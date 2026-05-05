<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tariff extends Model
{
    protected $table = 'tariffs';

    protected $fillable = [
        'name',
        'price_per_km',
        'weight_coef',
        'volume_coef',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_per_km' => 'decimal:2',
            'weight_coef'  => 'decimal:2',
            'volume_coef'  => 'decimal:2',
            'is_active'    => 'boolean',
        ];
    }
}
