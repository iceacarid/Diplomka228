<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseLog extends Model
{
    protected $fillable = [
        'warehouse_id',
        'order_id',
        'truck_id',
        'driver_id',
        'weight_change',
        'load_before',
        'load_after',
        'action',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'weight_change' => 'float',
            'load_before'   => 'float',
            'load_after'    => 'float',
        ];
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function truck()
    {
        return $this->belongsTo(Truck::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
