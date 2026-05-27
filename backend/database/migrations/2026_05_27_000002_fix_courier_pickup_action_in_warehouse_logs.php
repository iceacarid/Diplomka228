<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('warehouse_logs')
            ->where('action', 'unload')
            ->where('note', 'like', 'Курьер забрал груз%')
            ->update(['action' => 'courier_pickup']);
    }

    public function down(): void
    {
        DB::table('warehouse_logs')
            ->where('action', 'courier_pickup')
            ->whereNull('driver_id')
            ->whereNull('truck_id')
            ->update(['action' => 'unload']);
    }
};
