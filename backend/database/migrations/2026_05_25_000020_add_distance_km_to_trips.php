<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            if (!Schema::hasColumn('trips', 'distance_km')) {
                $table->float('distance_km')->nullable()->after('route_polyline');
            }
            if (!Schema::hasColumn('trips', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('distance_km');
            }
            if (!Schema::hasColumn('trips', 'arrived_at')) {
                $table->timestamp('arrived_at')->nullable()->after('started_at');
            }
            if (!Schema::hasColumn('trips', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('arrived_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn(array_filter(
                ['distance_km', 'started_at', 'arrived_at', 'completed_at'],
                fn($col) => Schema::hasColumn('trips', $col)
            ));
        });
    }
};
