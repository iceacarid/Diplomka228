<?php

namespace App\Http\Controllers;

use App\Models\CargoType;
use App\Models\Tariff;
use App\Services\TwoGisService;
use Illuminate\Http\Request;

class CalculatorController extends Controller
{
    public function __construct(private TwoGisService $maps) {}

    public function suggest(Request $request)
    {
        $request->validate(['q' => 'required|string|min:2|max:200']);
        return response()->json($this->maps->suggest($request->q));
    }

    public function calculate(Request $request)
    {
        $request->validate([
            'origin'      => 'required|string',
            'destination' => 'required|string',
            'weight'      => 'required|numeric|min:0',
            'volume'      => 'required|numeric|min:0',
            'cargo_type'  => 'nullable|string|exists:cargo_types,slug',
        ]);

        $distance = $this->maps->calculateDistance($request->origin, $request->destination) ?? 500;

        $tariff = Tariff::where('is_active', true)->first();
        $pricePerKm = $tariff ? (float) $tariff->price_per_km : 50.0;
        $weightCoef = $tariff ? (float) $tariff->weight_coef  : 1.0;
        $volumeCoef = $tariff ? (float) $tariff->volume_coef  : 50.0;
        $tariffName = $tariff ? $tariff->name : 'По умолчанию';

        $cargoCoef  = 1.0;
        $cargoLabel = 'Обычный груз';
        if ($request->cargo_type) {
            $ct = CargoType::where('slug', $request->cargo_type)->where('is_active', true)->first();
            if ($ct) {
                $cargoCoef  = (float) $ct->coefficient;
                $cargoLabel = $ct->label;
            }
        }

        // Formula: (distance × price_per_km + weight × weight_coef + volume × volume_coef) × cargo_coef
        $base  = ($distance * $pricePerKm) + ($request->weight * $weightCoef) + ($request->volume * $volumeCoef);
        $price = $base * $cargoCoef;

        return response()->json([
            'price'                   => round($price, 2),
            'base_price'              => round($base, 2),
            'distance_km'             => $distance,
            'tariff_name'             => $tariffName,
            'cargo_type_label'        => $cargoLabel,
            'cargo_type_coef'         => $cargoCoef,
            'estimated_delivery_days' => max(1, (int)($distance / 500)),
        ]);
    }

    public function reverseGeocode(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lon' => 'required|numeric|between:-180,180',
        ]);

        $address = $this->maps->reverseGeocode((float)$request->lat, (float)$request->lon);

        if (!$address) {
            return response()->json(['error' => 'Адрес не найден'], 404);
        }

        return response()->json(['address' => $address]);
    }

    public function calculateRoute(Request $request)
    {
        $request->validate([
            'points'   => 'required|array|min:2',
            'points.*' => 'required|string',
        ]);

        $coords = array_map(fn($p) => $this->maps->geocode($p), $request->points);
        if (in_array(null, $coords, true)) {
            return response()->json(['error' => 'Не удалось геокодировать один из адресов.'], 400);
        }

        return response()->json([
            'points'       => $request->points,
            'coords'       => $coords,
            'total_points' => count($request->points),
        ]);
    }
}
