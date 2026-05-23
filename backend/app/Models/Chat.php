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
        if ($user->isAdmin()) return true;

        // Order's client always has read access regardless of role
        if ((int) $this->order->client_id === (int) $user->id) return true;

        return $user->isManagerOrAdmin()
            && ((int) $this->manager_id === (int) $user->id
                || (int) $this->order->manager_id === (int) $user->id);
    }

    public function canUserWrite(User $user): bool
    {
        if ($this->isArchived() && !$user->isAdmin()) {
            return false;
        }

        if ($user->isAdmin()) return true;

        // Order's client always has write access regardless of role
        if ((int) $this->order->client_id === (int) $user->id) return true;

        return $user->isManagerOrAdmin()
            && ((int) $this->manager_id === (int) $user->id
                || (int) $this->order->manager_id === (int) $user->id);
    }
}
