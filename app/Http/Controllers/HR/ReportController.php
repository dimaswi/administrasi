<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\Attendance;
use App\Models\HR\Leave;
use App\Models\HR\Training;
use App\Models\HR\EmployeeTraining;
use App\Models\HR\PerformanceReview;
use App\Models\HR\PerformancePeriod;
use App\Models\OrganizationUnit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Reports Hub - Main reports page
     */
    public function index()
    {
        $currentMonth = now()->format('Y-m');
        $currentYear = now()->year;

        // Quick stats
        $stats = [
            'total_employees' => Employee::where('status', 'active')->count(),
            'leaves_this_month' => Leave::whereMonth('start_date', now()->month)
                ->whereYear('start_date', $currentYear)
                ->count(),
            'trainings_this_month' => EmployeeTraining::whereMonth('start_date', now()->month)
                ->whereYear('start_date', $currentYear)
                ->count(),
            'reviews_active' => PerformanceReview::whereHas('period', fn($q) => $q->where('is_current', true))
                ->count(),
        ];

        return Inertia::render('HR/report/index', [
            'stats' => $stats,
        ]);
    }

    /**
     * Leave Report
     */
    public function leaveReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month');
        $unitId = $request->get('unit_id');
        $leaveTypeId = $request->get('leave_type_id');
        $status = $request->get('status');

        $query = Leave::query()
            ->with([
                'employee:id,employee_id,first_name,last_name,organization_unit_id',
                'employee.organizationUnit:id,name',
                'leaveType:id,name,code',
                'approver:id,name',
            ])
            ->whereYear('start_date', $year);

        if ($month) {
            $query->whereMonth('start_date', $month);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        if ($leaveTypeId) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $leaves = $query->orderBy('start_date', 'desc')->get();

        // Summary statistics
        $summary = [
            'total_requests' => $leaves->count(),
            'approved' => $leaves->where('status', 'approved')->count(),
            'pending' => $leaves->where('status', 'pending')->count(),
            'rejected' => $leaves->where('status', 'rejected')->count(),
            'total_days' => $leaves->where('status', 'approved')->sum('total_days'),
            'by_type' => $leaves->where('status', 'approved')
                ->groupBy('leaveType.name')
                ->map(fn($items) => [
                    'count' => $items->count(),
                    'days' => $items->sum('total_days'),
                ])->toArray(),
            'by_month' => $leaves->where('status', 'approved')
                ->groupBy(fn($item) => Carbon::parse($item->start_date)->format('Y-m'))
                ->map(fn($items) => $items->sum('total_days'))
                ->toArray(),
        ];

        // Get filter options
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);
        $leaveTypes = \App\Models\HR\LeaveType::where('is_active', true)->get(['id', 'name', 'code']);

        return Inertia::render('HR/report/leave', [
            'leaves' => $leaves->map(fn($leave) => [
                'id' => $leave->id,
                'employee' => [
                    'id' => $leave->employee->id,
                    'employee_id' => $leave->employee->employee_id,
                    'name' => $leave->employee->first_name . ' ' . ($leave->employee->last_name ?? ''),
                    'unit' => $leave->employee->organizationUnit?->name,
                ],
                'leave_type' => $leave->leaveType?->name,
                'start_date' => $leave->start_date,
                'end_date' => $leave->end_date,
                'total_days' => $leave->total_days,
                'reason' => $leave->reason,
                'status' => $leave->status,
                'approver' => $leave->approver?->name,
                'approved_at' => $leave->approved_at,
            ]),
            'summary' => $summary,
            'units' => $units,
            'leaveTypes' => $leaveTypes,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'unit_id' => $unitId,
                'leave_type_id' => $leaveTypeId,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Export Leave Report
     */
    public function exportLeaveReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month');
        $unitId = $request->get('unit_id');
        $status = $request->get('status');

        $query = Leave::query()
            ->with([
                'employee:id,employee_id,first_name,last_name,organization_unit_id',
                'employee.organizationUnit:id,name',
                'leaveType:id,name',
                'approver:id,name',
            ])
            ->whereYear('start_date', $year);

        if ($month) {
            $query->whereMonth('start_date', $month);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        if ($status) {
            $query->where('status', $status);
        }

        $leaves = $query->orderBy('start_date', 'desc')->get();

        $headers = [
            'employee.employee_id' => 'NIP',
            'employee.name' => 'Nama Karyawan',
            'employee.unit' => 'Unit',
            'leave_type' => 'Jenis Cuti',
            'start_date' => 'Tanggal Mulai',
            'end_date' => 'Tanggal Selesai',
            'total_days' => 'Jumlah Hari',
            'reason' => 'Alasan',
            'status' => 'Status',
            'approver' => 'Disetujui Oleh',
        ];

        $data = $leaves->map(fn($leave) => [
            'employee' => [
                'employee_id' => $leave->employee->employee_id,
                'name' => $leave->employee->first_name . ' ' . ($leave->employee->last_name ?? ''),
                'unit' => $leave->employee->organizationUnit?->name ?? '-',
            ],
            'leave_type' => $leave->leaveType?->name ?? '-',
            'start_date' => $leave->start_date,
            'end_date' => $leave->end_date,
            'total_days' => $leave->total_days,
            'reason' => $leave->reason ?? '-',
            'status' => ucfirst($leave->status),
            'approver' => $leave->approver?->name ?? '-',
        ]);

        $filename = "laporan_cuti_{$year}" . ($month ? "_{$month}" : '') . ".csv";

        return $this->exportService->exportToCsv($data, $headers, $filename);
    }

    /**
     * Training Report
     */
    public function trainingReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month');
        $trainingId = $request->get('training_id');
        $status = $request->get('status');
        $category = $request->get('category');

        $query = EmployeeTraining::query()
            ->with([
                'employee:id,employee_id,first_name,last_name,organization_unit_id',
                'employee.organizationUnit:id,name',
                'training:id,code,name,category,type,duration_hours',
            ])
            ->whereYear('start_date', $year);

        if ($month) {
            $query->whereMonth('start_date', $month);
        }

        if ($trainingId) {
            $query->where('training_id', $trainingId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($category) {
            $query->whereHas('training', fn($q) => $q->where('category', $category));
        }

        $trainings = $query->orderBy('start_date', 'desc')->get();

        // Summary statistics
        $summary = [
            'total_participants' => $trainings->count(),
            'completed' => $trainings->where('status', 'completed')->count(),
            'in_progress' => $trainings->where('status', 'in_progress')->count(),
            'registered' => $trainings->where('status', 'registered')->count(),
            'failed' => $trainings->where('status', 'failed')->count(),
            'average_score' => round($trainings->where('status', 'completed')->avg('score') ?? 0, 2),
            'total_hours' => $trainings->where('status', 'completed')
                ->sum(fn($t) => $t->training?->duration_hours ?? 0),
            'by_category' => $trainings
                ->groupBy('training.category')
                ->map(fn($items) => $items->count())
                ->toArray(),
            'by_status' => $trainings
                ->groupBy('status')
                ->map(fn($items) => $items->count())
                ->toArray(),
        ];

        // Get filter options
        $trainingOptions = Training::where('is_active', true)->get(['id', 'code', 'name']);
        $categories = Training::distinct()->pluck('category')->filter();

        return Inertia::render('HR/report/training', [
            'trainings' => $trainings->map(fn($et) => [
                'id' => $et->id,
                'employee' => [
                    'id' => $et->employee->id,
                    'employee_id' => $et->employee->employee_id,
                    'name' => $et->employee->first_name . ' ' . ($et->employee->last_name ?? ''),
                    'unit' => $et->employee->organizationUnit?->name,
                ],
                'training' => [
                    'code' => $et->training?->code,
                    'name' => $et->training?->name,
                    'category' => $et->training?->category,
                    'type' => $et->training?->type,
                    'duration_hours' => $et->training?->duration_hours,
                ],
                'start_date' => $et->start_date,
                'end_date' => $et->end_date,
                'status' => $et->status,
                'score' => $et->score,
                'grade' => $et->grade,
                'certificate_number' => $et->certificate_number,
            ]),
            'summary' => $summary,
            'trainingOptions' => $trainingOptions,
            'categories' => $categories,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'training_id' => $trainingId,
                'status' => $status,
                'category' => $category,
            ],
        ]);
    }

    /**
     * Export Training Report
     */
    public function exportTrainingReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month');
        $trainingId = $request->get('training_id');
        $status = $request->get('status');

        $query = EmployeeTraining::query()
            ->with([
                'employee:id,employee_id,first_name,last_name',
                'training:id,code,name,category,type',
            ])
            ->whereYear('start_date', $year);

        if ($month) {
            $query->whereMonth('start_date', $month);
        }

        if ($trainingId) {
            $query->where('training_id', $trainingId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $trainings = $query->orderBy('start_date', 'desc')->get();

        $headers = [
            'employee.employee_id' => 'NIP',
            'employee.name' => 'Nama Karyawan',
            'training.code' => 'Kode Training',
            'training.name' => 'Nama Training',
            'training.category' => 'Kategori',
            'start_date' => 'Tanggal Mulai',
            'end_date' => 'Tanggal Selesai',
            'status' => 'Status',
            'score' => 'Nilai',
            'grade' => 'Grade',
            'certificate_number' => 'No. Sertifikat',
        ];

        $data = $trainings->map(fn($et) => [
            'employee' => [
                'employee_id' => $et->employee->employee_id,
                'name' => $et->employee->first_name . ' ' . ($et->employee->last_name ?? ''),
            ],
            'training' => [
                'code' => $et->training?->code ?? '-',
                'name' => $et->training?->name ?? '-',
                'category' => $et->training?->category ?? '-',
            ],
            'start_date' => $et->start_date ?? '-',
            'end_date' => $et->end_date ?? '-',
            'status' => ucfirst(str_replace('_', ' ', $et->status)),
            'score' => $et->score ?? '-',
            'grade' => $et->grade ?? '-',
            'certificate_number' => $et->certificate_number ?? '-',
        ]);

        $filename = "laporan_training_{$year}" . ($month ? "_{$month}" : '') . ".csv";

        return $this->exportService->exportToCsv($data, $headers, $filename);
    }

    /**
     * Performance Report
     */
    public function performanceReport(Request $request)
    {
        $periodId = $request->get('period_id');
        $unitId = $request->get('unit_id');
        $status = $request->get('status');

        // Get current or selected period
        $period = $periodId 
            ? PerformancePeriod::find($periodId)
            : PerformancePeriod::where('is_current', true)->first();

        if (!$period) {
            $period = PerformancePeriod::latest()->first();
        }

        $query = PerformanceReview::query()
            ->with([
                'employee:id,employee_id,first_name,last_name,organization_unit_id',
                'employee.organizationUnit:id,name',
                'reviewer:id,name',
            ])
            ->where('period_id', $period?->id);

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        if ($status) {
            $query->where('status', $status);
        }

        $reviews = $query->orderBy('final_score', 'desc')->get();

        // Summary statistics
        $summary = [
            'total_reviews' => $reviews->count(),
            'completed' => $reviews->where('status', 'completed')->count(),
            'in_progress' => $reviews->whereIn('status', ['draft', 'self_review', 'manager_review'])->count(),
            'average_score' => round($reviews->where('status', 'completed')->avg('final_score') ?? 0, 2),
            'by_grade' => $reviews->where('status', 'completed')
                ->groupBy('final_grade')
                ->map(fn($items) => $items->count())
                ->toArray(),
            'by_status' => $reviews
                ->groupBy('status')
                ->map(fn($items) => $items->count())
                ->toArray(),
            'score_distribution' => [
                '90-100' => $reviews->where('status', 'completed')->filter(fn($r) => $r->final_score >= 90)->count(),
                '80-89' => $reviews->where('status', 'completed')->filter(fn($r) => $r->final_score >= 80 && $r->final_score < 90)->count(),
                '70-79' => $reviews->where('status', 'completed')->filter(fn($r) => $r->final_score >= 70 && $r->final_score < 80)->count(),
                '60-69' => $reviews->where('status', 'completed')->filter(fn($r) => $r->final_score >= 60 && $r->final_score < 70)->count(),
                '<60' => $reviews->where('status', 'completed')->filter(fn($r) => $r->final_score < 60)->count(),
            ],
        ];

        // Get filter options
        $periods = PerformancePeriod::orderBy('start_date', 'desc')->get(['id', 'name', 'is_current']);
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/report/performance', [
            'reviews' => $reviews->map(fn($review) => [
                'id' => $review->id,
                'employee' => [
                    'id' => $review->employee->id,
                    'employee_id' => $review->employee->employee_id,
                    'name' => $review->employee->first_name . ' ' . ($review->employee->last_name ?? ''),
                    'unit' => $review->employee->organizationUnit?->name,
                ],
                'status' => $review->status,
                'self_score' => $review->self_score,
                'manager_score' => $review->manager_score,
                'final_score' => $review->final_score,
                'final_grade' => $review->final_grade,
                'reviewer' => $review->reviewer?->name,
                'completed_at' => $review->completed_at,
            ]),
            'summary' => $summary,
            'period' => $period ? [
                'id' => $period->id,
                'name' => $period->name,
            ] : null,
            'periods' => $periods,
            'units' => $units,
            'filters' => [
                'period_id' => $periodId,
                'unit_id' => $unitId,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Export Performance Report
     */
    public function exportPerformanceReport(Request $request)
    {
        $periodId = $request->get('period_id');
        $unitId = $request->get('unit_id');
        $status = $request->get('status');

        $period = $periodId 
            ? PerformancePeriod::find($periodId)
            : PerformancePeriod::where('is_current', true)->first();

        if (!$period) {
            $period = PerformancePeriod::latest()->first();
        }

        $query = PerformanceReview::query()
            ->with([
                'employee:id,employee_id,first_name,last_name,organization_unit_id',
                'employee.organizationUnit:id,name',
                'reviewer:id,name',
            ])
            ->where('period_id', $period?->id);

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        if ($status) {
            $query->where('status', $status);
        }

        $reviews = $query->orderBy('final_score', 'desc')->get();

        $headers = [
            'employee.employee_id' => 'NIP',
            'employee.name' => 'Nama Karyawan',
            'employee.unit' => 'Unit',
            'status' => 'Status',
            'self_score' => 'Nilai Self Review',
            'manager_score' => 'Nilai Manager',
            'final_score' => 'Nilai Akhir',
            'final_grade' => 'Grade',
            'reviewer' => 'Reviewer',
        ];

        $data = $reviews->map(fn($review) => [
            'employee' => [
                'employee_id' => $review->employee->employee_id,
                'name' => $review->employee->first_name . ' ' . ($review->employee->last_name ?? ''),
                'unit' => $review->employee->organizationUnit?->name ?? '-',
            ],
            'status' => ucfirst(str_replace('_', ' ', $review->status)),
            'self_score' => $review->self_score ?? '-',
            'manager_score' => $review->manager_score ?? '-',
            'final_score' => $review->final_score ?? '-',
            'final_grade' => $review->final_grade ?? '-',
            'reviewer' => $review->reviewer?->name ?? '-',
        ]);

        $periodName = $period ? str_replace(' ', '_', $period->name) : 'all';
        $filename = "laporan_kinerja_{$periodName}.csv";

        return $this->exportService->exportToCsv($data, $headers, $filename);
    }

    /**
     * Employee Report - Summary per employee
     */
    public function employeeReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $unitId = $request->get('unit_id');
        $status = $request->get('status', 'active');

        $query = Employee::query()
            ->with([
                'organizationUnit:id,name',
                'jobCategory:id,name',
                'employmentStatus:id,name',
            ])
            ->withCount([
                'attendances as attendance_count' => fn($q) => $q->whereYear('date', $year),
                'leaves as leave_count' => fn($q) => $q->whereYear('start_date', $year)->where('status', 'approved'),
                'employeeTrainings as training_count' => fn($q) => $q->whereYear('start_date', $year),
                'performanceReviews as review_count' => fn($q) => $q->whereYear('created_at', $year),
            ])
            ->withSum([
                'leaves as total_leave_days' => fn($q) => $q->whereYear('start_date', $year)->where('status', 'approved')
            ], 'total_days');

        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $employees = $query->orderBy('first_name')->get();

        // Summary
        $summary = [
            'total_employees' => $employees->count(),
            'by_unit' => $employees->groupBy('organizationUnit.name')
                ->map(fn($items) => $items->count())
                ->toArray(),
            'by_status' => $employees->groupBy('status')
                ->map(fn($items) => $items->count())
                ->toArray(),
        ];

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/report/employee', [
            'employees' => $employees->map(fn($emp) => [
                'id' => $emp->id,
                'employee_id' => $emp->employee_id,
                'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
                'unit' => $emp->organizationUnit?->name,
                'job_category' => $emp->jobCategory?->name,
                'employment_status' => $emp->employmentStatus?->name,
                'status' => $emp->status,
                'join_date' => $emp->join_date,
                'attendance_count' => $emp->attendance_count ?? 0,
                'leave_count' => $emp->leave_count ?? 0,
                'total_leave_days' => $emp->total_leave_days ?? 0,
                'training_count' => $emp->training_count ?? 0,
                'review_count' => $emp->review_count ?? 0,
            ]),
            'summary' => $summary,
            'units' => $units,
            'filters' => [
                'year' => $year,
                'unit_id' => $unitId,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Export Employee Report
     */
    public function exportEmployeeReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $unitId = $request->get('unit_id');
        $status = $request->get('status', 'active');

        $query = Employee::query()
            ->with([
                'organizationUnit:id,name',
                'jobCategory:id,name',
            ])
            ->withCount([
                'attendances as attendance_count' => fn($q) => $q->whereYear('date', $year),
                'leaves as leave_count' => fn($q) => $q->whereYear('start_date', $year)->where('status', 'approved'),
                'employeeTrainings as training_count' => fn($q) => $q->whereYear('start_date', $year),
            ])
            ->withSum([
                'leaves as total_leave_days' => fn($q) => $q->whereYear('start_date', $year)->where('status', 'approved')
            ], 'total_days');

        if ($unitId) {
            $query->where('organization_unit_id', $unitId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $employees = $query->orderBy('first_name')->get();

        $headers = [
            'employee_id' => 'NIP',
            'name' => 'Nama',
            'unit' => 'Unit',
            'job_category' => 'Jabatan',
            'status' => 'Status',
            'join_date' => 'Tanggal Bergabung',
            'attendance_count' => 'Jumlah Kehadiran',
            'leave_count' => 'Jumlah Cuti',
            'total_leave_days' => 'Total Hari Cuti',
            'training_count' => 'Jumlah Training',
        ];

        $data = $employees->map(fn($emp) => [
            'employee_id' => $emp->employee_id,
            'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
            'unit' => $emp->organizationUnit?->name ?? '-',
            'job_category' => $emp->jobCategory?->name ?? '-',
            'status' => ucfirst($emp->status),
            'join_date' => $emp->join_date ?? '-',
            'attendance_count' => $emp->attendance_count ?? 0,
            'leave_count' => $emp->leave_count ?? 0,
            'total_leave_days' => $emp->total_leave_days ?? 0,
            'training_count' => $emp->training_count ?? 0,
        ]);

        $filename = "laporan_karyawan_{$year}.csv";

        return $this->exportService->exportToCsv($data, $headers, $filename);
    }

    /**
     * Turnover Report
     */
    public function turnoverReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $unitId = $request->get('unit_id');
        $type = $request->get('type'); // resignation, termination, new_hire

        // Get employees who joined this year
        $newHires = Employee::query()
            ->with(['organizationUnit:id,name', 'jobCategory:id,name'])
            ->whereYear('join_date', $year)
            ->when($unitId, fn($q) => $q->where('organization_unit_id', $unitId))
            ->orderBy('join_date', 'desc')
            ->get();

        // Get employees who left this year (resign, termination)
        $separations = Employee::query()
            ->with(['organizationUnit:id,name', 'jobCategory:id,name'])
            ->whereIn('status', ['resigned', 'terminated'])
            ->whereNotNull('termination_date')
            ->whereYear('termination_date', $year)
            ->when($unitId, fn($q) => $q->where('organization_unit_id', $unitId))
            ->orderBy('termination_date', 'desc')
            ->get();

        // Get total active employees for turnover rate calculation
        $totalEmployeesStartYear = Employee::query()
            ->where(function ($q) use ($year) {
                $q->where('join_date', '<', "{$year}-01-01")
                    ->where(function ($q2) use ($year) {
                        $q2->whereNull('termination_date')
                            ->orWhere('termination_date', '>=', "{$year}-01-01");
                    });
            })
            ->when($unitId, fn($q) => $q->where('organization_unit_id', $unitId))
            ->count();

        $totalEmployeesEndYear = Employee::query()
            ->where('join_date', '<=', "{$year}-12-31")
            ->where(function ($q) use ($year) {
                $q->whereNull('termination_date')
                    ->orWhere('termination_date', '>', "{$year}-12-31");
            })
            ->when($unitId, fn($q) => $q->where('organization_unit_id', $unitId))
            ->count();

        $avgEmployees = ($totalEmployeesStartYear + $totalEmployeesEndYear) / 2;

        // Monthly data for chart
        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthDate = Carbon::create($year, $month, 1);
            $monthNewHires = $newHires->filter(fn($e) => Carbon::parse($e->join_date)->month === $month)->count();
            $monthSeparations = $separations->filter(fn($e) => Carbon::parse($e->termination_date)->month === $month)->count();
            
            $monthlyData[] = [
                'month' => $monthDate->translatedFormat('M'),
                'month_num' => $month,
                'new_hires' => $monthNewHires,
                'separations' => $monthSeparations,
                'net' => $monthNewHires - $monthSeparations,
            ];
        }

        // Separations by reason
        $separationsByReason = $separations->groupBy('termination_reason')
            ->map(fn($items) => $items->count())
            ->toArray();

        // By unit
        $separationsByUnit = $separations->groupBy('organizationUnit.name')
            ->map(fn($items) => $items->count())
            ->toArray();

        $newHiresByUnit = $newHires->groupBy('organizationUnit.name')
            ->map(fn($items) => $items->count())
            ->toArray();

        // Calculate turnover rates
        $turnoverRate = $avgEmployees > 0 
            ? round(($separations->count() / $avgEmployees) * 100, 2) 
            : 0;

        $voluntaryTurnover = $avgEmployees > 0 
            ? round(($separations->where('status', 'resigned')->count() / $avgEmployees) * 100, 2) 
            : 0;

        $involuntaryTurnover = $avgEmployees > 0 
            ? round(($separations->where('status', 'terminated')->count() / $avgEmployees) * 100, 2) 
            : 0;

        $summary = [
            'total_new_hires' => $newHires->count(),
            'total_separations' => $separations->count(),
            'resignations' => $separations->where('status', 'resigned')->count(),
            'terminations' => $separations->where('status', 'terminated')->count(),
            'net_change' => $newHires->count() - $separations->count(),
            'turnover_rate' => $turnoverRate,
            'voluntary_turnover' => $voluntaryTurnover,
            'involuntary_turnover' => $involuntaryTurnover,
            'avg_employees' => round($avgEmployees),
            'employees_start_year' => $totalEmployeesStartYear,
            'employees_end_year' => $totalEmployeesEndYear,
            'separations_by_reason' => $separationsByReason,
            'separations_by_unit' => $separationsByUnit,
            'new_hires_by_unit' => $newHiresByUnit,
            'monthly_data' => $monthlyData,
        ];

        // Filter data based on type
        $filteredData = collect();
        if ($type === 'new_hire' || !$type) {
            $filteredData = $filteredData->merge(
                $newHires->map(fn($emp) => [
                    'id' => $emp->id,
                    'employee_id' => $emp->employee_id,
                    'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
                    'unit' => $emp->organizationUnit?->name,
                    'job_category' => $emp->jobCategory?->name,
                    'type' => 'new_hire',
                    'date' => $emp->join_date,
                    'reason' => null,
                ])
            );
        }
        
        if ($type === 'resignation' || $type === 'termination' || !$type) {
            $separationsFiltered = $separations;
            if ($type === 'resignation') {
                $separationsFiltered = $separations->where('status', 'resigned');
            } elseif ($type === 'termination') {
                $separationsFiltered = $separations->where('status', 'terminated');
            }
            
            $filteredData = $filteredData->merge(
                $separationsFiltered->map(fn($emp) => [
                    'id' => $emp->id,
                    'employee_id' => $emp->employee_id,
                    'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
                    'unit' => $emp->organizationUnit?->name,
                    'job_category' => $emp->jobCategory?->name,
                    'type' => $emp->status === 'resigned' ? 'resignation' : 'termination',
                    'date' => $emp->termination_date,
                    'reason' => $emp->termination_reason,
                ])
            );
        }

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/report/turnover', [
            'data' => $filteredData->sortByDesc('date')->values(),
            'summary' => $summary,
            'units' => $units,
            'filters' => [
                'year' => (int) $year,
                'unit_id' => $unitId,
                'type' => $type,
            ],
        ]);
    }

    /**
     * Export Turnover Report
     */
    public function exportTurnoverReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $unitId = $request->get('unit_id');
        $type = $request->get('type');

        // Get data
        $newHires = Employee::query()
            ->with(['organizationUnit:id,name', 'jobCategory:id,name'])
            ->whereYear('join_date', $year)
            ->when($unitId, fn($q) => $q->where('organization_unit_id', $unitId))
            ->when($type === 'new_hire', fn($q) => $q)
            ->orderBy('join_date', 'desc')
            ->get();

        $separations = Employee::query()
            ->with(['organizationUnit:id,name', 'jobCategory:id,name'])
            ->whereIn('status', ['resigned', 'terminated'])
            ->whereNotNull('termination_date')
            ->whereYear('termination_date', $year)
            ->when($unitId, fn($q) => $q->where('organization_unit_id', $unitId))
            ->when($type === 'resignation', fn($q) => $q->where('status', 'resigned'))
            ->when($type === 'termination', fn($q) => $q->where('status', 'terminated'))
            ->orderBy('termination_date', 'desc')
            ->get();

        $data = collect();

        if ($type !== 'resignation' && $type !== 'termination') {
            $data = $data->merge(
                $newHires->map(fn($emp) => [
                    'employee_id' => $emp->employee_id,
                    'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
                    'unit' => $emp->organizationUnit?->name ?? '-',
                    'job_category' => $emp->jobCategory?->name ?? '-',
                    'type' => 'Karyawan Baru',
                    'date' => $emp->join_date,
                    'reason' => '-',
                ])
            );
        }

        if ($type !== 'new_hire') {
            $data = $data->merge(
                $separations->map(fn($emp) => [
                    'employee_id' => $emp->employee_id,
                    'name' => $emp->first_name . ' ' . ($emp->last_name ?? ''),
                    'unit' => $emp->organizationUnit?->name ?? '-',
                    'job_category' => $emp->jobCategory?->name ?? '-',
                    'type' => $emp->status === 'resigned' ? 'Resign' : 'Terminasi',
                    'date' => $emp->termination_date,
                    'reason' => $emp->termination_reason ?? '-',
                ])
            );
        }

        $headers = [
            'employee_id' => 'NIP',
            'name' => 'Nama Karyawan',
            'unit' => 'Unit',
            'job_category' => 'Jabatan',
            'type' => 'Tipe',
            'date' => 'Tanggal',
            'reason' => 'Alasan',
        ];

        $filename = "laporan_turnover_{$year}.csv";

        return $this->exportService->exportToCsv($data, $headers, $filename);
    }
}
