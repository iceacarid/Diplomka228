<?php

namespace App\Http\Controllers;

use App\Models\Tariff;
use Illuminate\Http\Request;

class TariffController extends Controller
{
    public function index()
    {
        $tariff = Tariff::where('is_active', true)->first()
            ?? Tariff::firstOrCreate(
                ['name' => 'Базовый'],
                ['price_per_km' => 55.00, 'weight_coef' => 12.00, 'volume_coef' => 50.00, 'is_active' => true]
            );

        return response()->json([$tariff]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'price_per_km' => 'required|numeric|min:0',
            'weight_coef'  => 'required|numeric|min:0',
            'volume_coef'  => 'required|numeric|min:0',
            'is_active'    => 'boolean',
        ]);
        return response()->json(Tariff::create($data), 201);
    }

    public function update(Request $request, Tariff $tariff)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'price_per_km' => 'sometimes|numeric|min:0',
            'weight_coef'  => 'sometimes|numeric|min:0',
            'volume_coef'  => 'sometimes|numeric|min:0',
            'is_active'    => 'boolean',
        ]);
        $tariff->update($data);
        return response()->json($tariff);
    }

    public function destroy(Request $request, Tariff $tariff)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Недостаточно прав.'], 403);
        }
        $tariff->delete();
        return response()->json(['message' => 'Тариф удалён.']);
    }
}
