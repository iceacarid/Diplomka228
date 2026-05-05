<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourierShift extends Model
{
    protected $fillable = ['courier_id', 'opened_at', 'closed_at'];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function courier()
    {
        return $this->belongsTo(User::class, 'courier_id');
    }

    public function isOpen(): bool
    {
        return $this->closed_at === null;
    }
}
