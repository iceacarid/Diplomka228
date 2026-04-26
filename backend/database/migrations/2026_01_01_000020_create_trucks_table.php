<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('plate_number', 20)->unique();
            $table->string('brand', 100);
            $table->string('model', 100);
            $table->integer('capacity_weight');
            $table->float('capacity_volume');
            $table->enum('status', ['available', 'in_transit', 'maintenance'])->default('available');
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->boolean('is_company_owned')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
