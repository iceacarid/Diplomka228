<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FavoriteAddr extends Model
{
    protected $table = 'favorite_addresses';

    protected $fillable = [
        'user_id',
        'title',
        'address',
        'lat',
        'lng',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
