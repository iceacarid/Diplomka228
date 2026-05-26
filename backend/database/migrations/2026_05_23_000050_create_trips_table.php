<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks');
            $table->foreignId('driver_id')->constrained('drivers');
            $table->foreignId('driver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('warehouse_from_id')->constrained('warehouses');
            $table->foreignId('warehouse_to_id')->constrained('warehouses');
            $table->string('status')->default('forming');  // forming|loading|in_transit|arrived|completed
            $table->json('route_polyline')->nullable();
            $table->float('distance_km')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN ('forming','loading','in_transit','arrived','completed'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
