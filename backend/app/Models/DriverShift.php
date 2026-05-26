<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverShift extends Model
{
    protected $table = 'driver_shifts';

    protected $fillable = ['driver_user_id', 'opened_at', 'closed_at'];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function driverUser()
    {
        return $this->belongsTo(User::class, 'driver_user_id');
    }

    public function isOpen(): bool
    {
        return $this->closed_at === null;
    }
}
