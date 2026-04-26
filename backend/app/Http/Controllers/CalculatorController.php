<?php

namespace App\Http\Controllers;

use App\Models\Tariff;
use App\Services\YandexMapsService;
use Illuminate\Http\Request;

class CalculatorController extends Controller
{
    public function __construct(private YandexMapsService $yandex) {}

    public function calculate(Request $request)
    {
        $request->validate([
            'origin'      => 'required|string',
            'destination' => 'required|string',
            'weight'      => 'required|numeric|min:0',
            'volume'      => 'required|numeric|min:0',
        ]);

        $distance = $this->yandex->calculateDistance($request->origin, $request->destination) ?? 500;

        $tariff = Tariff::where('is_active', true)->first();
        if ($tariff) {
            $pricePerKm = (float) $tariff->price_per_km;
            $weightCoef = (float) $tariff->weight_coef;
            $tariffName = $tariff->name;
        } else {
            $pricePerKm = 50.0;
            $weightCoef = 1.0;
            $tariffName = 'По умолчанию';
        }

        $price = ($distance * $pricePerKm) + ($request->weight * $weightCoef);

        return response()->json([
            'price'                  => round($price, 2),
            'distance_km'            => $distance,
            'tariff_name'            => $tariffName,
            'estimated_delivery_days'=> max(1, (int)($distance / 500)),
        ]);
    }

    public function calculateRoute(Request $request)
    {
        $request->validate([
            'points' => 'required|array|min:2',
            'points.*' => 'required|string',
        ]);

        $route = $this->yandex->calculateRoute($request->points);
        if (!$route) {
            return response()->json(['error' => 'Не удалось построить маршрут.'], 400);
        }

        return response()->json($route);
    }
}
