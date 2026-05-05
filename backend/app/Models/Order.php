<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'tracking_id',
        'client_id',
        'manager_id',
        'truck_id',
        'driver_id',
        'courier_id',
        'status',
        'origin_address',
        'dest_address',
        'weight',
        'volume',
        'cargo_type',
        'cargo_type_custom',
        'cargo_description',
        'price',
        'eta',
        'rejection_reason',
        'pickup_date',
        'pickup_time',
        'courier_blocked',
        'courier_blocked_reason',
    ];

    protected function casts(): array
    {
        return [
            'weight'     => 'float',
            'volume'     => 'float',
            'price'      => 'decimal:2',
            'eta'             => 'datetime',
            'pickup_date'     => 'date',
            'courier_blocked' => 'boolean',
            'created_at'      => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($order) {
            if (empty($order->tracking_id)) {
                $order->tracking_id = static::generateTrackingId();
            }
        });
    }

    public static function generateTrackingId(): string
    {
        do {
            $code = 'FE-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (static::where('tracking_id', $code)->exists());
        return $code;
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function truck()
    {
        return $this->belongsTo(Truck::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function courier()
    {
        return $this->belongsTo(User::class, 'courier_id');
    }

    public function chat()
    {
        return $this->hasOne(Chat::class);
    }
}
