<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_instance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instance_token_id')->constrained()->cascadeOnDelete();
            $table->string('event_type');
            $table->string('correlation_key');
            $table->enum('status', ['active', 'completed', 'expired', 'cancelled'])->default('active')->index();
            $table->dateTime('expires_at')->nullable();
            $table->json('filters')->nullable(); // additional matching criteria
            $table->timestamps();

            $table->unique(['process_instance_id', 'instance_token_id']);
            $table->index(['event_type', 'correlation_key', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_subscriptions');
    }
};
