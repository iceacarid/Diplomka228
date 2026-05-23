<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'address',
        'total_capacity',
        'current_load',
    ];

    protected function casts(): array
    {
        return [
            'latitude'       => 'float',
            'longitude'      => 'float',
            'total_capacity' => 'float',
            'current_load'   => 'float',
        ];
    }

    public function logs()
    {
        return $this->hasMany(WarehouseLog::class);
    }

    public function getLoadPercentAttribute(): float
    {
        if ($this->total_capacity <= 0) return 0;
        return round(($this->current_load / $this->total_capacity) * 100, 1);
    }

    public function getFreeCapacityAttribute(): float
    {
        return max(0, $this->total_capacity - $this->current_load);
    }

    /**
     * Placeholder для вызова из модуля разгрузки фур.
     * updateStorageLoad($warehouseId, $weightDelta, $meta)
     */
    public static function updateStorageLoad(int $warehouseId, float $weightDelta, array $meta = []): self
    {
        $warehouse = self::findOrFail($warehouseId);
        $before    = $warehouse->current_load;
        $after     = max(0, $before + $weightDelta);

        $warehouse->update(['current_load' => $after]);

        WarehouseLog::create([
            'warehouse_id' => $warehouse->id,
            'order_id'     => $meta['order_id']  ?? null,
            'truck_id'     => $meta['truck_id']  ?? null,
            'driver_id'    => $meta['driver_id'] ?? null,
            'weight_change'=> $weightDelta,
            'load_before'  => $before,
            'load_after'   => $after,
            'action'       => $meta['action'] ?? ($weightDelta >= 0 ? 'load' : 'unload'),
            'note'         => $meta['note']   ?? null,
        ]);

        return $warehouse->fresh();
    }
}
