<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->jsonb('metadata')->nullable()->after('type');
        });

        DB::statement("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check");
        DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'bot_greeting', 'form_submission'))");
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        DB::statement("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check");
        DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'bot_greeting'))");
    }
};
