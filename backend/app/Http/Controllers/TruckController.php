<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use Illuminate\Http\Request;

class TruckController extends Controller
{
    public function index(Request $request)
    {
        $query = Truck::with('driver');
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        return response()->json($query->get()->map(fn($t) => $this->truckData($t)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'plate_number'    => 'required|string|max:20|unique:trucks,plate_number',
            'brand'           => 'required|string|max:100',
            'model'           => 'required|string|max:100',
            'capacity_weight' => 'required|numeric|min:0.1',
            'capacity_volume' => 'required|numeric|min:0.1',
            'height_m'        => 'nullable|numeric|min:0.1|max:10',
            'width_m'         => 'nullable|numeric|min:0.1|max:5',
            'length_m'        => 'nullable|numeric|min:1|max:30',
            'mass_kg'         => 'nullable|integer|min:1',
            'axle_load_kg'    => 'nullable|integer|min:1',
            'status'          => 'in:available,in_transit,maintenance',
            'driver_id'       => 'nullable|exists:drivers,id',
            'is_company_owned'=> 'boolean',
        ]);

        $truck = Truck::create($data);
        return response()->json($this->truckData($truck->load('driver')), 201);
    }

    public function show(Truck $truck)
    {
        return response()->json($this->truckData($truck->load('driver')));
    }

    public function update(Request $request, Truck $truck)
    {
        $data = $request->validate([
            'plate_number'    => 'sometimes|string|max:20|unique:trucks,plate_number,' . $truck->id,
            'brand'           => 'sometimes|string|max:100',
            'model'           => 'sometimes|string|max:100',
            'capacity_weight' => 'sometimes|numeric|min:0.1',
            'capacity_volume' => 'sometimes|numeric|min:0.1',
            'height_m'        => 'nullable|numeric|min:0.1|max:10',
            'width_m'         => 'nullable|numeric|min:0.1|max:5',
            'length_m'        => 'nullable|numeric|min:1|max:30',
            'mass_kg'         => 'nullable|integer|min:1',
            'axle_load_kg'    => 'nullable|integer|min:1',
            'status'          => 'in:available,in_transit,maintenance',
            'driver_id'       => 'nullable|exists:drivers,id',
            'is_company_owned'=> 'boolean',
        ]);

        $truck->update($data);

        // Один водитель — одна машина
        if (isset($data['driver_id']) && $data['driver_id']) {
            Truck::where('driver_id', $data['driver_id'])
                 ->where('id', '!=', $truck->id)
                 ->update(['driver_id' => null]);
        }

        return response()->json($this->truckData($truck->load('driver')));
    }

    public function destroy(Truck $truck)
    {
        $truck->delete();
        return response()->json(['message' => 'Транспорт удалён.']);
    }

    private function truckData(Truck $truck): array
    {
        return [
            'id'              => $truck->id,
            'plate_number'    => $truck->plate_number,
            'brand'           => $truck->brand,
            'model'           => $truck->model,
            'capacity_weight' => $truck->capacity_weight,
            'capacity_volume' => $truck->capacity_volume,
            'height_m'        => $truck->height_m,
            'width_m'         => $truck->width_m,
            'length_m'        => $truck->length_m,
            'mass_kg'         => $truck->mass_kg,
            'axle_load_kg'    => $truck->axle_load_kg,
            'status'          => $truck->status,
            'driver_id'       => $truck->driver_id,
            'driver_name'     => $truck->driver?->name ?? '',
            'is_company_owned'=> $truck->is_company_owned,
            'created_at'      => $truck->created_at,
        ];
    }
}
