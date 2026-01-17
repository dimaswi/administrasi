<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Leave extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'total_days',
        'is_half_day',
        'half_day_type',
        'reason',
        'attachment',
        'emergency_contact',
        'emergency_phone',
        'delegation_to',
        'delegation_employee_id',
        'delegation_approved_at',
        'delegation_notes',
        'supervisor_id',
        'supervisor_approved_at',
        'supervisor_notes',
        'director_id',
        'director_signed_at',
        'response_letter_number',
        'response_letter_generated_at',
        'status',
        'approved_by',
        'approved_at',
        'approval_notes',
        'approved_by_level_2',
        'approved_at_level_2',
        'approval_notes_level_2',
        'created_by',
        'updated_by',
        'submitted_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_days' => 'integer',
        'is_half_day' => 'boolean',
        'approved_at' => 'datetime',
        'approved_at_level_2' => 'datetime',
        'delegation_approved_at' => 'datetime',
        'supervisor_approved_at' => 'datetime',
        'director_signed_at' => 'datetime',
        'response_letter_generated_at' => 'datetime',
        'submitted_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * Status labels
     */
    public const STATUS_LABELS = [
        'draft' => 'Draft',
        'pending' => 'Menunggu Persetujuan',
        'pending_delegation' => 'Menunggu Konfirmasi Delegasi',
        'pending_supervisor' => 'Menunggu Persetujuan Atasan',
        'pending_hr' => 'Menunggu Proses HR',
        'pending_director_sign' => 'Menunggu Tanda Tangan Direktur',
        'approved' => 'Disetujui',
        'rejected' => 'Ditolak',
        'cancelled' => 'Dibatalkan',
    ];

    /**
     * Half day type labels
     */
    public const HALF_DAY_TYPES = [
        'morning' => 'Pagi',
        'afternoon' => 'Siang',
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

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approverLevel2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_level_2');
    }

    public function delegationEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'delegation_employee_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_id');
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
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePendingDelegation($query)
    {
        return $query->where('status', 'pending_delegation');
    }

    public function scopePendingSupervisor($query)
    {
        return $query->where('status', 'pending_supervisor');
    }

    public function scopePendingHr($query)
    {
        return $query->where('status', 'pending_hr');
    }

    public function scopePendingDirectorSign($query)
    {
        return $query->where('status', 'pending_director_sign');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeInDateRange($query, string $startDate, string $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }

    public function scopeOverlapping($query, string $startDate, string $endDate, ?int $excludeId = null)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        })
        ->whereIn('status', ['pending', 'approved'])
        ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId));
    }

    public function scopeForYear($query, int $year)
    {
        return $query->whereYear('start_date', $year);
    }

    /**
     * Accessors
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function getDateRangeAttribute(): string
    {
        if ($this->start_date->eq($this->end_date)) {
            return $this->start_date->format('d M Y');
        }
        return $this->start_date->format('d M') . ' - ' . $this->end_date->format('d M Y');
    }

    public function getHalfDayLabelAttribute(): ?string
    {
        return $this->half_day_type ? self::HALF_DAY_TYPES[$this->half_day_type] : null;
    }

    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'pending';
    }

    public function getIsApprovedAttribute(): bool
    {
        return $this->status === 'approved';
    }

    public function getIsRejectedAttribute(): bool
    {
        return $this->status === 'rejected';
    }

    // public function getCanCancelAttribute(): bool
    // {
    //     return in_array($this->status, ['draft', 'pending']);
    // }

    public function getCanEditAttribute(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Calculate total days between dates
     */
    public static function calculateDays(string $startDate, string $endDate, bool $isHalfDay = false): float
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        $days = 0;
        $current = $start->copy();
        
        while ($current->lte($end)) {
            // Skip weekends (Saturday = 6, Sunday = 0)
            if (!in_array($current->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
                $days++;
            }
            $current->addDay();
        }
        
        // If half day, divide by 2
        if ($isHalfDay) {
            $days = $days > 0 ? 0.5 : 0;
        }
        
        return $days;
    }

    /**
     * Submit leave request with hierarchical workflow
     */
    public function submit(): bool
    {
        if ($this->status !== 'draft') {
            return false;
        }

        // Start with delegation approval if delegation is set
        if ($this->delegation_employee_id) {
            $this->status = 'pending_delegation';
        } else {
            $this->status = 'pending_supervisor';
        }
        
        $this->submitted_at = now();
        return $this->save();
    }

    /**
     * Approve by delegation (rekan kerja)
     */
    public function approveDelegation(int $employeeId, ?string $notes = null): bool
    {
        if ($this->status !== 'pending_delegation') {
            return false;
        }

        $this->delegation_approved_at = now();
        $this->delegation_notes = $notes;
        $this->status = 'pending_supervisor';
        
        return $this->save();
    }

    /**
     * Approve by supervisor (kepala unit)
     */
    public function approveSupervisor(int $userId, ?string $notes = null): bool
    {
        if ($this->status !== 'pending_supervisor') {
            return false;
        }

        $this->supervisor_id = $userId;
        $this->supervisor_approved_at = now();
        $this->supervisor_notes = $notes;
        $this->status = 'pending_hr';
        
        return $this->save();
    }

    /**
     * Approve by HR - Final approval, generates Surat Cuti
     * Director signing is just for notification/report, not blocking
     */
    public function approveHr(int $approverId, ?string $notes = null): bool
    {
        if ($this->status !== 'pending_hr') {
            return false;
        }

        $this->approved_by = $approverId;
        $this->approved_at = now();
        $this->approval_notes = $notes;
        $this->status = 'approved'; // Directly approved, director sign is just notification
        
        return $this->save();
    }

    /**
     * Sign by director (notification/report - adds signature to Surat Balasan)
     * This doesn't change approval status, just records director signature
     */
    public function signDirector(int $directorId, ?string $letterNumber = null): bool
    {
        // Director can sign approved leaves (not just pending_director_sign)
        if (!in_array($this->status, ['approved', 'pending_director_sign'])) {
            return false;
        }

        $this->director_id = $directorId;
        $this->director_signed_at = now();
        $this->response_letter_number = $letterNumber;
        $this->response_letter_generated_at = now();
        
        // If it was pending_director_sign, also mark as approved
        if ($this->status === 'pending_director_sign') {
            $this->status = 'approved';
        }
        
        return $this->save();
    }

    /**
     * Approve leave request (legacy method for backward compatibility)
     */
    public function approve(int $approverId, ?string $notes = null): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->status = 'approved';
        $this->approved_by = $approverId;
        $this->approved_at = now();
        $this->approval_notes = $notes;
        
        return $this->save();
    }

    /**
     * Reject leave request (can be done at any pending stage)
     */
    public function reject(int $approverId, ?string $notes = null): bool
    {
        $allowedStatuses = ['pending', 'pending_delegation', 'pending_supervisor', 'pending_hr', 'pending_director_sign'];
        if (!in_array($this->status, $allowedStatuses)) {
            return false;
        }

        $this->status = 'rejected';
        $this->approved_by = $approverId;
        $this->approved_at = now();
        $this->approval_notes = $notes;
        
        return $this->save();
    }

    /**
     * Cancel leave request
     */
    public function cancel(?string $reason = null): bool
    {
        if (!$this->can_cancel) {
            return false;
        }

        $this->status = 'cancelled';
        $this->cancelled_at = now();
        $this->cancellation_reason = $reason;
        
        return $this->save();
    }

    /**
     * Get the supervisor for this leave request based on organization hierarchy
     */
    public function getSupervisorUser(): ?User
    {
        $employee = $this->employee;
        if (!$employee || !$employee->organizationUnit) {
            return null;
        }

        $orgUnit = $employee->organizationUnit;
        
        // Check if employee is the head of their unit (use int cast for comparison)
        if ($orgUnit->head_id && (int) $employee->user_id === (int) $orgUnit->head_id) {
            // Employee is head, get parent unit's head
            $parentUnit = $orgUnit->parent;
            return $parentUnit?->head;
        }

        // Regular employee, get their unit's head
        return $orgUnit->head;
    }

    /**
     * Get the director (level 1 head) for final signature
     */
    public function getDirectorUser(): ?User
    {
        $employee = $this->employee;
        if (!$employee || !$employee->organizationUnit) {
            return null;
        }

        $orgUnit = $employee->organizationUnit;
        
        // Traverse up to find level 1 organization
        while ($orgUnit && $orgUnit->level > 1) {
            $orgUnit = $orgUnit->parent;
        }

        return $orgUnit?->head;
    }

    /**
     * Check if user can approve as delegation
     */
    public function canApproveAsDelegation(int $employeeId): bool
    {
        return $this->status === 'pending_delegation' 
            && (int) $this->delegation_employee_id === $employeeId;
    }

    /**
     * Check if user can approve as supervisor
     */
    public function canApproveAsSupervisor(int $userId): bool
    {
        if ($this->status !== 'pending_supervisor') {
            return false;
        }

        $supervisor = $this->getSupervisorUser();
        return $supervisor && $supervisor->id === $userId;
    }

    /**
     * Check if user can sign as director
     */
    public function canSignAsDirector(int $userId): bool
    {
        if ($this->status !== 'pending_director_sign') {
            return false;
        }

        $director = $this->getDirectorUser();
        return $director && $director->id === $userId;
    }

    /**
     * Get can cancel attribute - updated for new statuses
     */
    public function getCanCancelAttribute(): bool
    {
        return in_array($this->status, ['draft', 'pending', 'pending_delegation', 'pending_supervisor']);
    }
}
