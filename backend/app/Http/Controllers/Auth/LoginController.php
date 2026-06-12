<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\BlockAppeal;
use App\Models\User;
use App\Services\OtpService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    const MAX_ATTEMPTS     = 5;
    const LOCKOUT_MINUTES  = 15;

    public function __construct(private OtpService $otpService) {}

    public function login(Request $request)
    {
        $email = strtolower(trim($request->input('email', '')));
        $now   = Carbon::now();

        $user = User::where('email', $email)->first();

        // Проверка блокировки
        if ($user && $user->lockout_until && $user->lockout_until->gt($now)) {
            $remaining = (int) $user->lockout_until->diffInMinutes($now) + 1;
            return response()->json([
                'error'        => "Аккаунт временно заблокирован. Повторите через {$remaining} мин.",
                'locked'       => true,
                'lockout_until'=> $user->lockout_until,
            ], 429);
        }

        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Неверные данные — увеличиваем счётчик
            if ($user && $user->is_active) {
                $user->failed_login_attempts++;
                if ($user->failed_login_attempts >= self::MAX_ATTEMPTS) {
                    $user->lockout_until = $now->copy()->addMinutes(self::LOCKOUT_MINUTES);
                    $user->failed_login_attempts = 0;
                }
                $user->save();
            }
            return response()->json(['error' => 'Неверный email или пароль.'], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'error'      => 'Email не подтверждён. Проверьте почту и введите код.',
                'unverified' => true,
            ], 403);
        }

        if ($user->is_blocked) {
            return response()->json([
                'error'        => 'Аккаунт заблокирован.',
                'is_blocked'   => true,
                'block_reason' => $user->block_reason,
            ], 403);
        }

        // Успешный вход — сброс счётчика
        $user->failed_login_attempts = 0;
        $user->lockout_until = null;
        $user->save();

        // Если 2FA включена — отправляем OTP
        if ($user->two_factor_enabled) {
            try {
                $this->otpService->send($user, 'two_factor');
            } catch (\Exception $e) {
                return response()->json(['error' => 'Не удалось отправить код 2FA: ' . $e->getMessage()], 500);
            }
            return response()->json([
                'two_factor_required' => true,
                'email'               => $user->email,
                'message'             => 'Код подтверждения отправлен на ваш email.',
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'user'  => $this->userData($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Успешный выход.']);
    }

    private function userData(User $user): array
    {
        return [
            'id'                 => $user->id,
            'email'              => $user->email,
            'name'               => $user->name,
            'phone'              => $user->phone,
            'role'               => $user->role,
            'warehouse_id'       => $user->warehouse_id,
            'avatar_url'         => $user->avatarUrl(),
            'is_active'          => $user->is_active,
            'is_blocked'         => (bool) $user->is_blocked,
            'block_reason'       => $user->block_reason,
            'has_block_appeal'   => BlockAppeal::where('user_id', $user->id)->exists(),
            'two_factor_enabled' => $user->two_factor_enabled,
            'created_at'         => $user->created_at,
        ];
    }
}
