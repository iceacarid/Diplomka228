<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

class TestMissedPickup extends Command
{
    protected $signature   = 'test:missed-pickup';
    protected $description = 'Set pickup_date to past on first courier_assigned order (for testing only)';

    public function handle(): void
    {
        $courier = \App\Models\User::where('role', 'courier')->first();
        if (!$courier) {
            $this->error('No courier user found. Create a courier account first.');
            return;
        }

        // Prefer confirmed order, fall back to any order
        $order = Order::where('status', 'confirmed')->first()
            ?? Order::whereNotIn('status', ['delivered', 'rejected', 'at_warehouse'])->first();

        if (!$order) {
            $this->error('No suitable order found.');
            return;
        }

        $order->update([
            'status'      => 'courier_assigned',
            'courier_id'  => $courier->id,
            'pickup_date' => '2026-04-01',
        ]);

        $this->info("Order #{$order->id} ({$order->tracking_id}):");
        $this->info("  status      = courier_assigned");
        $this->info("  courier_id  = {$courier->id} ({$courier->name})");
        $this->info("  pickup_date = 2026-04-01");
        $this->info('Now run: php artisan courier:check-missed-pickups');
    }
}
