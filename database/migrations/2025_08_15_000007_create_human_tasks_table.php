<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('human_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_instance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instance_token_id')->constrained()->cascadeOnDelete();
            $table->string('node_id');
            $table->unsignedBigInteger('assignee_id')->nullable();
            $table->json('candidate_roles')->nullable(); // ['role1', 'role2'] для group tasks
            $table->enum('status', [
                'created',
                'assigned',
                'claimed',
                'completed',
                'cancelled',
                'reassigned',
            ])->default('created')->index();
            $table->longText('form_schema'); // JSON schema
            $table->longText('ui_schema')->nullable(); // UI hints
            $table->longText('form_data')->nullable(); // заполненные данные
            $table->dateTime('due_at')->nullable();
            $table->dateTime('claimed_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->text('comment')->nullable();
            $table->json('escalation_history')->nullable();
            $table->timestamps();

            $table->index(['assignee_id', 'status']);
            $table->index(['due_at']);
            $table->index(['process_instance_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('human_tasks');
    }
};
