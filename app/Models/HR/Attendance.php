<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Attendance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id',
        'employee_schedule_id',
        'work_schedule_id',
        'date',
        'clock_in',
        'clock_out',
        'break_start',
        'break_end',
        'scheduled_clock_in',
        'scheduled_clock_out',
        'clock_in_latitude',
        'clock_in_longitude',
        'clock_out_latitude',
        'clock_out_longitude',
        'clock_in_location_valid',
        'clock_out_location_valid',
        'status',
        'is_manual_entry',
        'is_approved',
        'late_minutes',
        'early_leave_minutes',
        'overtime_minutes',
        'work_duration_minutes',
        'notes',
        'approval_notes',
        'approved_by',
        'approved_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime:H:i:s',
        'clock_out' => 'datetime:H:i:s',
        'break_start' => 'datetime:H:i:s',
        'break_end' => 'datetime:H:i:s',
        'scheduled_clock_in' => 'datetime:H:i:s',
        'scheduled_clock_out' => 'datetime:H:i:s',
        'clock_in_latitude' => 'decimal:8',
        'clock_in_longitude' => 'decimal:8',
        'clock_out_latitude' => 'decimal:8',
        'clock_out_longitude' => 'decimal:8',
        'clock_in_location_valid' => 'boolean',
        'clock_out_location_valid' => 'boolean',
        'is_manual_entry' => 'boolean',
        'is_approved' => 'boolean',
        'late_minutes' => 'integer',
        'early_leave_minutes' => 'integer',
        'overtime_minutes' => 'integer',
        'work_duration_minutes' => 'integer',
        'approved_at' => 'datetime',
    ];

    /**
     * Status labels
     */
    public const STATUS_LABELS = [
        'present' => 'Hadir',
        'absent' => 'Tidak Hadir',
        'late' => 'Terlambat',
        'early_leave' => 'Pulang Awal',
        'late_early_leave' => 'Terlambat & Pulang Awal',
        'holiday' => 'Libur',
        'leave' => 'Cuti',
        'sick' => 'Sakit',
        'permit' => 'Izin',
    ];

    /**
     * Relationships
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function employeeSchedule(): BelongsTo
    {
        return $this->belongsTo(EmployeeSchedule::class);
    }

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scopes
     */
    public function scopeForDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopePresent($query)
    {
        return $query->whereIn('status', ['present', 'late', 'early_leave', 'late_early_leave']);
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    public function scopeLate($query)
    {
        return $query->whereIn('status', ['late', 'late_early_leave']);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('is_manual_entry', true)->where('is_approved', false);
    }

    /**
     * Accessors
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function getClockInFormattedAttribute(): ?string
    {
        return $this->clock_in ? Carbon::parse($this->clock_in)->format('H:i') : null;
    }

    public function getClockOutFormattedAttribute(): ?string
    {
        return $this->clock_out ? Carbon::parse($this->clock_out)->format('H:i') : null;
    }

    public function getWorkDurationFormattedAttribute(): ?string
    {
        if (!$this->work_duration_minutes) return null;
        
        $hours = floor($this->work_duration_minutes / 60);
        $minutes = $this->work_duration_minutes % 60;
        
        return sprintf('%d jam %d menit', $hours, $minutes);
    }

    public function getLateFormattedAttribute(): ?string
    {
        if (!$this->late_minutes) return null;
        
        $hours = floor($this->late_minutes / 60);
        $minutes = $this->late_minutes % 60;
        
        if ($hours > 0) {
            return sprintf('%d jam %d menit', $hours, $minutes);
        }
        return sprintf('%d menit', $minutes);
    }

    public function getOvertimeFormattedAttribute(): ?string
    {
        if (!$this->overtime_minutes) return null;
        
        $hours = floor($this->overtime_minutes / 60);
        $minutes = $this->overtime_minutes % 60;
        
        return sprintf('%d jam %d menit', $hours, $minutes);
    }

    /**
     * Calculate work duration
     */
    public function calculateWorkDuration(): ?int
    {
        if (!$this->clock_in || !$this->clock_out) return null;
        
        $clockIn = Carbon::parse($this->clock_in);
        $clockOut = Carbon::parse($this->clock_out);
        
        // Subtract break time if exists
        $breakMinutes = 0;
        if ($this->break_start && $this->break_end) {
            $breakStart = Carbon::parse($this->break_start);
            $breakEnd = Carbon::parse($this->break_end);
            $breakMinutes = $breakEnd->diffInMinutes($breakStart);
        }
        
        return $clockOut->diffInMinutes($clockIn) - $breakMinutes;
    }

    /**
     * Calculate late minutes
     */
    public function calculateLateMinutes(): int
    {
        if (!$this->clock_in || !$this->scheduled_clock_in) return 0;
        
        $clockIn = Carbon::parse($this->clock_in);
        $scheduledIn = Carbon::parse($this->scheduled_clock_in);
        
        // Get tolerance from work schedule
        $tolerance = $this->workSchedule?->late_tolerance ?? 0;
        $scheduledWithTolerance = $scheduledIn->copy()->addMinutes($tolerance);
        
        if ($clockIn->greaterThan($scheduledWithTolerance)) {
            // Use absolute value to ensure positive result
            return (int) abs($clockIn->diffInMinutes($scheduledIn));
        }
        
        return 0;
    }

    /**
     * Calculate early leave minutes
     */
    public function calculateEarlyLeaveMinutes(): int
    {
        if (!$this->clock_out || !$this->scheduled_clock_out) return 0;
        
        $clockOut = Carbon::parse($this->clock_out);
        $scheduledOut = Carbon::parse($this->scheduled_clock_out);
        
        // Get tolerance from work schedule
        $tolerance = $this->workSchedule?->early_leave_tolerance ?? 0;
        $scheduledWithTolerance = $scheduledOut->copy()->subMinutes($tolerance);
        
        if ($clockOut->lessThan($scheduledWithTolerance)) {
            // Use absolute value to ensure positive result
            return (int) abs($scheduledOut->diffInMinutes($clockOut));
        }
        
        return 0;
    }

    /**
     * Determine status based on times
     */
    public function determineStatus(): string
    {
        if (!$this->clock_in && !$this->clock_out) {
            return 'absent';
        }
        
        $isLate = $this->late_minutes > 0;
        $isEarlyLeave = $this->early_leave_minutes > 0;
        
        if ($isLate && $isEarlyLeave) {
            return 'late_early_leave';
        } elseif ($isLate) {
            return 'late';
        } elseif ($isEarlyLeave) {
            return 'early_leave';
        }
        
        return 'present';
    }

    /**
     * Check if location is valid (within radius of office)
     */
    public static function isLocationValid(float $lat, float $lng, float $officeLat, float $officeLng, float $radiusMeters = 100): bool
    {
        $earthRadius = 6371000; // meters
        
        $latDiff = deg2rad($lat - $officeLat);
        $lngDiff = deg2rad($lng - $officeLng);
        
        $a = sin($latDiff / 2) * sin($latDiff / 2) +
            cos(deg2rad($officeLat)) * cos(deg2rad($lat)) *
            sin($lngDiff / 2) * sin($lngDiff / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $earthRadius * $c;
        
        return $distance <= $radiusMeters;
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attendance) {
            if (auth()->check()) {
                $attendance->created_by = auth()->id();
            }
        });

        static::updating(function ($attendance) {
            if (auth()->check()) {
                $attendance->updated_by = auth()->id();
            }
        });
    }
}
