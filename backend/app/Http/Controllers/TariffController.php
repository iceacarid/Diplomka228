<?php

namespace App\Http\Controllers;

use App\Models\Tariff;
use Illuminate\Http\Request;

class TariffController extends Controller
{
    public function index()
    {
        return response()->json(Tariff::where('is_active', true)->get());
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
