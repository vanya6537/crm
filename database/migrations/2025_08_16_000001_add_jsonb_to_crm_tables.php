<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Update agents table with JSONB
        Schema::table('agents', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->comment('Custom fields defined by user');
            $table->json('metadata')->nullable()->comment('Agent metadata: ratings, stats');
        });

        // Update properties table with JSONB
        Schema::table('properties', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->comment('Custom fields: energy_class, floor, etc');
            $table->json('amenities')->nullable()->comment('Structured amenities (pool, garage, etc)');
            $table->json('inspection_reports')->nullable()->comment('History of inspections');
        });

        // Update buyers table with JSONB
        Schema::table('buyers', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->comment('Custom fields: nationality, occupation');
            $table->json('search_history')->nullable()->comment('Properties they viewed');
            $table->json('financing_info')->nullable()->comment('Loan approved, bank, amount');
        });

        // Update transactions table with JSONB
        Schema::table('transactions', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->comment('Custom transaction fields');
            $table->json('timeline')->nullable()->comment('Transaction milestones');
            $table->json('escrow_details')->nullable()->comment('Escrow account information');
        });

        // Update property_showings table with JSONB
        Schema::table('property_showings', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->comment('Custom showing fields');
            $table->json('feedback')->nullable()->comment('Buyer feedback form');
            $table->json('photos')->nullable()->comment('Photos taken during showing');
        });

        // Update communications table with JSONB
        Schema::table('communications', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->comment('Custom communication fields');
            $table->json('attachments')->nullable()->comment('File attachments');
            $table->json('sentiment')->nullable()->comment('Sentiment analysis result');
        });
    }

    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->dropColumn(['custom_fields', 'metadata']);
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['custom_fields', 'amenities', 'inspection_reports']);
        });

        Schema::table('buyers', function (Blueprint $table) {
            $table->dropColumn(['custom_fields', 'search_history', 'financing_info']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['custom_fields', 'timeline', 'escrow_details']);
        });

        Schema::table('property_showings', function (Blueprint $table) {
            $table->dropColumn(['custom_fields', 'feedback', 'photos']);
        });

        Schema::table('communications', function (Blueprint $table) {
            $table->dropColumn(['custom_fields', 'attachments', 'sentiment']);
        });
    }
};
