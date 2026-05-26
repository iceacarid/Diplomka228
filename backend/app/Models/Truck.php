<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Truck extends Model
{
    protected $table = 'trucks';

    protected $fillable = [
        'plate_number',
        'brand',
        'model',
        'capacity_weight',
        'capacity_volume',
        'height_m',
        'width_m',
        'length_m',
        'mass_kg',
        'axle_load_kg',
        'status',
        'driver_id',
        'is_company_owned',
    ];

    protected function casts(): array
    {
        return [
            'is_company_owned' => 'boolean',
            'capacity_volume'  => 'float',
            'height_m'         => 'float',
            'width_m'          => 'float',
            'length_m'         => 'float',
        ];
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
