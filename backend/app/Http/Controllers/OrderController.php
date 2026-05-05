<?php

namespace App\Http\Controllers;

use App\Models\CargoType;
use App\Models\Chat;
use App\Models\Driver;
use App\Models\Message;
use App\Models\Order;
use App\Models\Truck;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Order::with(['client', 'manager', 'courier', 'truck', 'driver']);

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('tracking_id')) {
            $query->where('tracking_id', $request->tracking_id);
        }

        return response()->json($query->orderByDesc('created_at')->get()->map(fn($o) => $this->orderData($o)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'origin_address'    => 'required|string|max:500',
            'dest_address'      => 'required|string|max:500',
            'weight'            => 'required|numeric|min:0',
            'volume'            => 'nullable|numeric|min:0',
            'cargo_type'        => 'required|string|exists:cargo_types,slug',
            'cargo_type_custom' => 'nullable|string|max:255',
            'cargo_description' => 'nullable|string',
            'price'             => 'required|numeric|min:0',
            'pickup_date'       => 'nullable|date',
        ]);

        $data['client_id'] = $request->user()->id;
        $data['status']    = 'pending';

        $order = Order::create($data);

        // Авто-создание чата с бот-приветствием
        $chat = Chat::create(['order_id' => $order->id]);
        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => implode("\n", [
                "Ваша заявка {$order->tracking_id} успешно создана!",
                "",
                "⚠️ Заполнение формы ниже обязательно.",
                "Без этого ваш заказ не будет обработан менеджером.",
            ]),
            'type' => 'bot_greeting',
        ]);

        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])), 201);
    }

    public function show(Request $request, Order $order)
    {
        $user = $request->user();
        if ($user->role === 'client' && $order->client_id !== $user->id) {
            return response()->json(['error' => 'Доступ запрещён.'], 403);
        }
        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'status'           => 'sometimes|in:draft,pending,in_progress,confirmed,courier_assigned,picked_up,at_warehouse,missed_pickup,shipped,delivered,rejected',
            'rejection_reason' => 'nullable|string',
            'eta'              => 'nullable|date',
            'pickup_date'      => 'nullable|date',
        ]);
        $order->update($data);

        // Авто-архивация чата при доставке
        if (isset($data['status']) && $data['status'] === 'delivered') {
            \App\Models\Chat::where('order_id', $order->id)->update(['status' => 'archived']);
        }

        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'Заказ удалён.']);
    }

    /** POST /api/orders/{id}/accept */
    public function accept(Request $request, Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['error' => 'Заказ уже обработан.'], 400);
        }
        $manager = $request->user();
        $order->update(['status' => 'in_progress', 'manager_id' => $manager->id]);

        // Закрепляем чат за менеджером
        $chat = \App\Models\Chat::where('order_id', $order->id)->first();
        if ($chat) {
            $chat->update(['manager_id' => $manager->id]);
            Message::create([
                'chat_id'     => $chat->id,
                'sender_id'   => null,
                'sender_role' => 'bot',
                'body'        => "Менеджер {$manager->name} принял заявку в работу. Ожидайте уточнения деталей.",
                'type'        => 'text',
            ]);
        }

        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    /** POST /api/orders/{id}/reject */
    public function reject(Request $request, Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['error' => 'Заказ уже обработан.'], 400);
        }
        $request->validate(['rejection_reason' => 'required|string']);
        $manager = $request->user();
        $order->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'manager_id'       => $manager->id,
        ]);

        $chat = \App\Models\Chat::where('order_id', $order->id)->first();
        if ($chat) {
            $chat->update(['manager_id' => $manager->id, 'status' => 'archived']);
            Message::create([
                'chat_id'     => $chat->id,
                'sender_id'   => null,
                'sender_role' => 'bot',
                'body'        => $request->rejection_reason,
                'type'        => 'text',
                'metadata'    => ['event' => 'order_rejected', 'manager_name' => $manager->name],
            ]);
        }

        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    /** POST /api/orders/{id}/assign-transport */
    public function assignTransport(Request $request, Order $order)
    {
        $request->validate([
            'truck_id'  => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
        ]);

        $truck  = Truck::findOrFail($request->truck_id);
        $driver = Driver::findOrFail($request->driver_id);

        if ($truck->status !== 'available') {
            return response()->json(['error' => 'Транспорт недоступен.'], 400);
        }
        if (!$driver->is_available) {
            return response()->json(['error' => 'Водитель недоступен.'], 400);
        }

        $order->update(['truck_id' => $truck->id, 'driver_id' => $driver->id, 'status' => 'shipped']);
        $truck->update(['status' => 'in_transit', 'driver_id' => $driver->id]);
        $driver->update(['is_available' => false]);

        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    /** POST /api/orders/{id}/reschedule-confirm — менеджер подтверждает перенос забора */
    public function rescheduleConfirm(Request $request, Order $order)
    {
        $user = $request->user();
        if (!in_array($user->role, ['manager', 'admin'])) {
            return response()->json(['error' => 'Нет доступа.'], 403);
        }
        if ($order->status !== 'missed_pickup') {
            return response()->json(['error' => 'Заявка не требует переноса.'], 400);
        }

        $data = $request->validate([
            'pickup_date' => 'required|date|after_or_equal:today',
            'pickup_time' => 'nullable|regex:/^\d{2}:\d{2}$/',
        ]);

        $order->update([
            'pickup_date'            => $data['pickup_date'],
            'pickup_time'            => $data['pickup_time'] ?? null,
            'status'                 => 'confirmed',
            'courier_id'             => null,
            'courier_blocked'        => false,
            'courier_blocked_reason' => null,
        ]);

        $timeStr  = isset($data['pickup_time']) ? " в {$data['pickup_time']}" : '';
        $dateLabel = \Carbon\Carbon::parse($data['pickup_date'])->translatedFormat('d.m.Y');

        $chat = \App\Models\Chat::where('order_id', $order->id)->first();
        if ($chat) {
            Message::create([
                'chat_id'     => $chat->id,
                'sender_id'   => null,
                'sender_role' => 'bot',
                'body'        => "✅ Менеджер {$user->name} согласовал новую дату забора груза: {$dateLabel}{$timeStr}. Заявка снова доступна для курьеров.",
                'type'        => 'text',
                'metadata'    => ['event' => 'reschedule_confirmed'],
            ]);
            $chat->touch();
        }

        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    /** GET /api/orders/track/{tracking_id} — публичный */
    public function track(string $trackingId)
    {
        $order = Order::with(['client', 'manager', 'truck', 'driver'])
                      ->where('tracking_id', $trackingId)
                      ->first();
        if (!$order) {
            return response()->json(['error' => 'Заказ не найден.'], 404);
        }
        return response()->json($this->orderData($order));
    }

    private function orderData(Order $order): array
    {
        if (!$order->relationLoaded('chat')) {
            $order->load('chat');
        }
        return [
            'id'                => $order->id,
            'chat_id'           => $order->chat?->id,
            'tracking_id'       => $order->tracking_id,
            'client_id'         => $order->client_id,
            'client_name'       => $order->client?->name ?? '',
            'manager_id'        => $order->manager_id,
            'manager_name'      => $order->manager?->name ?? '',
            'courier_id'        => $order->courier_id,
            'courier_name'      => $order->courier?->name ?? '',
            'truck_id'          => $order->truck_id,
            'truck_plate'       => $order->truck?->plate_number ?? '',
            'driver_id'         => $order->driver_id,
            'driver_name'       => $order->driver?->name ?? '',
            'status'            => $order->status,
            'origin_address'    => $order->origin_address,
            'dest_address'      => $order->dest_address,
            'weight'            => $order->weight,
            'volume'            => $order->volume,
            'cargo_type'        => $order->cargo_type,
            'cargo_type_custom' => $order->cargo_type_custom,
            'cargo_description' => $order->cargo_description,
            'price'             => $order->price,
            'eta'                    => $order->eta,
            'pickup_date'            => $order->pickup_date?->toDateString(),
            'pickup_time'            => $order->pickup_time,
            'courier_blocked'        => (bool) $order->courier_blocked,
            'courier_blocked_reason' => $order->courier_blocked_reason,
            'rejection_reason'       => $order->rejection_reason,
            'created_at'             => $order->created_at,
        ];
    }
}
