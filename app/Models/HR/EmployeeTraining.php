<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class EmployeeTraining extends Model
{
    protected $fillable = [
        'employee_id',
        'training_id',
        'status',
        'start_date',
        'end_date',
        'completion_date',
        'score',
        'grade',
        'certificate_number',
        'certificate_path',
        'certificate_expiry',
        'feedback',
        'rating',
        'notes',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'completion_date' => 'date',
        'certificate_expiry' => 'date',
        'score' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    /**
     * Status options
     */
    public const STATUSES = [
        'registered' => 'Terdaftar',
        'in_progress' => 'Sedang Berjalan',
        'completed' => 'Selesai',
        'failed' => 'Tidak Lulus',
        'cancelled' => 'Dibatalkan',
    ];

    /**
     * Get employee
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get training
     */
    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }

    /**
     * Get approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * Get certificate URL
     */
    public function getCertificateUrlAttribute(): ?string
    {
        if (!$this->certificate_path) {
            return null;
        }
        return Storage::disk('public')->url($this->certificate_path);
    }

    /**
     * Check if certificate expired
     */
    public function getIsCertificateExpiredAttribute(): bool
    {
        if (!$this->certificate_expiry) {
            return false;
        }
        return $this->certificate_expiry->isPast();
    }

    /**
     * Check if certificate expiring soon (30 days)
     */
    public function getIsCertificateExpiringSoonAttribute(): bool
    {
        if (!$this->certificate_expiry) {
            return false;
        }
        return $this->certificate_expiry->isFuture() && $this->certificate_expiry->diffInDays(now()) <= 30;
    }

    /**
     * Scope completed
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope in progress
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope registered
     */
    public function scopeRegistered($query)
    {
        return $query->where('status', 'registered');
    }
}
