<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeWorkHistory extends Model
{
    protected $table = 'employee_work_histories';

    protected $fillable = [
        'employee_id',
        'company_name',
        'position',
        'start_date',
        'end_date',
        'job_description',
        'leaving_reason',
        'reference_contact',
        'reference_phone',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Employee relation
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get duration in years/months
     */
    public function getDurationAttribute(): string
    {
        $endDate = $this->end_date ?? now();
        $years = $this->start_date->diffInYears($endDate);
        $months = $this->start_date->copy()->addYears($years)->diffInMonths($endDate);
        
        $parts = [];
        if ($years > 0) {
            $parts[] = "{$years} tahun";
        }
        if ($months > 0) {
            $parts[] = "{$months} bulan";
        }
        
        return implode(' ', $parts) ?: '< 1 bulan';
    }
}
