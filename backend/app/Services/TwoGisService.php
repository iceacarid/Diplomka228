<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwoGisService
{
    private string $key;

    public function __construct()
    {
        $this->key = config('services.twogis.key', '');
    }

    private function http(int $timeout = 5)
    {
        return Http::withoutVerifying()->timeout($timeout);
    }

    public function suggest(string $query, int $limit = 7): array
    {
        if (!$this->key || mb_strlen($query) < 2) return [];

        try {
            $res = $this->http(5)->get('https://catalog.api.2gis.com/3.0/items', [
                'q'         => $query,
                'key'       => $this->key,
                'locale'    => 'ru_RU',
                'fields'    => 'items.point',
                'page_size' => $limit,
                'type'      => 'street,building,adm_div',
            ]);

            $items = $res->json('result.items') ?? [];

            $result = [];
            foreach ($items as $i) {
                $name = $i['full_name'] ?? $i['name'] ?? '';
                if (!$name) continue;
                $result[] = [
                    'name' => $name,
                    'lat'  => $i['point']['lat'] ?? null,
                    'lon'  => $i['point']['lon'] ?? null,
                ];
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('2GIS suggest error: ' . $e->getMessage());
            return [];
        }
    }

    public function geocode(string $address): ?array
    {
        if (!$this->key) return null;

        try {
            $res = $this->http(8)->get('https://catalog.api.2gis.com/3.0/items/geocode', [
                'q'      => $address,
                'key'    => $this->key,
                'fields' => 'items.point',
                'locale' => 'ru_RU',
            ]);

            $items = $res->json('result.items') ?? [];
            if (empty($items)) return null;

            $pt = $items[0]['point'] ?? null;
            return $pt ? ['lat' => (float)$pt['lat'], 'lon' => (float)$pt['lon']] : null;
        } catch (\Exception $e) {
            Log::error('2GIS geocode error: ' . $e->getMessage());
            return null;
        }
    }

    public function reverseGeocode(float $lat, float $lon): ?string
    {
        if (!$this->key) return null;

        try {
            $res = $this->http(8)->get('https://catalog.api.2gis.com/3.0/items/geocode', [
                'lat'    => $lat,
                'lon'    => $lon,
                'key'    => $this->key,
                'fields' => 'items.point',
                'locale' => 'ru_RU',
            ]);

            $items = $res->json('result.items') ?? [];
            if (empty($items)) return null;

            return $items[0]['full_name'] ?? $items[0]['name'] ?? null;
        } catch (\Exception $e) {
            Log::error('2GIS reverseGeocode error: ' . $e->getMessage());
            return null;
        }
    }

    public function routeDistance(array $from, array $to): ?float
    {
        if (!$this->key) return null;

        try {
            $res = $this->http(12)->post(
                "https://routing.api.2gis.com/routing/7.0.0/global?key={$this->key}",
                [
                    'points' => [
                        ['lat' => $from['lat'], 'lon' => $from['lon'], 'type' => 'stop'],
                        ['lat' => $to['lat'],   'lon' => $to['lon'],   'type' => 'stop'],
                    ],
                    'transport'  => 'truck',
                    'route_mode' => 'fastest',
                ]
            );

            $routes = $res->json('result') ?? [];
            $meters = $routes[0]['total_distance'] ?? null;

            return $meters ? round($meters / 1000, 1) : null;
        } catch (\Exception $e) {
            Log::error('2GIS routing error: ' . $e->getMessage());
            return null;
        }
    }

    public function calculateDistance(string $origin, string $destination): ?float
    {
        $from = $this->geocode($origin);
        $to   = $this->geocode($destination);

        if (!$from || !$to) return null;

        $road = $this->routeDistance($from, $to);
        return $road ?? $this->haversine($from, $to);
    }

    private function haversine(array $from, array $to): float
    {
        $R    = 6371;
        $dLat = deg2rad($to['lat'] - $from['lat']);
        $dLon = deg2rad($to['lon'] - $from['lon']);
        $a    = sin($dLat / 2) ** 2
              + cos(deg2rad($from['lat'])) * cos(deg2rad($to['lat'])) * sin($dLon / 2) ** 2;
        return round($R * 2 * atan2(sqrt($a), sqrt(1 - $a)), 1);
    }
}
