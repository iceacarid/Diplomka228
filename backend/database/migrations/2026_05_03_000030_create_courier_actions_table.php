<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('courier_id')->constrained('users')->cascadeOnDelete();
            $table->string('action_type', 50);
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('tracking_id', 20)->nullable();
            $table->foreignId('shift_id')->nullable()->constrained('courier_shifts')->nullOnDelete();
            $table->timestamps();

            $table->index(['courier_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_actions');
    }
};
