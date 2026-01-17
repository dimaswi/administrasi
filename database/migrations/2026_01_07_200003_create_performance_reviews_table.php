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
        // Performance Reviews (Penilaian Kinerja)
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('performance_periods')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['draft', 'self_review', 'manager_review', 'calibration', 'completed'])->default('draft');
            $table->decimal('self_score', 5, 2)->nullable();
            $table->decimal('manager_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('final_grade', 10)->nullable(); // A, B, C, D, E
            $table->text('employee_notes')->nullable(); // Self assessment notes
            $table->text('manager_notes')->nullable(); // Manager feedback
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->text('development_plan')->nullable();
            $table->timestamp('self_reviewed_at')->nullable();
            $table->timestamp('manager_reviewed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->unique(['employee_id', 'period_id']);
        });

        // Performance Review Items (Detail KPI per Review)
        Schema::create('performance_review_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('performance_reviews')->cascadeOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('kpi_templates')->nullOnDelete();
            $table->foreignId('category_id')->constrained('kpi_categories')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('measurement_type', ['numeric', 'percentage', 'rating', 'yes_no'])->default('numeric');
            $table->string('unit')->nullable();
            $table->decimal('target', 10, 2)->nullable();
            $table->decimal('actual', 10, 2)->nullable();
            $table->integer('weight')->default(1);
            $table->decimal('self_score', 5, 2)->nullable(); // 1-5 or 0-100
            $table->decimal('manager_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->text('self_comment')->nullable();
            $table->text('manager_comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_review_items');
        Schema::dropIfExists('performance_reviews');
    }
};
