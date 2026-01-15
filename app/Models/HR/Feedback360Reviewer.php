<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Feedback360Reviewer extends Model
{
    protected $fillable = [
        'participant_id',
        'reviewer_employee_id',
        'relationship',
        'status',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public const STATUSES = [
        'pending' => 'Menunggu',
        'in_progress' => 'Sedang Diisi',
        'completed' => 'Selesai',
        'declined' => 'Ditolak',
    ];

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getRelationshipLabelAttribute(): string
    {
        return Feedback360Session::RELATIONSHIPS[$this->relationship] ?? $this->relationship;
    }

    // Relationships
    public function participant(): BelongsTo
    {
        return $this->belongsTo(Feedback360Participant::class, 'participant_id');
    }

    public function reviewerEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reviewer_employee_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Feedback360Response::class, 'reviewer_id');
    }

    public function comment(): HasOne
    {
        return $this->hasOne(Feedback360Comment::class, 'reviewer_id');
    }

    // Helper methods
    public function markCompleted(): void
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();

        // Update participant average score
        $this->participant->calculateAverageScore();
    }

    public function getAverageScore(): ?float
    {
        return $this->responses()->whereNotNull('score')->avg('score');
    }
}
