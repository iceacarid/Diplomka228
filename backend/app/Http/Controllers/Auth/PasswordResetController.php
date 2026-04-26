<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function request(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if ($user) {
            try {
                $this->otpService->send($user, 'password_reset');
            } catch (\Exception $e) {
                return response()->json(['error' => 'Не удалось отправить письмо.'], 500);
            }
        }

        return response()->json([
            'message' => 'Если этот email зарегистрирован, на него отправлен код сброса пароля.',
        ]);
    }

    public function confirm(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'email'        => 'required|email',
            'code'         => 'required|string|size:6',
            'new_password' => ['required', 'string', function ($attr, $val, $fail) {
                if (strlen($val) < 8)            $fail('Минимум 8 символов.');
                if (!preg_match('/[A-Z]/', $val)) $fail('Минимум одна заглавная буква.');
                if (!preg_match('/[a-z]/', $val)) $fail('Минимум одна строчная буква.');
                if (!preg_match('/\d/', $val))    $fail('Минимум одна цифра.');
                if (!preg_match('/[!@#$%^&*()\-_=+\[\]{}|;:,.<>?\/\\\\\'"`~]/', $val))
                    $fail('Минимум один специальный символ.');
            }],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Пользователь не найден.'], 404);
        }

        $otp = $this->otpService->verify($user, $request->code, 'password_reset');
        if (!$otp) {
            return response()->json(['error' => 'Неверный или истёкший код.'], 400);
        }

        $otp->update(['is_used' => true]);
        $user->update([
            'password'              => Hash::make($request->new_password),
            'failed_login_attempts' => 0,
            'lockout_until'         => null,
        ]);

        return response()->json(['message' => 'Пароль успешно изменён. Войдите с новым паролем.']);
    }
}
