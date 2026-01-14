<?php

namespace App\Models\HR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalibrationSession extends Model
{
    protected $fillable = [
        'period_id',
        'name',
        'description',
        'status',
        'scheduled_date',
        'facilitator_id',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
    ];

    public const STATUSES = [
        'draft' => 'Draft',
        'in_progress' => 'Sedang Berjalan',
        'completed' => 'Selesai',
    ];

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    // Relationships
    public function period(): BelongsTo
    {
        return $this->belongsTo(PerformancePeriod::class, 'period_id');
    }

    public function facilitator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'facilitator_id');
    }

    public function calibrationReviews(): HasMany
    {
        return $this->hasMany(CalibrationReview::class, 'session_id');
    }

    // Helper methods
    public function getProgress(): array
    {
        $total = $this->calibrationReviews()->count();
        $calibrated = $this->calibrationReviews()->whereNotNull('calibrated_score')->count();
        $percentage = $total > 0 ? round(($calibrated / $total) * 100) : 0;

        return [
            'total' => $total,
            'calibrated' => $calibrated,
            'percentage' => $percentage,
        ];
    }

    public function getGradeDistribution(): array
    {
        $distribution = [];
        $reviews = $this->calibrationReviews()->get();

        // Original distribution
        $originalDist = $reviews->groupBy('original_grade')->map->count();
        // Calibrated distribution
        $calibratedDist = $reviews->whereNotNull('calibrated_grade')->groupBy('calibrated_grade')->map->count();

        foreach (PerformanceReview::GRADES as $grade => $label) {
            $distribution[$grade] = [
                'label' => $label,
                'original' => $originalDist[$grade] ?? 0,
                'calibrated' => $calibratedDist[$grade] ?? 0,
            ];
        }

        return $distribution;
    }
}
