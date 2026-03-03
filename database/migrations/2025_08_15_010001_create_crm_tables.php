<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('license_number')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->enum('specialization', ['residential', 'commercial', 'luxury'])->default('residential');
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->string('address');
            $table->string('city');
            $table->enum('type', ['apartment', 'house', 'commercial'])->default('apartment');
            $table->enum('status', ['available', 'sold', 'rented', 'archived'])->default('available')->index();
            $table->decimal('price', 15, 2);
            $table->decimal('area', 8, 2)->nullable();
            $table->integer('rooms')->nullable();
            $table->text('description')->nullable();
            $table->json('photos_json')->nullable();
            $table->json('features_json')->nullable();
            $table->timestamps();
            $table->index(['status', 'city']);
            $table->fullText('address', 'description');
        });

        Schema::create('buyers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->decimal('budget_min', 15, 2)->nullable();
            $table->decimal('budget_max', 15, 2)->nullable();
            $table->json('preferences_json')->nullable();
            $table->enum('source', ['website', 'referral', 'agent_call', 'ads'])->default('website');
            $table->enum('status', ['active', 'converted', 'lost'])->default('active')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('buyers')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->enum('status', ['lead', 'negotiation', 'offer', 'accepted', 'closed', 'cancelled'])->default('lead')->index();
            $table->decimal('offer_price', 15, 2)->nullable();
            $table->decimal('final_price', 15, 2)->nullable();
            $table->decimal('commission_percent', 5, 2)->default(5.00);
            $table->decimal('commission_amount', 15, 2)->nullable();
            $table->json('documents_json')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('started_at');
            $table->dateTime('closed_at')->nullable();
            $table->timestamps();
            $table->unique(['property_id', 'buyer_id']);
            $table->index(['status', 'agent_id']);
        });

        Schema::create('property_showings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('buyers')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->dateTime('completed_at')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'no_show', 'cancelled'])->default('scheduled')->index();
            $table->integer('rating')->nullable(); // 1-5
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['scheduled_at', 'status']);
        });

        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->enum('type', ['email', 'call', 'meeting', 'offer', 'update'])->default('email');
            $table->enum('direction', ['inbound', 'outbound'])->default('outbound');
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->enum('status', ['sent', 'delivered', 'read', 'pending_response'])->default('sent')->index();
            $table->dateTime('next_follow_up_at')->nullable();
            $table->json('metadata_json')->nullable();
            $table->timestamps();
            $table->index(['transaction_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communications');
        Schema::dropIfExists('property_showings');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('buyers');
        Schema::dropIfExists('properties');
        Schema::dropIfExists('agents');
    }
};
