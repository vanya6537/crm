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
        Schema::create('process_triggers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_id')->nullable()->constrained('process_definitions')->nullOnDelete();
            $table->string('trigger_type'); // 'entity_created', 'entity_updated', 'entity_deleted', 'field_changed', 'status_changed'
            $table->string('entity_type'); // 'Property', 'Agent', 'Buyer', 'Transaction', 'Communication', 'PropertyShowing'
            $table->unsignedBigInteger('entity_id')->nullable(); // Specific entity instance (or null for all)
            $table->string('event_name'); // e.g., 'property.created', 'buyer.status_changed', 'transaction.completed'
            $table->json('condition_expression')->nullable(); // DSL expression that must evaluate to true
            $table->json('context_mapping')->nullable(); // Map entity fields to process variables
            $table->json('metadata')->nullable(); // Additional config specific to trigger type
            $table->boolean('is_active')->default(true);
            $table->integer('execution_order')->default(0);
            $table->string('execution_mode')->default('async'); // 'sync', 'async', 'scheduled'
            $table->unsignedInteger('max_executions')->nullable(); // Limit executions (null = unlimited)
            $table->unsignedInteger('execution_count')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            
            $table->index('process_id');
            $table->index(['entity_type', 'event_name']);
            $table->index('is_active');
            $table->index('trigger_type');
        });

        // Process trigger executions log
        Schema::create('process_trigger_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_trigger_id')->constrained('process_triggers')->cascadeOnDelete();
            $table->foreignId('process_instance_id')->nullable()->constrained('process_instances')->nullOnDelete();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->string('status'); // 'pending', 'running', 'completed', 'failed'
            $table->json('context')->nullable(); // Captured entity data at time of trigger
            $table->json('process_input')->nullable(); // Data passed to process
            $table->text('error_message')->nullable();
            $table->timestamp('triggered_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();
            
            $table->index(['process_trigger_id', 'status']);
            $table->index(['entity_type', 'entity_id']);
            $table->index('triggered_at');
        });

        // CRM entity trigger bindings (for easy lookup)
        Schema::create('crm_trigger_bindings', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type'); // 'Property', 'Agent', 'Buyer', etc.
            $table->string('entity_field')->nullable(); // e.g., 'status', 'price' (null = all fields)
            $table->string('trigger_event'); // 'created', 'updated', 'field_changed', 'status_changed'
            $table->foreignId('process_trigger_id')->constrained('process_triggers')->cascadeOnDelete();
            $table->json('field_value_conditions')->nullable(); // e.g., {"status": "new"} means trigger when status becomes "new"
            $table->boolean('enabled')->default(true);
            $table->integer('priority')->default(0); // Higher = execute first
            $table->timestamps();
            
            $table->unique(['entity_type', 'entity_field', 'trigger_event', 'process_trigger_id']);
            $table->index(['entity_type', 'trigger_event', 'enabled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_trigger_bindings');
        Schema::dropIfExists('process_trigger_executions');
        Schema::dropIfExists('process_triggers');
    }
};
