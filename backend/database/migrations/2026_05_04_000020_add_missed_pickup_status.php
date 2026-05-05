<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
            'draft','pending','in_progress','confirmed',
            'courier_assigned','picked_up','at_warehouse',
            'missed_pickup',
            'shipped','delivered','rejected'
        ))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
            'draft','pending','in_progress','confirmed',
            'courier_assigned','picked_up','at_warehouse',
            'shipped','delivered','rejected'
        ))");
    }
};
