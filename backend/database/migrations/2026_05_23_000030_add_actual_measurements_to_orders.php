<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->float('actual_weight')->nullable()->after('weight');
            $table->float('actual_volume')->nullable()->after('volume');
            $table->string('measurement_note')->nullable()->after('actual_volume');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['actual_weight', 'actual_volume', 'measurement_note']);
        });
    }
};
