<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->date('pickup_date')->nullable()->after('eta');
            $table->boolean('courier_blocked')->default(false)->after('pickup_date');
            $table->string('courier_blocked_reason', 255)->nullable()->after('courier_blocked');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['pickup_date', 'courier_blocked', 'courier_blocked_reason']);
        });
    }
};
