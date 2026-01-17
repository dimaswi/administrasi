<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KpiTemplate extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'code',
        'description',
        'measurement_type',
        'unit',
        'target_min',
        'target_max',
        'weight',
        'is_active',
    ];

    protected $casts = [
        'target_min' => 'decimal:2',
        'target_max' => 'decimal:2',
        'weight' => 'integer',
        'is_active' => 'boolean',
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

    public function getTargetRangeAttribute(): ?string
    {
        if ($this->target_min && $this->target_max) {
            return "{$this->target_min} - {$this->target_max}";
        }
        if ($this->target_min) {
            return "≥ {$this->target_min}";
        }
        if ($this->target_max) {
            return "≤ {$this->target_max}";
        }
        return null;
    }

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(KpiCategory::class, 'category_id');
    }

    public function reviewItems(): HasMany
    {
        return $this->hasMany(PerformanceReviewItem::class, 'template_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
