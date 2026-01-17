<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class EmployeeCredential extends Model
{
    protected $fillable = [
        'employee_id',
        'type',
        'name',
        'number',
        'issued_by',
        'issued_date',
        'expiry_date',
        'document_path',
        'notes',
        'is_verified',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'expiry_date' => 'date',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    /**
     * Credential types
     */
    public const TYPES = [
        'ktp' => 'KTP',
        'npwp' => 'NPWP',
        'bpjs_kesehatan' => 'BPJS Kesehatan',
        'bpjs_ketenagakerjaan' => 'BPJS Ketenagakerjaan',
        'sim_a' => 'SIM A',
        'sim_b' => 'SIM B',
        'sim_c' => 'SIM C',
        'passport' => 'Paspor',
        'bank_account' => 'Rekening Bank',
        'sertifikasi' => 'Sertifikasi Profesi',
        'ijazah' => 'Ijazah',
        'other' => 'Lainnya',
    ];

    /**
     * Get employee
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get verifier
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Get type label
     */
    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    /**
     * Check if expired
     */
    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->isPast();
    }

    /**
     * Check if expiring soon (within 30 days)
     */
    public function getIsExpiringSoonAttribute(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->isFuture() && $this->expiry_date->diffInDays(now()) <= 30;
    }

    /**
     * Get days until expiry
     */
    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (!$this->expiry_date) {
            return null;
        }
        return (int) now()->diffInDays($this->expiry_date, false);
    }

    /**
     * Get document URL
     */
    public function getDocumentUrlAttribute(): ?string
    {
        if (!$this->document_path) {
            return null;
        }
        return Storage::disk('public')->url($this->document_path);
    }

    /**
     * Scope expiring soon
     */
    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereNotNull('expiry_date')
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays($days));
    }

    /**
     * Scope expired
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now());
    }

    /**
     * Scope verified
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope unverified
     */
    public function scopeUnverified($query)
    {
        return $query->where('is_verified', false);
    }
}
