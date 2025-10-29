<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Disposition extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'incoming_letter_id',
        'parent_disposition_id',
        'from_user_id',
        'to_user_id',
        'instruction',
        'notes',
        'priority',
        'deadline',
        'status',
        'read_at',
        'completed_at',
    ];

    protected $casts = [
        'deadline' => 'date',
        'read_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function incomingLetter(): BelongsTo
    {
        return $this->belongsTo(IncomingLetter::class, 'incoming_letter_id');
    }

    public function parentDisposition(): BelongsTo
    {
        return $this->belongsTo(Disposition::class, 'parent_disposition_id');
    }

    public function childDispositions(): HasMany
    {
        return $this->hasMany(Disposition::class, 'parent_disposition_id')->orderBy('created_at', 'desc');
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(DispositionFollowUp::class)->orderBy('follow_up_date', 'desc');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('to_user_id', $userId);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', 'completed')
                     ->whereNotNull('deadline')
                     ->whereDate('deadline', '<', now());
    }

    public function scopeUpcoming($query, $days = 3)
    {
        return $query->where('status', '!=', 'completed')
                     ->whereNotNull('deadline')
                     ->whereDate('deadline', '>=', now())
                     ->whereDate('deadline', '<=', now()->addDays($days));
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRead(): bool
    {
        return !is_null($this->read_at);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isOverdue(): bool
    {
        return $this->deadline 
               && !$this->isCompleted() 
               && $this->deadline->isPast();
    }

    public function markAsRead(): void
    {
        if (!$this->isRead()) {
            $this->update([
                'status' => 'read',
                'read_at' => now(),
            ]);
        }
    }

    public function markAsInProgress(): void
    {
        $this->update(['status' => 'in_progress']);
    }

    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Update parent letter status
        $this->incomingLetter->updateStatus();
    }

    public function canUserAccess(User $user): bool
    {
        // Admin can access all
        if ($user->role_id === 1) {
            return true;
        }

        // User is sender or receiver
        if ($this->from_user_id === $user->id || $this->to_user_id === $user->id) {
            return true;
        }

        // User is in the disposition chain
        $parent = $this->parentDisposition;
        while ($parent) {
            if ($parent->from_user_id === $user->id || $parent->to_user_id === $user->id) {
                return true;
            }
            $parent = $parent->parentDisposition;
        }

        return false;
    }
}
