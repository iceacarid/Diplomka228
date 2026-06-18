<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    const ACTION_EXPIRY_MINUTES = 30;

    public function __construct(private OtpService $otpService) {}

    /** Верификация 2FA-кода при входе */
    public function verifyLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Пользователь не найден.'], 404);
        }

        if (!$user->two_factor_enabled) {
            return response()->json(['error' => '2FA не включена для этого аккаунта.'], 400);
        }

        $otp = $this->otpService->verify($user, $request->code, 'two_factor');
        if (!$otp) {
            return response()->json(['error' => 'Неверный или истёкший код.'], 400);
        }

        $otp->update(['is_used' => true]);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->userData($user),
            'token' => $token,
        ]);
    }

    /** Запрос на включение/отключение 2FA — отправляет ссылку на email */
    public function requestToggle(Request $request)
    {
        $request->validate(['action' => 'required|in:enable,disable']);

        $user = $request->user();
        $action = $request->action;

        if ($action === 'enable' && $user->two_factor_enabled) {
            return response()->json(['message' => '2FA уже включена.']);
        }
        if ($action === 'disable' && !$user->two_factor_enabled) {
            return response()->json(['message' => '2FA уже выключена.']);
        }

        $token = Str::random(64);
        $user->update([
            'two_factor_action_token'      => $token,
            'two_factor_action'            => $action,
            'two_factor_action_expires_at' => Carbon::now()->addMinutes(self::ACTION_EXPIRY_MINUTES),
        ]);

        $confirmUrl = config('app.url') . "/api/auth/2fa/confirm-link?token={$token}&action={$action}";
        $label   = $action === 'enable' ? 'включения' : 'отключения';
        $subject = "ФураЕдет — подтверждение {$label} 2FA";

        \Illuminate\Support\Facades\Mail::send('emails.2fa_link', [
            'name'       => $user->name,
            'action'     => $action,
            'confirmUrl' => $confirmUrl,
            'minutes'    => self::ACTION_EXPIRY_MINUTES,
            'subject'    => $subject,
        ], function ($msg) use ($user, $subject) {
            $msg->to($user->email)->subject($subject);
        });

        return response()->json(['message' => "Письмо со ссылкой подтверждения отправлено на {$user->email}."]);
    }

    /** Подтверждение по ссылке из письма (GET) */
    public function confirmLink(Request $request)
    {
        $token  = $request->query('token', '');
        $action = $request->query('action', '');

        if (!$token || !in_array($action, ['enable', 'disable'])) {
            return redirect(config('app.frontend_url') . '/dashboard?2fa_error=invalid');
        }

        $user = User::where('two_factor_action_token', $token)
                    ->where('two_factor_action', $action)
                    ->first();

        if (!$user) {
            return redirect(config('app.frontend_url') . '/dashboard?2fa_error=invalid');
        }

        if (!$user->two_factor_action_expires_at || $user->two_factor_action_expires_at->isPast()) {
            return redirect(config('app.frontend_url') . '/dashboard?2fa_error=expired');
        }

        $user->update([
            'two_factor_enabled'           => $action === 'enable',
            'two_factor_action_token'      => null,
            'two_factor_action'            => null,
            'two_factor_action_expires_at' => null,
        ]);

        return redirect(config('app.frontend_url') . "/dashboard?2fa_confirmed={$action}");
    }

    private function userData(User $user): array
    {
        return [
            'id'                 => $user->id,
            'email'              => $user->email,
            'name'               => $user->name,
            'phone'              => $user->phone,
            'role'               => $user->role,
            'avatar_url'         => $user->avatarUrl(),
            'two_factor_enabled' => $user->two_factor_enabled,
            'created_at'         => $user->created_at,
        ];
    }
}
