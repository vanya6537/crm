<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Store form schemas (configurations)
        Schema::create('form_schemas', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('entity_type'); // agent, property, buyer, transaction, property_showing, communication
            $table->string('form_type'); // custom, intake, feedback, survey, etc
            $table->enum('status', ['draft', 'published', 'deprecated'])->default('draft');
            $table->json('metadata')->nullable(); // title, icon, color, tags
            $table->json('config')->nullable(); // layout, theme, validation settings
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();
            
            $table->index('entity_type');
            $table->index('form_type');
            $table->index('status');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();
        });

        // Store individual form fields with validation rules
        Schema::create('form_fields', function (Blueprint $table) {
            $table->id();  
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('form_schema_id');
            $table->string('name'); // field_name in code
            $table->string('label'); // display label
            $table->text('description')->nullable();
            $table->string('field_type'); // text, textarea, number, select, multiselect, date, datetime, checkbox, radio, email, phone, url, json, etc
            $table->integer('sort_order')->default(0);
            $table->boolean('required')->default(false);
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable();
            
            // Field configuration (stored as JSON)
            $table->json('options')->nullable(); // for select/multiselect: array of {value, label}
            $table->json('validation')->nullable(); // rules, regex, min, max, etc
            $table->json('default_value')->nullable();
            $table->json('conditional_logic')->nullable(); // show/hide rules
            
            // UI configuration
            $table->string('icon')->nullable(); // icon name for display
            $table->string('css_class')->nullable();
            $table->json('ui_config')->nullable(); // rows, cols, width, layout specific
            
            $table->timestamps();
            
            $table->foreign('form_schema_id')->references('id')->on('form_schemas')->cascadeOnDelete();
            $table->index('form_schema_id');
            $table->index('field_type');
        });

        // Store form responses (submissions)
        Schema::create('form_responses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('form_schema_id');
            $table->morphs('respondent'); // agent, buyer, etc
            $table->json('response_data')->nullable(); // all field responses stored as JSON
            $table->enum('status', ['draft', 'submitted', 'invalid', 'processing', 'processed'])->default('draft');
            $table->string('source')->nullable(); // web, messenger, api, form_builder
            $table->json('metadata')->nullable(); // ip_address, user_agent, submission_time, etc
            $table->unsignedBigInteger('messenger_message_id')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            
            $table->foreign('form_schema_id')->references('id')->on('form_schemas')->cascadeOnDelete();
            $table->index('form_schema_id');
            $table->index('respondent_type');
            $table->index('status');
            $table->index('submitted_at');
        });

        // Store individual field responses with validation results
        Schema::create('form_response_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('form_response_id');
            $table->unsignedBigInteger('form_field_id');
            $table->json('value')->nullable(); // actual submitted value
            $table->json('validation_errors')->nullable(); // validation failures
            $table->boolean('is_valid')->default(true);
            $table->timestamps();
            
            $table->foreign('form_response_id')->references('id')->on('form_responses')->cascadeOnDelete();
            $table->foreign('form_field_id')->references('id')->on('form_fields')->cascadeOnDelete();
            $table->unique(['form_response_id', 'form_field_id']);
        });

        // Store messenger messages and agent communications
        Schema::create('messenger_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('messenger_type'); // telegram, whatsapp, slack, email, sms
            $table->string('external_message_id')->nullable(); // message ID from messenger service
            $table->unsignedBigInteger('agent_id')->nullable();
            $table->morphs('recipient'); // agent, buyer, property, etc
            $table->text('content');
            $table->json('attachments')->nullable(); // photos, documents
            $table->json('metadata')->nullable(); // chat_id, thread_id, sender_id, etc
            $table->unsignedBigInteger('form_response_id')->nullable(); // link to form response if form was submitted
            $table->enum('direction', ['incoming', 'outgoing'])->default('outgoing');
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending');
            $table->string('error_message')->nullable();
            $table->integer('retry_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->foreign('agent_id')->references('id')->on('agents')->nullOnDelete();
            $table->foreign('form_response_id')->references('id')->on('form_responses')->nullOnDelete();
            $table->index('agent_id');
            $table->index('messenger_type');
            $table->index('direction');
            $table->index('status');
            $table->index('created_at');
        });

        // Store messenger service configurations per agent
        Schema::create('messenger_agent_configs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('agent_id');
            $table->string('messenger_type'); // telegram, whatsapp, slack, email
            $table->json('config')->nullable(); // messenger settings: token, chat_id, etc
            $table->boolean('is_active')->default(true);
            $table->json('webhooks')->nullable(); // webhook URLs for incoming messages
            $table->json('metadata')->nullable(); // last_sync_time, error_log, etc
            $table->timestamps();
            
            $table->foreign('agent_id')->references('id')->on('agents')->cascadeOnDelete();
            $table->unique(['agent_id', 'messenger_type']);
            $table->index('agent_id');
            $table->index('messenger_type');
        });

        // Form field templates (reusable field definitions)
        Schema::create('form_field_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name')->unique(); // e.g., "agent_rating_field", "property_type_field"
            $table->text('description')->nullable();
            $table->string('field_type'); // base field type
            $table->json('template_config')->nullable(); // predefined config
            $table->json('options')->nullable(); // standard options
            $table->json('validation')->nullable(); // standard validation rules
            $table->string('icon')->nullable();
            $table->json('metadata')->nullable(); // tags, category, etc
            $table->timestamps();
            
            $table->index('field_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_field_templates');
        Schema::dropIfExists('messenger_agent_configs');
        Schema::dropIfExists('messenger_messages');
        Schema::dropIfExists('form_response_entries');
        Schema::dropIfExists('form_responses');
        Schema::dropIfExists('form_fields');
        Schema::dropIfExists('form_schemas');
    }
};
