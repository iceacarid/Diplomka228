<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Order;
use App\Models\Trip;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseKeeperController extends Controller
{
    /** GET /keeper/stats — сводка по складу */
    public function stats(Request $request)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');

        $warehouse = $keeper->warehouse_id ? Warehouse::find($keeper->warehouse_id) : null;
        $wid = $keeper->warehouse_id;

        // at_warehouse: фильтр по городу (через PHP, т.к. нет прямого FK)
        $atWarehouseCount = Order::where('status', 'at_warehouse')
            ->get()
            ->filter(fn($o) => $this->orderBelongsToMyWarehouse($o, $keeper))
            ->count();

        // ready_for_pickup: заказы, доехавшие до этого склада
        $readyForPickup = $wid
            ? Order::where('status', 'ready_for_pickup')
                ->whereHas('trip', fn($q) => $q->where('warehouse_to_id', $wid))
                ->count()
            : 0;

        // awaiting_measurement: очередь приёмки
        $awaitingMeasurement = Order::where('status', 'awaiting_measurement')
            ->get()
            ->filter(fn($o) => $this->orderBelongsToMyWarehouse($o, $keeper))
            ->count();

        // shipped: в пути из этого склада
        $shippedFromHere = $wid
            ? Order::where('status', 'shipped')
                ->whereHas('trip', fn($q) => $q->where('warehouse_from_id', $wid))
                ->count()
            : 0;

        // активные рейсы
        $activeTrips = $wid
            ? Trip::whereIn('status', ['forming', 'loading', 'in_transit', 'arrived'])
                ->where(fn($q) => $q->where('warehouse_from_id', $wid)->orWhere('warehouse_to_id', $wid))
                ->count()
            : 0;

        return response()->json([
            'warehouse' => $warehouse ? [
                'id'             => $warehouse->id,
                'name'           => $warehouse->name,
                'address'        => $warehouse->address,
                'total_capacity' => $warehouse->total_capacity,
                'current_load'   => $warehouse->current_load,
                'load_percent'   => $warehouse->load_percent,
                'free_capacity'  => $warehouse->free_capacity,
            ] : null,
            'counts' => [
                'awaiting_measurement' => $awaitingMeasurement,
                'at_warehouse'         => $atWarehouseCount,
                'ready_for_pickup'     => $readyForPickup,
                'shipped_from_here'    => $shippedFromHere,
                'active_trips'         => $activeTrips,
            ],
        ]);
    }

    /** GET /keeper/warehouse-orders — заказы склада (at_warehouse, shipped, ready_for_pickup) */
    public function warehouseOrders(Request $request)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');

        $wid = $keeper->warehouse_id;

        // at_warehouse: city-match
        $atWarehouse = Order::with(['client', 'courier', 'trip'])
            ->where('status', 'at_warehouse')
            ->get()
            ->filter(fn($o) => $this->orderBelongsToMyWarehouse($o, $keeper));

        // shipped: уехали из нашего склада
        $shipped = $wid
            ? Order::with(['client', 'trip.warehouseTo'])
                ->where('status', 'shipped')
                ->whereHas('trip', fn($q) => $q->where('warehouse_from_id', $wid))
                ->get()
            : collect();

        // ready_for_pickup: прибыли на наш склад
        $readyForPickup = $wid
            ? Order::with(['client', 'trip.warehouseFrom'])
                ->where('status', 'ready_for_pickup')
                ->whereHas('trip', fn($q) => $q->where('warehouse_to_id', $wid))
                ->get()
            : collect();

        $all = $atWarehouse->concat($shipped)->concat($readyForPickup)
            ->sortByDesc('updated_at')
            ->values()
            ->map(fn($o) => $this->warehouseOrderData($o));

        return response()->json($all);
    }

    /** GET /keeper/queue — заказы awaiting_measurement на складе кладовщика */
    public function incomingQueue(Request $request)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');

        $orders = Order::with(['client', 'courier'])
            ->where('status', 'awaiting_measurement')
            ->get()
            ->filter(fn($o) => $this->orderBelongsToMyWarehouse($o, $keeper))
            ->values()
            ->map(fn($o) => $this->orderData($o));

        return response()->json($orders);
    }

    /** POST /keeper/orders/{order}/confirm — замер и приёмка груза */
    public function confirmMeasurement(Request $request, Order $order)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');
        abort_unless($order->status === 'awaiting_measurement', 400, 'Неверный статус.');

        $data = $request->validate([
            'actual_weight' => 'required|numeric|min:0.01',
            'actual_volume' => 'required|numeric|min:0.01',
            'note'          => 'nullable|string|max:500',
        ]);

        $warehouse = Warehouse::find($keeper->warehouse_id);

        $order->update([
            'status'         => 'at_warehouse',
            'actual_weight'  => $data['actual_weight'],
            'actual_volume'  => $data['actual_volume'],
            'measurement_note' => $data['note'] ?? null,
        ]);

        if ($warehouse) {
            Warehouse::updateStorageLoad($warehouse->id, $data['actual_weight'], [
                'order_id' => $order->id,
                'action'   => 'load',
                'note'     => "Приёмка заказа {$order->tracking_id}",
            ]);
        }

        $note = $data['note'] ?? null;
        $this->botMessage($order,
            "Груз принят на склад. Данные скорректированы: вес {$data['actual_weight']} кг, объём {$data['actual_volume']} м³."
            . ($note ? " Примечание: {$note}" : '')
        );

        return response()->json($this->orderData($order->fresh('client')));
    }

    /** POST /keeper/orders/{order}/reject — отклонить груз, вернуть курьеру */
    public function rejectCargo(Request $request, Order $order)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');
        abort_unless($order->status === 'awaiting_measurement', 400, 'Неверный статус.');

        $data = $request->validate(['reason' => 'required|string|max:500']);

        $order->update(['status' => 'accepted', 'courier_id' => null]);

        $this->botMessage($order,
            "Склад отклонил груз. Причина: {$data['reason']}. Требуется новое назначение курьера."
        );

        return response()->json(['message' => 'Груз отклонён.']);
    }

    /** GET /keeper/manifests — рейсы (манифесты) для моего склада */
    public function myManifests(Request $request)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');

        $wid = $keeper->warehouse_id;

        $trips = Trip::with(['truck', 'driver', 'warehouseFrom', 'warehouseTo', 'orders.client'])
            ->where(function ($q) use ($wid) {
                $q->where('warehouse_from_id', $wid)
                  ->orWhere('warehouse_to_id', $wid);
            })
            ->whereNotIn('status', ['completed'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $this->tripData($t, $wid));

        return response()->json($trips);
    }

    /** POST /keeper/orders/{order}/mark-unloaded — пометить груз как разгруженный из фуры */
    public function markUnloaded(Request $request, Order $order)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');
        abort_unless($order->status === 'shipped' && $order->trip_id, 400, 'Заказ не в пути или неверный статус.');

        $order->update(['unloaded_at' => $order->unloaded_at ? null : now()]);

        return response()->json(['unloaded_at' => $order->unloaded_at]);
    }

    /** POST /keeper/orders/{order}/mark-loaded — пометить груз как загруженный в фуру */
    public function markLoaded(Request $request, Order $order)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');
        abort_unless($order->status === 'at_warehouse' && $order->trip_id, 400, 'Заказ не в рейсе или неверный статус.');

        $order->update(['loaded_at' => $order->loaded_at ? null : now()]);

        return response()->json(['loaded_at' => $order->loaded_at]);
    }

    /** POST /keeper/trips/{trip}/dispatch — подтвердить загрузку, отправить фуру */
    public function dispatch(Request $request, Trip $trip)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');
        abort_unless($trip->warehouse_from_id === $keeper->warehouse_id, 403, 'Не ваш склад.');
        abort_unless($trip->status === 'loading', 400, 'Рейс не в статусе загрузки.');

        $orders = $trip->orders()->where('status', 'at_warehouse')->get();
        if ($orders->isEmpty()) {
            return response()->json(['error' => 'Нет заказов для отгрузки.'], 400);
        }

        $notLoaded = $orders->whereNull('loaded_at')->count();
        if ($notLoaded > 0) {
            return response()->json(['error' => "Не все грузы загружены ({$notLoaded} из {$orders->count()})."], 400);
        }

        $warehouse = Warehouse::find($keeper->warehouse_id);

        foreach ($orders as $order) {
            $order->update(['status' => 'shipped']);

            if ($warehouse) {
                Warehouse::updateStorageLoad($warehouse->id, -($order->actual_weight ?? $order->weight), [
                    'order_id' => $order->id,
                    'truck_id' => $trip->truck_id,
                    'driver_id'=> $trip->driver_id,
                    'action'   => 'unload',
                    'note'     => "Отгрузка в рейс #{$trip->id}",
                ]);
            }

            $this->botMessage($order,
                "Груз отгружен на фуру ({$trip->truck->plate_number}). Водитель: {$trip->driver->name}. Следует в {$trip->warehouseTo->name}."
            );
        }

        $trip->update(['status' => 'in_transit', 'started_at' => now()]);

        return response()->json(['message' => 'Рейс отправлен.', 'trip' => $this->tripData($trip->fresh(), $keeper->warehouse_id)]);
    }

    /** POST /keeper/trips/{trip}/unload — принять фуру на Складе Б */
    public function confirmUnload(Request $request, Trip $trip)
    {
        $keeper = $request->user();
        abort_unless($keeper->isWarehouseKeeper(), 403, 'Только кладовщик.');
        abort_unless($trip->warehouse_to_id === $keeper->warehouse_id, 403, 'Не ваш склад назначения.');
        abort_unless($trip->status === 'arrived', 400, 'Фура ещё не прибыла.');

        $warehouse = Warehouse::find($keeper->warehouse_id);

        $orders = $trip->orders()->where('status', 'shipped')->get();

        $notUnloaded = $orders->whereNull('unloaded_at')->count();
        if ($notUnloaded > 0) {
            return response()->json(['error' => "Не все грузы разгружены ({$notUnloaded} из {$orders->count()})."], 400);
        }

        foreach ($orders as $order) {
            $order->update(['status' => 'ready_for_pickup']);

            if ($warehouse) {
                Warehouse::updateStorageLoad($warehouse->id, $order->actual_weight ?? $order->weight, [
                    'order_id' => $order->id,
                    'truck_id' => $trip->truck_id,
                    'driver_id'=> $trip->driver_id,
                    'action'   => 'load',
                    'note'     => "Приёмка из рейса #{$trip->id}",
                ]);
            }

            $this->botMessage($order,
                "Груз прибыл на склад {$trip->warehouseTo->name}. Ожидает передачи местному курьеру для доставки."
            );
        }

        $trip->update(['status' => 'completed', 'completed_at' => now()]);
        $trip->truck->update(['status' => 'available']);
        $trip->driver->update(['is_available' => true]);

        return response()->json(['message' => 'Разгрузка подтверждена.']);
    }

    private function orderBelongsToMyWarehouse(Order $order, $keeper): bool
    {
        if (!$keeper->warehouse_id) return true;
        $warehouse = \App\Models\Warehouse::find($keeper->warehouse_id);
        if (!$warehouse || !$warehouse->address) return true;
        return str_contains(mb_strtolower($order->origin_address), mb_strtolower(explode(',', $warehouse->address)[0] ?? ''));
    }

    private function botMessage(Order $order, string $text): void
    {
        $chat = $order->chat;
        if (!$chat) return;
        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => $text,
            'type'        => 'text',
        ]);
        $chat->touch();
    }

    private function tripData(Trip $trip, ?int $myWarehouseId): array
    {
        $role = match (true) {
            $trip->warehouse_from_id === $myWarehouseId => 'source',
            $trip->warehouse_to_id   === $myWarehouseId => 'destination',
            default => 'observer',
        };

        return [
            'id'             => $trip->id,
            'status'         => $trip->status,
            'role'           => $role,
            'truck'          => ['id' => $trip->truck->id, 'plate' => $trip->truck->plate_number, 'label' => "{$trip->truck->brand} {$trip->truck->model}"],
            'driver'         => ['id' => $trip->driver->id, 'name' => $trip->driver->name],
            'warehouse_from' => ['id' => $trip->warehouseFrom->id, 'name' => $trip->warehouseFrom->name, 'address' => $trip->warehouseFrom->address],
            'warehouse_to'   => ['id' => $trip->warehouseTo->id,   'name' => $trip->warehouseTo->name,   'address' => $trip->warehouseTo->address],
            'orders_count'   => $trip->orders->count(),
            'orders'         => $trip->orders->map(fn($o) => [
                'id' => $o->id, 'tracking_id' => $o->tracking_id, 'status' => $o->status,
                'weight' => $o->actual_weight ?? $o->weight, 'volume' => $o->actual_volume ?? $o->volume,
                'client_name' => $o->client?->name,
                'loaded_at'   => $o->loaded_at,
                'unloaded_at' => $o->unloaded_at,
            ]),
            'estimated_arrival_at' => $trip->estimated_arrival_at,
            'started_at'     => $trip->started_at,
            'arrived_at'     => $trip->arrived_at,
            'completed_at'   => $trip->completed_at,
            'created_at'     => $trip->created_at,
        ];
    }

    private function orderData(Order $order): array
    {
        return [
            'id'             => $order->id,
            'tracking_id'    => $order->tracking_id,
            'status'         => $order->status,
            'origin_address' => $order->origin_address,
            'dest_address'   => $order->dest_address,
            'weight'         => $order->weight,
            'volume'         => $order->volume,
            'actual_weight'  => $order->actual_weight,
            'actual_volume'  => $order->actual_volume,
            'cargo_type'     => $order->cargo_type,
            'cargo_description' => $order->cargo_description,
            'client_name'    => $order->client?->name,
            'client_phone'   => $order->client?->phone,
            'courier_name'   => $order->courier?->name,
            'created_at'     => $order->created_at,
        ];
    }

    private function warehouseOrderData(Order $order): array
    {
        $trip = $order->trip;
        return [
            'id'             => $order->id,
            'tracking_id'    => $order->tracking_id,
            'status'         => $order->status,
            'origin_address' => $order->origin_address,
            'dest_address'   => $order->dest_address,
            'weight'         => $order->actual_weight ?? $order->weight,
            'volume'         => $order->actual_volume ?? $order->volume,
            'cargo_type'     => $order->cargo_type,
            'client_name'    => $order->client?->name,
            'trip_id'        => $trip?->id,
            'trip_dest'      => $trip?->warehouseTo?->name,
            'trip_from'      => $trip?->warehouseFrom?->name,
            'updated_at'     => $order->updated_at,
            'created_at'     => $order->created_at,
        ];
    }
}
