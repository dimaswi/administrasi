<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Training Programs
        Schema::create('trainings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type'); // internal, external, online, certification
            $table->string('category')->nullable(); // technical, soft-skill, compliance, etc
            $table->string('provider')->nullable(); // Internal, Vendor name, Platform name
            $table->integer('duration_hours')->nullable();
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('location')->nullable();
            $table->boolean('is_mandatory')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('objectives')->nullable(); // Learning objectives
            $table->text('prerequisites')->nullable();
            $table->timestamps();
        });

        // Employee Training Records
        Schema::create('employee_trainings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_id')->constrained()->cascadeOnDelete();
            $table->string('status'); // registered, in_progress, completed, failed, cancelled
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('completion_date')->nullable();
            $table->decimal('score', 5, 2)->nullable(); // Final score if applicable
            $table->string('grade')->nullable(); // A, B, C, D, F or Pass/Fail
            $table->string('certificate_number')->nullable();
            $table->string('certificate_path')->nullable(); // Path to certificate file
            $table->date('certificate_expiry')->nullable(); // For certifications that expire
            $table->text('feedback')->nullable(); // Training feedback from employee
            $table->integer('rating')->nullable(); // 1-5 rating
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->unique(['employee_id', 'training_id', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_trainings');
        Schema::dropIfExists('trainings');
    }
};
