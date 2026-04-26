<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Order::with(['client', 'manager', 'truck', 'driver']);

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
            'volume'            => 'required|numeric|min:0',
            'cargo_type'        => 'required|in:general,fragile,flammable,perishable,hazardous,oversized,temperature_controlled,other',
            'cargo_type_custom' => 'nullable|string|max:255',
            'cargo_description' => 'nullable|string',
            'price'             => 'required|numeric|min:0',
        ]);

        $data['client_id'] = $request->user()->id;
        $data['status']    = 'pending';

        $order = Order::create($data);
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
            'status'           => 'sometimes|in:draft,pending,in_progress,shipped,delivered,rejected',
            'rejection_reason' => 'nullable|string',
            'eta'              => 'nullable|date',
        ]);
        $order->update($data);
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
        $order->update(['status' => 'in_progress', 'manager_id' => $request->user()->id]);
        return response()->json($this->orderData($order->load(['client', 'manager', 'truck', 'driver'])));
    }

    /** POST /api/orders/{id}/reject */
    public function reject(Request $request, Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['error' => 'Заказ уже обработан.'], 400);
        }
        $request->validate(['rejection_reason' => 'required|string']);
        $order->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'manager_id'       => $request->user()->id,
        ]);
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
        return [
            'id'                => $order->id,
            'tracking_id'       => $order->tracking_id,
            'client_id'         => $order->client_id,
            'client_name'       => $order->client?->name ?? '',
            'manager_id'        => $order->manager_id,
            'manager_name'      => $order->manager?->name ?? '',
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
            'eta'               => $order->eta,
            'rejection_reason'  => $order->rejection_reason,
            'created_at'        => $order->created_at,
        ];
    }
}
