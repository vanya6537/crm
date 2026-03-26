<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trigger_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_trigger_id')->nullable()->constrained('process_triggers')->nullOnDelete();
            $table->foreignId('process_trigger_execution_id')->nullable()->constrained('process_trigger_executions')->nullOnDelete();
            $table->string('trigger_code')->nullable();
            $table->string('family')->nullable();
            $table->string('source_entity_type');
            $table->unsignedBigInteger('source_entity_id');
            $table->string('subject_entity_type')->nullable();
            $table->unsignedBigInteger('subject_entity_id')->nullable();
            $table->string('attention_state')->default('need_action');
            $table->string('priority')->default('medium');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->text('reason')->nullable();
            $table->string('recommended_action')->nullable();
            $table->json('payload')->nullable();
            $table->string('dedupe_key')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['source_entity_type', 'source_entity_id'], 'trigger_events_source_idx');
            $table->index(['subject_entity_type', 'subject_entity_id'], 'trigger_events_subject_idx');
            $table->index(['attention_state', 'priority'], 'trigger_events_attention_priority_idx');
            $table->index(['status', 'occurred_at'], 'trigger_events_status_occurred_idx');
            $table->index('dedupe_key');
        });

        Schema::create('trigger_action_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trigger_event_id')->nullable()->constrained('trigger_events')->nullOnDelete();
            $table->foreignId('process_trigger_execution_id')->nullable()->constrained('process_trigger_executions')->nullOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('owner_role')->nullable();
            $table->string('source_entity_type');
            $table->unsignedBigInteger('source_entity_id');
            $table->string('subject_entity_type')->nullable();
            $table->unsignedBigInteger('subject_entity_id')->nullable();
            $table->string('title');
            $table->text('summary')->nullable();
            $table->string('attention_state')->default('need_action');
            $table->string('priority')->default('medium');
            $table->string('recommended_action')->nullable();
            $table->string('primary_action_label')->nullable();
            $table->json('action_payload')->nullable();
            $table->string('status')->default('open');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('snooze_until')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'attention_state', 'priority'], 'trigger_action_items_status_attention_idx');
            $table->index(['source_entity_type', 'source_entity_id'], 'trigger_action_items_source_idx');
            $table->index(['subject_entity_type', 'subject_entity_id'], 'trigger_action_items_subject_idx');
            $table->index(['assignee_id', 'status'], 'trigger_action_items_assignee_idx');
            $table->index('due_at');
            $table->index('snooze_until');
        });

        Schema::create('trigger_resolutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trigger_action_item_id')->constrained('trigger_action_items')->cascadeOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('resolution_type');
            $table->text('notes')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('resolved_at')->useCurrent();
            $table->timestamps();

            $table->index(['resolution_type', 'resolved_at'], 'trigger_resolutions_type_resolved_idx');
        });

        Schema::create('trigger_suppressions', function (Blueprint $table) {
            $table->id();
            $table->string('dedupe_key');
            $table->string('source_entity_type')->nullable();
            $table->unsignedBigInteger('source_entity_id')->nullable();
            $table->timestamp('suppressed_until');
            $table->string('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('dedupe_key');
            $table->index(['source_entity_type', 'source_entity_id'], 'trigger_suppressions_source_idx');
            $table->index('suppressed_until');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trigger_suppressions');
        Schema::dropIfExists('trigger_resolutions');
        Schema::dropIfExists('trigger_action_items');
        Schema::dropIfExists('trigger_events');
    }
};