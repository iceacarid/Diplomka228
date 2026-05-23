<?php

namespace App\Http\Controllers;

use App\Models\CourierAction;
use App\Models\CourierShift;
use App\Models\Message;
use App\Models\Order;
use Illuminate\Http\Request;

class CourierController extends Controller
{
    public function shiftStatus(Request $request)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');

        $shift = CourierShift::where('courier_id', $courier->id)
                             ->whereNull('closed_at')
                             ->latest()
                             ->first();

        return response()->json([
            'open'  => (bool) $shift,
            'shift' => $shift ? ['id' => $shift->id, 'opened_at' => $shift->opened_at] : null,
        ]);
    }

    public function openShift(Request $request)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');

        $existing = CourierShift::where('courier_id', $courier->id)
                                ->whereNull('closed_at')
                                ->first();
        if ($existing) {
            return response()->json(['error' => 'Смена уже открыта.'], 400);
        }

        $shift = CourierShift::create(['courier_id' => $courier->id, 'opened_at' => now()]);
        CourierAction::log($courier->id, 'shift_open', null, $shift->id);

        return response()->json([
            'open'  => true,
            'shift' => ['id' => $shift->id, 'opened_at' => $shift->opened_at],
        ]);
    }

    public function closeShift(Request $request)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');

        $shift = CourierShift::where('courier_id', $courier->id)
                             ->whereNull('closed_at')
                             ->first();
        if (!$shift) {
            return response()->json(['error' => 'Нет открытой смены.'], 400);
        }

        $activeOrders = Order::where('courier_id', $courier->id)
                             ->whereIn('status', ['courier_assigned', 'picked_up', 'missed_pickup'])
                             ->count();
        if ($activeOrders > 0) {
            return response()->json([
                'error' => "Нельзя закрыть смену: есть {$activeOrders} активн. " . ($activeOrders === 1 ? 'заказ' : ($activeOrders < 5 ? 'заказа' : 'заказов')) . '. Завершите все заказы.',
            ], 400);
        }

        $shift->update(['closed_at' => now()]);
        CourierAction::log($courier->id, 'shift_close', null, $shift->id);

        return response()->json(['open' => false, 'shift' => null]);
    }

    public function myOrders(Request $request)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');

        $today = now()->toDateString();

        $orders = Order::with(['client'])
                       ->where('courier_id', $courier->id)
                       ->where(function ($q) use ($today) {
                           // picked_up и missed_pickup — всегда показываем
                           $q->whereIn('status', ['picked_up', 'missed_pickup'])
                             ->orWhere(function ($q2) use ($today) {
                                 // courier_assigned — только если дата забора сегодня или раньше (или не задана)
                                 $q2->where('status', 'courier_assigned')
                                    ->where(function ($q3) use ($today) {
                                        $q3->whereNull('pickup_date')
                                           ->orWhereDate('pickup_date', '<=', $today);
                                    });
                             });
                       })
                       ->orderByDesc('updated_at')
                       ->get()
                       ->map(fn($o) => $this->orderData($o));

        return response()->json($orders);
    }

    public function history(Request $request)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');

        $orders = Order::with(['client'])
                       ->where('courier_id', $courier->id)
                       ->where('status', 'at_warehouse')
                       ->orderByDesc('updated_at')
                       ->get()
                       ->map(fn($o) => $this->orderData($o));

        return response()->json($orders);
    }

    public function pickUp(Request $request, Order $order)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');
        abort_unless($order->courier_id === $courier->id, 403, 'Нет доступа.');

        if (!in_array($order->status, ['courier_assigned', 'missed_pickup'])) {
            return response()->json(['error' => 'Неверный статус заявки.'], 400);
        }

        $order->update(['status' => 'picked_up', 'courier_blocked' => false, 'courier_blocked_reason' => null]);
        CourierAction::log($courier->id, 'order_picked_up', $order);
        $this->botMessage($order, "Курьер {$courier->name} забрал груз. Везёт на склад.");

        return response()->json($this->orderData($order->fresh('client')));
    }

    public function deliverToWarehouse(Request $request, Order $order)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');
        abort_unless($order->courier_id === $courier->id, 403, 'Нет доступа.');

        if ($order->status !== 'picked_up') {
            return response()->json(['error' => 'Неверный статус заявки.'], 400);
        }

        $order->update(['status' => 'at_warehouse']);
        CourierAction::log($courier->id, 'order_at_warehouse', $order);
        $this->botMessage($order, "Курьер {$courier->name} доставил груз на склад. Заявка готова к следующему этапу.");

        return response()->json($this->orderData($order->fresh('client')));
    }

    public function notifyMissed(Request $request, Order $order)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');
        abort_unless($order->courier_id === $courier->id, 403, 'Нет доступа.');

        if ($order->status !== 'missed_pickup') {
            return response()->json(['error' => 'Заявка не в статусе "пропущен забор".'], 400);
        }
        if ($order->courier_blocked) {
            return response()->json(['error' => 'Заявка уже заблокирована.'], 400);
        }

        $reason = $request->validate(['reason' => 'required|string|max:255'])['reason'];

        $order->update([
            'courier_blocked'        => true,
            'courier_blocked_reason' => $reason,
        ]);

        $this->botCourierBlocked($order, $courier->name, $reason);

        return response()->json($this->orderData($order->fresh('client')));
    }

    /** POST /courier/orders/{order}/request-reschedule
     *  Курьер вручную запрашивает перенос — без ожидания системного missed_pickup.
     *  Доступно при статусе courier_assigned (груз ещё не забран).
     */
    public function requestReschedule(Request $request, Order $order)
    {
        $courier = $request->user();
        abort_unless($courier->isCourier(), 403, 'Только курьер.');
        abort_unless($order->courier_id === $courier->id, 403, 'Нет доступа.');

        if ($order->status !== 'courier_assigned') {
            return response()->json(['error' => 'Перенос доступен только до забора груза.'], 400);
        }
        if ($order->courier_blocked) {
            return response()->json(['error' => 'Заявка уже ожидает менеджера.'], 400);
        }

        $reason = $request->validate(['reason' => 'required|string|max:255'])['reason'];

        $order->update([
            'status'                 => 'missed_pickup',
            'courier_blocked'        => true,
            'courier_blocked_reason' => $reason,
        ]);

        CourierAction::log($courier->id, 'reschedule_requested', $order);
        $this->botCourierBlocked($order, $courier->name, $reason);

        return response()->json($this->orderData($order->fresh('client')));
    }

    private function hasOpenShift(int $courierId): bool
    {
        return CourierShift::where('courier_id', $courierId)
                           ->whereNull('closed_at')
                           ->exists();
    }

    private function botCourierBlocked(Order $order, string $courierName, string $reason): void
    {
        $chat = $order->chat;
        if (!$chat) return;

        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => "🚨 Курьер {$courierName} запросил перенос забора груза.\nПричина: {$reason}\nЗаявка {$order->tracking_id} ожидает подтверждения нового времени от менеджера.",
            'type'        => 'text',
            'metadata'    => ['event' => 'courier_blocked', 'reason' => $reason],
        ]);
        $chat->touch();
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

    private function orderData(Order $order): array
    {
        return [
            'id'                => $order->id,
            'tracking_id'       => $order->tracking_id,
            'status'            => $order->status,
            'origin_address'    => $order->origin_address,
            'dest_address'      => $order->dest_address,
            'weight'            => $order->weight,
            'volume'            => $order->volume,
            'cargo_type'        => $order->cargo_type,
            'cargo_type_custom' => $order->cargo_type_custom,
            'cargo_description' => $order->cargo_description,
            'client_name'            => $order->client?->name ?? '',
            'client_phone'           => $order->client?->phone ?? '',
            'pickup_date'            => $order->pickup_date?->toDateString(),
            'courier_blocked'        => (bool) $order->courier_blocked,
            'courier_blocked_reason' => $order->courier_blocked_reason,
            'created_at'             => $order->created_at,
        ];
    }
}
