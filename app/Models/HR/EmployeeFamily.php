<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeFamily extends Model
{
    protected $table = 'employee_families';

    protected $fillable = [
        'employee_id',
        'name',
        'relation',
        'nik',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'occupation',
        'phone',
        'is_emergency_contact',
        'is_dependent',
        'notes',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_emergency_contact' => 'boolean',
        'is_dependent' => 'boolean',
    ];

    /**
     * Employee relation
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get relation label in Indonesian
     */
    public function getRelationLabelAttribute(): string
    {
        return match ($this->relation) {
            'spouse' => 'Pasangan',
            'child' => 'Anak',
            'parent' => 'Orang Tua',
            'sibling' => 'Saudara Kandung',
            default => $this->relation,
        };
    }

    /**
     * Scope for emergency contacts
     */
    public function scopeEmergencyContacts($query)
    {
        return $query->where('is_emergency_contact', true);
    }

    /**
     * Scope for dependents
     */
    public function scopeDependents($query)
    {
        return $query->where('is_dependent', true);
    }
}
