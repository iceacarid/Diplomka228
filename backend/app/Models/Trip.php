<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    protected $table = 'trips';

    protected $fillable = [
        'truck_id',
        'driver_id',
        'driver_user_id',
        'warehouse_from_id',
        'warehouse_to_id',
        'status',
        'route_polyline',
        'waypoints',
        'distance_km',
        'started_at',
        'arrived_at',
        'completed_at',
        'estimated_arrival_at',
    ];

    protected function casts(): array
    {
        return [
            'route_polyline' => 'array',
            'waypoints'      => 'array',
            'distance_km'    => 'float',
            'started_at'            => 'datetime',
            'arrived_at'            => 'datetime',
            'completed_at'          => 'datetime',
            'estimated_arrival_at'  => 'datetime',
        ];
    }

    public function truck()        { return $this->belongsTo(Truck::class); }
    public function driver()       { return $this->belongsTo(Driver::class); }
    public function driverUser()   { return $this->belongsTo(User::class, 'driver_user_id'); }
    public function warehouseFrom(){ return $this->belongsTo(Warehouse::class, 'warehouse_from_id'); }
    public function warehouseTo()  { return $this->belongsTo(Warehouse::class, 'warehouse_to_id'); }
    public function orders()       { return $this->hasMany(Order::class); }
}
