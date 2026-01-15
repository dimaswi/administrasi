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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('employee_schedule_id')->nullable()->constrained('employee_schedules')->nullOnDelete();
            $table->foreignId('work_schedule_id')->nullable()->constrained('work_schedules')->nullOnDelete();
            $table->date('date');
            
            // Clock in/out times
            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            
            // Expected times from schedule
            $table->time('scheduled_clock_in')->nullable();
            $table->time('scheduled_clock_out')->nullable();
            
            // GPS Coordinates
            $table->decimal('clock_in_latitude', 10, 8)->nullable();
            $table->decimal('clock_in_longitude', 11, 8)->nullable();
            $table->decimal('clock_out_latitude', 10, 8)->nullable();
            $table->decimal('clock_out_longitude', 11, 8)->nullable();
            
            // Location validation
            $table->boolean('clock_in_location_valid')->default(false);
            $table->boolean('clock_out_location_valid')->default(false);
            
            // Status flags
            $table->enum('status', ['present', 'absent', 'late', 'early_leave', 'late_early_leave', 'holiday', 'leave', 'sick', 'permit'])->default('present');
            $table->boolean('is_manual_entry')->default(false);
            $table->boolean('is_approved')->default(true);
            
            // Time calculations (in minutes)
            $table->integer('late_minutes')->default(0);
            $table->integer('early_leave_minutes')->default(0);
            $table->integer('overtime_minutes')->default(0);
            $table->integer('work_duration_minutes')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Audit
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->unique(['employee_id', 'date']);
            $table->index(['date', 'status']);
            $table->index(['employee_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
