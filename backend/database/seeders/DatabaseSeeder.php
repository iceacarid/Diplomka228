<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $users = [
            [
                'name'      => 'Администратор',
                'email'     => 'admin@furaedet.ru',
                'password'  => Hash::make('Admin1234!'),
                'role'      => 'admin',
                'is_active' => true,
            ],
            [
                'name'      => 'Менеджер',
                'email'     => 'manager@furaedet.ru',
                'password'  => Hash::make('Manager1234!'),
                'role'      => 'manager',
                'is_active' => true,
            ],
            [
                'name'      => 'Клиент',
                'email'     => 'client@furaedet.ru',
                'password'  => Hash::make('Client1234!'),
                'role'      => 'client',
                'is_active' => true,
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(['email' => $data['email']], $data);
        }
    }
}
