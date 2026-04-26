<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    protected $table = 'drivers';

    protected $fillable = [
        'name',
        'phone',
        'license_number',
        'type',
        'personal_car',
        'insurance_num',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
        ];
    }

    public function trucks()
    {
        return $this->hasMany(Truck::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
