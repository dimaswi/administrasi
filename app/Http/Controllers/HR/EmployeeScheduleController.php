<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeSchedule;
use App\Models\HR\WorkSchedule;
use App\Models\OrganizationUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeScheduleController extends Controller
{
    /**
     * Display schedules list (grouped by employee)
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $unitId = $request->get('unit_id');

        $employees = Employee::query()
            ->with(['organizationUnit', 'jobCategory', 'schedules' => function ($query) {
                $query->with([
                    'mondayShift', 'tuesdayShift', 'wednesdayShift', 
                    'thursdayShift', 'fridayShift', 'saturdayShift', 'sundayShift'
                ])->orderBy('effective_date', 'desc');
            }])
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($unitId, function ($query, $unitId) {
                return $query->where('organization_unit_id', $unitId);
            })
            ->where('status', 'active')
            ->orderBy('first_name')
            ->paginate($perPage)
            ->withQueryString();

        $units = OrganizationUnit::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('HR/schedule/index', [
            'employees' => $employees,
            'units' => $units,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
                'unit_id' => $unitId,
            ],
        ]);
    }

    /**
     * Show employee schedule history
     */
    public function show(Employee $employee)
    {
        $employee->load(['organizationUnit', 'jobCategory', 'schedules' => function ($query) {
            $query->with([
                'creator',
                'mondayShift', 'tuesdayShift', 'wednesdayShift', 
                'thursdayShift', 'fridayShift', 'saturdayShift', 'sundayShift'
            ])->orderBy('effective_date', 'desc');
        }]);

        return Inertia::render('HR/schedule/show', [
            'employee' => $employee,
        ]);
    }

    /**
     * Show form to create new schedule for employee
     */
    public function create(Employee $employee)
    {
        $employee->load(['organizationUnit', 'jobCategory']);
        
        $currentSchedule = EmployeeSchedule::getCurrentSchedule($employee->id);
        if ($currentSchedule) {
            $currentSchedule->load([
                'mondayShift', 'tuesdayShift', 'wednesdayShift', 
                'thursdayShift', 'fridayShift', 'saturdayShift', 'sundayShift'
            ]);
        }

        $workSchedules = WorkSchedule::active()->orderBy('name')->get();

        return Inertia::render('HR/schedule/create', [
            'employee' => $employee,
            'currentSchedule' => $currentSchedule,
            'workSchedules' => $workSchedules,
        ]);
    }

    /**
     * Store new schedule
     */
    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'effective_date' => 'required|date|after_or_equal:today',
            'monday_shift_id' => 'nullable|exists:work_schedules,id',
            'tuesday_shift_id' => 'nullable|exists:work_schedules,id',
            'wednesday_shift_id' => 'nullable|exists:work_schedules,id',
            'thursday_shift_id' => 'nullable|exists:work_schedules,id',
            'friday_shift_id' => 'nullable|exists:work_schedules,id',
            'saturday_shift_id' => 'nullable|exists:work_schedules,id',
            'sunday_shift_id' => 'nullable|exists:work_schedules,id',
            'notes' => 'nullable|string|max:500',
        ]);

        // End current active schedule if exists
        $currentSchedule = EmployeeSchedule::getCurrentSchedule($employee->id);
        if ($currentSchedule) {
            $endDate = date('Y-m-d', strtotime($validated['effective_date'] . ' -1 day'));
            $currentSchedule->update(['end_date' => $endDate]);
        }

        // Create new schedule
        $employee->schedules()->create([
            ...$validated,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('hr.schedules.show', $employee)
            ->with('success', 'Jadwal kerja berhasil ditambahkan');
    }

    /**
     * Edit existing schedule
     */
    public function edit(Employee $employee, EmployeeSchedule $schedule)
    {
        if ($schedule->employee_id !== $employee->id) {
            abort(404);
        }

        $employee->load(['organizationUnit', 'jobCategory']);
        $schedule->load([
            'mondayShift', 'tuesdayShift', 'wednesdayShift', 
            'thursdayShift', 'fridayShift', 'saturdayShift', 'sundayShift'
        ]);

        $workSchedules = WorkSchedule::active()->orderBy('name')->get();

        return Inertia::render('HR/schedule/edit', [
            'employee' => $employee,
            'schedule' => $schedule,
            'workSchedules' => $workSchedules,
        ]);
    }

    /**
     * Update schedule
     */
    public function update(Request $request, Employee $employee, EmployeeSchedule $schedule)
    {
        if ($schedule->employee_id !== $employee->id) {
            abort(404);
        }

        $validated = $request->validate([
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'monday_shift_id' => 'nullable|exists:work_schedules,id',
            'tuesday_shift_id' => 'nullable|exists:work_schedules,id',
            'wednesday_shift_id' => 'nullable|exists:work_schedules,id',
            'thursday_shift_id' => 'nullable|exists:work_schedules,id',
            'friday_shift_id' => 'nullable|exists:work_schedules,id',
            'saturday_shift_id' => 'nullable|exists:work_schedules,id',
            'sunday_shift_id' => 'nullable|exists:work_schedules,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $schedule->update($validated);

        return redirect()->route('hr.schedules.show', $employee)
            ->with('success', 'Jadwal kerja berhasil diperbarui');
    }

    /**
     * Delete schedule (only future schedules)
     */
    public function destroy(Employee $employee, EmployeeSchedule $schedule)
    {
        if ($schedule->employee_id !== $employee->id) {
            abort(404);
        }

        if ($schedule->effective_date <= now()->toDateString()) {
            return back()->with('error', 'Tidak dapat menghapus jadwal yang sudah/sedang berlaku');
        }

        $schedule->delete();

        return redirect()->route('hr.schedules.show', $employee)
            ->with('success', 'Jadwal kerja berhasil dihapus');
    }

    /**
     * Show bulk assign form
     */
    public function bulkForm()
    {
        $employees = Employee::where('status', 'active')
            ->with('organizationUnit')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name', 'organization_unit_id']);

        $units = OrganizationUnit::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $workSchedules = WorkSchedule::active()->orderBy('name')->get();

        return Inertia::render('HR/schedule/bulk', [
            'employees' => $employees,
            'units' => $units,
            'workSchedules' => $workSchedules,
        ]);
    }

    /**
     * Bulk assign schedule to multiple employees
     */
    public function bulkCreate(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'effective_date' => 'required|date|after_or_equal:today',
            'monday_shift_id' => 'nullable|exists:work_schedules,id',
            'tuesday_shift_id' => 'nullable|exists:work_schedules,id',
            'wednesday_shift_id' => 'nullable|exists:work_schedules,id',
            'thursday_shift_id' => 'nullable|exists:work_schedules,id',
            'friday_shift_id' => 'nullable|exists:work_schedules,id',
            'saturday_shift_id' => 'nullable|exists:work_schedules,id',
            'sunday_shift_id' => 'nullable|exists:work_schedules,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $employeeIds = $validated['employee_ids'];
        unset($validated['employee_ids']);

        foreach ($employeeIds as $employeeId) {
            $currentSchedule = EmployeeSchedule::getCurrentSchedule($employeeId);
            if ($currentSchedule) {
                $endDate = date('Y-m-d', strtotime($validated['effective_date'] . ' -1 day'));
                $currentSchedule->update(['end_date' => $endDate]);
            }

            EmployeeSchedule::create([
                'employee_id' => $employeeId,
                ...$validated,
                'created_by' => Auth::id(),
            ]);
        }

        return redirect()->route('hr.schedules.index')
            ->with('success', count($employeeIds) . ' karyawan berhasil diatur jadwalnya');
    }
}
