<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarlyLeaveRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id',
        'attendance_id',
        'date',
        'requested_leave_time',
        'scheduled_leave_time',
        'reason',
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
        'auto_checkout',
    ];

    protected $casts = [
        'date' => 'date',
        'requested_leave_time' => 'datetime:H:i',
        'scheduled_leave_time' => 'datetime:H:i',
        'approved_at' => 'datetime',
        'delegation_approved_at' => 'datetime',
        'supervisor_approved_at' => 'datetime',
        'director_signed_at' => 'datetime',
        'response_letter_generated_at' => 'datetime',
        'auto_checkout' => 'boolean',
    ];

    protected $appends = ['status_label'];

    /**
     * Status labels
     */
    public const STATUS_LABELS = [
        'pending' => 'Menunggu Persetujuan',
        'pending_delegation' => 'Menunggu Konfirmasi Delegasi',
        'pending_supervisor' => 'Menunggu Persetujuan Atasan',
        'pending_hr' => 'Menunggu Proses HR',
        'pending_director_sign' => 'Menunggu Tanda Tangan Direktur',
        'approved' => 'Disetujui',
        'rejected' => 'Ditolak',
    ];

    /**
     * Relationships
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
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

    public function scopeForToday($query)
    {
        return $query->where('date', now()->toDateString());
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Helpers
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPendingDelegation(): bool
    {
        return $this->status === 'pending_delegation';
    }

    public function isPendingSupervisor(): bool
    {
        return $this->status === 'pending_supervisor';
    }

    public function isPendingHr(): bool
    {
        return $this->status === 'pending_hr';
    }

    public function isPendingDirectorSign(): bool
    {
        return $this->status === 'pending_director_sign';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    /**
     * Calculate early leave minutes
     */
    public function getEarlyLeaveMinutesAttribute(): int
    {
        if (!$this->scheduled_leave_time || !$this->requested_leave_time) {
            return 0;
        }
        
        $scheduled = \Carbon\Carbon::parse($this->scheduled_leave_time);
        $requested = \Carbon\Carbon::parse($this->requested_leave_time);
        
        if ($requested >= $scheduled) {
            return 0;
        }
        
        return $scheduled->diffInMinutes($requested);
    }

    /**
     * Submit early leave request with hierarchical workflow
     */
    public function submitHierarchical(): bool
    {
        // Start with delegation approval if delegation is set
        if ($this->delegation_employee_id) {
            $this->status = 'pending_delegation';
        } else {
            $this->status = 'pending_supervisor';
        }
        
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
     * Approve by HR - Final approval (izin langsung disetujui)
     */
    public function approveHr(int $approverId, ?string $notes = null): bool
    {
        if ($this->status !== 'pending_hr') {
            return false;
        }

        $this->approved_by = $approverId;
        $this->approved_at = now();
        $this->approval_notes = $notes;
        $this->status = 'approved';  // HR approval is final
        
        // Auto checkout when HR approves
        $this->performAutoCheckout();
        
        return $this->save();
    }

    /**
     * Sign by director (notification only - for report/document purposes)
     * Can be done after HR approval (status = approved)
     */
    public function signDirector(int $directorId, ?string $letterNumber = null): bool
    {
        // Director can sign on approved status (not just pending_director_sign)
        if ($this->status !== 'approved') {
            return false;
        }

        $this->director_id = $directorId;
        $this->director_signed_at = now();
        $this->response_letter_number = $letterNumber;
        $this->response_letter_generated_at = now();
        // Status remains 'approved' - director sign is just for document purposes
        
        return $this->save();
    }

    /**
     * Approve the request (legacy method - used for backward compatibility)
     */
    public function approve(User $approver, ?string $notes = null): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'approval_notes' => $notes,
        ]);

        $this->performAutoCheckout();
    }

    /**
     * Perform auto checkout if enabled
     */
    protected function performAutoCheckout(): void
    {
        if ($this->auto_checkout && $this->attendance_id) {
            $attendance = $this->attendance;
            if ($attendance && !$attendance->clock_out) {
                $attendance->update([
                    'clock_out' => now(),
                    'notes' => 'Auto checkout - Izin pulang cepat disetujui',
                ]);
                
                $attendance->early_leave_minutes = $attendance->calculateEarlyLeaveMinutes();
                $attendance->work_duration_minutes = $attendance->calculateWorkDuration();
                $attendance->status = 'early_leave';
                $attendance->save();
            }
        }
    }

    /**
     * Reject the request (can be done at any pending stage)
     */
    public function reject(User $approver, ?string $notes = null): void
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'approval_notes' => $notes,
        ]);
    }

    /**
     * Get the supervisor for this request based on organization hierarchy
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
     * Director can sign after HR approval (status = approved) and not yet signed
     */
    public function canSignAsDirector(int $userId): bool
    {
        // Director can sign on approved status (after HR approval)
        if ($this->status !== 'approved' || $this->director_signed_at !== null) {
            return false;
        }

        $director = $this->getDirectorUser();
        return $director && $director->id === $userId;
    }
}
