<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orchestrator_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_instance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instance_token_id')->constrained()->cascadeOnDelete();
            $table->string('node_id');
            $table->enum('status', [
                'queued',
                'running',
                'succeeded',
                'failed',
                'retry',
            ])->default('queued')->index();
            $table->integer('attempt')->default(1);
            $table->dateTime('next_run_at')->index();
            $table->string('dedupe_key', 255)->unique()->index(); // instanceId:nodeId:attempt
            $table->longText('payload'); // JSON of {jobId, instanceId, nodeId, payload, attempt, deadline}
            $table->longText('result')->nullable();
            $table->text('error')->nullable();
            $table->integer('retry_count')->default(0);
            $table->dateTime('last_retry_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'next_run_at']);
            $table->index(['process_instance_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orchestrator_jobs');
    }
};
