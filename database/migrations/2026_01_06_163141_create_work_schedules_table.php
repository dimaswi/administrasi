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
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->string('description')->nullable();
            
            // Jam kerja
            $table->time('clock_in_time');
            $table->time('clock_out_time');
            
            // Jam istirahat
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            
            // Hari kerja (JSON: ["monday", "tuesday", ...])
            $table->json('work_days');
            
            // Toleransi (dalam menit)
            $table->unsignedSmallInteger('late_tolerance')->default(0)->comment('Toleransi keterlambatan (menit)');
            $table->unsignedSmallInteger('early_leave_tolerance')->default(0)->comment('Toleransi pulang awal (menit)');
            
            // Jam kerja fleksibel
            $table->boolean('is_flexible')->default(false);
            $table->unsignedSmallInteger('flexible_minutes')->nullable()->comment('Rentang fleksibel (menit)');
            
            // Total jam kerja per hari (dalam menit)
            $table->unsignedSmallInteger('work_hours_per_day')->default(480)->comment('Jam kerja per hari (menit)');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_schedules');
    }
};
