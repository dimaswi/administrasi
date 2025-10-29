<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Letter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'template_id',
        'incoming_letter_id',
        'letter_number',
        'subject',
        'letter_date',
        'recipient',
        'data',
        'rendered_html',
        'pdf_path',
        'status',
        'notes',
        'created_by',
        'updated_by',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'data' => 'array',
        'letter_date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    // Relationships
    public function template(): BelongsTo
    {
        return $this->belongsTo(LetterTemplate::class, 'template_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(LetterApproval::class)->orderBy('signature_index');
    }

    public function certificate(): HasOne
    {
        return $this->hasOne(LetterCertificate::class);
    }

    public function archive(): HasOne
    {
        return $this->hasOne(Archive::class);
    }

    public function incomingLetter(): BelongsTo
    {
        return $this->belongsTo(IncomingLetter::class, 'incoming_letter_id');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending_approval', 'partially_signed']);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'fully_signed');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Helper methods
    public function isPending(): bool
    {
        return in_array($this->status, ['pending_approval', 'partially_signed']);
    }

    public function isFullySigned(): bool
    {
        return $this->status === 'fully_signed';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function canBeApproved(): bool
    {
        return $this->isPending();
    }

    public function getApprovalProgress(): array
    {
        $total = $this->approvals()->count();
        $approved = $this->approvals()->where('status', 'approved')->count();
        $rejected = $this->approvals()->where('status', 'rejected')->count();

        return [
            'total' => $total,
            'approved' => $approved,
            'rejected' => $rejected,
            'pending' => $total - $approved - $rejected,
            'percentage' => $total > 0 ? ($approved / $total) * 100 : 0,
        ];
    }

    public function updateApprovalStatus(): void
    {
        $progress = $this->getApprovalProgress();

        if ($progress['rejected'] > 0) {
            // Ada yang reject, status jadi rejected
            $this->update(['status' => 'rejected']);
        } elseif ($progress['approved'] === $progress['total']) {
            // Semua sudah approve, status jadi fully_signed
            $this->update(['status' => 'fully_signed']);
        } elseif ($progress['approved'] > 0) {
            // Ada yang approve tapi belum semua, status jadi partially_signed
            $this->update(['status' => 'partially_signed']);
        } else {
            // Tidak ada yang approve (semua pending atau di-revoke), status jadi pending_approval
            $this->update(['status' => 'pending_approval']);
        }
    }

    /**
     * Check if user can access this letter
     * Admin (role_id = 1) can access all letters
     * Regular users can only access letters they created or are approvers for
     */
    public function canUserAccess(User $user): bool
    {
        // Admin can access all letters
        if ($user->role_id === 1) {
            return true;
        }

        // Creator can access
        if ($this->created_by === $user->id) {
            return true;
        }

        // Approver can access
        $isApprover = $this->approvals()->where('user_id', $user->id)->exists();
        if ($isApprover) {
            return true;
        }

        return false;
    }

    /**
     * Scope to filter letters by user access
     * Admin sees all, regular users see only their letters or letters they're approvers for (excluding drafts)
     */
    public function scopeAccessibleBy($query, User $user)
    {
        // Admin can see all letters
        if ($user->role_id === 1) {
            return $query;
        }

        // Regular users can only see:
        // 1. Letters they created (all statuses)
        // 2. Letters they are approvers for (only if NOT draft)
        return $query->where(function ($q) use ($user) {
            $q->where('created_by', $user->id)
              ->orWhere(function ($subQuery) use ($user) {
                  $subQuery->whereHas('approvals', function ($approvalQuery) use ($user) {
                      $approvalQuery->where('user_id', $user->id);
                  })
                  ->where('status', '!=', 'draft'); // Exclude draft letters for approvers
              });
        });
    }
}
