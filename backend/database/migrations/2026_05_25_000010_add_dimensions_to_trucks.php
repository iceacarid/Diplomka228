<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trucks', function (Blueprint $table) {
            $table->float('height_m')->nullable()->after('capacity_volume');    // высота, м
            $table->float('width_m')->nullable()->after('height_m');            // ширина, м
            $table->float('length_m')->nullable()->after('width_m');            // длина, м
            $table->integer('mass_kg')->nullable()->after('length_m');          // снаряжённая масса, кг
            $table->integer('axle_load_kg')->nullable()->after('mass_kg');      // нагрузка на ось, кг
        });
    }

    public function down(): void
    {
        Schema::table('trucks', function (Blueprint $table) {
            $table->dropColumn(['height_m', 'width_m', 'length_m', 'mass_kg', 'axle_load_kg']);
        });
    }
};
