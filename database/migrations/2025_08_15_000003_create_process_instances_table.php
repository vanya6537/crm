<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('process_instances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_definition_id')->constrained()->cascadeOnDelete();
            $table->foreignId('process_version_id')->constrained('process_versions')->cascadeOnDelete();
            $table->string('business_key')->nullable()->index();
            $table->enum('status', [
                'created',
                'running',
                'waiting',
                'paused',
                'completed',
                'failed',
                'cancelled',
            ])->default('created')->index();
            $table->longText('variables_json')->nullable(); // vars_json
            $table->json('metadata')->nullable();
            $table->dateTime('started_at')->nullable()->index();
            $table->dateTime('ended_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'started_at']);
            $table->index(['process_definition_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('process_instances');
    }
};
