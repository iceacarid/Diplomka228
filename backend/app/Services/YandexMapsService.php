<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YandexMapsService
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.yandex_maps.key', '');
    }

    public function geocode(string $address): ?array
    {
        if (!$this->apiKey) return null;

        try {
            $response = Http::timeout(10)->get('https://geocode-maps.yandex.ru/1.x/', [
                'apikey' => $this->apiKey,
                'geocode' => $address,
                'format'  => 'json',
                'results' => 1,
            ]);

            $data = $response->json();
            $members = $data['response']['GeoObjectCollection']['featureMember'] ?? [];
            if (empty($members)) return null;

            $pos = $members[0]['GeoObject']['Point']['pos'] ?? null;
            if (!$pos) return null;

            [$lng, $lat] = explode(' ', $pos);
            return ['lat' => (float)$lat, 'lng' => (float)$lng];
        } catch (\Exception $e) {
            Log::error('Yandex geocode error: ' . $e->getMessage());
            return null;
        }
    }

    public function calculateDistance(string $origin, string $destination): ?float
    {
        $from = $this->geocode($origin);
        $to   = $this->geocode($destination);

        if (!$from || !$to) {
            return $this->fallbackDistance($origin, $destination);
        }

        // Haversine formula
        $R = 6371;
        $dLat = deg2rad($to['lat'] - $from['lat']);
        $dLng = deg2rad($to['lng'] - $from['lng']);
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($from['lat'])) * cos(deg2rad($to['lat'])) *
             sin($dLng/2) * sin($dLng/2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return round($R * $c, 1);
    }

    public function calculateRoute(array $points): ?array
    {
        if (!$this->apiKey || count($points) < 2) return null;

        try {
            $waypoints = implode('|', array_map(function ($p) {
                $geo = $this->geocode($p);
                return $geo ? "{$geo['lng']},{$geo['lat']}" : null;
            }, $points));

            if (str_contains($waypoints, 'null')) return null;

            return [
                'points'       => $points,
                'waypoints'    => $waypoints,
                'total_points' => count($points),
            ];
        } catch (\Exception $e) {
            Log::error('Yandex route error: ' . $e->getMessage());
            return null;
        }
    }

    private function fallbackDistance(string $origin, string $destination): float
    {
        // Упрощённая таблица расстояний между крупными городами России
        $distances = [
            'москва|санкт-петербург' => 710,
            'москва|новосибирск'     => 3360,
            'москва|екатеринбург'    => 1780,
            'москва|казань'          => 820,
            'москва|нижний новгород' => 410,
            'москва|челябинск'       => 1910,
            'москва|омск'            => 2760,
            'москва|самара'          => 1070,
            'москва|уфа'             => 1340,
            'москва|краснодар'       => 1400,
        ];

        $key = strtolower($origin) . '|' . strtolower($destination);
        $reverseKey = strtolower($destination) . '|' . strtolower($origin);

        return $distances[$key] ?? $distances[$reverseKey] ?? 500.0;
    }
}
