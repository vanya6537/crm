<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('process_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_definition_id')->constrained()->cascadeOnDelete();
            $table->integer('version')->default(1);
            $table->enum('status', ['draft', 'published', 'deprecated'])->default('draft')->index();
            $table->longText('graph_json');
            $table->longText('variables_schema_json')->nullable();
            $table->string('checksum', 64); // SHA256
            $table->text('changelog')->nullable();
            $table->timestamps();

            $table->unique(['process_definition_id', 'version']);
            $table->index(['process_definition_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('process_versions');
    }
};
