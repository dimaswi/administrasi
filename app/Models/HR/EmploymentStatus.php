<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmploymentStatus extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_permanent',
        'is_active',
    ];

    protected $casts = [
        'is_permanent' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Employees with this employment status
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Scope for active statuses
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
