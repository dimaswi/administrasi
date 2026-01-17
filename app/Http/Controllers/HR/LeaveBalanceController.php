<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeLeaveBalance;
use App\Models\HR\LeaveType;
use App\Models\OrganizationUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveBalanceController extends Controller
{
    /**
     * Display a listing of leave balances.
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 25);
        $unitId = $request->get('unit_id');
        $year = $request->get('year', now()->year);
        $leaveTypeId = $request->get('leave_type_id');

        $query = Employee::with(['organizationUnit', 'jobCategory'])
            ->where('status', 'active')
            ->orderBy('first_name');

        // Search by employee name or ID
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Filter by unit
        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        $employees = $query->paginate($perPage);

        // Get leave types
        $leaveTypes = LeaveType::active()->ordered()->get();

        // Transform data with leave balances
        $employees->through(function ($employee) use ($year, $leaveTypes, $leaveTypeId) {
            $balances = [];
            
            $leaveTypesToShow = $leaveTypeId 
                ? $leaveTypes->where('id', $leaveTypeId) 
                : $leaveTypes;

            foreach ($leaveTypesToShow as $leaveType) {
                $balance = EmployeeLeaveBalance::where('employee_id', $employee->id)
                    ->where('leave_type_id', $leaveType->id)
                    ->where('year', $year)
                    ->first();

<<<<<<< HEAD
                // Only show if has balance record (is assigned)
                if ($balance) {
                    $balances[] = [
                        'leave_type_id' => $leaveType->id,
                        'leave_type_name' => $leaveType->name,
                        'leave_type_code' => $leaveType->code,
                        'leave_type_color' => $leaveType->color,
                        'initial_balance' => $balance->initial_balance,
                        'carry_over' => $balance->carry_over,
                        'adjustment' => $balance->adjustment,
                        'used' => $balance->used,
                        'pending' => $balance->pending,
                        'total_balance' => $balance->total_balance,
                        'available_balance' => $balance->available_balance,
                        'has_balance_record' => true,
                    ];
                }
            }

            // Count assigned leave types
            $assignedCount = EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('year', $year)
                ->count();

=======
                $balances[] = [
                    'leave_type_id' => $leaveType->id,
                    'leave_type_name' => $leaveType->name,
                    'leave_type_code' => $leaveType->code,
                    'leave_type_color' => $leaveType->color,
                    'initial_balance' => $balance?->initial_balance ?? $leaveType->default_quota,
                    'carry_over' => $balance?->carry_over ?? 0,
                    'adjustment' => $balance?->adjustment ?? 0,
                    'used' => $balance?->used ?? 0,
                    'pending' => $balance?->pending ?? 0,
                    'total_balance' => $balance?->total_balance ?? $leaveType->default_quota,
                    'available_balance' => $balance?->available_balance ?? $leaveType->default_quota,
                    'has_balance_record' => $balance !== null,
                ];
            }

>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
            return [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name,
                'job_category' => $employee->jobCategory?->name,
                'balances' => $balances,
<<<<<<< HEAD
                'assigned_count' => $assignedCount,
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
            ];
        });

        // Get filter options
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        // Get available years (current year and previous 2 years)
        $years = range(now()->year, now()->year - 2);

        return Inertia::render('HR/leave-balance/index', [
            'employees' => $employees,
            'leaveTypes' => $leaveTypes->map(fn($lt) => [
                'id' => $lt->id,
                'code' => $lt->code,
                'name' => $lt->name,
                'color' => $lt->color,
                'default_quota' => $lt->default_quota,
            ]),
            'units' => $units,
            'years' => $years,
            'filters' => [
                'search' => $search,
                'unit_id' => $unitId,
                'year' => (int) $year,
                'leave_type_id' => $leaveTypeId,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for editing leave balance.
     */
    public function edit(Employee $employee, Request $request)
    {
        $year = $request->get('year', now()->year);

        $leaveTypes = LeaveType::active()->ordered()->get();
        
        $balances = $leaveTypes->map(function ($leaveType) use ($employee, $year) {
            $balance = EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('year', $year)
                ->first();

            return [
                'leave_type_id' => $leaveType->id,
                'leave_type_name' => $leaveType->name,
                'leave_type_code' => $leaveType->code,
                'leave_type_color' => $leaveType->color,
                'default_quota' => $leaveType->default_quota,
                'initial_balance' => $balance?->initial_balance ?? $leaveType->default_quota,
                'carry_over' => $balance?->carry_over ?? 0,
                'adjustment' => $balance?->adjustment ?? 0,
                'used' => $balance?->used ?? 0,
                'pending' => $balance?->pending ?? 0,
                'total_balance' => $balance?->total_balance ?? $leaveType->default_quota,
                'available_balance' => $balance?->available_balance ?? $leaveType->default_quota,
<<<<<<< HEAD
                'is_assigned' => $balance !== null,
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
            ];
        });

        // Get available years
        $years = range(now()->year, now()->year - 2);

        return Inertia::render('HR/leave-balance/edit', [
            'employee' => [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name,
            ],
            'balances' => $balances,
            'year' => (int) $year,
            'years' => $years,
        ]);
    }

    /**
     * Update leave balances for an employee.
     */
    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:' . (now()->year + 1),
            'balances' => 'required|array',
            'balances.*.leave_type_id' => 'required|exists:leave_types,id',
            'balances.*.initial_balance' => 'required|numeric|min:0',
            'balances.*.carry_over' => 'required|numeric|min:0',
            'balances.*.adjustment' => 'required|numeric',
<<<<<<< HEAD
            'balances.*.is_assigned' => 'required|boolean',
        ]);

        foreach ($validated['balances'] as $balanceData) {
            $existing = EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('leave_type_id', $balanceData['leave_type_id'])
                ->where('year', $validated['year'])
                ->first();

            if ($balanceData['is_assigned']) {
                // Create or update balance
                EmployeeLeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'leave_type_id' => $balanceData['leave_type_id'],
                        'year' => $validated['year'],
                    ],
                    [
                        'initial_balance' => $balanceData['initial_balance'],
                        'carry_over' => $balanceData['carry_over'],
                        'adjustment' => $balanceData['adjustment'],
                    ]
                );
            } else {
                // Delete balance if exists and no usage
                if ($existing && $existing->used == 0 && $existing->pending == 0) {
                    $existing->delete();
                }
            }
=======
        ]);

        foreach ($validated['balances'] as $balanceData) {
            EmployeeLeaveBalance::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_type_id' => $balanceData['leave_type_id'],
                    'year' => $validated['year'],
                ],
                [
                    'initial_balance' => $balanceData['initial_balance'],
                    'carry_over' => $balanceData['carry_over'],
                    'adjustment' => $balanceData['adjustment'],
                ]
            );
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
        }

        return redirect()->route('hr.leave-balances.index', ['year' => $validated['year']])
            ->with('success', 'Saldo cuti berhasil diperbarui');
    }

    /**
<<<<<<< HEAD
     * Initialize/carry over balances from previous year.
     * Only carries over for leave types that were already assigned in previous year.
=======
     * Initialize balances for all employees for a specific year.
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
     */
    public function initializeYear(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:' . (now()->year + 1),
            'carry_over_previous' => 'boolean',
        ]);

        $year = $validated['year'];
        $carryOverPrevious = $validated['carry_over_previous'] ?? false;
<<<<<<< HEAD
        $previousYear = $year - 1;

        $employees = Employee::where('status', 'active')->get();

        $count = 0;
        foreach ($employees as $employee) {
            // Get previous year balances for this employee
            $previousBalances = EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('year', $previousYear)
                ->with('leaveType')
                ->get();

            foreach ($previousBalances as $previousBalance) {
                $leaveType = $previousBalance->leaveType;
                
                if (!$leaveType || !$leaveType->is_active) {
                    continue;
                }

                // Check if already exists for this year
=======

        $employees = Employee::where('status', 'active')->get();
        $leaveTypes = LeaveType::active()->get();

        $count = 0;
        foreach ($employees as $employee) {
            foreach ($leaveTypes as $leaveType) {
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                $existing = EmployeeLeaveBalance::where('employee_id', $employee->id)
                    ->where('leave_type_id', $leaveType->id)
                    ->where('year', $year)
                    ->first();

                if (!$existing) {
                    $carryOver = 0;
                    
                    if ($carryOverPrevious && $leaveType->allow_carry_over) {
<<<<<<< HEAD
                        $remaining = $previousBalance->remaining_balance;
                        $maxCarryOver = $leaveType->max_carry_over_days ?? $remaining;
                        $carryOver = min($remaining, $maxCarryOver);
=======
                        $previousBalance = EmployeeLeaveBalance::where('employee_id', $employee->id)
                            ->where('leave_type_id', $leaveType->id)
                            ->where('year', $year - 1)
                            ->first();
                        
                        if ($previousBalance) {
                            $remaining = $previousBalance->remaining_balance;
                            $maxCarryOver = $leaveType->max_carry_over_days ?? $remaining;
                            $carryOver = min($remaining, $maxCarryOver);
                        }
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                    }

                    EmployeeLeaveBalance::create([
                        'employee_id' => $employee->id,
                        'leave_type_id' => $leaveType->id,
                        'year' => $year,
                        'initial_balance' => $leaveType->default_quota,
                        'carry_over' => $carryOver,
                        'adjustment' => 0,
                        'used' => 0,
                        'pending' => 0,
                    ]);
                    $count++;
                }
            }
        }

<<<<<<< HEAD
        return back()->with('success', "Berhasil menginisialisasi {$count} saldo cuti untuk tahun {$year} (berdasarkan assignment tahun sebelumnya)");
=======
        return back()->with('success', "Berhasil menginisialisasi {$count} saldo cuti untuk tahun {$year}");
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    }
}
