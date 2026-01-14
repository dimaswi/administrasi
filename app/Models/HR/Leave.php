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
        'submitted_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * Status labels
     */
    public const STATUS_LABELS = [
        'draft' => 'Draft',
        'pending' => 'Menunggu Persetujuan',
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

    public function getCanCancelAttribute(): bool
    {
        return in_array($this->status, ['draft', 'pending']);
    }

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
     * Submit leave request
     */
    public function submit(): bool
    {
        if ($this->status !== 'draft') {
            return false;
        }

        $this->status = 'pending';
        $this->submitted_at = now();
        return $this->save();
    }

    /**
     * Approve leave request
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
     * Reject leave request
     */
    public function reject(int $approverId, ?string $notes = null): bool
    {
        if ($this->status !== 'pending') {
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
}
