<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkSchedule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'clock_in_time',
        'clock_out_time',
        'break_start',
        'break_end',
        'late_tolerance',
        'early_leave_tolerance',
        'is_flexible',
        'flexible_minutes',
        'work_hours_per_day',
        'is_active',
    ];

    protected $casts = [
        'is_flexible' => 'boolean',
        'is_active' => 'boolean',
        'late_tolerance' => 'integer',
        'early_leave_tolerance' => 'integer',
        'flexible_minutes' => 'integer',
        'work_hours_per_day' => 'integer',
    ];

    /**
     * Scope active
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get formatted clock in time
     */
    public function getClockInFormattedAttribute(): string
    {
        return date('H:i', strtotime($this->clock_in_time));
    }

    /**
     * Get formatted clock out time
     */
    public function getClockOutFormattedAttribute(): string
    {
        return date('H:i', strtotime($this->clock_out_time));
    }

    /**
     * Get work hours in formatted string
     */
    public function getWorkHoursFormattedAttribute(): string
    {
        $hours = floor($this->work_hours_per_day / 60);
        $minutes = $this->work_hours_per_day % 60;
        
        if ($minutes > 0) {
            return "{$hours} jam {$minutes} menit";
        }
        return "{$hours} jam";
    }

    /**
     * Get time range formatted
     */
    public function getTimeRangeAttribute(): string
    {
        return $this->clock_in_formatted . ' - ' . $this->clock_out_formatted;
    }
}
