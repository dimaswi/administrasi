<?php

namespace App\Console\Commands;

use App\Models\HR\Attendance;
use Illuminate\Console\Command;

class RecalculateAttendance extends Command
{
    protected $signature = 'attendance:recalculate {--date= : Date to recalculate (Y-m-d)}';
    protected $description = 'Recalculate late_minutes, early_leave_minutes and status for attendance records';

    public function handle()
    {
        $date = $this->option('date') ?? now()->toDateString();
        
        $attendances = Attendance::whereDate('date', $date)->get();
        
        $this->info("Recalculating {$attendances->count()} attendance records for {$date}...");
        
        foreach ($attendances as $att) {
            $att->late_minutes = $att->calculateLateMinutes();
            $att->early_leave_minutes = $att->calculateEarlyLeaveMinutes();
            $att->status = $att->determineStatus();
            $att->save();
            
            $this->line("Employee {$att->employee_id}: late={$att->late_minutes}min, early_leave={$att->early_leave_minutes}min, status={$att->status}");
        }
        
        $this->info('Done!');
        return 0;
    }
}
