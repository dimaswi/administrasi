<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeEducation extends Model
{
    protected $table = 'employee_educations';

    protected $fillable = [
        'employee_id',
        'education_level_id',
        'institution',
        'major',
        'start_year',
        'end_year',
        'gpa',
        'certificate_number',
        'certificate_file',
        'is_highest',
        'notes',
    ];

    protected $casts = [
        'gpa' => 'decimal:2',
        'is_highest' => 'boolean',
    ];

    /**
     * Employee relation
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Education level relation
     */
    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    /**
     * Scope for highest education
     */
    public function scopeHighest($query)
    {
        return $query->where('is_highest', true);
    }
}
