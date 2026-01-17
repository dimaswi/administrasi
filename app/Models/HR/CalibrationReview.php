<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalibrationReview extends Model
{
    protected $fillable = [
        'session_id',
        'review_id',
        'original_score',
        'calibrated_score',
        'original_grade',
        'calibrated_grade',
        'calibration_notes',
        'calibrated_by',
        'calibrated_at',
    ];

    protected $casts = [
        'original_score' => 'decimal:2',
        'calibrated_score' => 'decimal:2',
        'calibrated_at' => 'datetime',
    ];

    // Relationships
    public function session(): BelongsTo
    {
        return $this->belongsTo(CalibrationSession::class, 'session_id');
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(PerformanceReview::class, 'review_id');
    }

    public function calibratedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calibrated_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CalibrationComment::class, 'calibration_review_id');
    }

    // Accessors
    public function getScoreChangeAttribute(): ?float
    {
        if ($this->original_score === null || $this->calibrated_score === null) {
            return null;
        }
        return $this->calibrated_score - $this->original_score;
    }

    public function getGradeChangedAttribute(): bool
    {
        return $this->original_grade !== $this->calibrated_grade && $this->calibrated_grade !== null;
    }

    // Helper to calculate grade from score
    public static function calculateGrade(float $score): string
    {
        if ($score >= 90) return 'A';
        if ($score >= 80) return 'B';
        if ($score >= 70) return 'C';
        if ($score >= 60) return 'D';
        return 'E';
    }
}
