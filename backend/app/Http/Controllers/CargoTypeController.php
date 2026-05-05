<?php

namespace App\Http\Controllers;

use App\Models\CargoType;
use Illuminate\Http\Request;

class CargoTypeController extends Controller
{
    public function index()
    {
        return response()->json(
            CargoType::where('is_active', true)
                ->orderByRaw("CASE WHEN slug = 'other' THEN 1 ELSE 0 END")
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $data = $request->validate([
            'slug'        => 'required|string|max:50|unique:cargo_types,slug',
            'label'       => 'required|string|max:100',
            'description' => 'nullable|string|max:300',
            'icon'        => 'nullable|string|max:30',
            'coefficient' => 'required|numeric|min:0.1|max:10',
            'is_active'   => 'boolean',
        ]);
        return response()->json(CargoType::create($data), 201);
    }

    public function update(Request $request, CargoType $cargoType)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $data = $request->validate([
            'label'       => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:300',
            'icon'        => 'nullable|string|max:30',
            'coefficient' => 'sometimes|numeric|min:0.1|max:10',
            'is_active'   => 'boolean',
        ]);
        $cargoType->update($data);
        return response()->json($cargoType);
    }

    public function destroy(Request $request, CargoType $cargoType)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $cargoType->delete();
        return response()->json(['message' => 'Тип груза удалён.']);
    }
}
