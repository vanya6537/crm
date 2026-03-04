<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('license_number')->nullable()->after('phone');
            $table->string('specialization')->nullable()->after('license_number'); // e.g., "Luxury", "Commercial"
            $table->text('bio')->nullable()->after('specialization');
            $table->string('avatar_url')->nullable()->after('bio');
            $table->jsonb('social_links')->nullable()->after('avatar_url'); // JSON for Telegram, WhatsApp, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'license_number', 'specialization', 'bio', 'avatar_url', 'social_links']);
        });
    }
};
