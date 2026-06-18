<?php

namespace App\Http\Controllers;

use App\Models\CourierAction;
use App\Models\CourierShift;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

class AdminCourierController extends Controller
{
    private array $actionLabels = [
        'shift_open'        => 'Открыл смену',
        'shift_close'       => 'Закрыл смену',
        'order_taken'       => 'Взял заказ',
        'order_picked_up'   => 'Груз забран',
        'order_at_warehouse'=> 'Груз передан на склад',
    ];

    public function index(Request $request)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403);

        $couriers = User::where('role', 'courier')->orderBy('name')->with('warehouse')->get();

        $result = $couriers->map(function (User $u) {
            $lastAction = CourierAction::where('courier_id', $u->id)
                                       ->latest('created_at')->first();

            return [
                'id'             => $u->id,
                'name'           => $u->name,
                'email'          => $u->email,
                'phone'          => $u->phone,
                'is_active'      => $u->is_active,
                'warehouse_id'   => $u->warehouse_id,
                'warehouse_name' => $u->warehouse?->name,
                'has_open_shift' => CourierShift::where('courier_id', $u->id)
                                                ->whereNull('closed_at')->exists(),
                'total_orders'   => Order::where('courier_id', $u->id)->count(),
                'active_orders'  => Order::where('courier_id', $u->id)
                                         ->whereIn('status', ['courier_assigned', 'picked_up'])->count(),
                'last_action_at' => $lastAction?->created_at,
                'last_action'    => $lastAction ? ($this->actionLabels[$lastAction->action_type] ?? $lastAction->action_type) : null,
            ];
        });

        return response()->json($result);
    }

    public function history(Request $request, User $user)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403);
        abort_if($user->role !== 'courier', 422, 'Пользователь не является курьером.');

        $actions = CourierAction::where('courier_id', $user->id)
                                ->orderByDesc('created_at')
                                ->get()
                                ->map(fn($a) => [
                                    'id'           => $a->id,
                                    'action_type'  => $a->action_type,
                                    'action_label' => $this->actionLabels[$a->action_type] ?? $a->action_type,
                                    'tracking_id'  => $a->tracking_id,
                                    'order_id'     => $a->order_id,
                                    'created_at'   => $a->created_at,
                                ]);

        return response()->json([
            'courier' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'phone'    => $user->phone,
                'is_active'=> $user->is_active,
                'total_orders'  => Order::where('courier_id', $user->id)->count(),
                'active_orders' => Order::where('courier_id', $user->id)
                                        ->whereIn('status', ['courier_assigned', 'picked_up'])->count(),
                'has_open_shift'=> CourierShift::where('courier_id', $user->id)
                                               ->whereNull('closed_at')->exists(),
            ],
            'actions' => $actions,
        ]);
    }

    public function closeShift(Request $request, User $user)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403);
        abort_if($user->role !== 'courier', 422, 'Пользователь не является курьером.');

        $shift = CourierShift::where('courier_id', $user->id)
                             ->whereNull('closed_at')
                             ->first();

        if (!$shift) {
            return response()->json(['error' => 'У курьера нет открытой смены.'], 400);
        }

        $shift->update(['closed_at' => now()]);

        CourierAction::create([
            'courier_id'  => $user->id,
            'action_type' => 'shift_close_by_manager',
            'order_id'    => null,
            'shift_id'    => $shift->id,
        ]);

        return response()->json(['success' => true, 'closed_at' => $shift->closed_at]);
    }

    public function openShift(Request $request, User $user)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403);
        abort_if($user->role !== 'courier', 422, 'Пользователь не является курьером.');

        $existing = CourierShift::where('courier_id', $user->id)
                                ->whereNull('closed_at')
                                ->first();

        if ($existing) {
            return response()->json(['error' => 'У курьера уже открыта смена.'], 400);
        }

        $shift = CourierShift::create(['courier_id' => $user->id, 'opened_at' => now()]);

        CourierAction::create([
            'courier_id'  => $user->id,
            'action_type' => 'shift_open_by_manager',
            'order_id'    => null,
            'shift_id'    => $shift->id,
        ]);

        return response()->json(['success' => true, 'opened_at' => $shift->opened_at]);
    }
}
