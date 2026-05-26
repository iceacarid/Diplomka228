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

    // ─── Подсказки адресов ────────────────────────────────────────────────────

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

    // ─── Геокодирование ───────────────────────────────────────────────────────

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

    // ─── Truck Directions API ─────────────────────────────────────────────────

    /**
     * Маршрут для фуры с учётом ограничений (высота, вес, осевая нагрузка).
     * Возвращает distance (км), duration (сек) и polyline ([[lon,lat], ...]).
     */
    public function truckRoute(array $from, array $to, array $truckParams = [], array $waypoints = []): ?array
    {
        $points2gis = [['x' => $from['lon'], 'y' => $from['lat']]];
        foreach ($waypoints as $wp) {
            $points2gis[] = ['x' => (float)$wp['lng'], 'y' => (float)$wp['lat']];
        }
        $points2gis[] = ['x' => $to['lon'], 'y' => $to['lat']];

        // ── Попытка 1: 2GIS Truck Directions ──────────────────────────────────
        if ($this->key) {
            $defaults = [
                'height'        => 4.0,
                'width'         => 2.55,
                'length'        => 16.5,
                'mass'          => 20000,
                'max_perm_mass' => 44000,
                'axle_load'     => 11500,
            ];
            $params = array_merge($defaults, array_filter($truckParams, fn($v) => $v !== null));

            try {
                $res = $this->http(15)->post(
                    "https://routing.api.2gis.com/truck/6.0.0/global?key={$this->key}",
                    ['points' => $points2gis, 'type' => 'truck_jam', 'truck_params' => $params]
                );

                $result = $res->json('result.0') ?? null;
                if ($result && isset($result['geometry'])) {
                    return [
                        'distance' => isset($result['total_distance']) ? round($result['total_distance'] / 1000, 1) : null,
                        'duration' => $result['total_duration'] ?? null,
                        'polyline' => $this->parseLinestring($result['geometry']),
                    ];
                }
                Log::info('2GIS truck route fallback to OSRM', ['status' => $res->status(), 'body' => substr($res->body(), 0, 200)]);
            } catch (\Exception $e) {
                Log::warning('2GIS truck route exception: ' . $e->getMessage());
            }
        }

        // ── Попытка 2: OSRM (открытый, без ключа, реальные дороги) ──────────
        return $this->osrmRoute($from, $to, $waypoints);
    }

    /**
     * OSRM fallback — бесплатный роутинг по реальным дорогам.
     */
    private function osrmRoute(array $from, array $to, array $waypoints = []): ?array
    {
        $coords = "{$from['lon']},{$from['lat']}";
        foreach ($waypoints as $wp) {
            $coords .= ";{$wp['lng']},{$wp['lat']}";
        }
        $coords .= ";{$to['lon']},{$to['lat']}";

        try {
            $res = $this->http(20)->get(
                "https://router.project-osrm.org/route/v1/driving/{$coords}",
                ['overview' => 'full', 'geometries' => 'geojson']
            );

            $route = $res->json('routes.0') ?? null;
            if (!$route) {
                Log::warning('OSRM route: empty result', ['body' => substr($res->body(), 0, 200)]);
                return null;
            }

            $geom = $route['geometry']['coordinates'] ?? [];
            if (empty($geom)) return null;

            return [
                'distance' => isset($route['distance']) ? round($route['distance'] / 1000, 1) : null,
                'duration' => $route['duration'] ?? null,
                'polyline' => $geom,
            ];
        } catch (\Exception $e) {
            Log::error('OSRM route error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Просто расстояние в км (для калькулятора).
     * Использует Truck Directions API, fallback — haversine.
     */
    public function routeDistance(array $from, array $to, array $truckParams = []): ?float
    {
        $route = $this->truckRoute($from, $to, $truckParams);
        return $route['distance'] ?? null;
    }

    /**
     * Рассчитать расстояние по строковым адресам.
     */
    public function calculateDistance(string $origin, string $destination): ?float
    {
        $from = $this->geocode($origin);
        $to   = $this->geocode($destination);

        if (!$from || !$to) return null;

        $km = $this->routeDistance($from, $to);
        return $km ?? $this->haversine($from, $to);
    }

    // ─── Внутренние хелперы ───────────────────────────────────────────────────

    /**
     * Парсинг LINESTRING(lon1 lat1 alt1, lon2 lat2 alt2, ...) → [[lon, lat], ...]
     */
    private function parseLinestring(string $linestring): array
    {
        if (!preg_match('/LINESTRING\s*\((.+)\)/i', $linestring, $m)) return [];

        $coords = [];
        foreach (explode(',', $m[1]) as $point) {
            $parts = preg_split('/\s+/', trim($point));
            if (count($parts) >= 2) {
                $coords[] = [(float)$parts[0], (float)$parts[1]]; // [lon, lat]
            }
        }
        return $coords;
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
