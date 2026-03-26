<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trigger_definitions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('catalog_number')->unique();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('family');
            $table->string('source_entity_type');
            $table->string('runtime_entity_type')->nullable();
            $table->string('source_event')->default('updated');
            $table->string('trigger_type')->default('entity_updated');
            $table->string('attention_state')->default('need_action');
            $table->string('priority')->default('medium');
            $table->string('default_action')->nullable();
            $table->string('owner_role')->nullable();
            $table->json('visibility_roles')->nullable();
            $table->json('resolution_policy')->nullable();
            $table->integer('ttl_hours')->nullable();
            $table->string('dedupe_scope')->default('entity');
            $table->text('condition_summary')->nullable();
            $table->text('action_summary')->nullable();
            $table->boolean('is_mvp')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['family', 'is_active'], 'trigger_definitions_family_active_idx');
            $table->index(['runtime_entity_type', 'source_event'], 'trigger_definitions_runtime_event_idx');
            $table->index(['attention_state', 'priority'], 'trigger_definitions_attention_priority_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trigger_definitions');
    }
};