<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index()
    {
        $drivers = Driver::with('trucks')->get();
        return response()->json($drivers->map(fn($d) => $this->driverData($d)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'phone'          => 'required|string|max:20',
            'license_number' => 'required|string|max:50',
            'type'           => 'required|in:staff,hired',
            'personal_car'   => 'nullable|string|max:50',
            'insurance_num'  => 'nullable|string|max:50',
            'is_available'   => 'boolean',
        ]);

        $driver = Driver::create($data);
        return response()->json($this->driverData($driver->load('trucks')), 201);
    }

    public function show(Driver $driver)
    {
        return response()->json($this->driverData($driver->load('trucks')));
    }

    public function update(Request $request, Driver $driver)
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'phone'          => 'sometimes|string|max:20',
            'license_number' => 'sometimes|string|max:50',
            'type'           => 'sometimes|in:staff,hired',
            'personal_car'   => 'nullable|string|max:50',
            'insurance_num'  => 'nullable|string|max:50',
            'is_available'   => 'boolean',
        ]);

        $driver->update($data);
        return response()->json($this->driverData($driver->load('trucks')));
    }

    public function destroy(Driver $driver)
    {
        if ($driver->trucks()->where('status', 'in_transit')->exists()) {
            return response()->json(['error' => 'Нельзя удалить водителя, который находится в рейсе.'], 400);
        }
        $driver->delete();
        return response()->json(['message' => 'Водитель удалён.']);
    }

    private function driverData(Driver $driver): array
    {
        return [
            'id'             => $driver->id,
            'name'           => $driver->name,
            'phone'          => $driver->phone,
            'license_number' => $driver->license_number,
            'type'           => $driver->type,
            'personal_car'   => $driver->personal_car,
            'insurance_num'  => $driver->insurance_num,
            'is_available'   => $driver->is_available,
            'created_at'     => $driver->created_at,
            'trucks'         => $driver->trucks->map(fn($t) => [
                'id'           => $t->id,
                'plate_number' => $t->plate_number,
                'brand'        => $t->brand,
                'model'        => $t->model,
            ]),
        ];
    }
}
