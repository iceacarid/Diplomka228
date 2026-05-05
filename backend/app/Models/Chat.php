<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $fillable = ['order_id', 'manager_id', 'status', 'flagged'];

    protected $casts = ['flagged' => 'boolean'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('id');
    }

    public function appeal()
    {
        return $this->hasOne(Appeal::class);
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    public function canUserRead(User $user): bool
    {
        return match ($user->role) {
            'admin'   => true,
            'client'  => $this->order->client_id === $user->id,
            'manager' => $this->manager_id === $user->id
                      || $this->order->manager_id === $user->id,
            default   => false,
        };
    }

    public function canUserWrite(User $user): bool
    {
        if ($this->isArchived() && !$user->isAdmin()) {
            return false;
        }

        return match ($user->role) {
            'admin'   => true,
            'client'  => $this->order->client_id === $user->id,
            'manager' => $this->manager_id === $user->id
                      || $this->order->manager_id === $user->id,
            default   => false,
        };
    }
}
