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
     * Маршрут для фуры. ORS HGV — первый, OSRM — fallback.
     */
    public function truckRoute(array $from, array $to, array $truckParams = [], array $waypoints = []): ?array
    {
        $orsKey = config('services.ors.key');
        if ($orsKey) {
            $result = $this->orsRoute($from, $to, $truckParams, $waypoints, $orsKey);
            if ($result) return $result;
            Log::warning('ORS failed, falling back to OSRM');
        }
        return $this->osrmRoute($from, $to, $waypoints);
    }

    /**
     * OpenRouteService HGV routing — учитывает реальные ограничения для грузовиков.
     */
    private function orsRoute(array $from, array $to, array $truckParams, array $waypoints, string $apiKey): ?array
    {
        $coordinates = [[$from['lon'], $from['lat']]];
        foreach ($waypoints as $wp) {
            $coordinates[] = [$wp['lng'] ?? $wp['lon'], $wp['lat']];
        }
        $coordinates[] = [$to['lon'], $to['lat']];

        $body = ['coordinates' => $coordinates];

        // Restrictions если переданы параметры фуры
        $restrictions = array_filter([
            'height'   => isset($truckParams['height'])    ? (float)$truckParams['height']            : null,
            'width'    => isset($truckParams['width'])     ? (float)$truckParams['width']             : null,
            'length'   => isset($truckParams['length'])    ? (float)$truckParams['length']            : null,
            'weight'   => isset($truckParams['mass'])      ? round($truckParams['mass'] / 1000, 2)    : null,
            'axleload' => isset($truckParams['axle_load']) ? round($truckParams['axle_load'] / 1000, 2) : null,
        ], fn($v) => $v !== null && $v > 0);

        if (!empty($restrictions)) {
            $body['options'] = [
                'vehicle_type'   => 'hgv',
                'profile_params' => ['restrictions' => $restrictions],
            ];
        }

        try {
            $res = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => $apiKey,
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/json',
                ])
                ->timeout(20)
                ->post('https://api.openrouteservice.org/v2/directions/driving-hgv/geojson', $body);

            if (!$res->successful()) {
                Log::warning('ORS route error: ' . $res->status(), ['body' => substr($res->body(), 0, 300)]);
                return null;
            }

            $feature = $res->json('features.0') ?? null;
            if (!$feature) return null;

            $geom = $feature['geometry']['coordinates'] ?? [];
            $summary = $feature['properties']['summary'] ?? [];

            if (empty($geom)) return null;

            $dist = isset($summary['distance']) ? round($summary['distance'] / 1000, 1) : null;
            Log::info('ORS HGV route OK', ['distance_km' => $dist, 'restrictions' => $restrictions]);

            return [
                'distance' => $dist,
                'duration' => $summary['duration'] ?? null,
                'polyline' => $geom,
            ];
        } catch (\Exception $e) {
            Log::error('ORS route exception: ' . $e->getMessage());
            return null;
        }
    }

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
            if (!$route) return null;
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
