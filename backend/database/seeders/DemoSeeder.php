<?php

namespace Database\Seeders;

use App\Models\Chat;
use App\Models\Message;
use App\Models\Order;
use App\Models\Tariff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── Пользователи ─────────────────────────────────────────────────────
        $admin = User::updateOrCreate(['email' => 'admin@furaedet.ru'], [
            'name' => 'Администратор', 'password' => Hash::make('Admin1234!'),
            'role' => 'admin', 'is_active' => true, 'phone' => '+7 900 000 0001',
        ]);

        $manager = User::updateOrCreate(['email' => 'manager@furaedet.ru'], [
            'name' => 'Менеджер Иванов', 'password' => Hash::make('Manager1234!'),
            'role' => 'manager', 'is_active' => true, 'phone' => '+7 900 000 0002',
        ]);

        $courier = User::updateOrCreate(['email' => 'courier@furaedet.ru'], [
            'name' => 'Курьер Петров', 'password' => Hash::make('Courier1234!'),
            'role' => 'courier', 'is_active' => true, 'phone' => '+7 900 000 0003',
        ]);

        $client1 = User::updateOrCreate(['email' => 'client@furaedet.ru'], [
            'name' => 'Клиент Сидоров', 'password' => Hash::make('Client1234!'),
            'role' => 'client', 'is_active' => true, 'phone' => '+7 900 000 0004',
        ]);

        $client2 = User::updateOrCreate(['email' => 'client2@furaedet.ru'], [
            'name' => 'Клиент Козлова', 'password' => Hash::make('Client1234!'),
            'role' => 'client', 'is_active' => true, 'phone' => '+7 900 000 0005',
        ]);

        $client3 = User::updateOrCreate(['email' => 'client3@furaedet.ru'], [
            'name' => 'Клиент Новиков', 'password' => Hash::make('Client1234!'),
            'role' => 'client', 'is_active' => true, 'phone' => '+7 900 000 0006',
        ]);

        // ── Тарифы ───────────────────────────────────────────────────────────
        Tariff::updateOrCreate(['name' => 'Базовый'], [
            'price_per_km' => 55.00, 'weight_coef' => 12.00, 'is_active' => true,
        ]);
        Tariff::updateOrCreate(['name' => 'Экспресс'], [
            'price_per_km' => 85.00, 'weight_coef' => 18.00, 'is_active' => true,
        ]);
        Tariff::updateOrCreate(['name' => 'Эконом'], [
            'price_per_km' => 38.00, 'weight_coef' => 8.00, 'is_active' => true,
        ]);

        // ── Заказы с чатами ──────────────────────────────────────────────────
        $orders = [
            [
                'client'      => $client1,
                'status'      => 'pending',
                'origin'      => 'Москва, ул. Тверская, 12',
                'dest'        => 'Москва, ул. Арбат, 5',
                'weight'      => 150,
                'volume'      => 2.5,
                'cargo_type'  => 'general',
                'price'       => 4500,
                'description' => 'Офисная мебель, разобрана',
                'messages'    => [
                    ['role' => 'bot',    'body' => "Ваша заявка {tracking_id} успешно создана!\n\n⚠️ Заполнение формы ниже обязательно.\nБез этого ваш заказ не будет обработан менеджером.", 'type' => 'bot_greeting'],
                    ['role' => 'client', 'body' => 'Здравствуйте! Когда сможете забрать?'],
                ],
            ],
            [
                'client'      => $client1,
                'manager'     => $manager,
                'status'      => 'in_progress',
                'origin'      => 'Москва, Ленинградский пр., 80',
                'dest'        => 'Москва, ул. Садовая-Черногрязская, 8',
                'weight'      => 320,
                'volume'      => 4.0,
                'cargo_type'  => 'fragile',
                'price'       => 8900,
                'description' => 'Стекло витринное, требует осторожности',
                'messages'    => [
                    ['role' => 'bot',     'body' => "Ваша заявка {tracking_id} успешно создана!\n\n⚠️ Заполнение формы ниже обязательно.", 'type' => 'bot_greeting'],
                    ['role' => 'bot',     'body' => 'Менеджер Менеджер Иванов принял заявку в работу. Ожидайте уточнения деталей.', 'type' => 'text'],
                    ['role' => 'manager', 'body' => 'Добрый день! Уточните, есть ли лифт на месте загрузки?'],
                    ['role' => 'client',  'body' => 'Да, грузовой лифт есть, до 3 тонн.'],
                    ['role' => 'manager', 'body' => 'Отлично, планируем забор на завтра с 10:00 до 12:00.'],
                ],
            ],
            [
                'client'      => $client2,
                'manager'     => $manager,
                'status'      => 'confirmed',
                'origin'      => 'Москва, ул. Профсоюзная, 45',
                'dest'        => 'Москва, Варшавское шоссе, 125',
                'weight'      => 80,
                'volume'      => 1.2,
                'cargo_type'  => 'perishable',
                'price'       => 3200,
                'pickup_date' => now()->addDays(1)->toDateString(),
                'description' => 'Продукты питания, охлаждённые',
                'messages'    => [
                    ['role' => 'bot',     'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot',     'body' => 'Менеджер Менеджер Иванов принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'manager', 'body' => 'Подтверждаю заявку, курьер будет завтра в 11:00.'],
                    ['role' => 'client',  'body' => 'Спасибо, буду ждать!'],
                ],
            ],
            [
                'client'      => $client2,
                'manager'     => $manager,
                'courier'     => $courier,
                'status'      => 'courier_assigned',
                'origin'      => 'Москва, Краснопресненская наб., 12',
                'dest'        => 'Москва, ул. Новослободская, 18',
                'weight'      => 200,
                'volume'      => 3.0,
                'cargo_type'  => 'general',
                'price'       => 6100,
                'pickup_date' => now()->toDateString(),
                'description' => 'Оборудование для офиса',
                'messages'    => [
                    ['role' => 'bot',     'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot',     'body' => 'Менеджер Менеджер Иванов принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'bot',     'body' => 'Курьер Курьер Петров взял заявку и выезжает на адрес забора.', 'type' => 'text'],
                ],
            ],
            [
                'client'      => $client3,
                'manager'     => $manager,
                'courier'     => $courier,
                'status'      => 'missed_pickup',
                'origin'      => 'Москва, ул. Большая Дмитровка, 7',
                'dest'        => 'Москва, Ленинский пр., 55',
                'weight'      => 95,
                'volume'      => 1.8,
                'cargo_type'  => 'fragile',
                'price'       => 4200,
                'pickup_date' => now()->subDays(2)->toDateString(),
                'courier_blocked'        => false,
                'courier_blocked_reason' => null,
                'description' => 'Картины и рамы',
                'messages'    => [
                    ['role' => 'bot', 'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot', 'body' => 'Менеджер Менеджер Иванов принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => 'Курьер Курьер Петров взял заявку и выезжает на адрес забора.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => "⚠️ Заявка {tracking_id}: груз не был забран в назначенную дату. Требуется уточнение нового времени забора с клиентом.", 'type' => 'text'],
                ],
            ],
            [
                'client'      => $client3,
                'manager'     => $manager,
                'courier'     => $courier,
                'status'      => 'missed_pickup',
                'origin'      => 'Москва, Кутузовский пр., 32',
                'dest'        => 'Москва, ул. Остоженка, 10',
                'weight'      => 450,
                'volume'      => 6.0,
                'cargo_type'  => 'oversized',
                'price'       => 14500,
                'pickup_date' => now()->subDays(1)->toDateString(),
                'courier_blocked'        => true,
                'courier_blocked_reason' => 'Клиент не берёт трубку',
                'description' => 'Строительные материалы',
                'messages'    => [
                    ['role' => 'bot', 'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot', 'body' => 'Менеджер Менеджер Иванов принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => 'Курьер Курьер Петров взял заявку и выезжает на адрес забора.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => "⚠️ Заявка {tracking_id}: груз не был забран в назначенную дату.", 'type' => 'text'],
                    ['role' => 'bot', 'body' => "🚨 Курьер Курьер Петров не смог забрать груз.\nПричина: Клиент не берёт трубку\nЗаявка требует уточнения нового времени забора.", 'type' => 'text'],
                ],
            ],
            [
                'client'      => $client1,
                'manager'     => $manager,
                'courier'     => $courier,
                'status'      => 'picked_up',
                'origin'      => 'Москва, ул. Маросейка, 9',
                'dest'        => 'Москва, Дмитровское шоссе, 100',
                'weight'      => 280,
                'volume'      => 3.5,
                'cargo_type'  => 'general',
                'price'       => 7800,
                'pickup_date' => now()->toDateString(),
                'description' => 'Бытовая техника',
                'messages'    => [
                    ['role' => 'bot', 'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot', 'body' => 'Менеджер Менеджер Иванов принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => 'Курьер Курьер Петров взял заявку и выезжает на адрес забора.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => 'Курьер Курьер Петров забрал груз. Везёт на склад.', 'type' => 'text'],
                ],
            ],
            [
                'client'      => $client2,
                'manager'     => $manager,
                'courier'     => $courier,
                'status'      => 'at_warehouse',
                'origin'      => 'Москва, Рублёвское шоссе, 18',
                'dest'        => 'Москва, ул. Большая Семёновская, 40',
                'weight'      => 110,
                'volume'      => 2.0,
                'cargo_type'  => 'perishable',
                'price'       => 5300,
                'pickup_date' => now()->subDay()->toDateString(),
                'description' => 'Молочная продукция',
                'messages'    => [
                    ['role' => 'bot', 'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot', 'body' => 'Менеджер принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => 'Курьер забрал груз. Везёт на склад.', 'type' => 'text'],
                    ['role' => 'bot', 'body' => 'Курьер Курьер Петров доставил груз на склад. Заявка готова к следующему этапу.', 'type' => 'text'],
                ],
            ],
            [
                'client'      => $client3,
                'manager'     => $manager,
                'status'      => 'delivered',
                'origin'      => 'Москва, ул. Пречистенка, 22',
                'dest'        => 'Москва, Варшавское шоссе, 9',
                'weight'      => 500,
                'volume'      => 8.0,
                'cargo_type'  => 'hazardous',
                'price'       => 28000,
                'description' => 'Химические реагенты (ADR)',
                'messages'    => [
                    ['role' => 'bot',    'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot',    'body' => 'Менеджер принял заявку в работу.', 'type' => 'text'],
                    ['role' => 'client', 'body' => 'Груз доставлен, всё в порядке. Спасибо!'],
                ],
            ],
            [
                'client'  => $client1,
                'manager' => $manager,
                'status'  => 'rejected',
                'origin'  => 'Москва, Ленинградский пр., 15',
                'dest'    => 'Москва, ул. Сретенка, 6',
                'weight'  => 1200,
                'volume'  => 15.0,
                'cargo_type'       => 'oversized',
                'price'            => 45000,
                'rejection_reason' => 'Груз превышает допустимые габариты для данного маршрута. Обратитесь для подбора специального транспорта.',
                'messages'         => [
                    ['role' => 'bot', 'body' => "Ваша заявка {tracking_id} успешно создана!", 'type' => 'bot_greeting'],
                    ['role' => 'bot', 'body' => 'Груз превышает допустимые габариты для данного маршрута. Обратитесь для подбора специального транспорта.', 'type' => 'text'],
                ],
            ],
        ];

        foreach ($orders as $def) {
            $order = Order::create([
                'client_id'              => $def['client']->id,
                'manager_id'             => $def['manager']->id ?? null,
                'courier_id'             => isset($def['courier']) ? $def['courier']->id : null,
                'status'                 => $def['status'],
                'origin_address'         => $def['origin'],
                'dest_address'           => $def['dest'],
                'weight'                 => $def['weight'],
                'volume'                 => $def['volume'],
                'cargo_type'             => $def['cargo_type'],
                'cargo_description'      => $def['description'] ?? null,
                'price'                  => $def['price'],
                'pickup_date'            => $def['pickup_date'] ?? null,
                'courier_blocked'        => $def['courier_blocked'] ?? false,
                'courier_blocked_reason' => $def['courier_blocked_reason'] ?? null,
                'rejection_reason'       => $def['rejection_reason'] ?? null,
            ]);

            $chat = Chat::create([
                'order_id'   => $order->id,
                'manager_id' => $def['manager']->id ?? null,
                'status'     => in_array($def['status'], ['delivered', 'rejected']) ? 'archived' : 'active',
            ]);

            foreach ($def['messages'] as $msg) {
                $body = str_replace('{tracking_id}', $order->tracking_id, $msg['body']);
                Message::create([
                    'chat_id'     => $chat->id,
                    'sender_id'   => match($msg['role']) {
                        'client'  => $def['client']->id,
                        'manager' => $def['manager']->id ?? null,
                        default   => null,
                    },
                    'sender_role' => $msg['role'],
                    'body'        => $body,
                    'type'        => $msg['type'] ?? 'text',
                ]);
            }
        }

        $this->command->info('Demo seeder done.');
        $this->command->info('  admin@furaedet.ru   / Admin1234!');
        $this->command->info('  manager@furaedet.ru / Manager1234!');
        $this->command->info('  courier@furaedet.ru / Courier1234!');
        $this->command->info('  client@furaedet.ru  / Client1234!');
        $this->command->info('  client2@furaedet.ru / Client1234!');
        $this->command->info('  client3@furaedet.ru / Client1234!');
    }
}
