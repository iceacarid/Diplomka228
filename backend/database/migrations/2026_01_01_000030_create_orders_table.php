<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_id', 20)->unique();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('truck_id')->nullable()->constrained('trucks')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->enum('status', ['draft','pending','in_progress','shipped','delivered','rejected'])->default('pending');
            $table->string('origin_address', 500);
            $table->string('dest_address', 500);
            $table->float('weight');
            $table->float('volume');
            $table->enum('cargo_type', ['general','fragile','flammable','perishable','hazardous','oversized','temperature_controlled','other'])->default('general');
            $table->string('cargo_type_custom', 255)->nullable();
            $table->text('cargo_description')->nullable();
            $table->decimal('price', 10, 2);
            $table->timestamp('eta')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
