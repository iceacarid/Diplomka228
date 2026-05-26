<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\DriverLocation;
use App\Models\DriverShift;
use App\Models\Message;
use App\Models\Trip;
use Illuminate\Http\Request;

class DriverDashboardController extends Controller
{
    /** GET /driver/shift */
    public function shiftStatus(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');

        $shift = DriverShift::where('driver_user_id', $user->id)
                            ->whereNull('closed_at')
                            ->latest()
                            ->first();

        return response()->json([
            'open'  => (bool) $shift,
            'shift' => $shift ? ['id' => $shift->id, 'opened_at' => $shift->opened_at] : null,
        ]);
    }

    /** POST /driver/shift/open */
    public function openShift(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');

        $existing = DriverShift::where('driver_user_id', $user->id)->whereNull('closed_at')->first();
        if ($existing) {
            return response()->json(['error' => 'Смена уже открыта.'], 400);
        }

        $shift = DriverShift::create(['driver_user_id' => $user->id, 'opened_at' => now()]);

        return response()->json([
            'open'  => true,
            'shift' => ['id' => $shift->id, 'opened_at' => $shift->opened_at],
        ]);
    }

    /** POST /driver/shift/close */
    public function closeShift(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');

        $shift = DriverShift::where('driver_user_id', $user->id)->whereNull('closed_at')->first();
        if (!$shift) {
            return response()->json(['error' => 'Нет открытой смены.'], 400);
        }

        $activeTrips = $this->activeTripsQuery($user)->count();
        if ($activeTrips > 0) {
            return response()->json(['error' => 'Нельзя закрыть смену: есть активные рейсы.'], 400);
        }

        $shift->update(['closed_at' => now()]);

        return response()->json(['open' => false, 'shift' => null]);
    }

    /** GET /driver/trips — активные и последние рейсы */
    public function myTrips(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');

        $driver = Driver::where('user_id', $user->id)->first();

        $trips = Trip::with(['truck', 'warehouseFrom', 'warehouseTo', 'orders.client'])
            ->when($driver, fn($q) => $q->where('driver_id', $driver->id))
            ->whereNotIn('status', ['completed'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $this->tripData($t));

        return response()->json($trips);
    }

    /** POST /driver/location — обновить GPS координаты */
    public function updateLocation(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');

        $data = $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        DriverLocation::create([
            'driver_user_id' => $user->id,
            'latitude'       => $data['latitude'],
            'longitude'      => $data['longitude'],
            'recorded_at'    => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    /** POST /driver/trips/{trip}/arrived-load — прибыл на Склад А для загрузки */
    public function arrivedAtLoad(Request $request, Trip $trip)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');
        $this->authorizeTrip($user, $trip);
        abort_unless($trip->status === 'forming', 400, 'Рейс не в стадии формирования.');

        $trip->update(['status' => 'loading']);

        foreach ($trip->orders as $order) {
            $this->botMessage($order,
                "Водитель {$trip->driver->name} прибыл на склад {$trip->warehouseFrom->name} для загрузки."
            );
        }

        return response()->json($this->tripData($trip->fresh(['truck', 'warehouseFrom', 'warehouseTo', 'orders'])));
    }

    /** POST /driver/trips/{trip}/arrived-unload — прибыл на Склад Б для выгрузки */
    public function arrivedAtUnload(Request $request, Trip $trip)
    {
        $user = $request->user();
        abort_unless($user->isDriver(), 403, 'Только водитель.');
        $this->authorizeTrip($user, $trip);
        abort_unless($trip->status === 'in_transit', 400, 'Рейс не в пути.');

        $trip->update(['status' => 'arrived', 'arrived_at' => now()]);

        foreach ($trip->orders as $order) {
            $this->botMessage($order,
                "Фура прибыла на склад {$trip->warehouseTo->name}. Ожидается разгрузка кладовщиком."
            );
        }

        return response()->json($this->tripData($trip->fresh(['truck', 'warehouseFrom', 'warehouseTo', 'orders'])));
    }

    private function activeTripsQuery($user)
    {
        $driver = Driver::where('user_id', $user->id)->first();
        return Trip::where('driver_id', $driver?->id ?? 0)
                   ->whereNotIn('status', ['completed']);
    }

    private function authorizeTrip($user, Trip $trip): void
    {
        $driver = Driver::where('user_id', $user->id)->first();
        abort_unless($driver && $trip->driver_id === $driver->id, 403, 'Нет доступа к рейсу.');
    }

    private function botMessage(\App\Models\Order $order, string $text): void
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

    private function tripData(Trip $trip): array
    {
        return [
            'id'             => $trip->id,
            'status'         => $trip->status,
            'truck'          => ['id' => $trip->truck->id, 'plate' => $trip->truck->plate_number, 'label' => "{$trip->truck->brand} {$trip->truck->model}"],
            'driver'         => ['id' => $trip->driver->id, 'name' => $trip->driver->name],
            'warehouse_from' => [
                'id' => $trip->warehouseFrom->id, 'name' => $trip->warehouseFrom->name,
                'address' => $trip->warehouseFrom->address,
                'lat' => $trip->warehouseFrom->latitude, 'lng' => $trip->warehouseFrom->longitude,
            ],
            'warehouse_to'   => [
                'id' => $trip->warehouseTo->id, 'name' => $trip->warehouseTo->name,
                'address' => $trip->warehouseTo->address,
                'lat' => $trip->warehouseTo->latitude, 'lng' => $trip->warehouseTo->longitude,
            ],
            'route_polyline' => $trip->route_polyline,
            'orders'         => $trip->orders->map(fn($o) => [
                'id' => $o->id, 'tracking_id' => $o->tracking_id, 'status' => $o->status,
                'weight' => $o->actual_weight ?? $o->weight, 'volume' => $o->actual_volume ?? $o->volume,
                'dest_address' => $o->dest_address, 'client_name' => $o->client?->name,
            ]),
            'started_at'     => $trip->started_at,
            'arrived_at'     => $trip->arrived_at,
            'created_at'     => $trip->created_at,
        ];
    }
}
