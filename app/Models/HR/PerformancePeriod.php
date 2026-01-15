<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerformancePeriod extends Model
{
    protected $fillable = [
        'name',
        'type',
        'start_date',
        'end_date',
        'status',
        'description',
        'is_current',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    public const TYPES = [
        'monthly' => 'Bulanan',
        'quarterly' => 'Triwulan',
        'semester' => 'Semester',
        'yearly' => 'Tahunan',
    ];

    public const STATUSES = [
        'draft' => 'Draft',
        'active' => 'Aktif',
        'closed' => 'Selesai',
    ];

    // Accessors
    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    // Relationships
    public function reviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class, 'period_id');
    }

    public function goals(): HasMany
    {
        return $this->hasMany(EmployeeGoal::class, 'period_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }
}
