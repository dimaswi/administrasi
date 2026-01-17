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
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types')->restrictOnDelete();
            
            // Leave period
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('total_days');
            
            // Half day options
            $table->boolean('is_half_day')->default(false);
            $table->enum('half_day_type', ['morning', 'afternoon'])->nullable();
            
            // Request details
            $table->text('reason');
            $table->string('attachment')->nullable(); // File attachment
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_phone', 20)->nullable();
            $table->string('delegation_to')->nullable(); // Person to handle work
            
            // Status workflow
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'cancelled'])->default('draft');
            
            // Approval workflow
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Second level approval (if needed)
            $table->foreignId('approved_by_level_2')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at_level_2')->nullable();
            $table->text('approval_notes_level_2')->nullable();
            
            // Audit trail
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for common queries
            $table->index(['employee_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index(['status', 'created_at']);
        });

        // Create employee leave balances table
        Schema::create('employee_leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types')->cascadeOnDelete();
            $table->integer('year');
            
            // Balance tracking
            $table->decimal('initial_balance', 5, 1)->default(0); // Initial quota
            $table->decimal('carry_over', 5, 1)->default(0); // Carried over from previous year
            $table->decimal('adjustment', 5, 1)->default(0); // Manual adjustments
            $table->decimal('used', 5, 1)->default(0); // Used days
            $table->decimal('pending', 5, 1)->default(0); // Pending approval
            
            $table->timestamps();
            
            // Unique constraint: one balance per employee per leave type per year
            $table->unique(['employee_id', 'leave_type_id', 'year'], 'emp_leave_type_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_leave_balances');
        Schema::dropIfExists('leaves');
    }
};
