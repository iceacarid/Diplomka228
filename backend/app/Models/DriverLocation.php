<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverLocation extends Model
{
    public $timestamps = false;

    protected $table = 'driver_locations';

    protected $fillable = ['driver_user_id', 'latitude', 'longitude', 'recorded_at'];

    protected function casts(): array
    {
        return [
            'latitude'    => 'float',
            'longitude'   => 'float',
            'recorded_at' => 'datetime',
        ];
    }

    public function driverUser()
    {
        return $this->belongsTo(User::class, 'driver_user_id');
    }
}
