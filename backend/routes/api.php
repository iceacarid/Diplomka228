<?php

use App\Http\Controllers\AdminCourierController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\AppealController;
use App\Http\Controllers\CargoTypeController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\CalculatorController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\DriverDashboardController;
use App\Http\Controllers\FavoriteAddrController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TariffController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\TruckController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\WarehouseKeeperController;
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

// Публичный калькулятор и подсказки адресов
Route::post('calculator',    [CalculatorController::class, 'calculate']);
Route::get('suggest',        [CalculatorController::class, 'suggest']);
Route::get('geocode/reverse', [CalculatorController::class, 'reverseGeocode']);

// Публичные тарифы (только чтение)
Route::get('tariffs',     [TariffController::class, 'index']);
Route::get('cargo-types', [CargoTypeController::class, 'index']);

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
    Route::post('orders/{order}/assign-transport',   [OrderController::class, 'assignTransport']);
    Route::post('orders/{order}/reschedule-confirm', [OrderController::class, 'rescheduleConfirm']);
    Route::get('orders/{order}/available-couriers',  [OrderController::class, 'availableCouriers']);
    Route::post('orders/{order}/assign-courier',     [OrderController::class, 'assignCourier']);
    Route::post('orders/{order}/unassign-courier',   [OrderController::class, 'unassignCourier']);

    // Избранные адреса
    Route::apiResource('addresses', FavoriteAddrController::class)->except(['show']);

    // Тариф (единый — только изменение)
    Route::put('tariffs/{tariff}',    [TariffController::class, 'update']);
    Route::patch('tariffs/{tariff}',  [TariffController::class, 'update']);

    // Типы груза (CRUD только admin)
    Route::post('cargo-types',                [CargoTypeController::class, 'store']);
    Route::put('cargo-types/{cargoType}',     [CargoTypeController::class, 'update']);
    Route::patch('cargo-types/{cargoType}',   [CargoTypeController::class, 'update']);
    Route::delete('cargo-types/{cargoType}',  [CargoTypeController::class, 'destroy']);

    // Маршруты (manager/admin)
    Route::post('routes/calculate', [CalculatorController::class, 'calculateRoute']);

    // AI (manager/admin)
    Route::post('ai/optimize',           [AiController::class, 'optimize']);
    Route::get('ai/history',             [AiController::class, 'history']);
    Route::post('ai/distribution-plan',  [AiController::class, 'distributionPlan']);
    Route::post('ai/apply-plan',         [AiController::class, 'applyPlan']);

    // Чаты
    Route::get('chats',                               [ChatController::class, 'index']);
    Route::get('chats/{chat}',                        [ChatController::class, 'show']);
    Route::get('chats/{chat}/messages',               [ChatController::class, 'messages']);
    Route::post('chats/{chat}/messages',              [ChatController::class, 'sendMessage']);
    Route::patch('chats/{chat}/messages/{message}',   [ChatController::class, 'updateMessage']);
    Route::post('chats/{chat}/confirm',               [ChatController::class, 'confirm']);
    Route::post('chats/{chat}/archive',               [ChatController::class, 'archive']);
    Route::post('chats/{chat}/unarchive',             [ChatController::class, 'unarchive']);
    Route::post('chats/{chat}/appeal',                [ChatController::class, 'submitAppeal']);

    // Апелляции
    Route::get('appeals',              [AppealController::class, 'index']);
    Route::patch('appeals/{appeal}',   [AppealController::class, 'update']);

    // Склады (manager/admin)
    Route::apiResource('warehouses', WarehouseController::class);
    Route::post('warehouses/{warehouse}/update-load', [WarehouseController::class, 'updateLoad']);
    Route::get('warehouses/{warehouse}/logs',         [WarehouseController::class, 'logs']);

    // Курьеры (admin)
    Route::get('admin/couriers',                  [AdminCourierController::class, 'index']);
    Route::get('admin/couriers/{user}/history',   [AdminCourierController::class, 'history']);

    // Курьер
    Route::prefix('courier')->group(function () {
        Route::get('shift',                    [CourierController::class, 'shiftStatus']);
        Route::post('shift/open',              [CourierController::class, 'openShift']);
        Route::post('shift/close',             [CourierController::class, 'closeShift']);
        Route::get('orders/my',                [CourierController::class, 'myOrders']);
        Route::get('orders/history',           [CourierController::class, 'history']);
        Route::post('orders/{order}/pickup',   [CourierController::class, 'pickUp']);
        Route::post('orders/{order}/warehouse',           [CourierController::class, 'deliverToWarehouse']);
        Route::post('orders/{order}/deliver',             [CourierController::class, 'deliver']);
        Route::post('orders/{order}/notify-missed',       [CourierController::class, 'notifyMissed']);
        Route::post('orders/{order}/request-reschedule',  [CourierController::class, 'requestReschedule']);
    });

    // Кладовщик
    Route::prefix('keeper')->group(function () {
        Route::get('stats',                         [WarehouseKeeperController::class, 'stats']);
        Route::get('warehouse-orders',              [WarehouseKeeperController::class, 'warehouseOrders']);
        Route::get('queue',                         [WarehouseKeeperController::class, 'incomingQueue']);
        Route::post('orders/{order}/confirm',       [WarehouseKeeperController::class, 'confirmMeasurement']);
        Route::post('orders/{order}/reject',        [WarehouseKeeperController::class, 'rejectCargo']);
        Route::post('orders/{order}/mark-loaded',   [WarehouseKeeperController::class, 'markLoaded']);
        Route::post('orders/{order}/mark-unloaded', [WarehouseKeeperController::class, 'markUnloaded']);
        Route::get('manifests',                     [WarehouseKeeperController::class, 'myManifests']);
        Route::post('trips/{trip}/dispatch',        [WarehouseKeeperController::class, 'dispatch']);
        Route::post('trips/{trip}/unload',          [WarehouseKeeperController::class, 'confirmUnload']);
    });

    // Водитель фуры
    Route::prefix('driver')->group(function () {
        Route::get('shift',                         [DriverDashboardController::class, 'shiftStatus']);
        Route::post('shift/open',                   [DriverDashboardController::class, 'openShift']);
        Route::post('shift/close',                  [DriverDashboardController::class, 'closeShift']);
        Route::get('trips',                         [DriverDashboardController::class, 'myTrips']);
        Route::post('location',                     [DriverDashboardController::class, 'updateLocation']);
        Route::post('trips/{trip}/arrived-load',    [DriverDashboardController::class, 'arrivedAtLoad']);
        Route::post('trips/{trip}/arrived-unload',  [DriverDashboardController::class, 'arrivedAtUnload']);
    });

    // Рейсы (менеджер)
    Route::get('trips/active-trucks',          [TripController::class, 'activeTrucks']);
    Route::get('trips',                        [TripController::class, 'index']);
    Route::post('trips',                       [TripController::class, 'store']);
    Route::get('trips/{trip}',                 [TripController::class, 'show']);
    Route::put('trips/{trip}/waypoints',       [TripController::class, 'updateWaypoints']);
});
