<?php

namespace App\Console\Commands;

use App\Models\Message;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CheckMissedPickups extends Command
{
    protected $signature   = 'courier:check-missed-pickups';
    protected $description = 'Mark orders with past pickup_date as missed_pickup and notify chats';

    public function handle(): void
    {
        $today = Carbon::today();

        $orders = Order::with('chat')
            ->where('status', 'courier_assigned')
            ->whereNotNull('pickup_date')
            ->whereDate('pickup_date', '<', $today)
            ->get();

        foreach ($orders as $order) {
            $order->update(['status' => 'missed_pickup']);

            if ($order->chat) {
                Message::create([
                    'chat_id'     => $order->chat->id,
                    'sender_id'   => null,
                    'sender_role' => 'bot',
                    'body'        => "⚠️ Заявка {$order->tracking_id}: груз не был забран в назначенную дату ({$order->pickup_date}). Требуется уточнение нового времени забора с клиентом.",
                    'type'        => 'text',
                    'metadata'    => ['event' => 'missed_pickup'],
                ]);
                $order->chat->touch();
            }

            $this->info("Marked order #{$order->id} ({$order->tracking_id}) as missed_pickup");
        }

        $this->info("Done. Processed {$orders->count()} orders.");
    }
}
