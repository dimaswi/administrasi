<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLeaveBalance extends Model
{
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'year',
        'initial_balance',
        'carry_over',
        'adjustment',
        'used',
        'pending',
    ];

    protected $casts = [
        'year' => 'integer',
        'initial_balance' => 'decimal:1',
        'carry_over' => 'decimal:1',
        'adjustment' => 'decimal:1',
        'used' => 'decimal:1',
        'pending' => 'decimal:1',
    ];

    /**
     * Relationships
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * Accessors
     */
    public function getTotalBalanceAttribute(): float
    {
        return $this->initial_balance + $this->carry_over + $this->adjustment;
    }

    public function getAvailableBalanceAttribute(): float
    {
        return $this->total_balance - $this->used - $this->pending;
    }

    public function getRemainingBalanceAttribute(): float
    {
        return $this->total_balance - $this->used;
    }

    /**
     * Scopes
     */
    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForLeaveType($query, int $leaveTypeId)
    {
        return $query->where('leave_type_id', $leaveTypeId);
    }

    /**
     * Get or create balance for employee and leave type
     */
    public static function getOrCreate(int $employeeId, int $leaveTypeId, int $year): self
    {
        $balance = self::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->where('year', $year)
            ->first();

        if (!$balance) {
            $leaveType = LeaveType::find($leaveTypeId);
            $balance = self::create([
                'employee_id' => $employeeId,
                'leave_type_id' => $leaveTypeId,
                'year' => $year,
                'initial_balance' => $leaveType?->default_quota ?? 0,
                'carry_over' => 0,
                'adjustment' => 0,
                'used' => 0,
                'pending' => 0,
            ]);
        }

        return $balance;
    }

    /**
     * Add pending days
     */
    public function addPending(float $days): bool
    {
        $this->pending += $days;
        return $this->save();
    }

    /**
     * Remove pending days
     */
    public function removePending(float $days): bool
    {
        $this->pending = max(0, $this->pending - $days);
        return $this->save();
    }

    /**
     * Use days (move from pending to used)
     */
    public function useDays(float $days): bool
    {
        $this->pending = max(0, $this->pending - $days);
        $this->used += $days;
        return $this->save();
    }

    /**
     * Restore days (return used days)
     */
    public function restoreDays(float $days): bool
    {
        $this->used = max(0, $this->used - $days);
        return $this->save();
    }

    /**
     * Adjust balance
     */
    public function adjust(float $days, string $reason = null): bool
    {
        $this->adjustment += $days;
        return $this->save();
    }
}
