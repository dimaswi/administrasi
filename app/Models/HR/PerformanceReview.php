<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerformanceReview extends Model
{
    protected $fillable = [
        'employee_id',
        'period_id',
        'reviewer_id',
        'status',
        'self_score',
        'manager_score',
        'final_score',
        'final_grade',
        'employee_notes',
        'manager_notes',
        'strengths',
        'improvements',
        'development_plan',
        'self_reviewed_at',
        'manager_reviewed_at',
        'completed_at',
    ];

    protected $casts = [
        'self_score' => 'decimal:2',
        'manager_score' => 'decimal:2',
        'final_score' => 'decimal:2',
        'self_reviewed_at' => 'datetime',
        'manager_reviewed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public const STATUSES = [
        'draft' => 'Draft',
        'self_review' => 'Self Review',
        'manager_review' => 'Review Atasan',
        'calibration' => 'Kalibrasi',
        'completed' => 'Selesai',
    ];

    public const GRADES = [
        'A' => 'Sangat Baik (A)',
        'B' => 'Baik (B)',
        'C' => 'Cukup (C)',
        'D' => 'Kurang (D)',
        'E' => 'Sangat Kurang (E)',
    ];

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getGradeLabelAttribute(): ?string
    {
        return $this->final_grade ? (self::GRADES[$this->final_grade] ?? $this->final_grade) : null;
    }

    public function getCanSelfReviewAttribute(): bool
    {
        return in_array($this->status, ['draft', 'self_review']);
    }

    public function getCanManagerReviewAttribute(): bool
    {
        return in_array($this->status, ['self_review', 'manager_review']);
    }

    // Relationships
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(PerformancePeriod::class, 'period_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PerformanceReviewItem::class, 'review_id');
    }

    public function goals(): HasMany
    {
        return $this->hasMany(EmployeeGoal::class, 'review_id');
    }

    // Methods
    public function calculateSelfScore(): float
    {
        $items = $this->items()->whereNotNull('self_score')->get();
        if ($items->isEmpty()) {
            return 0;
        }

        $totalWeight = $items->sum('weight');
        if ($totalWeight == 0) {
            return 0;
        }

        $weightedSum = $items->sum(fn($item) => $item->self_score * $item->weight);
        return round($weightedSum / $totalWeight, 2);
    }

    public function calculateManagerScore(): float
    {
        $items = $this->items()->whereNotNull('manager_score')->get();
        if ($items->isEmpty()) {
            return 0;
        }

        $totalWeight = $items->sum('weight');
        if ($totalWeight == 0) {
            return 0;
        }

        $weightedSum = $items->sum(fn($item) => $item->manager_score * $item->weight);
        return round($weightedSum / $totalWeight, 2);
    }

    public function determineGrade(float $score): string
    {
        if ($score >= 90) return 'A';
        if ($score >= 80) return 'B';
        if ($score >= 70) return 'C';
        if ($score >= 60) return 'D';
        return 'E';
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('status', ['self_review', 'manager_review', 'calibration']);
    }
}
