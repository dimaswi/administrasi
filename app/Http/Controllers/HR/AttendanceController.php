<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Attendance;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeSchedule;
use App\Models\HR\WorkSchedule;
use App\Models\OrganizationUnit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Display attendance list (daily view)
     */
    public function index(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $unitId = $request->get('unit_id');
        $status = $request->get('status');
        $search = $request->get('search');
        $perPage = $request->get('per_page', 25);

        // Get employees with attendance for the date
        $query = Employee::query()
            ->with([
                'organizationUnit:id,name',
                'jobCategory:id,name',
                'attendances' => fn($q) => $q->whereDate('date', $date),
                'schedules' => fn($q) => $q->active(),
            ])
            ->where('status', 'active');

        // Filters
        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        $employees = $query->orderBy('first_name')->paginate($perPage);

        // Transform data
        $employees->through(function ($employee) use ($date) {
            $attendance = $employee->attendances->first();
            $schedule = $employee->schedules->first();
            $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
            $shiftKey = "{$dayOfWeek}_shift_id";
            $workScheduleId = $schedule?->$shiftKey;
            
            return [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name,
                'job_category' => $employee->jobCategory?->name,
                'attendance' => $attendance ? [
                    'id' => $attendance->id,
                    'clock_in' => $attendance->clock_in_formatted,
                    'clock_out' => $attendance->clock_out_formatted,
                    'status' => $attendance->status,
                    'status_label' => $attendance->status_label,
                    'late_minutes' => $attendance->late_minutes,
                    'is_manual_entry' => $attendance->is_manual_entry,
                    'is_approved' => $attendance->is_approved,
                    'notes' => $attendance->notes,
                ] : null,
                'is_scheduled' => $workScheduleId !== null,
                'is_day_off' => $workScheduleId === null && $schedule !== null,
            ];
        });

        // Filter by status after transform
        if ($status) {
            $employees->setCollection(
                $employees->getCollection()->filter(function ($item) use ($status) {
                    if ($status === 'present') {
                        return $item['attendance'] && in_array($item['attendance']['status'], ['present', 'late', 'early_leave', 'late_early_leave']);
                    } elseif ($status === 'absent') {
                        return !$item['attendance'] && $item['is_scheduled'];
                    } elseif ($status === 'late') {
                        return $item['attendance'] && in_array($item['attendance']['status'], ['late', 'late_early_leave']);
                    } elseif ($status === 'day_off') {
                        return $item['is_day_off'];
                    }
                    return $item['attendance']?->status === $status;
                })
            );
        }

        // Get statistics for the date
        $stats = $this->getDateStatistics($date, $unitId);

        // Get units for filter
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/attendance/index', [
            'employees' => $employees,
            'date' => $date,
            'stats' => $stats,
            'units' => $units,
            'filters' => [
                'date' => $date,
                'unit_id' => $unitId,
                'status' => $status,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create/edit attendance for specific employee
     */
    public function create(Request $request, Employee $employee)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        
        // Get existing attendance for this date
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $date)
            ->first();

        // Get employee schedule for this date
        $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
        $schedule = $employee->schedules()->active()->first();
        $shiftKey = "{$dayOfWeek}_shift";
        $workSchedule = $schedule?->$shiftKey;

        $employee->load(['organizationUnit', 'jobCategory']);

        // Get all active employees for searchable select
        $employees = Employee::where('status', 'active')
            ->with('organizationUnit:id,name')
            ->orderBy('first_name')
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->id,
                'employee_id' => $emp->employee_id,
                'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
                'organization_unit' => $emp->organizationUnit?->name,
                'job_category' => $emp->jobCategory?->name ?? null,
            ]);

        return Inertia::render('HR/attendance/form', [
            'employee' => [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name,
                'job_category' => $employee->jobCategory?->name,
            ],
            'employees' => $employees,
            'date' => $date,
            'attendance' => $attendance,
            'workSchedule' => $workSchedule ? [
                'id' => $workSchedule->id,
                'name' => $workSchedule->name,
                'clock_in_time' => substr($workSchedule->clock_in_time, 0, 5),
                'clock_out_time' => substr($workSchedule->clock_out_time, 0, 5),
            ] : null,
            'statusOptions' => Attendance::STATUS_LABELS,
        ]);
    }

    /**
     * Store attendance
     */
    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'clock_in' => 'nullable|date_format:H:i',
            'clock_out' => 'nullable|date_format:H:i',
            'status' => 'required|in:' . implode(',', array_keys(Attendance::STATUS_LABELS)),
            'notes' => 'nullable|string|max:500',
        ]);

        // Get work schedule for the day
        $dayOfWeek = strtolower(Carbon::parse($validated['date'])->format('l'));
        $schedule = $employee->schedules()->active()->first();
        $shiftKey = "{$dayOfWeek}_shift";
        $workSchedule = $schedule?->$shiftKey;

        // Check if status requires auto-calculation (present-type statuses)
        $autoCalculateStatuses = ['present', 'late', 'early_leave', 'late_early_leave'];
        $isAutoCalculate = in_array($validated['status'], $autoCalculateStatuses);

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date' => $validated['date'],
            ],
            [
                'employee_schedule_id' => $schedule?->id,
                'work_schedule_id' => $workSchedule?->id,
                'clock_in' => $validated['clock_in'],
                'clock_out' => $validated['clock_out'],
                'scheduled_clock_in' => $workSchedule?->clock_in_time,
                'scheduled_clock_out' => $workSchedule?->clock_out_time,
                'status' => $validated['status'],
                'notes' => $validated['notes'],
                'is_manual_entry' => true,
                'is_approved' => true,
            ]
        );

        // Calculate times
        if ($attendance->clock_in && $attendance->scheduled_clock_in) {
            $attendance->late_minutes = $attendance->calculateLateMinutes();
        }
        if ($attendance->clock_out && $attendance->scheduled_clock_out) {
            $attendance->early_leave_minutes = $attendance->calculateEarlyLeaveMinutes();
        }
        if ($attendance->clock_in && $attendance->clock_out) {
            $attendance->work_duration_minutes = $attendance->calculateWorkDuration();
        }
        
        // Only auto determine status for present-type entries with clock times
        // Otherwise respect user's manual status selection
        if ($isAutoCalculate && $attendance->clock_in) {
            $attendance->status = $attendance->determineStatus();
        }
        
        $attendance->save();

        return redirect()->route('hr.attendances.index', ['date' => $validated['date']])
            ->with('success', 'Data kehadiran berhasil disimpan');
    }

    /**
     * Bulk create attendance for multiple employees
     */
    public function bulkForm(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        
        $employees = Employee::with(['organizationUnit', 'jobCategory', 'schedules' => fn($q) => $q->active()])
            ->where('status', 'active')
            ->orderBy('first_name')
            ->get()
            ->map(function ($employee) use ($date) {
                $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
                $schedule = $employee->schedules->first();
                $shiftKey = "{$dayOfWeek}_shift_id";
                
                return [
                    'id' => $employee->id,
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                    'organization_unit_id' => $employee->organization_unit_id,
                    'organization_unit' => $employee->organizationUnit?->name,
                    'is_scheduled' => $schedule?->$shiftKey !== null,
                ];
            });

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);
        $workSchedules = WorkSchedule::active()->orderBy('name')->get(['id', 'code', 'name', 'clock_in_time', 'clock_out_time']);

        return Inertia::render('HR/attendance/bulk', [
            'employees' => $employees,
            'units' => $units,
            'workSchedules' => $workSchedules,
            'date' => $date,
            'statusOptions' => Attendance::STATUS_LABELS,
        ]);
    }

    /**
     * Bulk store attendance
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'clock_in' => 'nullable|date_format:H:i',
            'clock_out' => 'nullable|date_format:H:i',
            'status' => 'required|in:' . implode(',', array_keys(Attendance::STATUS_LABELS)),
            'notes' => 'nullable|string|max:500',
        ]);

        $dayOfWeek = strtolower(Carbon::parse($validated['date'])->format('l'));
        $count = 0;
        
        // Check if status requires auto-calculation
        $autoCalculateStatuses = ['present', 'late', 'early_leave', 'late_early_leave'];
        $isAutoCalculate = in_array($validated['status'], $autoCalculateStatuses);

        DB::transaction(function () use ($validated, $dayOfWeek, &$count, $isAutoCalculate) {
            foreach ($validated['employee_ids'] as $employeeId) {
                $employee = Employee::find($employeeId);
                $schedule = $employee->schedules()->active()->first();
                $shiftKey = "{$dayOfWeek}_shift";
                $workSchedule = $schedule?->$shiftKey;

                $attendance = Attendance::updateOrCreate(
                    [
                        'employee_id' => $employeeId,
                        'date' => $validated['date'],
                    ],
                    [
                        'employee_schedule_id' => $schedule?->id,
                        'work_schedule_id' => $workSchedule?->id,
                        'clock_in' => $validated['clock_in'],
                        'clock_out' => $validated['clock_out'],
                        'scheduled_clock_in' => $workSchedule?->clock_in_time,
                        'scheduled_clock_out' => $workSchedule?->clock_out_time,
                        'status' => $validated['status'],
                        'notes' => $validated['notes'],
                        'is_manual_entry' => true,
                        'is_approved' => true,
                    ]
                );
                
                // Calculate times and auto-determine status for present-type entries
                if ($attendance->clock_in && $attendance->scheduled_clock_in) {
                    $attendance->late_minutes = $attendance->calculateLateMinutes();
                }
                if ($attendance->clock_out && $attendance->scheduled_clock_out) {
                    $attendance->early_leave_minutes = $attendance->calculateEarlyLeaveMinutes();
                }
                if ($attendance->clock_in && $attendance->clock_out) {
                    $attendance->work_duration_minutes = $attendance->calculateWorkDuration();
                }
                
                // Only auto determine status for present-type entries with clock times
                if ($isAutoCalculate && $attendance->clock_in) {
                    $attendance->status = $attendance->determineStatus();
                }
                
                $attendance->save();
                $count++;
            }
        });

        return redirect()->route('hr.attendances.index', ['date' => $validated['date']])
            ->with('success', "Data kehadiran {$count} karyawan berhasil disimpan");
    }

    /**
     * Monthly report
     */
    public function report(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        $unitId = $request->get('unit_id');
        $employeeId = $request->get('employee_id');

        $startDate = Carbon::parse($month)->startOfMonth();
        $endDate = Carbon::parse($month)->endOfMonth();

        $query = Employee::query()
            ->with([
                'organizationUnit:id,name',
                'jobCategory:id,name',
                'attendances' => fn($q) => $q->whereBetween('date', [$startDate, $endDate]),
            ])
            ->where('status', 'active');

        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        if ($employeeId) {
            $query->where('id', $employeeId);
        }

        $employees = $query->orderBy('first_name')->get();

        // Build monthly summary for each employee
        $report = $employees->map(function ($employee) use ($startDate, $endDate) {
            $attendances = $employee->attendances->keyBy(fn($a) => $a->date->format('Y-m-d'));
            $days = [];
            $summary = [
                'present' => 0,
                'absent' => 0,
                'late' => 0,
                'leave' => 0,
                'sick' => 0,
                'permit' => 0,
                'total_late_minutes' => 0,
                'total_work_minutes' => 0,
            ];

            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $dateKey = $currentDate->format('Y-m-d');
                $attendance = $attendances->get($dateKey);
                
                $days[$dateKey] = $attendance ? [
                    'status' => $attendance->status,
                    'clock_in' => $attendance->clock_in_formatted,
                    'clock_out' => $attendance->clock_out_formatted,
                ] : null;

                if ($attendance) {
                    if (in_array($attendance->status, ['present', 'late', 'early_leave', 'late_early_leave'])) {
                        $summary['present']++;
                        $summary['total_work_minutes'] += $attendance->work_duration_minutes ?? 0;
                    }
                    if (in_array($attendance->status, ['late', 'late_early_leave'])) {
                        $summary['late']++;
                        $summary['total_late_minutes'] += $attendance->late_minutes;
                    }
                    if ($attendance->status === 'absent') $summary['absent']++;
                    if ($attendance->status === 'leave') $summary['leave']++;
                    if ($attendance->status === 'sick') $summary['sick']++;
                    if ($attendance->status === 'permit') $summary['permit']++;
                }

                $currentDate->addDay();
            }

            return [
                'employee' => [
                    'id' => $employee->id,
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                    'organization_unit' => $employee->organizationUnit?->name,
                    'job_category' => $employee->jobCategory?->name,
                ],
                'days' => $days,
                'summary' => $summary,
            ];
        });

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);
        $employeesList = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name']);

        return Inertia::render('HR/attendance/report', [
            'report' => $report,
            'month' => $month,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
            'units' => $units,
            'employees' => $employeesList,
            'filters' => [
                'month' => $month,
                'unit_id' => $unitId,
                'employee_id' => $employeeId,
            ],
        ]);
    }

    /**
     * Delete attendance
     */
    public function destroy(Attendance $attendance)
    {
        $date = $attendance->date->format('Y-m-d');
        $attendance->delete();

        return redirect()->route('hr.attendances.index', ['date' => $date])
            ->with('success', 'Data kehadiran berhasil dihapus');
    }

    /**
     * Get statistics for a specific date
     */
    private function getDateStatistics(string $date, ?int $unitId = null): array
    {
        $query = Employee::where('status', 'active');
        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }
        $totalEmployees = $query->count();

        $attendanceQuery = Attendance::whereDate('date', $date);
        if ($unitId) {
            $attendanceQuery->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $present = (clone $attendanceQuery)->whereIn('status', ['present', 'late', 'early_leave', 'late_early_leave'])->count();
        $late = (clone $attendanceQuery)->whereIn('status', ['late', 'late_early_leave'])->count();
        $absent = (clone $attendanceQuery)->where('status', 'absent')->count();
        $leave = (clone $attendanceQuery)->whereIn('status', ['leave', 'sick', 'permit'])->count();
        
        $notRecorded = $totalEmployees - $present - $absent - $leave;

        return [
            'total_employees' => $totalEmployees,
            'present' => $present,
            'late' => $late,
            'absent' => $absent,
            'leave' => $leave,
            'not_recorded' => max(0, $notRecorded),
            'attendance_rate' => $totalEmployees > 0 ? round(($present / $totalEmployees) * 100, 1) : 0,
        ];
    }

    /**
     * Export daily attendance to CSV
     */
    public function exportDaily(Request $request, ExportService $exportService)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $unitId = $request->get('unit_id');

        $query = Employee::query()
            ->with([
                'organizationUnit:id,name',
                'jobCategory:id,name',
                'attendances' => fn($q) => $q->whereDate('date', $date),
            ])
            ->where('status', 'active');

        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        $data = $query->orderBy('first_name')->get()->map(function ($employee) {
            $attendance = $employee->attendances->first();
            return [
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name ?? '-',
                'job_category' => $employee->jobCategory?->name ?? '-',
                'clock_in' => $attendance?->clock_in_formatted ?? '-',
                'clock_out' => $attendance?->clock_out_formatted ?? '-',
                'status' => $attendance ? Attendance::STATUS_LABELS[$attendance->status] ?? $attendance->status : 'Belum Input',
                'late_minutes' => $attendance?->late_minutes ?? 0,
                'notes' => $attendance?->notes ?? '',
            ];
        });

        $headers = [
            'employee_id' => 'NIP',
            'name' => 'Nama Karyawan',
            'organization_unit' => 'Unit Organisasi',
            'job_category' => 'Kategori Jabatan',
            'clock_in' => 'Jam Masuk',
            'clock_out' => 'Jam Keluar',
            'status' => 'Status',
            'late_minutes' => 'Terlambat (menit)',
            'notes' => 'Keterangan',
        ];

        $filename = 'kehadiran_' . $date . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }

    /**
     * Export monthly attendance report to CSV
     */
    public function exportMonthly(Request $request, ExportService $exportService)
    {
        $month = $request->get('month', now()->format('Y-m'));
        $unitId = $request->get('unit_id');

        $startDate = Carbon::parse($month)->startOfMonth();
        $endDate = Carbon::parse($month)->endOfMonth();

        $query = Employee::query()
            ->with([
                'organizationUnit:id,name',
                'jobCategory:id,name',
                'attendances' => fn($q) => $q->whereBetween('date', [$startDate, $endDate]),
            ])
            ->where('status', 'active');

        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        $data = $query->orderBy('first_name')->get()->map(function ($employee) {
            $attendances = $employee->attendances;
            $presentCount = $attendances->whereIn('status', ['present', 'late', 'early_leave', 'late_early_leave'])->count();
            $lateCount = $attendances->whereIn('status', ['late', 'late_early_leave'])->count();
            $absentCount = $attendances->where('status', 'absent')->count();
            $leaveCount = $attendances->where('status', 'leave')->count();
            $sickCount = $attendances->where('status', 'sick')->count();
            $permitCount = $attendances->where('status', 'permit')->count();
            $totalLateMinutes = $attendances->sum('late_minutes');
            $totalWorkMinutes = $attendances->sum('work_duration_minutes');

            return [
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name ?? '-',
                'job_category' => $employee->jobCategory?->name ?? '-',
                'present' => $presentCount,
                'late' => $lateCount,
                'absent' => $absentCount,
                'leave' => $leaveCount,
                'sick' => $sickCount,
                'permit' => $permitCount,
                'total_late_minutes' => $totalLateMinutes,
                'work_hours' => round($totalWorkMinutes / 60, 1),
            ];
        });

        $headers = [
            'employee_id' => 'NIP',
            'name' => 'Nama Karyawan',
            'organization_unit' => 'Unit Organisasi',
            'job_category' => 'Kategori Jabatan',
            'present' => 'Hadir',
            'late' => 'Terlambat',
            'absent' => 'Absen',
            'leave' => 'Cuti',
            'sick' => 'Sakit',
            'permit' => 'Izin',
            'total_late_minutes' => 'Total Terlambat (menit)',
            'work_hours' => 'Total Jam Kerja',
        ];

        $filename = 'rekap_kehadiran_' . $month . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }
}
