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
        Schema::create('employee_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            
            // Periode berlaku
            $table->date('effective_date')->comment('Tanggal mulai berlaku');
            $table->date('end_date')->nullable()->comment('Tanggal berakhir (null = masih berlaku)');
            
            // Jam kerja
            $table->time('clock_in_time');
            $table->time('clock_out_time');
            
            // Jam istirahat
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            
            // Hari kerja (JSON: ["monday", "tuesday", ...])
            $table->json('work_days');
            
            // Toleransi (dalam menit)
            $table->unsignedSmallInteger('late_tolerance')->default(0);
            $table->unsignedSmallInteger('early_leave_tolerance')->default(0);
            
            // Total jam kerja per hari (dalam menit)
            $table->unsignedSmallInteger('work_hours_per_day')->default(480);
            
            // Catatan perubahan
            $table->text('notes')->nullable();
            
            // Siapa yang membuat/mengubah jadwal
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            
            // Index untuk query efisien
            $table->index(['employee_id', 'effective_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_schedules');
        Schema::dropIfExists('work_schedules');
    }
};
