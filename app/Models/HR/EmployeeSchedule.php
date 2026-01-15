<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSchedule extends Model
{
    protected $table = 'employee_schedules';

    protected $fillable = [
        'employee_id',
        'effective_date',
        'end_date',
        'monday_shift_id',
        'tuesday_shift_id',
        'wednesday_shift_id',
        'thursday_shift_id',
        'friday_shift_id',
        'saturday_shift_id',
        'sunday_shift_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Employee relation
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Shift relations per day
     */
    public function mondayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'monday_shift_id');
    }

    public function tuesdayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'tuesday_shift_id');
    }

    public function wednesdayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'wednesday_shift_id');
    }

    public function thursdayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'thursday_shift_id');
    }

    public function fridayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'friday_shift_id');
    }

    public function saturdayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'saturday_shift_id');
    }

    public function sundayShift(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'sunday_shift_id');
    }

    /**
     * Creator relation
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get shift for specific day
     */
    public function getShiftForDay(string $day): ?WorkSchedule
    {
        $relation = strtolower($day) . 'Shift';
        return $this->$relation;
    }

    /**
     * Get work days (days with assigned shift)
     */
    public function getWorkDaysAttribute(): array
    {
        $days = [];
        $dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        foreach ($dayNames as $day) {
            $shiftId = $this->{$day . '_shift_id'};
            if ($shiftId) {
                $days[] = $day;
            }
        }
        
        return $days;
    }

    /**
     * Get all shifts as array
     */
    public function getShiftsAttribute(): array
    {
        return [
            'monday' => $this->mondayShift,
            'tuesday' => $this->tuesdayShift,
            'wednesday' => $this->wednesdayShift,
            'thursday' => $this->thursdayShift,
            'friday' => $this->fridayShift,
            'saturday' => $this->saturdayShift,
            'sunday' => $this->sundayShift,
        ];
    }

    /**
     * Check if schedule is currently active
     */
    public function getIsActiveAttribute(): bool
    {
        $today = now()->toDateString();
        return $this->effective_date <= $today && 
               ($this->end_date === null || $this->end_date >= $today);
    }

    /**
     * Scope for active schedules
     */
    public function scopeActive($query)
    {
        $today = now()->toDateString();
        return $query->where('effective_date', '<=', $today)
                     ->where(function ($q) use ($today) {
                         $q->whereNull('end_date')
                           ->orWhere('end_date', '>=', $today);
                     });
    }

    /**
     * Scope for specific employee
     */
    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Get current schedule for employee
     */
    public static function getCurrentSchedule(int $employeeId): ?self
    {
        return self::where('employee_id', $employeeId)
            ->where('effective_date', '<=', now())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->orderBy('effective_date', 'desc')
            ->first();
    }
}
