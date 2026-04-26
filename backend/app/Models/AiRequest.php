<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiRequest extends Model
{
    protected $table = 'ai_requests';

    protected $fillable = [
        'manager_id',
        'request_text',
        'response_text',
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
}
