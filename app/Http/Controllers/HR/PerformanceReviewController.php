<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\KpiCategory;
use App\Models\HR\KpiTemplate;
use App\Models\HR\PerformancePeriod;
use App\Models\HR\PerformanceReview;
use App\Models\HR\PerformanceReviewItem;
use App\Models\OrganizationUnit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PerformanceReviewController extends Controller
{
    /**
     * Display listing of performance reviews
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $periodId = $request->get('period_id');
        $status = $request->get('status');
        $unitId = $request->get('unit_id');
        $perPage = $request->get('per_page', 25);

        $query = PerformanceReview::with(['employee.organizationUnit', 'period', 'reviewer'])
            ->latest('updated_at');

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($periodId) {
            $query->where('period_id', $periodId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $reviews = $query->paginate($perPage);

        $reviews->through(fn($review) => [
            'id' => $review->id,
            'employee' => [
                'id' => $review->employee->id,
                'employee_id' => $review->employee->employee_id,
                'name' => $review->employee->first_name . ' ' . ($review->employee->last_name ?? ''),
                'organization_unit' => $review->employee->organizationUnit?->name,
            ],
            'period' => [
                'id' => $review->period->id,
                'name' => $review->period->name,
            ],
            'status' => $review->status,
            'status_label' => $review->status_label,
            'self_score' => $review->self_score,
            'manager_score' => $review->manager_score,
            'final_score' => $review->final_score,
            'final_grade' => $review->final_grade,
            'reviewer_name' => $review->reviewer?->name,
        ]);

        $periods = PerformancePeriod::orderBy('start_date', 'desc')->get(['id', 'name']);
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        // Stats
        $stats = [
            'total' => PerformanceReview::count(),
            'completed' => PerformanceReview::where('status', 'completed')->count(),
            'in_progress' => PerformanceReview::whereIn('status', ['self_review', 'manager_review', 'calibration'])->count(),
            'draft' => PerformanceReview::where('status', 'draft')->count(),
        ];

        return Inertia::render('HR/performance/review/index', [
            'reviews' => $reviews,
            'periods' => $periods,
            'units' => $units,
            'statuses' => PerformanceReview::STATUSES,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'period_id' => $periodId,
                'status' => $status,
                'unit_id' => $unitId,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create review
     */
    public function create(Request $request)
    {
        $periodId = $request->get('period_id');
        $employeeId = $request->get('employee_id');

        $periods = PerformancePeriod::whereIn('status', ['active', 'draft'])
            ->orderBy('start_date', 'desc')
            ->get(['id', 'name', 'type', 'status']);

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name'])
            ->map(fn($e) => [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->first_name . ' ' . ($e->last_name ?? ''),
            ]);

        $categories = KpiCategory::active()
            ->with(['templates' => fn($q) => $q->active()])
            ->ordered()
            ->get();

        return Inertia::render('HR/performance/review/form', [
            'periods' => $periods,
            'employees' => $employees,
            'categories' => $categories,
            'measurementTypes' => KpiTemplate::MEASUREMENT_TYPES,
            'review' => null,
            'preselectedPeriodId' => $periodId,
            'preselectedEmployeeId' => $employeeId,
        ]);
    }

    /**
     * Store new review
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_id' => 'required|exists:performance_periods,id',
            'items' => 'required|array|min:1',
            'items.*.category_id' => 'required|exists:kpi_categories,id',
            'items.*.template_id' => 'nullable|exists:kpi_templates,id',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.measurement_type' => 'required|in:' . implode(',', array_keys(KpiTemplate::MEASUREMENT_TYPES)),
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.target' => 'nullable|numeric',
            'items.*.weight' => 'required|integer|min:1',
        ]);

        // Check if review already exists for this employee and period
        $existing = PerformanceReview::where('employee_id', $validated['employee_id'])
            ->where('period_id', $validated['period_id'])
            ->exists();

        if ($existing) {
            return back()->withErrors(['employee_id' => 'Penilaian untuk karyawan ini pada periode tersebut sudah ada']);
        }

        DB::transaction(function () use ($validated) {
            $review = PerformanceReview::create([
                'employee_id' => $validated['employee_id'],
                'period_id' => $validated['period_id'],
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                PerformanceReviewItem::create([
                    'review_id' => $review->id,
                    'category_id' => $item['category_id'],
                    'template_id' => $item['template_id'] ?? null,
                    'name' => $item['name'],
                    'description' => $item['description'] ?? null,
                    'measurement_type' => $item['measurement_type'],
                    'unit' => $item['unit'] ?? null,
                    'target' => $item['target'] ?? null,
                    'weight' => $item['weight'],
                ]);
            }
        });

        return redirect()->route('hr.performance-reviews.index')
            ->with('success', 'Penilaian kinerja berhasil dibuat');
    }

    /**
     * Show review detail
     */
    public function show(PerformanceReview $performanceReview)
    {
        $performanceReview->load([
            'employee.organizationUnit',
            'period',
            'reviewer',
            'items.category',
            'goals',
        ]);

        $itemsByCategory = $performanceReview->items
            ->groupBy('category_id')
            ->map(function ($items, $categoryId) {
                $category = $items->first()->category;
                return [
                    'category' => [
                        'id' => $category->id,
                        'name' => $category->name,
                        'code' => $category->code,
                    ],
                    'items' => $items->map(fn($item) => [
                        'id' => $item->id,
                        'name' => $item->name,
                        'description' => $item->description,
                        'measurement_type' => $item->measurement_type,
                        'measurement_type_label' => $item->measurement_type_label,
                        'unit' => $item->unit,
                        'target' => $item->target,
                        'actual' => $item->actual,
                        'weight' => $item->weight,
                        'self_score' => $item->self_score,
                        'manager_score' => $item->manager_score,
                        'final_score' => $item->final_score,
                        'self_comment' => $item->self_comment,
                        'manager_comment' => $item->manager_comment,
                        'achievement_percentage' => $item->achievement_percentage,
                    ])->values(),
                ];
            })->values();

        return Inertia::render('HR/performance/review/show', [
            'review' => [
                'id' => $performanceReview->id,
                'employee' => [
                    'id' => $performanceReview->employee->id,
                    'employee_id' => $performanceReview->employee->employee_id,
                    'name' => $performanceReview->employee->first_name . ' ' . ($performanceReview->employee->last_name ?? ''),
                    'organization_unit' => $performanceReview->employee->organizationUnit?->name,
                ],
                'period' => [
                    'id' => $performanceReview->period->id,
                    'name' => $performanceReview->period->name,
                    'start_date' => $performanceReview->period->start_date->format('d M Y'),
                    'end_date' => $performanceReview->period->end_date->format('d M Y'),
                ],
                'reviewer_name' => $performanceReview->reviewer?->name,
                'status' => $performanceReview->status,
                'status_label' => $performanceReview->status_label,
                'self_score' => $performanceReview->self_score,
                'manager_score' => $performanceReview->manager_score,
                'final_score' => $performanceReview->final_score,
                'final_grade' => $performanceReview->final_grade,
                'grade_label' => $performanceReview->grade_label,
                'employee_notes' => $performanceReview->employee_notes,
                'manager_notes' => $performanceReview->manager_notes,
                'strengths' => $performanceReview->strengths,
                'improvements' => $performanceReview->improvements,
                'development_plan' => $performanceReview->development_plan,
                'self_reviewed_at' => $performanceReview->self_reviewed_at?->format('d M Y H:i'),
                'manager_reviewed_at' => $performanceReview->manager_reviewed_at?->format('d M Y H:i'),
                'completed_at' => $performanceReview->completed_at?->format('d M Y H:i'),
                'can_self_review' => $performanceReview->can_self_review,
                'can_manager_review' => $performanceReview->can_manager_review,
            ],
            'itemsByCategory' => $itemsByCategory,
            'goals' => $performanceReview->goals->map(fn($goal) => [
                'id' => $goal->id,
                'title' => $goal->title,
                'description' => $goal->description,
                'status' => $goal->status,
                'status_label' => $goal->status_label,
                'progress' => $goal->progress,
                'due_date' => $goal->due_date?->format('d M Y'),
                'is_overdue' => $goal->is_overdue,
            ]),
        ]);
    }

    /**
     * Submit self review
     */
    public function submitSelfReview(Request $request, PerformanceReview $performanceReview)
    {
        if (!$performanceReview->can_self_review) {
            return back()->with('error', 'Self review tidak dapat dilakukan pada status saat ini');
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:performance_review_items,id',
            'items.*.actual' => 'nullable|numeric',
            'items.*.self_score' => 'required|numeric|min:0|max:100',
            'items.*.self_comment' => 'nullable|string',
            'employee_notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $performanceReview) {
            foreach ($validated['items'] as $itemData) {
                PerformanceReviewItem::where('id', $itemData['id'])
                    ->where('review_id', $performanceReview->id)
                    ->update([
                        'actual' => $itemData['actual'] ?? null,
                        'self_score' => $itemData['self_score'],
                        'self_comment' => $itemData['self_comment'] ?? null,
                    ]);
            }

            $selfScore = $performanceReview->calculateSelfScore();

            $performanceReview->update([
                'self_score' => $selfScore,
                'employee_notes' => $validated['employee_notes'] ?? null,
                'self_reviewed_at' => now(),
                'status' => 'self_review',
            ]);
        });

        return back()->with('success', 'Self review berhasil disimpan');
    }

    /**
     * Submit manager review
     */
    public function submitManagerReview(Request $request, PerformanceReview $performanceReview)
    {
        if (!$performanceReview->can_manager_review) {
            return back()->with('error', 'Manager review tidak dapat dilakukan pada status saat ini');
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:performance_review_items,id',
            'items.*.manager_score' => 'required|numeric|min:0|max:100',
            'items.*.manager_comment' => 'nullable|string',
            'manager_notes' => 'nullable|string',
            'strengths' => 'nullable|string',
            'improvements' => 'nullable|string',
            'development_plan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $performanceReview) {
            foreach ($validated['items'] as $itemData) {
                $item = PerformanceReviewItem::where('id', $itemData['id'])
                    ->where('review_id', $performanceReview->id)
                    ->first();

                if ($item) {
                    $item->update([
                        'manager_score' => $itemData['manager_score'],
                        'final_score' => $itemData['manager_score'], // Use manager score as final
                        'manager_comment' => $itemData['manager_comment'] ?? null,
                    ]);
                }
            }

            $managerScore = $performanceReview->calculateManagerScore();
            $finalGrade = $performanceReview->determineGrade($managerScore);

            $performanceReview->update([
                'manager_score' => $managerScore,
                'final_score' => $managerScore,
                'final_grade' => $finalGrade,
                'manager_notes' => $validated['manager_notes'] ?? null,
                'strengths' => $validated['strengths'] ?? null,
                'improvements' => $validated['improvements'] ?? null,
                'development_plan' => $validated['development_plan'] ?? null,
                'manager_reviewed_at' => now(),
                'reviewer_id' => Auth::id(),
                'status' => 'manager_review',
            ]);
        });

        return back()->with('success', 'Manager review berhasil disimpan');
    }

    /**
     * Complete review
     */
    public function complete(PerformanceReview $performanceReview)
    {
        if ($performanceReview->status !== 'manager_review' && $performanceReview->status !== 'calibration') {
            return back()->with('error', 'Penilaian tidak dapat diselesaikan pada status saat ini');
        }

        $performanceReview->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Penilaian berhasil diselesaikan');
    }

    /**
     * Delete review
     */
    public function destroy(PerformanceReview $performanceReview)
    {
        if ($performanceReview->status === 'completed') {
            return back()->with('error', 'Penilaian yang sudah selesai tidak dapat dihapus');
        }

        $performanceReview->delete();

        return redirect()->route('hr.performance-reviews.index')
            ->with('success', 'Penilaian berhasil dihapus');
    }

    /**
     * Export reviews to CSV
     */
    public function export(Request $request, ExportService $exportService)
    {
        $periodId = $request->get('period_id');
        $status = $request->get('status');
        $unitId = $request->get('unit_id');

        $query = PerformanceReview::with(['employee.organizationUnit', 'period', 'reviewer'])
            ->orderBy('updated_at', 'desc');

        if ($periodId) {
            $query->where('period_id', $periodId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $data = $query->get()->map(fn($review) => [
            'employee_id' => $review->employee->employee_id,
            'employee_name' => $review->employee->first_name . ' ' . ($review->employee->last_name ?? ''),
            'organization_unit' => $review->employee->organizationUnit?->name ?? '-',
            'period' => $review->period->name,
            'status' => $review->status_label,
            'self_score' => $review->self_score ?? '-',
            'manager_score' => $review->manager_score ?? '-',
            'final_score' => $review->final_score ?? '-',
            'final_grade' => $review->final_grade ?? '-',
            'reviewer' => $review->reviewer?->name ?? '-',
            'completed_at' => $review->completed_at?->format('d/m/Y H:i') ?? '-',
        ]);

        $headers = [
            'employee_id' => 'NIP',
            'employee_name' => 'Nama Karyawan',
            'organization_unit' => 'Unit Organisasi',
            'period' => 'Periode',
            'status' => 'Status',
            'self_score' => 'Nilai Self Review',
            'manager_score' => 'Nilai Atasan',
            'final_score' => 'Nilai Akhir',
            'final_grade' => 'Grade',
            'reviewer' => 'Penilai',
            'completed_at' => 'Tanggal Selesai',
        ];

        $filename = 'penilaian_kinerja_' . now()->format('Y-m-d') . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }
}
