<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KpiCategory extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'weight',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'weight' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function templates(): HasMany
    {
        return $this->hasMany(KpiTemplate::class, 'category_id');
    }

    public function reviewItems(): HasMany
    {
        return $this->hasMany(PerformanceReviewItem::class, 'category_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
