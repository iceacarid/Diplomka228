<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cargo_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 50)->unique();
            $table->string('label', 100);
            $table->string('description', 300)->nullable();
            $table->string('icon', 30)->default('Package');
            $table->decimal('coefficient', 6, 3)->default(1.000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('cargo_types')->insert([
            ['slug' => 'general',                'label' => 'Обычный груз',       'description' => 'Стандартные грузы без особых условий',           'icon' => 'Package',      'coefficient' => 1.000, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'oversized',              'label' => 'Крупногабаритный',   'description' => 'Грузы с нестандартными габаритами',              'icon' => 'Boxes',        'coefficient' => 1.350, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'fragile',                'label' => 'Хрупкий',            'description' => 'Требует особой осторожности',                    'icon' => 'Shield',       'coefficient' => 1.500, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'flammable',              'label' => 'Огнеопасный',        'description' => 'Легковоспламеняющиеся материалы',                'icon' => 'Bolt',         'coefficient' => 2.000, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'perishable',             'label' => 'Скоропортящийся',    'description' => 'Продукты и товары с ограниченным сроком',         'icon' => 'Clock',        'coefficient' => 1.600, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'temperature_controlled', 'label' => 'Рефрижератор',       'description' => 'Требует поддержания температурного режима',       'icon' => 'Refrigerator', 'coefficient' => 1.800, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'hazardous',              'label' => 'Опасный груз',       'description' => 'ADR — требует спецразрешения',                   'icon' => 'Lock',         'coefficient' => 2.500, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'other',                  'label' => 'Другое',             'description' => 'Нестандартный груз, уточняется менеджером',       'icon' => 'Edit',         'coefficient' => 1.200, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cargo_types');
    }
};
