<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\WarehouseLog;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index()
    {
        $warehouses = Warehouse::all();
        return response()->json($warehouses->map(fn($w) => $this->warehouseData($w)));
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Только администратор может создавать склады.'], 403);
        }

        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'latitude'       => 'required|numeric|between:-90,90',
            'longitude'      => 'required|numeric|between:-180,180',
            'address'        => 'nullable|string|max:500',
            'total_capacity' => 'required|numeric|min:0.1',
            'current_load'   => 'sometimes|numeric|min:0',
        ]);

        $warehouse = Warehouse::create($data);
        return response()->json($this->warehouseData($warehouse), 201);
    }

    public function show(Warehouse $warehouse)
    {
        return response()->json($this->warehouseData($warehouse->load('logs')));
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Только администратор может редактировать склады.'], 403);
        }

        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'latitude'       => 'sometimes|numeric|between:-90,90',
            'longitude'      => 'sometimes|numeric|between:-180,180',
            'address'        => 'nullable|string|max:500',
            'total_capacity' => 'sometimes|numeric|min:0.1',
            'current_load'   => 'sometimes|numeric|min:0',
        ]);

        $warehouse->update($data);
        return response()->json($this->warehouseData($warehouse));
    }

    public function destroy(Request $request, Warehouse $warehouse)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Только администратор может удалять склады.'], 403);
        }

        $warehouse->delete();
        return response()->json(['message' => 'Склад удалён.']);
    }

    /**
     * Обновление загрузки склада (вызывается при разгрузке фуры).
     * Placeholder для будущей интеграции с CourierController.
     */
    public function updateLoad(Request $request, Warehouse $warehouse)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Только администратор может изменять загрузку склада.'], 403);
        }

        $data = $request->validate([
            'weight_change' => 'required|numeric',
            'order_id'      => 'nullable|integer|exists:orders,id',
            'truck_id'      => 'nullable|integer|exists:trucks,id',
            'driver_id'     => 'nullable|integer|exists:drivers,id',
            'courier_id'    => 'nullable|integer|exists:users,id',
            'action'        => 'nullable|in:load,unload,manual,courier_pickup',
            'note'          => 'nullable|string|max:500',
        ]);

        $warehouse = Warehouse::updateStorageLoad($warehouse->id, $data['weight_change'], $data);
        return response()->json($this->warehouseData($warehouse));
    }

    public function updateLog(Request $request, Warehouse $warehouse, WarehouseLog $log)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Только администратор.'], 403);
        }
        if ($log->warehouse_id !== $warehouse->id) {
            return response()->json(['error' => 'Лог не принадлежит складу.'], 422);
        }

        $data = $request->validate([
            'action'        => 'sometimes|in:load,unload,manual,courier_pickup',
            'note'          => 'nullable|string|max:500',
            'weight_change' => 'sometimes|numeric',
        ]);

        // Если изменился weight_change — пересчитываем current_load склада
        if (isset($data['weight_change']) && $data['weight_change'] != $log->weight_change) {
            $delta = $data['weight_change'] - $log->weight_change;
            $warehouse->current_load = max(0, $warehouse->current_load + $delta);
            $warehouse->save();
            $data['load_after'] = $log->load_before + $data['weight_change'];
        }

        $log->update($data);

        return response()->json([
            'id'            => $log->id,
            'action'        => $log->action,
            'note'          => $log->note,
            'weight_change' => $log->weight_change,
            'load_before'   => $log->load_before,
            'load_after'    => $log->load_after,
        ]);
    }

    public function logs(Request $request, Warehouse $warehouse)
    {
        $query = $warehouse->logs()
            ->with(['order:id,tracking_id', 'truck:id,plate_number,brand,model', 'driver:id,name', 'courier:id,name'])
            ->latest();

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->take(100)->get();

        return response()->json($logs->map(fn($l) => [
            'id'           => $l->id,
            'weight_change'=> $l->weight_change,
            'load_before'  => $l->load_before,
            'load_after'   => $l->load_after,
            'action'       => $l->action,
            'note'         => $l->note,
            'created_at'   => $l->created_at,
            'order'        => $l->order   ? ['id' => $l->order->id, 'tracking_id' => $l->order->tracking_id] : null,
            'truck'        => $l->truck   ? ['id' => $l->truck->id, 'plate_number' => $l->truck->plate_number, 'label' => "{$l->truck->brand} {$l->truck->model}"] : null,
            'driver'       => $l->driver  ? ['id' => $l->driver->id, 'name' => $l->driver->name] : null,
            'courier'      => $l->courier ? ['id' => $l->courier->id, 'name' => $l->courier->name] : null,
        ]));
    }

    private function warehouseData(Warehouse $warehouse): array
    {
        return [
            'id'             => $warehouse->id,
            'name'           => $warehouse->name,
            'latitude'       => $warehouse->latitude,
            'longitude'      => $warehouse->longitude,
            'address'        => $warehouse->address,
            'total_capacity' => $warehouse->total_capacity,
            'current_load'   => $warehouse->current_load,
            'free_capacity'  => $warehouse->free_capacity,
            'load_percent'   => $warehouse->load_percent,
            'created_at'     => $warehouse->created_at,
        ];
    }
}
