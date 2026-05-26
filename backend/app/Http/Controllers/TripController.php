<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\DriverLocation;
use App\Models\Message;
use App\Models\Order;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\Warehouse;
use App\Services\TwoGisService;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function __construct(private TwoGisService $maps) {}

    /** GET /trips — все рейсы для менеджера/администратора */
    public function index(Request $request)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403, 'Нет доступа.');

        $trips = Trip::with(['truck', 'driver', 'warehouseFrom', 'warehouseTo'])
            ->withCount('orders')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $this->tripListData($t));

        return response()->json($trips);
    }

    /** POST /trips — создать рейс */
    public function store(Request $request)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403, 'Нет доступа.');

        $data = $request->validate([
            'truck_id'              => 'required|exists:trucks,id',
            'driver_id'             => 'required|exists:drivers,id',
            'warehouse_from_id'     => 'required|exists:warehouses,id',
            'warehouse_to_id'       => 'required|exists:warehouses,id|different:warehouse_from_id',
            'order_ids'             => 'required|array|min:1',
            'order_ids.*'           => 'exists:orders,id',
            'estimated_arrival_at'  => 'nullable|date',
        ]);

        $truck  = Truck::findOrFail($data['truck_id']);
        $driver = Driver::findOrFail($data['driver_id']);

        if ($truck->status !== 'available') {
            return response()->json(['error' => 'Транспорт недоступен.'], 400);
        }
        if (!$driver->is_available) {
            return response()->json(['error' => 'Водитель недоступен.'], 400);
        }

        $orders = Order::whereIn('id', $data['order_ids'])
                       ->where('status', 'at_warehouse')
                       ->get();

        if ($orders->count() !== count($data['order_ids'])) {
            return response()->json(['error' => 'Часть заказов недоступна (статус не at_warehouse).'], 400);
        }

        $warehouseFrom = Warehouse::findOrFail($data['warehouse_from_id']);
        $warehouseTo   = Warehouse::findOrFail($data['warehouse_to_id']);

        $route = $this->buildTruckRoute($warehouseFrom, $warehouseTo, $truck);

        $trip = Trip::create([
            'truck_id'             => $truck->id,
            'driver_id'            => $driver->id,
            'driver_user_id'       => $driver->user_id,
            'warehouse_from_id'    => $warehouseFrom->id,
            'warehouse_to_id'      => $warehouseTo->id,
            'status'               => 'forming',
            'route_polyline'       => $route['polyline'],
            'distance_km'          => $route['distance_km'],
            'estimated_arrival_at' => $data['estimated_arrival_at'] ?? null,
        ]);

        $truck->update(['status' => 'in_transit', 'driver_id' => $driver->id]);
        $driver->update(['is_available' => false]);

        $orders->each(function (Order $order) use ($trip, $driver, $truck) {
            $order->update([
                'trip_id'   => $trip->id,
                'truck_id'  => $truck->id,
                'driver_id' => $driver->id,
            ]);
            $this->botMessage($order,
                "Рейс сформирован. Водитель {$driver->name} ({$truck->plate_number}) заберёт груз со склада {$trip->warehouseFrom->name}."
            );
        });

        return response()->json($this->tripDetailData($trip->load(['truck', 'driver', 'warehouseFrom', 'warehouseTo', 'orders.client'])), 201);
    }

    /** PUT /trips/{trip}/waypoints — обновить промежуточные точки и пересчитать маршрут */
    public function updateWaypoints(Request $request, Trip $trip)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403, 'Нет доступа.');

        $data = $request->validate([
            'waypoints'         => 'present|array',
            'waypoints.*.lat'   => 'required|numeric',
            'waypoints.*.lng'   => 'required|numeric',
            'waypoints.*.label' => 'nullable|string|max:100',
        ]);

        $trip->load(['truck', 'warehouseFrom', 'warehouseTo']);
        $route = $this->buildTruckRoute($trip->warehouseFrom, $trip->warehouseTo, $trip->truck, $data['waypoints']);

        $trip->update([
            'waypoints'      => $data['waypoints'],
            'route_polyline' => $route['polyline'],
            'distance_km'    => $route['distance_km'],
        ]);

        return response()->json([
            'id'             => $trip->id,
            'route_polyline' => $trip->route_polyline,
            'waypoints'      => $trip->waypoints,
            'distance_km'    => $trip->distance_km,
        ]);
    }

    /** GET /trips/{trip} — детали рейса */
    public function show(Request $request, Trip $trip)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403, 'Нет доступа.');
        $trip->load(['truck', 'driver', 'warehouseFrom', 'warehouseTo', 'orders.client']);
        return response()->json($this->tripDetailData($trip));
    }

    /** GET /trips/active-trucks — текущие позиции всех активных фур */
    public function activeTrucks(Request $request)
    {
        abort_unless($request->user()->isManagerOrAdmin(), 403, 'Нет доступа.');

        $activeTrips = Trip::with(['truck', 'driver', 'warehouseFrom', 'warehouseTo'])
            ->whereIn('status', ['forming', 'loading', 'in_transit', 'arrived'])
            ->get();

        $result = $activeTrips->map(function (Trip $trip) {
            $driverUserId = $trip->driver_user_id;
            $location = $driverUserId
                ? DriverLocation::where('driver_user_id', $driverUserId)->latest('recorded_at')->first()
                : null;

            return [
                'trip_id'    => $trip->id,
                'status'     => $trip->status,
                'truck'      => ['plate' => $trip->truck->plate_number, 'label' => "{$trip->truck->brand} {$trip->truck->model}"],
                'driver'     => ['name' => $trip->driver->name],
                'from'       => $trip->warehouseFrom->name,
                'to'         => $trip->warehouseTo->name,
                'driver_id'      => $trip->driver_id,
                'route_polyline' => $trip->route_polyline,
                'waypoints'      => $trip->waypoints,
                'warehouse_from' => ['lat' => $trip->warehouseFrom->latitude, 'lng' => $trip->warehouseFrom->longitude, 'name' => $trip->warehouseFrom->name],
                'warehouse_to'   => ['lat' => $trip->warehouseTo->latitude,   'lng' => $trip->warehouseTo->longitude,   'name' => $trip->warehouseTo->name],
                'location'       => $location ? ['lat' => $location->latitude, 'lng' => $location->longitude, 'at' => $location->recorded_at] : null,
            ];
        });

        return response()->json($result);
    }

    /**
     * Запрашивает реальный маршрут через Truck Directions API.
     * При ошибке API — fallback на прямую линию между координатами.
     * Возвращает ['polyline' => [[lon,lat],...], 'distance_km' => float|null]
     */
    private function buildTruckRoute(Warehouse $from, Warehouse $to, Truck $truck, array $waypoints = []): array
    {
        $fallback = [
            'polyline'    => null,
            'distance_km' => null,
        ];

        if (!$from->latitude || !$from->longitude || !$to->latitude || !$to->longitude) {
            return $fallback;
        }

        // Параметры конкретной фуры (используем заданные, иначе дефолты в TwoGisService)
        $truckParams = array_filter([
            'height'        => $truck->height_m       ?: null,
            'width'         => $truck->width_m         ?: null,
            'length'        => $truck->length_m        ?: null,
            'mass'          => $truck->mass_kg         ?: null,
            'axle_load'     => $truck->axle_load_kg    ?: null,
            // capacity_weight в тоннах → переводим в кг для полной разрешённой массы
            'max_perm_mass' => $truck->capacity_weight ? (int)($truck->capacity_weight * 1000) : null,
        ], fn($v) => $v !== null);

        $route = $this->maps->truckRoute(
            ['lat' => $from->latitude,  'lon' => $from->longitude],
            ['lat' => $to->latitude,    'lon' => $to->longitude],
            $truckParams,
            $waypoints
        );

        if ($route && $route['polyline']) {
            return [
                'polyline'    => $route['polyline'],
                'distance_km' => $route['distance'],
            ];
        }

        // API недоступен или нет ключа — прямая линия как fallback
        return [
            'polyline' => [
                [$from->longitude, $from->latitude],
                [$to->longitude,   $to->latitude],
            ],
            'distance_km' => null,
        ];
    }

    private function botMessage(Order $order, string $text): void
    {
        $chat = $order->chat;
        if (!$chat) return;
        Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => null,
            'sender_role' => 'bot',
            'body'        => $text,
            'type'        => 'text',
        ]);
        $chat->touch();
    }

    private function tripListData(Trip $trip): array
    {
        return [
            'id'             => $trip->id,
            'status'         => $trip->status,
            'truck'          => ['id' => $trip->truck->id, 'plate' => $trip->truck->plate_number, 'label' => "{$trip->truck->brand} {$trip->truck->model}"],
            'driver'         => ['id' => $trip->driver->id, 'name' => $trip->driver->name],
            'warehouse_from' => ['id' => $trip->warehouseFrom->id, 'name' => $trip->warehouseFrom->name],
            'warehouse_to'   => ['id' => $trip->warehouseTo->id,   'name' => $trip->warehouseTo->name],
            'orders_count'   => $trip->orders_count ?? $trip->orders()->count(),
            'distance_km'    => $trip->distance_km,
            'estimated_arrival_at' => $trip->estimated_arrival_at,
            'started_at'     => $trip->started_at,
            'arrived_at'     => $trip->arrived_at,
            'completed_at'   => $trip->completed_at,
            'created_at'     => $trip->created_at,
        ];
    }

    private function tripDetailData(Trip $trip): array
    {
        return array_merge($this->tripListData($trip), [
            'route_polyline' => $trip->route_polyline,
            'waypoints'      => $trip->waypoints,
            'warehouse_from' => [
                'id' => $trip->warehouseFrom->id, 'name' => $trip->warehouseFrom->name,
                'address' => $trip->warehouseFrom->address,
                'lat' => $trip->warehouseFrom->latitude, 'lng' => $trip->warehouseFrom->longitude,
            ],
            'warehouse_to'   => [
                'id' => $trip->warehouseTo->id, 'name' => $trip->warehouseTo->name,
                'address' => $trip->warehouseTo->address,
                'lat' => $trip->warehouseTo->latitude, 'lng' => $trip->warehouseTo->longitude,
            ],
            'orders' => $trip->orders->map(fn($o) => [
                'id' => $o->id, 'tracking_id' => $o->tracking_id, 'status' => $o->status,
                'weight' => $o->actual_weight ?? $o->weight, 'volume' => $o->actual_volume ?? $o->volume,
                'origin_address' => $o->origin_address, 'dest_address' => $o->dest_address,
                'client_name' => $o->client?->name,
            ]),
        ]);
    }
}
