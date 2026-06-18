<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{

    public function register(Request $request)
    {
        $email = strtolower(trim($request->input('email', '')));

        $validator = Validator::make($request->all(), [
            'email'    => 'required|email|unique:users,email',
            'name'     => 'required|string|max:255',
            'phone'    => 'nullable|string|max:20',
            'password' => ['required', 'string', function ($attr, $val, $fail) {
                if (strlen($val) < 8)            $fail('Минимум 8 символов.');
                if (!preg_match('/[A-Z]/', $val)) $fail('Минимум одна заглавная буква.');
                if (!preg_match('/[a-z]/', $val)) $fail('Минимум одна строчная буква.');
                if (!preg_match('/\d/', $val))    $fail('Минимум одна цифра.');
                if (!preg_match('/[!@#$%^&*()\-_=+\[\]{}|;:,.<>?\/\\\\\'"`~]/', $val))
                    $fail('Минимум один специальный символ.');
            }],
        ], [
            'email.required' => 'Укажите email.',
            'email.email'    => 'Некорректный формат email.',
            'email.unique'   => 'Этот email уже зарегистрирован.',
            'name.required'  => 'Укажите имя.',
            'name.max'       => 'Имя слишком длинное.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'email'     => $email,
            'name'      => $request->name,
            'phone'     => $request->phone,
            'password'  => Hash::make($request->password),
            'role'      => 'client',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Регистрация успешна.',
            'user'    => $this->userData($user),
            'token'   => $token,
        ], 201);
    }

    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'   => 'required|email',
            'code'    => 'required|string|size:6',
            'purpose' => 'required|in:registration,password_reset',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Пользователь не найден.'], 404);
        }

        $otp = $this->otpService->verify($user, $request->code, $request->purpose);
        if (!$otp) {
            return response()->json(['error' => 'Неверный или истёкший код.'], 400);
        }

        $otp->update(['is_used' => true]);

        if ($request->purpose === 'registration') {
            $user->update(['is_active' => true]);
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'message' => 'Email подтверждён. Регистрация завершена.',
                'user'    => $this->userData($user),
                'token'   => $token,
            ]);
        }

        return response()->json(['message' => 'Код подтверждён.', 'email' => $request->email]);
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email'   => 'required|email',
            'purpose' => 'required|in:registration,password_reset',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Если email зарегистрирован, на него отправлен код.']);
        }

        if ($request->purpose === 'registration' && $user->is_active) {
            return response()->json(['error' => 'Email уже подтверждён.'], 400);
        }

        try {
            $this->otpService->send($user, $request->purpose);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Не удалось отправить письмо.'], 500);
        }

        return response()->json(['message' => 'Код отправлен повторно.']);
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
