<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CargoType extends Model
{
    protected $table = 'cargo_types';

    protected $fillable = [
        'slug',
        'label',
        'description',
        'icon',
        'coefficient',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'coefficient' => 'decimal:3',
            'is_active'   => 'boolean',
        ];
    }
}
