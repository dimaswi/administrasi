<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobCategory extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_medical',
        'requires_str',
        'requires_sip',
        'is_active',
    ];

    protected $casts = [
        'is_medical' => 'boolean',
        'requires_str' => 'boolean',
        'requires_sip' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Employees in this job category
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Scope for active categories
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for medical categories
     */
    public function scopeMedical($query)
    {
        return $query->where('is_medical', true);
    }
}
