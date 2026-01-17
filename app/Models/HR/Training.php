<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Training extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'category',
        'provider',
        'duration_hours',
        'cost',
        'location',
        'is_mandatory',
        'is_active',
        'objectives',
        'prerequisites',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Training types
     */
    public const TYPES = [
        'internal' => 'Internal Training',
        'external' => 'External Training',
        'online' => 'Online Course',
        'certification' => 'Sertifikasi',
        'workshop' => 'Workshop',
        'seminar' => 'Seminar',
    ];

    /**
     * Training categories
     */
    public const CATEGORIES = [
        'technical' => 'Technical Skill',
        'soft_skill' => 'Soft Skill',
        'leadership' => 'Leadership',
        'compliance' => 'Compliance',
        'safety' => 'Safety & Health',
        'product' => 'Product Knowledge',
        'other' => 'Lainnya',
    ];

    /**
     * Get employee trainings
     */
    public function employeeTrainings(): HasMany
    {
        return $this->hasMany(EmployeeTraining::class);
    }

    /**
     * Get type label
     */
    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    /**
     * Get category label
     */
    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    /**
     * Format duration
     */
    public function getFormattedDurationAttribute(): string
    {
        if (!$this->duration_hours) {
            return '-';
        }
        
        if ($this->duration_hours < 8) {
            return $this->duration_hours . ' jam';
        }
        
        $days = floor($this->duration_hours / 8);
        $hours = $this->duration_hours % 8;
        
        if ($hours > 0) {
            return "{$days} hari {$hours} jam";
        }
        
        return "{$days} hari";
    }

    /**
     * Scope active
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope mandatory
     */
    public function scopeMandatory($query)
    {
        return $query->where('is_mandatory', true);
    }
}
