<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeFamily;
use App\Models\HR\EmployeeEducation;
use App\Models\HR\EmployeeWorkHistory;
use App\Models\HR\JobCategory;
use App\Models\HR\EmploymentStatus;
use App\Models\HR\EducationLevel;
use App\Models\OrganizationUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $status = $request->get('status', '');
        $jobCategoryId = $request->get('job_category_id', '');
        $organizationUnitId = $request->get('organization_unit_id', '');

        $employees = Employee::query()
            ->with(['jobCategory', 'employmentStatus', 'organizationUnit', 'educationLevel'])
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('nik', 'like', "%{$search}%");
                });
            })
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($jobCategoryId, fn($q) => $q->where('job_category_id', $jobCategoryId))
            ->when($organizationUnitId, fn($q) => $q->where('organization_unit_id', $organizationUnitId))
            ->orderBy('employee_id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/employee/index', [
            'employees' => $employees,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'job_category_id' => $jobCategoryId,
                'organization_unit_id' => $organizationUnitId,
                'perPage' => $perPage,
            ],
            'jobCategories' => JobCategory::active()->orderBy('name')->get(),
            'organizationUnits' => OrganizationUnit::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('HR/employee/create', [
            'jobCategories' => JobCategory::active()->orderBy('name')->get(),
            'employmentStatuses' => EmploymentStatus::active()->orderBy('name')->get(),
            'educationLevels' => EducationLevel::active()->ordered()->get(),
            'organizationUnits' => OrganizationUnit::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Personal
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'nik' => 'nullable|string|max:16|unique:employees,nik',
            'gender' => 'required|in:male,female',
            'place_of_birth' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'religion' => 'nullable|string|max:50',
            'marital_status' => 'nullable|string|max:20',
            'blood_type' => 'nullable|string|max:5',
            // Contact
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            // Emergency Contact
            'emergency_contact_name' => 'nullable|string|max:100',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:50',
            // Employment
            'job_category_id' => 'required|exists:job_categories,id',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'organization_unit_id' => 'nullable|exists:organization_units,id',
            'position' => 'nullable|string|max:100',
            'join_date' => 'required|date',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after_or_equal:contract_start_date',
            // Education
            'education_level_id' => 'nullable|exists:education_levels,id',
            'education_institution' => 'nullable|string|max:200',
            'education_major' => 'nullable|string|max:100',
            'education_year' => 'nullable|integer|min:1900|max:' . date('Y'),
            // Documents
            'photo' => 'nullable|image|max:2048',
            'npwp_number' => 'nullable|string|max:30',
            'bpjs_kesehatan_number' => 'nullable|string|max:20',
            'bpjs_ketenagakerjaan_number' => 'nullable|string|max:20',
            // Bank
            'bank_name' => 'nullable|string|max:50',
            'bank_account_number' => 'nullable|string|max:30',
            'bank_account_name' => 'nullable|string|max:100',
            // Notes
            'notes' => 'nullable|string',
        ]);

        // Generate Employee ID
        $joinYear = date('Y', strtotime($validated['join_date']));
        $validated['employee_id'] = Employee::generateEmployeeId($validated['job_category_id'], $joinYear);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('employees/photos', 'public');
        }

        $employee = Employee::create($validated);

        return redirect()->route('hr.employees.show', $employee)
            ->with('success', 'Karyawan berhasil ditambahkan dengan NIK: ' . $employee->employee_id);
    }

    public function show(Employee $employee)
    {
        $employee->load([
            'jobCategory',
            'employmentStatus',
            'organizationUnit',
            'educationLevel',
            'families',
            'educations.educationLevel',
            'workHistories',
            'user',
            'credentials',
        ]);

        // Get available users (users not assigned to any employee, or assigned to current employee)
        $availableUsers = User::whereDoesntHave('employee')
            ->orWhereHas('employee', fn($q) => $q->where('id', $employee->id))
            ->orderBy('name')
            ->get(['id', 'name', 'nip']);

        return Inertia::render('HR/employee/show', [
            'employee' => $employee,
            'educationLevels' => EducationLevel::active()->ordered()->get(),
            'availableUsers' => $availableUsers,
        ]);
    }

    public function edit(Employee $employee)
    {
        $employee->load(['jobCategory', 'families', 'educations.educationLevel', 'workHistories']);
        
        return Inertia::render('HR/employee/edit', [
            'employee' => $employee,
            'jobCategories' => JobCategory::active()->orderBy('name')->get(),
            'employmentStatuses' => EmploymentStatus::active()->orderBy('name')->get(),
            'educationLevels' => EducationLevel::active()->ordered()->get(),
            'organizationUnits' => OrganizationUnit::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            // Personal
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'nik' => 'nullable|string|max:16|unique:employees,nik,' . $employee->id,
            'gender' => 'required|in:male,female',
            'place_of_birth' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'religion' => 'nullable|string|max:50',
            'marital_status' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:5',
            // Contact
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            // Emergency Contact
            'emergency_contact_name' => 'nullable|string|max:100',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:50',
            // Employment
            'job_category_id' => 'required|exists:job_categories,id',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'organization_unit_id' => 'nullable|exists:organization_units,id',
            'position' => 'nullable|string|max:100',
            'join_date' => 'required|date',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after_or_equal:contract_start_date',
            'permanent_date' => 'nullable|date',
            // Medical Staff
            'str_number' => 'nullable|string|max:50',
            'str_expiry_date' => 'nullable|date',
            'sip_number' => 'nullable|string|max:50',
            'sip_expiry_date' => 'nullable|date',
            // Documents
            'photo' => 'nullable|image|max:2048',
            'npwp_number' => 'nullable|string|max:30',
            'bpjs_kesehatan_number' => 'nullable|string|max:20',
            'bpjs_ketenagakerjaan_number' => 'nullable|string|max:20',
            // Bank
            'bank_name' => 'nullable|string|max:50',
            'bank_account_number' => 'nullable|string|max:30',
            'bank_account_name' => 'nullable|string|max:100',
            // Status
            'status' => 'nullable|in:active,inactive,resigned,terminated',
            'resign_date' => 'nullable|date',
            'resign_reason' => 'nullable|string',
            // Notes
            'notes' => 'nullable|string',
            // Family members
            'families' => 'nullable|array',
            'families.*.id' => 'nullable|integer',
            'families.*.name' => 'required|string|max:100',
            'families.*.relation' => 'required|string|max:50',
            'families.*.birth_date' => 'nullable|date',
            'families.*.occupation' => 'nullable|string|max:100',
            'families.*.phone' => 'nullable|string|max:20',
            // Education history
            'educations' => 'nullable|array',
            'educations.*.id' => 'nullable|integer',
            'educations.*.education_level_id' => 'required|exists:education_levels,id',
            'educations.*.institution_name' => 'required|string|max:200',
            'educations.*.major' => 'nullable|string|max:100',
            'educations.*.graduation_year' => 'nullable|integer|min:1950|max:' . date('Y'),
            'educations.*.gpa' => 'nullable|numeric|min:0|max:4',
            // Work history
            'work_histories' => 'nullable|array',
            'work_histories.*.id' => 'nullable|integer',
            'work_histories.*.company_name' => 'required|string|max:200',
            'work_histories.*.position' => 'required|string|max:100',
            'work_histories.*.start_date' => 'nullable|date',
            'work_histories.*.end_date' => 'nullable|date',
            'work_histories.*.job_description' => 'nullable|string',
            'work_histories.*.leaving_reason' => 'nullable|string|max:255',
            'work_histories.*.reference_contact' => 'nullable|string|max:100',
            'work_histories.*.reference_phone' => 'nullable|string|max:20',
        ]);

        DB::transaction(function () use ($request, $employee, &$validated) {
            // Handle photo upload
            if ($request->hasFile('photo')) {
                // Delete old photo
                if ($employee->photo) {
                    Storage::disk('public')->delete($employee->photo);
                }
                $validated['photo'] = $request->file('photo')->store('employees/photos', 'public');
            }

            // Extract families, educations, and work_histories from validated data
            $families = $validated['families'] ?? [];
            $educations = $validated['educations'] ?? [];
            $workHistories = $validated['work_histories'] ?? [];
            unset($validated['families'], $validated['educations'], $validated['work_histories']);

            $employee->update($validated);

            // Sync families
            $existingFamilyIds = collect($families)->pluck('id')->filter()->toArray();
            $employee->families()->whereNotIn('id', $existingFamilyIds)->delete();
            
            foreach ($families as $familyData) {
                if (!empty($familyData['id'])) {
                    $employee->families()->where('id', $familyData['id'])->update($familyData);
                } else {
                    $employee->families()->create($familyData);
                }
            }

            // Sync educations
            $existingEducationIds = collect($educations)->pluck('id')->filter()->toArray();
            $employee->educations()->whereNotIn('id', $existingEducationIds)->delete();
            
            foreach ($educations as $educationData) {
                if (!empty($educationData['id'])) {
                    $employee->educations()->where('id', $educationData['id'])->update($educationData);
                } else {
                    $employee->educations()->create($educationData);
                }
            }

            // Sync work histories
            $existingWorkHistoryIds = collect($workHistories)->pluck('id')->filter()->toArray();
            $employee->workHistories()->whereNotIn('id', $existingWorkHistoryIds)->delete();
            
            foreach ($workHistories as $workHistoryData) {
                if (!empty($workHistoryData['id'])) {
                    $employee->workHistories()->where('id', $workHistoryData['id'])->update($workHistoryData);
                } else {
                    $employee->workHistories()->create($workHistoryData);
                }
            }
        });

        return redirect()->route('hr.employees.show', $employee)
            ->with('success', 'Data karyawan berhasil diperbarui');
    }

    public function destroy(Employee $employee)
    {
        // Soft delete
        $employee->delete();

        return redirect()->route('hr.employees.index')
            ->with('success', 'Karyawan berhasil dihapus');
    }

    /**
     * Update employee status (resign, terminate, etc.)
     */
    public function updateStatus(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,resigned,terminated',
            'resign_date' => 'required_if:status,resigned,terminated|nullable|date',
            'resign_reason' => 'nullable|string',
        ]);

        $employee->update($validated);

        return back()->with('success', 'Status karyawan berhasil diperbarui');
    }

    /**
     * Partial update for specific sections (documents, bank, notes)
     */
    public function updatePartial(Request $request, Employee $employee)
    {
        $section = $request->input('section');

        $rules = match ($section) {
            'documents' => [
                'npwp_number' => 'nullable|string|max:30',
                'bpjs_kesehatan_number' => 'nullable|string|max:20',
                'bpjs_ketenagakerjaan_number' => 'nullable|string|max:20',
            ],
            'bank' => [
                'bank_name' => 'nullable|string|max:50',
                'bank_account_number' => 'nullable|string|max:30',
                'bank_account_name' => 'nullable|string|max:100',
            ],
            'notes' => [
                'notes' => 'nullable|string',
            ],
            'user' => [
                'user_id' => 'nullable|exists:users,id',
            ],
            default => [],
        };

        if (empty($rules)) {
            return back()->with('error', 'Invalid section');
        }

        $validated = $request->validate($rules);
        $employee->update($validated);

        return back()->with('success', 'Data berhasil diperbarui');
    }
}
