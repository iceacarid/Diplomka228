<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Tariff;
use App\Models\Truck;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Склады ────────────────────────────────────────────────────────────
        $warehouseMsk = Warehouse::updateOrCreate(['name' => 'Склад Москва'], [
            'address'        => 'Москва, Складской пер., 1',
            'latitude'       => 55.7558,
            'longitude'      => 37.6176,
            'total_capacity' => 1000,
            'current_load'   => 0,
        ]);

        $warehouseKzn = Warehouse::updateOrCreate(['name' => 'Склад Казань'], [
            'address'        => 'Казань, ул. Складская, 5',
            'latitude'       => 55.7879,
            'longitude'      => 49.1233,
            'total_capacity' => 800,
            'current_load'   => 0,
        ]);

        // ── Пользователи ─────────────────────────────────────────────────────
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
            'warehouse_id' => $warehouseMsk->id,
        ]);

        User::updateOrCreate(['email' => 'client@furaedet.ru'], [
            'name'      => 'Клиент Сидоров',
            'password'  => Hash::make('Client1234!'),
            'role'      => 'client',
            'is_active' => true,
            'phone'     => '+7 900 000 0004',
        ]);

        // Кладовщик — привязан к Складу Москва
        User::updateOrCreate(['email' => 'keeper@furaedet.ru'], [
            'name'         => 'Кладовщик Смирнов',
            'password'     => Hash::make('Keeper1234!'),
            'role'         => 'warehouse_keeper',
            'is_active'    => true,
            'phone'        => '+7 900 000 0005',
            'warehouse_id' => $warehouseMsk->id,
        ]);

        // Водитель — создаём пользователя, Driver-запись и закрепляем фуру
        $driverUser = User::updateOrCreate(['email' => 'driver@furaedet.ru'], [
            'name'      => 'Водитель Орлов',
            'password'  => Hash::make('Driver1234!'),
            'role'      => 'driver',
            'is_active' => true,
            'phone'     => '+7 900 000 0006',
        ]);

        $driver = Driver::updateOrCreate(['phone' => '+7 900 000 0006'], [
            'user_id'        => $driverUser->id,
            'name'           => 'Орлов Дмитрий Сергеевич',
            'license_number' => 'ВУ 77АА 123456',
            'type'           => 'staff',
            'is_available'   => true,
        ]);

        Truck::updateOrCreate(['plate_number' => 'А777АА 77'], [
            'brand'           => 'Volvo',
            'model'           => 'FH16',
            'capacity_weight' => 20,
            'capacity_volume' => 90.0,
            'status'          => 'available',
            'driver_id'       => $driver->id,
            'is_company_owned'=> true,
        ]);

        // ── Тарифы ───────────────────────────────────────────────────────────
        Tariff::updateOrCreate(['name' => 'Базовый'],  ['price_per_km' => 55.00, 'weight_coef' => 12.00, 'is_active' => true]);
        Tariff::updateOrCreate(['name' => 'Экспресс'], ['price_per_km' => 85.00, 'weight_coef' => 18.00, 'is_active' => true]);
        Tariff::updateOrCreate(['name' => 'Эконом'],   ['price_per_km' => 38.00, 'weight_coef' =>  8.00, 'is_active' => true]);

        $this->command->info('Seed done.');
        $this->command->info('  admin@furaedet.ru   / Admin1234!');
        $this->command->info('  manager@furaedet.ru / Manager1234!');
        $this->command->info('  courier@furaedet.ru / Courier1234!');
        $this->command->info('  client@furaedet.ru  / Client1234!');
        $this->command->info('  keeper@furaedet.ru  / Keeper1234!   (Склад Москва)');
        $this->command->info('  driver@furaedet.ru  / Driver1234!   (Volvo FH16 · А777АА 77)');
    }
}
