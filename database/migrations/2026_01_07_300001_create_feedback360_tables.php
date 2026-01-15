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
        // 360 Feedback Sessions (Sesi Feedback 360)
        Schema::create('feedback360_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('performance_periods')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_anonymous')->default(true);
            $table->integer('min_reviewers')->default(3);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 360 Feedback Participants (Target yang dinilai)
        Schema::create('feedback360_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('feedback360_sessions')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->decimal('average_score', 5, 2)->nullable();
            $table->integer('total_feedbacks')->default(0);
            $table->timestamps();
            
            $table->unique(['session_id', 'employee_id']);
        });

        // 360 Feedback Reviewers (Penilai untuk setiap participant)
        Schema::create('feedback360_reviewers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('feedback360_participants')->cascadeOnDelete();
            $table->foreignId('reviewer_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('relationship', ['self', 'supervisor', 'peer', 'subordinate', 'external'])->default('peer');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'declined'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->unique(['participant_id', 'reviewer_employee_id']);
        });

        // 360 Feedback Questions (Pertanyaan/Kriteria)
        Schema::create('feedback360_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('feedback360_sessions')->cascadeOnDelete();
            $table->string('category'); // Leadership, Communication, Teamwork, etc.
            $table->string('question');
            $table->text('description')->nullable();
            $table->enum('type', ['rating', 'text', 'yes_no'])->default('rating');
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });

        // 360 Feedback Responses (Jawaban dari reviewer)
        Schema::create('feedback360_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reviewer_id')->constrained('feedback360_reviewers')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('feedback360_questions')->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable(); // 1-5 rating
            $table->text('answer')->nullable(); // For text questions
            $table->boolean('boolean_answer')->nullable(); // For yes/no questions
            $table->timestamps();
            
            $table->unique(['reviewer_id', 'question_id']);
        });

        // 360 Feedback Comments (Komentar umum dari reviewer)
        Schema::create('feedback360_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reviewer_id')->constrained('feedback360_reviewers')->cascadeOnDelete();
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->text('additional_comments')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback360_comments');
        Schema::dropIfExists('feedback360_responses');
        Schema::dropIfExists('feedback360_questions');
        Schema::dropIfExists('feedback360_reviewers');
        Schema::dropIfExists('feedback360_participants');
        Schema::dropIfExists('feedback360_sessions');
    }
};
