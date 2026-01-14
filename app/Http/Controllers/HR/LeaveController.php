<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeLeaveBalance;
use App\Models\HR\Leave;
use App\Models\HR\LeaveType;
use App\Models\OrganizationUnit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class LeaveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 25);
        $status = $request->get('status');
        $leaveTypeId = $request->get('leave_type_id');
        $unitId = $request->get('unit_id');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Leave::with(['employee.organizationUnit', 'leaveType', 'approver'])
            ->latest('created_at');

        // Search by employee name or ID
        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Filter by leave type
        if ($leaveTypeId) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        // Filter by unit
        if ($unitId) {
            $query->whereHas('employee', function ($q) use ($unitId) {
                $q->where('organization_unit_id', $unitId);
            });
        }

        // Filter by date range
        if ($startDate && $endDate) {
            $query->inDateRange($startDate, $endDate);
        }

        $leaves = $query->paginate($perPage);

        // Transform data
        $leaves->through(function ($leave) {
            return [
                'id' => $leave->id,
                'employee' => [
                    'id' => $leave->employee->id,
                    'employee_id' => $leave->employee->employee_id,
                    'name' => $leave->employee->first_name . ' ' . ($leave->employee->last_name ?? ''),
                    'organization_unit' => $leave->employee->organizationUnit?->name,
                ],
                'leave_type' => [
                    'id' => $leave->leaveType->id,
                    'name' => $leave->leaveType->name,
                    'color' => $leave->leaveType->color,
                ],
                'start_date' => $leave->start_date->format('Y-m-d'),
                'end_date' => $leave->end_date->format('Y-m-d'),
                'date_range' => $leave->date_range,
                'total_days' => $leave->total_days,
                'is_half_day' => $leave->is_half_day,
                'half_day_label' => $leave->half_day_label,
                'status' => $leave->status,
                'status_label' => $leave->status_label,
                'reason' => $leave->reason,
                'approved_by' => $leave->approver?->name,
                'approved_at' => $leave->approved_at?->format('Y-m-d H:i'),
                'created_at' => $leave->created_at->format('Y-m-d H:i'),
            ];
        });

        // Get statistics
        $stats = $this->getStatistics();

        // Get filter options
        $leaveTypes = LeaveType::active()->ordered()->get(['id', 'name', 'color']);
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/leave/index', [
            'leaves' => $leaves,
            'stats' => $stats,
            'leaveTypes' => $leaveTypes,
            'units' => $units,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'leave_type_id' => $leaveTypeId,
                'unit_id' => $unitId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'per_page' => $perPage,
            ],
            'statusOptions' => Leave::STATUS_LABELS,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $employeeId = $request->get('employee_id');
        $employee = null;
        $balances = [];

        if ($employeeId) {
            $employee = Employee::with('organizationUnit')->find($employeeId);
            if ($employee) {
                $year = now()->year;
                $balances = EmployeeLeaveBalance::where('employee_id', $employeeId)
                    ->where('year', $year)
                    ->with('leaveType')
                    ->get()
                    ->map(function ($balance) {
                        return [
                            'leave_type_id' => $balance->leave_type_id,
                            'leave_type_name' => $balance->leaveType->name,
                            'total_balance' => $balance->total_balance,
                            'used' => $balance->used,
                            'pending' => $balance->pending,
                            'available' => $balance->available_balance,
                        ];
                    });
            }
        }

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name']);

        $leaveTypes = LeaveType::active()->ordered()->get();

        return Inertia::render('HR/leave/form', [
            'leave' => null,
            'employee' => $employee ? [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name,
            ] : null,
            'balances' => $balances,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
            'halfDayTypes' => Leave::HALF_DAY_TYPES,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_half_day' => 'boolean',
            'half_day_type' => 'required_if:is_half_day,true|nullable|in:morning,afternoon',
            'reason' => 'required|string|max:1000',
            'emergency_contact' => 'nullable|string|max:100',
            'emergency_phone' => 'nullable|string|max:20',
            'delegation_to' => 'nullable|string|max:100',
            'submit' => 'boolean', // Whether to submit immediately
        ]);

        // Calculate total days
        $totalDays = Leave::calculateDays(
            $validated['start_date'],
            $validated['end_date'],
            $validated['is_half_day'] ?? false
        );

        // Check for overlapping leaves
        $overlapping = Leave::where('employee_id', $validated['employee_id'])
            ->overlapping($validated['start_date'], $validated['end_date'])
            ->exists();

        if ($overlapping) {
            return back()->withErrors([
                'start_date' => 'Terdapat pengajuan cuti yang tumpang tindih dengan periode ini',
            ]);
        }

        // Check leave balance
        $year = Carbon::parse($validated['start_date'])->year;
        $balance = EmployeeLeaveBalance::getOrCreate(
            $validated['employee_id'],
            $validated['leave_type_id'],
            $year
        );

        if ($balance->available_balance < $totalDays) {
            return back()->withErrors([
                'leave_type_id' => 'Saldo cuti tidak mencukupi. Sisa: ' . $balance->available_balance . ' hari',
            ]);
        }

        DB::transaction(function () use ($validated, $totalDays, $balance) {
            $leave = Leave::create([
                ...$validated,
                'total_days' => $totalDays,
                'status' => ($validated['submit'] ?? false) ? 'pending' : 'draft',
                'submitted_at' => ($validated['submit'] ?? false) ? now() : null,
                'created_by' => Auth::id(),
            ]);

            // Add to pending balance if submitted
            if ($validated['submit'] ?? false) {
                $balance->addPending($totalDays);
            }
        });

        return redirect()->route('hr.leaves.index')
            ->with('success', 'Pengajuan cuti berhasil dibuat');
    }

    /**
     * Display the specified resource.
     */
    public function show(Leave $leave)
    {
        $leave->load(['employee.organizationUnit', 'leaveType', 'approver', 'creator']);

        // Get employee balances
        $year = $leave->start_date->year;
        $balances = EmployeeLeaveBalance::where('employee_id', $leave->employee_id)
            ->where('year', $year)
            ->with('leaveType')
            ->get();

        return Inertia::render('HR/leave/show', [
            'leave' => [
                'id' => $leave->id,
                'employee' => [
                    'id' => $leave->employee->id,
                    'employee_id' => $leave->employee->employee_id,
                    'name' => $leave->employee->first_name . ' ' . ($leave->employee->last_name ?? ''),
                    'organization_unit' => $leave->employee->organizationUnit?->name,
                ],
                'leave_type' => [
                    'id' => $leave->leaveType->id,
                    'name' => $leave->leaveType->name,
                    'color' => $leave->leaveType->color,
                ],
                'start_date' => $leave->start_date->format('Y-m-d'),
                'end_date' => $leave->end_date->format('Y-m-d'),
                'date_range' => $leave->date_range,
                'total_days' => $leave->total_days,
                'is_half_day' => $leave->is_half_day,
                'half_day_type' => $leave->half_day_type,
                'half_day_label' => $leave->half_day_label,
                'status' => $leave->status,
                'status_label' => $leave->status_label,
                'reason' => $leave->reason,
                'emergency_contact' => $leave->emergency_contact,
                'emergency_phone' => $leave->emergency_phone,
                'delegation_to' => $leave->delegation_to,
                'attachment' => $leave->attachment,
                'approved_by' => $leave->approver?->name,
                'approved_at' => $leave->approved_at?->format('Y-m-d H:i'),
                'approval_notes' => $leave->approval_notes,
                'created_by' => $leave->creator?->name,
                'created_at' => $leave->created_at->format('Y-m-d H:i'),
                'submitted_at' => $leave->submitted_at?->format('Y-m-d H:i'),
                'can_approve' => $leave->status === 'pending',
                'can_cancel' => $leave->can_cancel,
                'can_edit' => $leave->can_edit,
            ],
            'balances' => $balances,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Leave $leave)
    {
        if (!$leave->can_edit) {
            return redirect()->route('hr.leaves.show', $leave)
                ->with('error', 'Pengajuan cuti tidak dapat diedit');
        }

        $leave->load(['employee.organizationUnit', 'leaveType']);

        $year = $leave->start_date->year;
        $balances = EmployeeLeaveBalance::where('employee_id', $leave->employee_id)
            ->where('year', $year)
            ->with('leaveType')
            ->get()
            ->map(function ($balance) {
                return [
                    'leave_type_id' => $balance->leave_type_id,
                    'leave_type_name' => $balance->leaveType->name,
                    'total_balance' => $balance->total_balance,
                    'used' => $balance->used,
                    'pending' => $balance->pending,
                    'available' => $balance->available_balance,
                ];
            });

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name']);

        $leaveTypes = LeaveType::active()->ordered()->get();

        return Inertia::render('HR/leave/form', [
            'leave' => $leave,
            'employee' => [
                'id' => $leave->employee->id,
                'employee_id' => $leave->employee->employee_id,
                'name' => $leave->employee->first_name . ' ' . ($leave->employee->last_name ?? ''),
                'organization_unit' => $leave->employee->organizationUnit?->name,
            ],
            'balances' => $balances,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
            'halfDayTypes' => Leave::HALF_DAY_TYPES,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Leave $leave)
    {
        if (!$leave->can_edit) {
            return redirect()->route('hr.leaves.show', $leave)
                ->with('error', 'Pengajuan cuti tidak dapat diedit');
        }

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_half_day' => 'boolean',
            'half_day_type' => 'required_if:is_half_day,true|nullable|in:morning,afternoon',
            'reason' => 'required|string|max:1000',
            'emergency_contact' => 'nullable|string|max:100',
            'emergency_phone' => 'nullable|string|max:20',
            'delegation_to' => 'nullable|string|max:100',
            'submit' => 'boolean',
        ]);

        // Calculate total days
        $totalDays = Leave::calculateDays(
            $validated['start_date'],
            $validated['end_date'],
            $validated['is_half_day'] ?? false
        );

        // Check for overlapping leaves (excluding current)
        $overlapping = Leave::where('employee_id', $leave->employee_id)
            ->overlapping($validated['start_date'], $validated['end_date'], $leave->id)
            ->exists();

        if ($overlapping) {
            return back()->withErrors([
                'start_date' => 'Terdapat pengajuan cuti yang tumpang tindih dengan periode ini',
            ]);
        }

        // Check leave balance
        $year = Carbon::parse($validated['start_date'])->year;
        $balance = EmployeeLeaveBalance::getOrCreate(
            $leave->employee_id,
            $validated['leave_type_id'],
            $year
        );

        if ($balance->available_balance < $totalDays) {
            return back()->withErrors([
                'leave_type_id' => 'Saldo cuti tidak mencukupi. Sisa: ' . $balance->available_balance . ' hari',
            ]);
        }

        DB::transaction(function () use ($leave, $validated, $totalDays, $balance) {
            $leave->update([
                ...$validated,
                'total_days' => $totalDays,
                'status' => ($validated['submit'] ?? false) ? 'pending' : 'draft',
                'submitted_at' => ($validated['submit'] ?? false) ? now() : null,
                'updated_by' => Auth::id(),
            ]);

            // Add to pending balance if submitted
            if ($validated['submit'] ?? false) {
                $balance->addPending($totalDays);
            }
        });

        return redirect()->route('hr.leaves.index')
            ->with('success', 'Pengajuan cuti berhasil diperbarui');
    }

    /**
     * Approve leave request
     */
    public function approve(Request $request, Leave $leave)
    {
        if ($leave->status !== 'pending') {
            return redirect()->route('hr.leaves.show', $leave)
                ->with('error', 'Pengajuan cuti tidak dapat disetujui');
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($leave, $validated) {
            $leave->approve(Auth::id(), $validated['notes'] ?? null);

            // Move from pending to used in balance
            $year = $leave->start_date->year;
            $balance = EmployeeLeaveBalance::getOrCreate(
                $leave->employee_id,
                $leave->leave_type_id,
                $year
            );
            $balance->useDays($leave->total_days);
        });

        return redirect()->route('hr.leaves.index')
            ->with('success', 'Pengajuan cuti berhasil disetujui');
    }

    /**
     * Reject leave request
     */
    public function reject(Request $request, Leave $leave)
    {
        if ($leave->status !== 'pending') {
            return redirect()->route('hr.leaves.show', $leave)
                ->with('error', 'Pengajuan cuti tidak dapat ditolak');
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($leave, $validated) {
            $leave->reject(Auth::id(), $validated['notes']);

            // Remove from pending balance
            $year = $leave->start_date->year;
            $balance = EmployeeLeaveBalance::getOrCreate(
                $leave->employee_id,
                $leave->leave_type_id,
                $year
            );
            $balance->removePending($leave->total_days);
        });

        return redirect()->route('hr.leaves.index')
            ->with('success', 'Pengajuan cuti berhasil ditolak');
    }

    /**
     * Cancel leave request
     */
    public function cancel(Request $request, Leave $leave)
    {
        if (!$leave->can_cancel) {
            return redirect()->route('hr.leaves.show', $leave)
                ->with('error', 'Pengajuan cuti tidak dapat dibatalkan');
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($leave, $validated) {
            $wasPending = $leave->status === 'pending';
            $leave->cancel($validated['reason'] ?? null);

            // Remove from pending balance if was pending
            if ($wasPending) {
                $year = $leave->start_date->year;
                $balance = EmployeeLeaveBalance::getOrCreate(
                    $leave->employee_id,
                    $leave->leave_type_id,
                    $year
                );
                $balance->removePending($leave->total_days);
            }
        });

        return redirect()->route('hr.leaves.index')
            ->with('success', 'Pengajuan cuti berhasil dibatalkan');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Leave $leave)
    {
        if (!$leave->can_edit) {
            return redirect()->route('hr.leaves.index')
                ->with('error', 'Pengajuan cuti tidak dapat dihapus');
        }

        $leave->delete();

        return redirect()->route('hr.leaves.index')
            ->with('success', 'Pengajuan cuti berhasil dihapus');
    }

    /**
     * Get statistics
     */
    private function getStatistics(): array
    {
        return [
            'pending' => Leave::pending()->count(),
            'approved_this_month' => Leave::approved()
                ->whereMonth('approved_at', now()->month)
                ->whereYear('approved_at', now()->year)
                ->count(),
            'rejected_this_month' => Leave::rejected()
                ->whereMonth('approved_at', now()->month)
                ->whereYear('approved_at', now()->year)
                ->count(),
            'total_days_this_month' => Leave::approved()
                ->whereMonth('start_date', now()->month)
                ->whereYear('start_date', now()->year)
                ->sum('total_days'),
        ];
    }

    /**
     * Export leaves to CSV
     */
    public function export(Request $request, ExportService $exportService)
    {
        $status = $request->get('status');
        $leaveTypeId = $request->get('leave_type_id');
        $unitId = $request->get('unit_id');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Leave::with(['employee.organizationUnit', 'leaveType', 'approver'])
            ->latest('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($leaveTypeId) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        if ($startDate) {
            $query->where('start_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('end_date', '<=', $endDate);
        }

        $data = $query->get()->map(function ($leave) {
            $statusLabels = [
                'pending' => 'Menunggu',
                'approved' => 'Disetujui',
                'rejected' => 'Ditolak',
                'cancelled' => 'Dibatalkan',
            ];

            return [
                'employee_id' => $leave->employee->employee_id,
                'employee_name' => $leave->employee->first_name . ' ' . ($leave->employee->last_name ?? ''),
                'organization_unit' => $leave->employee->organizationUnit?->name ?? '-',
                'leave_type' => $leave->leaveType->name,
                'start_date' => $leave->start_date->format('d/m/Y'),
                'end_date' => $leave->end_date->format('d/m/Y'),
                'total_days' => $leave->total_days,
                'reason' => $leave->reason,
                'status' => $statusLabels[$leave->status] ?? $leave->status,
                'approved_by' => $leave->approver ? ($leave->approver->name ?? '-') : '-',
                'approved_at' => $leave->approved_at?->format('d/m/Y H:i') ?? '-',
                'rejection_reason' => $leave->rejection_reason ?? '-',
            ];
        });

        $headers = [
            'employee_id' => 'NIP',
            'employee_name' => 'Nama Karyawan',
            'organization_unit' => 'Unit Organisasi',
            'leave_type' => 'Jenis Cuti',
            'start_date' => 'Tanggal Mulai',
            'end_date' => 'Tanggal Selesai',
            'total_days' => 'Jumlah Hari',
            'reason' => 'Alasan',
            'status' => 'Status',
            'approved_by' => 'Disetujui Oleh',
            'approved_at' => 'Tanggal Persetujuan',
            'rejection_reason' => 'Alasan Penolakan',
        ];

        $filename = 'pengajuan_cuti_' . now()->format('Y-m-d') . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }
}
