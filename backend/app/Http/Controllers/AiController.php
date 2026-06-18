<?php

namespace App\Http\Controllers;

use App\Models\AiRequest;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use App\Models\Warehouse;
use App\Services\AiService;
use App\Services\GigaChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiController extends Controller
{
    public function __construct(
        private AiService $aiService,
        private GigaChatService $gigaChatService
    ) {}

    /** POST /api/ai/optimize — legacy free-text optimizer */
    public function optimize(Request $request)
    {
        $request->validate([
            'trucks' => 'required|array|min:1',
            'orders' => 'required|array|min:1',
            'prompt' => 'nullable|string',
        ]);

        $recommendation = $this->aiService->optimizeLoad(
            $request->trucks,
            $request->orders,
            $request->input('prompt', '')
        );

        $record = AiRequest::create([
            'manager_id'    => $request->user()->id,
            'request_text'  => 'Транспорт: ' . count($request->trucks) . ', Заказы: ' . count($request->orders),
            'response_text' => $recommendation,
        ]);

        return response()->json([
            'recommendation' => $recommendation,
            'request_id'     => $record->id,
        ]);
    }

    /** GET /api/ai/history */
    public function history(Request $request)
    {
        $history = AiRequest::where('manager_id', $request->user()->id)
                            ->orderByDesc('created_at')
                            ->limit(10)
                            ->get();

        return response()->json($history->map(fn($r) => [
            'id'            => $r->id,
            'request_text'  => $r->request_text,
            'response_text' => $r->response_text,
            'manager_name'  => $r->manager?->name ?? '',
            'created_at'    => $r->created_at,
        ]));
    }

    /** POST /api/ai/distribution-plan — GigaChat structured plan */
    public function distributionPlan(Request $request)
    {
        $request->validate([
            'order_ids'         => 'nullable|array',
            'order_ids.*'       => 'integer',
            'warehouse_from_id' => 'nullable|integer',
            'warehouse_to_id'   => 'nullable|integer',
        ]);

        $trucks = Truck::with('driver')
            ->where('status', 'available')
            ->get();

        $ordersQuery = Order::where('status', 'at_warehouse');
        if (!empty($request->order_ids)) {
            $ordersQuery->whereIn('id', $request->order_ids);
        }
        $orders = $ordersQuery->get();

        if ($trucks->isEmpty()) {
            return response()->json(['error' => 'Нет доступных фур.'], 422);
        }
        if ($orders->isEmpty()) {
            return response()->json(['error' => 'Нет заказов для распределения.'], 422);
        }

        $warehouseIds = array_filter([
            $request->warehouse_from_id,
            $request->warehouse_to_id,
        ]);
        $warehousesData = Warehouse::when(!empty($warehouseIds), fn($q) => $q->whereIn('id', $warehouseIds))
            ->get()
            ->map(fn($w) => [
                'id'              => $w->id,
                'name'            => $w->name,
                'address'         => $w->address,
                'total_capacity'  => $w->total_capacity,
                'current_load'    => $w->current_load,
                'load_percent'    => $w->total_capacity > 0
                    ? round($w->current_load / $w->total_capacity * 100, 1)
                    : 0,
            ])->values()->toArray();

        $trucksData = $trucks->map(fn($t) => [
            'id'              => $t->id,
            'plate_number'    => $t->plate_number,
            'brand'           => $t->brand,
            'model'           => $t->model,
            'capacity_weight' => $t->capacity_weight,
            'capacity_volume' => (float) $t->capacity_volume,
            'driver_name'     => $t->driver?->name ?? 'Нет водителя',
        ])->values()->toArray();

        $ordersData = $orders->map(fn($o) => [
            'id'             => $o->id,
            'tracking_id'    => $o->tracking_id,
            'origin_address' => $o->origin_address,
            'dest_address'   => $o->dest_address,
            'weight'         => (float) $o->weight,
            'volume'         => (float) ($o->volume ?? 0),
            'cargo_type'     => $o->cargo_type,
            'actual_weight'  => $o->actual_weight ? (float) $o->actual_weight : null,
        ])->values()->toArray();

        $aiResult = $this->gigaChatService->optimizeDistribution($trucksData, $ordersData, $warehousesData);

        if (!$aiResult) {
            return response()->json(['error' => 'GigaChat не ответил. Проверьте GIGACHAT_AUTH_KEY.'], 503);
        }

        // Enrich plan with full model data, merging duplicate truck_id entries
        $trucksById = $trucks->keyBy('id');
        $ordersById = $orders->keyBy('id');

        $planByTruck   = [];
        $usedOrderIds  = [];

        // Отслеживаем накопленный вес/объём по фурам для контроля перегруза
        $truckLoad = []; // [truck_id => ['weight' => float, 'volume' => float]]

        foreach ($aiResult['plan'] as $item) {
            $truck = $trucksById->get($item['truck_id']);
            if (!$truck) continue;

            $tid = $truck->id;
            if (!isset($planByTruck[$tid])) {
                $planByTruck[$tid] = [
                    'truck_id'      => $tid,
                    'truck'         => $this->truckSummary($truck),
                    'orders'        => [],
                    'justification' => '',
                ];
                $truckLoad[$tid] = ['weight' => 0.0, 'volume' => 0.0];
            }

            foreach ($item['order_ids'] ?? [] as $oid) {
                $order = $ordersById->get($oid);
                if (!$order || in_array($oid, $usedOrderIds)) continue;

                $w = (float) ($order->actual_weight ?? $order->weight ?? 0);
                $v = (float) ($order->volume ?? 0);

                $capW = (float) $truck->capacity_weight;
                $capV = (float) ($truck->capacity_volume ?? 0);

                $newW = $truckLoad[$tid]['weight'] + $w;
                $newV = $truckLoad[$tid]['volume'] + $v;

                // Перегруз → пропускаем (уйдёт в unassigned ниже)
                $overWeight = $capW > 0 && $newW > $capW;
                $overVolume = $capV > 0 && $newV > $capV;
                if ($overWeight || $overVolume) continue;

                $planByTruck[$tid]['orders'][] = $this->orderSummary($order);
                $truckLoad[$tid]['weight'] = $newW;
                $truckLoad[$tid]['volume'] = $newV;
                $usedOrderIds[] = $oid;
            }

            if (!empty($item['justification'])) {
                $planByTruck[$tid]['justification'] = $item['justification'];
            }
        }

        // Only include trucks that actually got orders assigned
        $enrichedPlan = array_values(array_filter(
            $planByTruck,
            fn($p) => count($p['orders']) > 0
        ));

        // Unassigned = из ответа GigaChat + те, что мы срезали из-за перегруза
        $unassigned = [];
        foreach ($aiResult['unassigned'] ?? [] as $item) {
            $order = $ordersById->get($item['order_id']);
            if ($order) {
                $unassigned[] = [
                    'order'  => $this->orderSummary($order),
                    'reason' => $item['reason'] ?? '',
                ];
            }
        }
        // Добавляем заказы, срезанные из-за перегруза (не вошли в usedOrderIds)
        foreach ($ordersData as $od) {
            if (!in_array($od['id'], $usedOrderIds)) {
                $alreadyListed = collect($unassigned)->contains(fn($u) => $u['order']['id'] === $od['id']);
                if (!$alreadyListed) {
                    $unassigned[] = [
                        'order'  => $od,
                        'reason' => 'Превышена грузоподъёмность или объём всех доступных фур',
                    ];
                }
            }
        }

        $assignedCount = array_sum(array_map(fn($p) => count($p['orders']), $enrichedPlan));

        // Если есть нераспределённые — запрашиваем рекомендации у GigaChat
        $recommendation = null;
        if (!empty($unassigned)) {
            $unassignedForAi = array_map(fn($u) => $u['order'], $unassigned);
            $recommendation  = $this->gigaChatService->recommendForUnassigned($unassignedForAi, $trucksData);
        }

        AiRequest::create([
            'manager_id'    => $request->user()->id,
            'request_text'  => "Распределение: фур {$trucks->count()}, заказов {$orders->count()}",
            'response_text' => "Назначено {$assignedCount}/{$orders->count()} заказов по " . count($enrichedPlan) . " фурам"
                             . (!empty($unassigned) ? ', нераспределено: ' . count($unassigned) : ''),
        ]);

        return response()->json([
            'plan'           => $enrichedPlan,
            'unassigned'     => $unassigned,
            'recommendation' => $recommendation,
        ]);
    }

    /** POST /api/ai/apply-plan — commit draft assignments to DB */
    public function applyPlan(Request $request)
    {
        $request->validate([
            'assignments'               => 'required|array|min:1',
            'assignments.*.truck_id'    => 'required|exists:trucks,id',
            'assignments.*.order_ids'   => 'required|array|min:1',
            'assignments.*.order_ids.*' => 'integer|exists:orders,id',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->assignments as $assignment) {
                $truck = Truck::with('driver')->findOrFail($assignment['truck_id']);

                if ($truck->status !== 'available') {
                    DB::rollBack();
                    return response()->json(
                        ['error' => "Фура {$truck->plate_number} больше недоступна."],
                        422
                    );
                }

                $assignOrders = Order::whereIn('id', $assignment['order_ids'])
                    ->where('status', 'in_progress')
                    ->whereNull('truck_id')
                    ->get();

                if ($assignOrders->count() !== count($assignment['order_ids'])) {
                    DB::rollBack();
                    return response()->json(
                        ['error' => 'Некоторые заказы уже назначены или изменили статус. Обновите страницу.'],
                        422
                    );
                }

                $totalWeight = $assignOrders->sum('weight');
                $totalVolume = $assignOrders->sum('volume');

                if ($totalWeight > $truck->capacity_weight) {
                    DB::rollBack();
                    return response()->json(
                        ['error' => "Превышена грузоподъёмность фуры {$truck->plate_number}."],
                        422
                    );
                }
                if ($truck->capacity_volume > 0 && $totalVolume > $truck->capacity_volume) {
                    DB::rollBack();
                    return response()->json(
                        ['error' => "Превышен объём фуры {$truck->plate_number}."],
                        422
                    );
                }

                Order::whereIn('id', $assignment['order_ids'])->update([
                    'truck_id'  => $truck->id,
                    'driver_id' => $truck->driver?->id,
                    'status'    => 'shipped',
                ]);

                $truck->update(['status' => 'in_transit']);

                if ($truck->driver) {
                    $truck->driver->update(['is_available' => false]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Ошибка: ' . $e->getMessage()], 500);
        }

        return response()->json(['message' => 'План успешно применён.']);
    }

    private function truckSummary(Truck $truck): array
    {
        return [
            'id'              => $truck->id,
            'plate_number'    => $truck->plate_number,
            'brand'           => $truck->brand,
            'model'           => $truck->model,
            'capacity_weight' => $truck->capacity_weight,
            'capacity_volume' => (float) $truck->capacity_volume,
            'status'          => $truck->status,
            'driver_id'       => $truck->driver?->id,
            'driver_name'     => $truck->driver?->name ?? '',
            'driver_phone'    => $truck->driver?->phone ?? '',
        ];
    }

    private function orderSummary(Order $order): array
    {
        return [
            'id'             => $order->id,
            'tracking_id'    => $order->tracking_id,
            'origin_address' => $order->origin_address,
            'dest_address'   => $order->dest_address,
            'weight'         => (float) $order->weight,
            'volume'         => (float) ($order->volume ?? 0),
            'cargo_type'     => $order->cargo_type,
            'price'          => $order->price,
            'created_at'     => $order->created_at,
        ];
    }
}
