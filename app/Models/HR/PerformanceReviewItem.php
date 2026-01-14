<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReviewItem extends Model
{
    protected $fillable = [
        'review_id',
        'template_id',
        'category_id',
        'name',
        'description',
        'measurement_type',
        'unit',
        'target',
        'actual',
        'weight',
        'self_score',
        'manager_score',
        'final_score',
        'self_comment',
        'manager_comment',
    ];

    protected $casts = [
        'target' => 'decimal:2',
        'actual' => 'decimal:2',
        'weight' => 'integer',
        'self_score' => 'decimal:2',
        'manager_score' => 'decimal:2',
        'final_score' => 'decimal:2',
    ];

    public const MEASUREMENT_TYPES = [
        'numeric' => 'Angka',
        'percentage' => 'Persentase',
        'rating' => 'Rating (1-5)',
        'yes_no' => 'Ya/Tidak',
    ];

    // Accessors
    public function getMeasurementTypeLabelAttribute(): string
    {
        return self::MEASUREMENT_TYPES[$this->measurement_type] ?? $this->measurement_type;
    }

    public function getAchievementPercentageAttribute(): ?float
    {
        if ($this->target && $this->actual) {
            return round(($this->actual / $this->target) * 100, 2);
        }
        return null;
    }

    // Relationships
    public function review(): BelongsTo
    {
        return $this->belongsTo(PerformanceReview::class, 'review_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(KpiTemplate::class, 'template_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(KpiCategory::class, 'category_id');
    }
}
