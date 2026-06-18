<?php

namespace App\Http\Controllers;

use App\Models\CourierAction;
use App\Models\User;
use App\Models\WarehouseLog;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    /** GET /api/admin/stats?period=14 */
    public function stats(Request $request)
    {
        $period = max(7, min(90, (int) $request->query('period', 14)));

        $revenueRows = Order::where('status', 'delivered')
            ->where('updated_at', '>=', now()->subDays($period))
            ->select(
                DB::raw('DATE(updated_at) as day'),
                DB::raw('SUM(price) as total')
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $days   = [];
        $labels = [];
        $values = [];
        for ($i = $period - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $days[]   = $date;
            $labels[] = now()->subDays($i)->format('d.m');
            $values[] = isset($revenueRows[$date]) ? (float) $revenueRows[$date]->total : 0;
        }

        $totalRevenue = array_sum($values);
        $prevRevenue  = (float) Order::where('status', 'delivered')
            ->whereBetween('updated_at', [
                now()->subDays($period * 2),
                now()->subDays($period),
            ])
            ->sum('price');

        $revenueGrowth = $prevRevenue > 0
            ? round(($totalRevenue - $prevRevenue) / $prevRevenue * 100, 1)
            : null;

        $totalOrders     = Order::where('created_at', '>=', now()->subDays($period))->count();
        $deliveredOrders = Order::where('status', 'delivered')
            ->where('updated_at', '>=', now()->subDays($period))
            ->count();
        $conversion = $totalOrders > 0 ? round($deliveredOrders / $totalOrders * 100, 1) : 0;

        return response()->json([
            'period'         => $period,
            'labels'         => $labels,
            'values'         => $values,
            'total_revenue'  => $totalRevenue,
            'prev_revenue'   => $prevRevenue,
            'revenue_growth' => $revenueGrowth,
            'total_orders'   => $totalOrders,
            'delivered_orders' => $deliveredOrders,
            'conversion'     => $conversion,
        ]);
    }

    /** GET /api/admin/system-health */
    public function systemHealth()
    {
        // DB
        $dbStatus = 'ok';
        $dbNote   = 'Подключено';
        try {
            DB::connection()->getPdo();
            $t0    = microtime(true);
            DB::select('SELECT 1');
            $dbMs  = round((microtime(true) - $t0) * 1000);
            $dbNote = "{$dbMs} ms";
        } catch (\Exception $e) {
            $dbStatus = 'error';
            $dbNote   = 'Ошибка подключения';
        }

        // 2GIS
        $twoGisKey    = config('services.twogis.key');
        $twoGisStatus = $twoGisKey ? 'ok' : 'error';
        $twoGisNote   = $twoGisKey ? 'API-ключ настроен' : 'API-ключ отсутствует';

        // GigaChat
        $gigaChatLastOk = Cache::get('gigachat_last_call_ok');
        $gigaChatAt     = Cache::get('gigachat_last_call_at');
        if ($gigaChatLastOk === null) {
            $gigaChatStatus = config('services.gigachat.auth_key') ? 'unknown' : 'error';
            $gigaChatNote   = config('services.gigachat.auth_key') ? 'Ключ настроен, ещё не вызван' : 'GIGACHAT_AUTH_KEY не задан';
        } elseif ($gigaChatLastOk) {
            $gigaChatStatus = 'ok';
            $gigaChatNote   = 'Последний вызов успешен' . ($gigaChatAt ? ' · ' . $this->relativeTime($gigaChatAt) : '');
        } else {
            $gigaChatStatus = 'critical';
            $gigaChatNote   = 'Не отвечает — критическая ошибка' . ($gigaChatAt ? ' · ' . $this->relativeTime($gigaChatAt) : '');
        }

        return response()->json([
            'items' => [
                [
                    'name'   => 'API сервис',
                    'note'   => 'Laravel ' . app()->version(),
                    'status' => 'ok',
                    'value'  => '100%',
                ],
                [
                    'name'   => 'База данных',
                    'note'   => $dbNote,
                    'status' => $dbStatus,
                    'value'  => $dbStatus === 'ok' ? $dbNote : 'Ошибка',
                ],
                [
                    'name'   => '2GIS MapGL SDK',
                    'note'   => $twoGisNote,
                    'status' => $twoGisStatus,
                    'value'  => $twoGisStatus === 'ok' ? 'Настроен' : 'Нет ключа',
                ],
                [
                    'name'   => 'GigaChat AI',
                    'note'   => $gigaChatNote,
                    'status' => $gigaChatStatus,
                    'value'  => match($gigaChatStatus) {
                        'ok'      => 'Работает',
                        'critical'=> 'КРИТИЧНО',
                        'error'   => 'Нет ключа',
                        default   => 'Нет данных',
                    },
                ],
            ],
        ]);
    }

    /** GET /api/admin/activity-log?limit=25 */
    public function activityLog(Request $request)
    {
        $limit = max(10, min(100, (int) $request->query('limit', 30)));

        $courierActions = CourierAction::with(['courier', 'order'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($a) => [
                'id'    => 'ca_' . $a->id,
                'type'  => 'courier',
                'title' => $this->courierActionTitle($a->action_type),
                'desc'  => $this->courierActionDesc($a),
                'actor' => $a->courier?->name ?? 'Курьер',
                'time'  => $a->created_at?->toIso8601String(),
                'color' => $this->courierActionColor($a->action_type),
            ]);

        $warehouseLogs = WarehouseLog::with(['warehouse', 'order', 'courier'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($l) => [
                'id'    => 'wl_' . $l->id,
                'type'  => 'warehouse',
                'title' => $this->warehouseLogTitle($l->action),
                'desc'  => $this->warehouseLogDesc($l),
                'actor' => $l->courier?->name ?? ($l->warehouse?->name ?? 'Склад'),
                'time'  => $l->created_at?->toIso8601String(),
                'color' => $this->warehouseLogColor($l->action),
            ]);

        $newUsers = User::where('created_at', '>=', now()->subDays(7))
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn($u) => [
                'id'    => 'usr_' . $u->id,
                'type'  => 'user',
                'title' => 'Новый пользователь',
                'desc'  => "{$u->name} · {$u->role} · {$u->email}",
                'actor' => $u->name,
                'time'  => $u->created_at?->toIso8601String(),
                'color' => '#12B76A',
            ]);

        $merged = $courierActions
            ->concat($warehouseLogs)
            ->concat($newUsers)
            ->sortByDesc('time')
            ->values()
            ->take($limit);

        return response()->json($merged);
    }

    // ─── helpers ───────────────────────────────────────────────────────────────

    private function relativeTime(int $timestamp): string
    {
        $diff = now()->timestamp - $timestamp;
        if ($diff < 60) return 'только что';
        if ($diff < 3600) return round($diff / 60) . ' мин назад';
        if ($diff < 86400) return round($diff / 3600) . ' ч назад';
        return round($diff / 86400) . ' д назад';
    }

    private function courierActionTitle(string $type): string
    {
        return match($type) {
            'shift_open'            => 'Смена открыта',
            'shift_close'           => 'Смена закрыта',
            'shift_open_by_manager' => 'Смена открыта менеджером',
            'shift_close_by_manager'=> 'Смена закрыта менеджером',
            'order_picked_up'       => 'Груз забран у клиента',
            'order_at_warehouse'    => 'Груз сдан на склад',
            'order_delivered'       => 'Доставлено клиенту',
            'reschedule_requested'  => 'Запрошен перенос забора',
            default                 => ucfirst(str_replace('_', ' ', $type)),
        };
    }

    private function courierActionDesc(CourierAction $a): string
    {
        $parts = [];
        if ($a->courier) $parts[] = $a->courier->name;
        if ($a->tracking_id) $parts[] = $a->tracking_id;
        return implode(' · ', $parts) ?: '—';
    }

    private function courierActionColor(string $type): string
    {
        return match($type) {
            'order_delivered'       => '#12B76A',
            'shift_open'            => '#12B76A',
            'shift_open_by_manager' => '#12B76A',
            'order_picked_up'       => '#7BB4FF',
            'order_at_warehouse'    => 'var(--gold)',
            'reschedule_requested'  => '#F79009',
            'shift_close'           => 'rgba(255,255,255,0.4)',
            'shift_close_by_manager'=> 'rgba(255,255,255,0.4)',
            default                 => '#A78BFA',
        };
    }

    private function warehouseLogTitle(string $action): string
    {
        return match($action) {
            'load'          => 'Загрузка на склад / в фуру',
            'unload'        => 'Разгрузка из фуры',
            'courier_pickup'=> 'Курьер забрал с склада',
            'manual'        => 'Ручная корректировка',
            default         => ucfirst(str_replace('_', ' ', $action)),
        };
    }

    private function warehouseLogDesc(WarehouseLog $l): string
    {
        $parts = [];
        if ($l->warehouse) $parts[] = $l->warehouse->name;
        if ($l->order?->tracking_id) $parts[] = $l->order->tracking_id;
        if ($l->weight_change) $parts[] = abs($l->weight_change) . ' кг';
        return implode(' · ', $parts) ?: '—';
    }

    private function warehouseLogColor(string $action): string
    {
        return match($action) {
            'load'          => '#7BB4FF',
            'unload'        => 'var(--gold)',
            'courier_pickup'=> '#A78BFA',
            'manual'        => '#F79009',
            default         => 'rgba(255,255,255,0.4)',
        };
    }
}
