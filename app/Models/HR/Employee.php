<?php

namespace App\Models\HR;

use App\Models\OrganizationUnit;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id',
        'user_id',
        'first_name',
        'last_name',
        'nik',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'religion',
        'marital_status',
        'blood_type',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'phone_secondary',
        'email',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'job_category_id',
        'employment_status_id',
        'organization_unit_id',
        'position',
        'join_date',
        'contract_start_date',
        'contract_end_date',
        'permanent_date',
        'resign_date',
        'resign_reason',
        'education_level_id',
        'education_institution',
        'education_major',
        'education_year',
        'photo',
        'ktp_file',
        'npwp_number',
        'npwp_file',
        'bpjs_kesehatan_number',
        'bpjs_ketenagakerjaan_number',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'status',
        'notes',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'join_date' => 'date',
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'permanent_date' => 'date',
        'resign_date' => 'date',
    ];

    protected $appends = [
        'full_name',
    ];

    /**
     * Get full name
     */
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . ($this->last_name ?? ''));
    }

    /**
     * Generate Employee ID (NIK)
     * Format: YYYY-KATEGORI-URUT (contoh: 2026-1-001)
     */
    public static function generateEmployeeId(int $jobCategoryId, ?int $year = null): string
    {
        $year = $year ?? date('Y');
        
        // Get job category code
        $jobCategory = JobCategory::find($jobCategoryId);
        if (!$jobCategory) {
            throw new \InvalidArgumentException('Job Category not found');
        }
        
        // Get next sequence number for this year and category
        // PostgreSQL compatible: use SPLIT_PART instead of SUBSTRING_INDEX
        $prefix = "{$year}-{$jobCategory->code}-";
        $lastEmployee = self::where('employee_id', 'like', "{$prefix}%")
            ->orderByRaw("CAST(SPLIT_PART(employee_id, '-', 3) AS INTEGER) DESC")
            ->first();
        
        if ($lastEmployee) {
            $parts = explode('-', $lastEmployee->employee_id);
            $lastSequence = (int) end($parts);
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }
        
        return sprintf('%d-%s-%03d', $year, $jobCategory->code, $nextSequence);
    }

    /**
     * User account relation (if employee has system access)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Job category relation
     */
    public function jobCategory(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class);
    }

    /**
     * Employment status relation
     */
    public function employmentStatus(): BelongsTo
    {
        return $this->belongsTo(EmploymentStatus::class);
    }

    /**
     * Organization unit relation
     */
    public function organizationUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationUnit::class);
    }

    /**
     * Education level relation
     */
    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    /**
     * Family members relation
     */
    public function families(): HasMany
    {
        return $this->hasMany(EmployeeFamily::class);
    }

    /**
     * Education history relation
     */
    public function educations(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class);
    }

    /**
     * Work history relation
     */
    public function workHistories(): HasMany
    {
        return $this->hasMany(EmployeeWorkHistory::class);
    }

    /**
     * Schedules relation
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    /**
     * Attendances relation
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Leaves relation
     */
    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }

    /**
     * Leave balances relation
     */
    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class);
    }

    /**
     * Employee trainings relation
     */
    public function employeeTrainings(): HasMany
    {
        return $this->hasMany(EmployeeTraining::class);
    }

    /**
     * Performance reviews relation
     */
    public function performanceReviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class);
    }

    /**
     * Credentials relation
     */
    public function credentials(): HasMany
    {
        return $this->hasMany(EmployeeCredential::class);
    }

    /**
     * Get current active schedule
     */
    public function getCurrentScheduleAttribute(): ?EmployeeSchedule
    {
        return EmployeeSchedule::getCurrentSchedule($this->id);
    }

    /**
     * Scope for active employees
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for employees by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for employees by job category
     */
    public function scopeJobCategory($query, int $categoryId)
    {
        return $query->where('job_category_id', $categoryId);
    }

    /**
     * Scope for medical staff
     */
    public function scopeMedicalStaff($query)
    {
        return $query->whereHas('jobCategory', function ($q) {
            $q->where('is_medical', true);
        });
    }

    /**
     * Check if employee is medical staff
     */
    public function isMedicalStaff(): bool
    {
        return $this->jobCategory?->is_medical ?? false;
    }

    /**
     * Get age
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->date_of_birth) {
            return null;
        }
        return $this->date_of_birth->age;
    }

    /**
     * Get tenure in years
     */
    public function getTenureYearsAttribute(): ?float
    {
        if (!$this->join_date) {
            return null;
        }
        return round($this->join_date->diffInDays(now()) / 365, 1);
    }

    /**
     * Check if contract is expiring soon (within 30 days)
     */
    public function isContractExpiringSoon(): bool
    {
        if (!$this->contract_end_date) {
            return false;
        }
        return $this->contract_end_date->diffInDays(now()) <= 30 && $this->contract_end_date->isFuture();
    }
}
