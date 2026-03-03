<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor')->nullable(); // user ID or system
            $table->string('action'); // 'create', 'update', 'delete', 'signal', 'complete'
            $table->string('entity_type'); // ProcessDefinition, ProcessInstance, InstanceToken, Job, HumanTask
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('changes')->nullable(); // before/after
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->index();

            $table->index(['entity_type', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
