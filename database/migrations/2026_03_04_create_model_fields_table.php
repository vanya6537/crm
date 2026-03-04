<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('model_fields', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            
            // Entity type this field belongs to
            $table->enum('entity_type', [
                'agent',
                'property',
                'buyer',
                'transaction',
                'property_showing',
                'communication'
            ]);
            
            // Field definition
            $table->string('name'); // Field key for database
            $table->string('label'); // Display name
            $table->text('description')->nullable(); // Help text
            $table->string('field_type'); // Type: text, textarea, number, date, select, relation, etc.
            $table->integer('sort_order')->default(0);
            
            // Configuration
            $table->boolean('required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable();
            
            // For select/reference fields
            $table->json('options')->nullable(); // List of values for select/checkbox
            $table->string('reference_table')->nullable(); // For relation type fields
            
            // Field type specific settings
            $table->json('validation')->nullable(); // Validation rules
            $table->json('default_value')->nullable();
            $table->json('ui_config')->nullable(); // CSS classes, width, cols, rows, etc.
            
            // Field sub-type settings
            $table->boolean('is_master_relation')->default(false); // For relation type - if true, cascade delete
            $table->boolean('allow_multiple')->default(false); // For select/relation - multiple selection
            $table->integer('max_items')->nullable(); // For multiple relations - max count
            
            // System fields
            $table->string('icon')->nullable();
            $table->string('css_class')->nullable();
            $table->json('metadata')->nullable();
            
            // Auditing
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            
            // Indexes
            $table->index('entity_type');
            $table->index('name');
            $table->index('is_active');
            $table->unique(['entity_type', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('model_fields');
    }
};
