<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('instance_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_instance_id')->constrained()->cascadeOnDelete();
            $table->string('node_id');
            $table->enum('state', [
                'created',
                'ready',
                'running',
                'completed',
                'failed',
                'waiting',
                'cancelled',
            ])->default('created')->index();
            $table->string('locked_by')->nullable(); // scheduler ID
            $table->dateTime('lock_until')->nullable();
            $table->json('context')->nullable(); // scope vars, input data
            $table->integer('attempt')->default(0);
            $table->timestamps();

            $table->index(['process_instance_id', 'state']);
            $table->index(['state', 'lock_until']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instance_tokens');
    }
};
