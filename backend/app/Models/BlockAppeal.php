<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockAppeal extends Model
{
    protected $fillable = ['user_id', 'body', 'status', 'reviewed_by', 'admin_response'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
