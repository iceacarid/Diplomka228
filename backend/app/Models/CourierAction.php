<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourierAction extends Model
{
    protected $fillable = ['courier_id', 'action_type', 'order_id', 'tracking_id', 'shift_id'];

    protected $casts = ['created_at' => 'datetime'];

    public function courier()
    {
        return $this->belongsTo(User::class, 'courier_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public static function log(int $courierId, string $type, ?Order $order = null, ?int $shiftId = null): void
    {
        static::create([
            'courier_id'  => $courierId,
            'action_type' => $type,
            'order_id'    => $order?->id,
            'tracking_id' => $order?->tracking_id,
            'shift_id'    => $shiftId,
        ]);
    }
}
