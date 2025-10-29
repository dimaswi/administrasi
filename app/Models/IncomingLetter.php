<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class IncomingLetter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'incoming_number',
        'original_number',
        'original_date',
        'received_date',
        'sender',
        'subject',
        'category',
        'classification',
        'attachment_count',
        'attachment_description',
        'file_path',
        'organization_unit_id',
        'registered_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'original_date' => 'date',
        'received_date' => 'date',
        'attachment_count' => 'integer',
    ];

    // Relationships
    public function organizationUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationUnit::class, 'organization_unit_id');
    }

    public function registrar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function dispositions(): HasMany
    {
        return $this->hasMany(Disposition::class)->whereNull('parent_disposition_id')->orderBy('created_at', 'desc');
    }

    public function allDispositions(): HasMany
    {
        return $this->hasMany(Disposition::class)->orderBy('created_at', 'desc');
    }

    public function outgoingLetters(): HasMany
    {
        return $this->hasMany(Letter::class, 'incoming_letter_id');
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'incoming_letter_id');
    }

    public function archive(): HasOne
    {
        return $this->hasOne(Archive::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByClassification($query, $classification)
    {
        return $query->where('classification', $classification);
    }

    public function scopeReceivedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('received_date', [$startDate, $endDate]);
    }

    public function scopeAccessibleBy($query, User $user)
    {
        // Admin can see all
        if ($user->role_id === 1) {
            return $query;
        }

        // Regular users can see:
        // 1. Letters from their organization unit
        // 2. Letters they registered
        // 3. Letters they have dispositions for
        return $query->where(function ($q) use ($user) {
            $q->where('organization_unit_id', $user->organization_unit_id)
              ->orWhere('registered_by', $user->id)
              ->orWhereHas('allDispositions', function ($dispQuery) use ($user) {
                  $dispQuery->where('to_user_id', $user->id);
              });
        });
    }

    // Helper methods
    public function isNew(): bool
    {
        return $this->status === 'new';
    }

    public function isDisposed(): bool
    {
        return in_array($this->status, ['disposed', 'in_progress']);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function getDispositionProgress(): array
    {
        $total = $this->allDispositions()->count();
        $pending = $this->allDispositions()->where('status', 'pending')->count();
        $completed = $this->allDispositions()->where('status', 'completed')->count();

        return [
            'total' => $total,
            'pending' => $pending,
            'completed' => $completed,
            'percentage' => $total > 0 ? ($completed / $total) * 100 : 0,
        ];
    }

    public function updateStatus(): void
    {
        $progress = $this->getDispositionProgress();

        if ($progress['total'] === 0) {
            $this->update(['status' => 'new']);
        } elseif ($progress['completed'] === $progress['total']) {
            $this->update(['status' => 'completed']);
        } elseif ($progress['pending'] === $progress['total']) {
            $this->update(['status' => 'disposed']);
        } else {
            $this->update(['status' => 'in_progress']);
        }
    }
}
