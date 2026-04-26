<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\CalculatorController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\FavoriteAddrController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TariffController;
use App\Http\Controllers\TruckController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ─── Публичные маршруты ───────────────────────────────────────────────────────

// Auth
Route::prefix('auth')->group(function () {
    Route::post('register',               [RegisterController::class, 'register']);
    Route::post('verify-email',           [RegisterController::class, 'verifyEmail']);
    Route::post('resend-otp',             [RegisterController::class, 'resendOtp']);
    Route::post('login',                  [LoginController::class, 'login']);
    Route::post('password-reset',         [PasswordResetController::class, 'request']);
    Route::post('password-reset/confirm', [PasswordResetController::class, 'confirm']);
    Route::post('2fa/verify',             [TwoFactorController::class, 'verifyLogin']);
    Route::get('2fa/confirm-link',        [TwoFactorController::class, 'confirmLink']);
});

// Публичное отслеживание заказа
Route::get('orders/track/{tracking_id}', [OrderController::class, 'track']);

// Публичный калькулятор
Route::post('calculator', [CalculatorController::class, 'calculate']);

// Публичные тарифы (только чтение)
Route::get('tariffs', [TariffController::class, 'index']);

// ─── Защищённые маршруты ──────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Профиль
    Route::get('auth/me',    [UserController::class, 'me']);
    Route::put('auth/me',    [UserController::class, 'update']);
    Route::patch('auth/me',  [UserController::class, 'update']);
    Route::post('auth/logout', [LoginController::class, 'logout']);

    // 2FA управление
    Route::post('auth/2fa/request', [TwoFactorController::class, 'requestToggle']);

    // Пользователи (manager/admin)
    Route::get('users',                      [UserController::class, 'index']);
    Route::post('users/{user}/change-role',  [UserController::class, 'changeRole']);
    Route::delete('users/{user}',            [UserController::class, 'destroy']);

    // Водители (manager/admin)
    Route::apiResource('drivers', DriverController::class);

    // Транспорт (manager/admin)
    Route::apiResource('trucks', TruckController::class);

    // Заказы
    Route::apiResource('orders', OrderController::class)->except(['destroy']);
    Route::delete('orders/{order}',                [OrderController::class, 'destroy']);
    Route::post('orders/{order}/accept',           [OrderController::class, 'accept']);
    Route::post('orders/{order}/reject',           [OrderController::class, 'reject']);
    Route::post('orders/{order}/assign-transport', [OrderController::class, 'assignTransport']);

    // Избранные адреса
    Route::apiResource('addresses', FavoriteAddrController::class)->except(['show']);

    // Тарифы (CRUD только admin)
    Route::post('tariffs',            [TariffController::class, 'store']);
    Route::put('tariffs/{tariff}',    [TariffController::class, 'update']);
    Route::patch('tariffs/{tariff}',  [TariffController::class, 'update']);
    Route::delete('tariffs/{tariff}', [TariffController::class, 'destroy']);

    // Маршруты (manager/admin)
    Route::post('routes/calculate', [CalculatorController::class, 'calculateRoute']);

    // AI (manager/admin)
    Route::post('ai/optimize', [AiController::class, 'optimize']);
    Route::get('ai/history',   [AiController::class, 'history']);
});
