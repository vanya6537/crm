<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('process_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->index();
            $table->string('name');
            $table->enum('status', ['draft', 'published', 'deprecated'])->default('draft')->index();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('process_definitions');
    }
};
