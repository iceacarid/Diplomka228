<?php

namespace Database\Seeders;

use App\Models\Tariff;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Склад
        $warehouse = Warehouse::updateOrCreate(['name' => 'Склад Москва'], [
            'address'        => 'Москва, Складской пер., 1',
            'latitude'       => 55.7558,
            'longitude'      => 37.6176,
            'total_capacity' => 1000,
            'current_load'   => 0,
        ]);

        // Пользователи
        User::updateOrCreate(['email' => 'admin@furaedet.ru'], [
            'name'      => 'Администратор',
            'password'  => Hash::make('Admin1234!'),
            'role'      => 'admin',
            'is_active' => true,
            'phone'     => '+7 900 000 0001',
        ]);

        User::updateOrCreate(['email' => 'manager@furaedet.ru'], [
            'name'      => 'Менеджер Иванов',
            'password'  => Hash::make('Manager1234!'),
            'role'      => 'manager',
            'is_active' => true,
            'phone'     => '+7 900 000 0002',
        ]);

        User::updateOrCreate(['email' => 'courier@furaedet.ru'], [
            'name'         => 'Курьер Петров',
            'password'     => Hash::make('Courier1234!'),
            'role'         => 'courier',
            'is_active'    => true,
            'phone'        => '+7 900 000 0003',
            'warehouse_id' => $warehouse->id,
        ]);

        User::updateOrCreate(['email' => 'client@furaedet.ru'], [
            'name'      => 'Клиент Сидоров',
            'password'  => Hash::make('Client1234!'),
            'role'      => 'client',
            'is_active' => true,
            'phone'     => '+7 900 000 0004',
        ]);

        // Тарифы
        Tariff::updateOrCreate(['name' => 'Базовый'],  ['price_per_km' => 55.00, 'weight_coef' => 12.00, 'is_active' => true]);
        Tariff::updateOrCreate(['name' => 'Экспресс'], ['price_per_km' => 85.00, 'weight_coef' => 18.00, 'is_active' => true]);
        Tariff::updateOrCreate(['name' => 'Эконом'],   ['price_per_km' => 38.00, 'weight_coef' =>  8.00, 'is_active' => true]);

        $this->command->info('Seed done.');
        $this->command->info('  admin@furaedet.ru   / Admin1234!');
        $this->command->info('  manager@furaedet.ru / Manager1234!');
        $this->command->info('  courier@furaedet.ru / Courier1234!');
        $this->command->info('  client@furaedet.ru  / Client1234!');
    }
}
