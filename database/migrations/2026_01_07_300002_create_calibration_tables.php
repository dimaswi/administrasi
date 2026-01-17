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
        // Calibration Sessions (Sesi Kalibrasi)
        Schema::create('calibration_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('performance_periods')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'in_progress', 'completed'])->default('draft');
            $table->date('scheduled_date')->nullable();
            $table->foreignId('facilitator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Calibration Participants (Review yang akan dikalibrasi)
        Schema::create('calibration_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('calibration_sessions')->cascadeOnDelete();
            $table->foreignId('review_id')->constrained('performance_reviews')->cascadeOnDelete();
            $table->decimal('original_score', 5, 2)->nullable(); // Skor sebelum kalibrasi
            $table->decimal('calibrated_score', 5, 2)->nullable(); // Skor setelah kalibrasi
            $table->string('original_grade', 10)->nullable();
            $table->string('calibrated_grade', 10)->nullable();
            $table->text('calibration_notes')->nullable();
            $table->foreignId('calibrated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('calibrated_at')->nullable();
            $table->timestamps();
            
            $table->unique(['session_id', 'review_id']);
        });

        // Calibration Comments/Discussion (Log diskusi kalibrasi)
        Schema::create('calibration_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calibration_review_id')->constrained('calibration_reviews')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('comment');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calibration_comments');
        Schema::dropIfExists('calibration_reviews');
        Schema::dropIfExists('calibration_sessions');
    }
};
