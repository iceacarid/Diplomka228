<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'users';

    protected $fillable = [
        'email',
        'name',
        'phone',
        'avatar',
        'role',
        'password',
        'is_active',
        'failed_login_attempts',
        'lockout_until',
        'two_factor_enabled',
        'two_factor_action_token',
        'two_factor_action',
        'two_factor_action_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_action_token',
    ];

    protected function casts(): array
    {
        return [
            'password'                    => 'hashed',
            'is_active'                   => 'boolean',
            'two_factor_enabled'          => 'boolean',
            'lockout_until'               => 'datetime',
            'two_factor_action_expires_at'=> 'datetime',
            'created_at'                  => 'datetime',
        ];
    }

    // Relations
    public function orders()
    {
        return $this->hasMany(Order::class, 'client_id');
    }

    public function managedOrders()
    {
        return $this->hasMany(Order::class, 'manager_id');
    }

    public function favoriteAddresses()
    {
        return $this->hasMany(FavoriteAddr::class);
    }

    public function aiRequests()
    {
        return $this->hasMany(AiRequest::class, 'manager_id');
    }

    public function otps()
    {
        return $this->hasMany(EmailOtp::class);
    }

    // Helpers
    public function isClient(): bool   { return $this->role === 'client'; }
    public function isManager(): bool  { return $this->role === 'manager'; }
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isManagerOrAdmin(): bool { return in_array($this->role, ['manager', 'admin']); }

    public function avatarUrl(): string
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        return asset('storage/avatars/default.png');
    }
}
