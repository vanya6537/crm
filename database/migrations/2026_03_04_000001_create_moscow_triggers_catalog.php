<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Moscow Real Estate Agency Trigger Templates Catalog
        Schema::create('trigger_templates', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Unique identifier: 'lead_first_contact_reminder'
            $table->string('name'); // Display name: 'Напоминание о первом контакте'
            $table->text('description');
            $table->string('category'); // 'leads', 'properties', 'buyers', 'showings', 'owners', 'deals', 'messaging', 'meta'
            $table->string('event_type'); // 'created', 'updated', 'status_changed', 'field_changed', 'time_based', 'custom'
            $table->string('entity_type'); // 'Lead', 'Property', 'Buyer', 'PropertyShowing', 'Owner', 'Transaction', 'Agent'
            $table->json('event_config')->nullable(); // {event: "lead.created", condition: {...}}
            $table->json('action_config')->nullable(); // {type: "send_notification", channels: ["push", "telegram"]}
            $table->json('timing_config')->nullable(); // {delay: "2h", frequency: "once"} for time-based triggers
            $table->json('default_template_vars')->nullable(); // Variables available for templates
            $table->boolean('is_recommended')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->string('moscow_use_case')->nullable(); // Why this trigger is important for Moscow market
            $table->string('expected_impact')->nullable(); // "Increases conversion by 20-35%"
            $table->json('sample_notification')->nullable(); // Example notification text
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            
            $table->index('category');
            $table->index('entity_type');
            $table->index('is_recommended');
            $table->index('is_active');
        });

        // Active trigger instances (per agency/agent)
        Schema::create('active_triggers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trigger_template_id')->constrained('trigger_templates')->cascadeOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->unsignedBigInteger('created_by');
            $table->boolean('is_enabled')->default(true);
            $table->json('override_config')->nullable(); // Override template config
            $table->json('filter_config')->nullable(); // Additional filters {object_type: "apartment", price_min: 1000000}
            $table->integer('execution_count')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();
            
            $table->unique(['trigger_template_id', 'agent_id']);
            $table->index('agent_id');
            $table->index('is_enabled');
            $table->index('created_by');
        });

        // Trigger execution logs (for analytics)
        Schema::create('trigger_execution_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('active_trigger_id')->constrained('active_triggers')->cascadeOnDelete();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->string('status'); // 'pending', 'executed', 'failed', 'skipped'
            $table->json('trigger_context')->nullable(); // Entity data at trigger time
            $table->json('notification_sent')->nullable(); // {channel: "telegram", message_id: "123"}
            $table->text('error_details')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();
            
            $table->index('active_trigger_id');
            $table->index('entity_type');
            $table->index('status');
            $table->index('executed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trigger_execution_logs');
        Schema::dropIfExists('active_triggers');
        Schema::dropIfExists('trigger_templates');
    }
};
