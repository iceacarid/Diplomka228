<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('warehouse_logs', function (Blueprint $table) {
            $table->foreignId('courier_id')->nullable()->after('driver_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('warehouse_logs', function (Blueprint $table) {
            $table->dropForeign(['courier_id']);
            $table->dropColumn('courier_id');
        });
    }
};
