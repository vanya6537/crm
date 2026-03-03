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
        Schema::create('list_of_values', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Название списка (e.g., "Должности", "Статусы")
            $table->string('key')->unique(); // Уникальный ключ для использования в коде
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false); // Системный ли список
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index('key');
        });

        Schema::create('list_of_values_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('list_of_values_id')->constrained('list_of_values')->onDelete('cascade');
            $table->string('label'); // Отображаемое значение
            $table->string('value'); // Значение
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->jsonb('metadata')->nullable(); // Дополнительные данные
            $table->timestamps();
            
            $table->unique(['list_of_values_id', 'value']);
            $table->index('value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('list_of_values_items');
        Schema::dropIfExists('list_of_values');
    }
};
