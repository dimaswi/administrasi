<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Restructure:
     * - work_schedules = Template shift (Pagi, Siang, Malam) dengan jam saja, TANPA hari
     * - employee_schedules = Jadwal mingguan karyawan, dengan shift berbeda per hari
     */
    public function up(): void
    {
        // 1. Hapus work_days dari work_schedules (shift tidak perlu hari)
        Schema::table('work_schedules', function (Blueprint $table) {
            $table->dropColumn('work_days');
        });

        // 2. Ubah struktur employee_schedules - shift per hari
        Schema::table('employee_schedules', function (Blueprint $table) {
            // Hapus kolom lama
            $table->dropColumn([
                'clock_in_time',
                'clock_out_time',
                'break_start',
                'break_end',
                'work_days',
                'late_tolerance',
                'early_leave_tolerance',
                'work_hours_per_day',
            ]);
        });

        // 3. Hapus foreign key work_schedule_id jika ada (separate statement)
        if (Schema::hasColumn('employee_schedules', 'work_schedule_id')) {
            Schema::table('employee_schedules', function (Blueprint $table) {
                $table->dropConstrainedForeignId('work_schedule_id');
            });
        }

        // 4. Tambah kolom shift per hari
        Schema::table('employee_schedules', function (Blueprint $table) {
            $table->foreignId('monday_shift_id')->nullable()->after('end_date')
                ->constrained('work_schedules')->nullOnDelete();
            $table->foreignId('tuesday_shift_id')->nullable()->after('monday_shift_id')
                ->constrained('work_schedules')->nullOnDelete();
            $table->foreignId('wednesday_shift_id')->nullable()->after('tuesday_shift_id')
                ->constrained('work_schedules')->nullOnDelete();
            $table->foreignId('thursday_shift_id')->nullable()->after('wednesday_shift_id')
                ->constrained('work_schedules')->nullOnDelete();
            $table->foreignId('friday_shift_id')->nullable()->after('thursday_shift_id')
                ->constrained('work_schedules')->nullOnDelete();
            $table->foreignId('saturday_shift_id')->nullable()->after('friday_shift_id')
                ->constrained('work_schedules')->nullOnDelete();
            $table->foreignId('sunday_shift_id')->nullable()->after('saturday_shift_id')
                ->constrained('work_schedules')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore employee_schedules
        Schema::table('employee_schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('monday_shift_id');
            $table->dropConstrainedForeignId('tuesday_shift_id');
            $table->dropConstrainedForeignId('wednesday_shift_id');
            $table->dropConstrainedForeignId('thursday_shift_id');
            $table->dropConstrainedForeignId('friday_shift_id');
            $table->dropConstrainedForeignId('saturday_shift_id');
            $table->dropConstrainedForeignId('sunday_shift_id');

            $table->time('clock_in_time')->after('end_date');
            $table->time('clock_out_time')->after('clock_in_time');
            $table->time('break_start')->nullable()->after('clock_out_time');
            $table->time('break_end')->nullable()->after('break_start');
            $table->json('work_days')->after('break_end');
            $table->integer('late_tolerance')->default(15)->after('work_days');
            $table->integer('early_leave_tolerance')->default(0)->after('late_tolerance');
            $table->integer('work_hours_per_day')->after('early_leave_tolerance');
            $table->foreignId('work_schedule_id')->nullable()->after('work_hours_per_day')
                ->constrained()->nullOnDelete();
        });

        // Restore work_schedules
        Schema::table('work_schedules', function (Blueprint $table) {
            $table->json('work_days')->after('break_end');
        });
    }
};
