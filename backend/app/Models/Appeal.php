<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appeal extends Model
{
    protected $fillable = ['chat_id', 'client_id', 'body', 'status', 'admin_id'];

    public function chat()   { return $this->belongsTo(Chat::class); }
    public function client() { return $this->belongsTo(User::class, 'client_id'); }
    public function admin()  { return $this->belongsTo(User::class, 'admin_id'); }
}
