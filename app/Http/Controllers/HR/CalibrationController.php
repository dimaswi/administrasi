<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\CalibrationComment;
use App\Models\HR\CalibrationReview;
use App\Models\HR\CalibrationSession;
use App\Models\HR\PerformancePeriod;
use App\Models\HR\PerformanceReview;
use App\Models\OrganizationUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CalibrationController extends Controller
{
    /**
     * Display list of calibration sessions
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $periodId = $request->get('period_id');
        $perPage = $request->get('per_page', 25);

        $query = CalibrationSession::with(['period', 'facilitator'])
            ->withCount('calibrationReviews')
            ->latest('created_at');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status && $status !== '_all') {
            $query->where('status', $status);
        }

        if ($periodId && $periodId !== '_all') {
            $query->where('period_id', $periodId);
        }

        $sessions = $query->paginate($perPage);

        $sessions->through(fn($session) => [
            'id' => $session->id,
            'name' => $session->name,
            'period' => $session->period ? [
                'id' => $session->period->id,
                'name' => $session->period->name,
            ] : null,
            'status' => $session->status,
            'status_label' => $session->status_label,
            'scheduled_date' => $session->scheduled_date?->format('Y-m-d'),
            'facilitator_name' => $session->facilitator?->name,
            'reviews_count' => $session->calibration_reviews_count,
            'progress' => $session->getProgress(),
            'created_at' => $session->created_at->format('Y-m-d'),
        ]);

        $periods = PerformancePeriod::orderBy('start_date', 'desc')->get(['id', 'name']);

        // Stats
        $stats = [
            'total' => CalibrationSession::count(),
            'in_progress' => CalibrationSession::where('status', 'in_progress')->count(),
            'completed' => CalibrationSession::where('status', 'completed')->count(),
            'draft' => CalibrationSession::where('status', 'draft')->count(),
        ];

        return Inertia::render('HR/performance/calibration/index', [
            'sessions' => $sessions,
            'periods' => $periods,
            'statuses' => CalibrationSession::STATUSES,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status ?? '_all',
                'period_id' => $periodId ?? '_all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create session
     */
    public function create()
    {
        $periods = PerformancePeriod::orderBy('start_date', 'desc')
            ->get(['id', 'name', 'status']);

        $facilitators = User::whereHas('role', function ($q) {
                $q->whereIn('name', ['admin', 'hr-manager', 'manager']);
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/performance/calibration/form', [
            'periods' => $periods,
            'facilitators' => $facilitators,
            'units' => $units,
            'grades' => PerformanceReview::GRADES,
            'session' => null,
        ]);
    }

    /**
     * Store new session
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'period_id' => 'required|exists:performance_periods,id',
            'description' => 'nullable|string',
            'scheduled_date' => 'nullable|date',
            'facilitator_id' => 'nullable|exists:users,id',
            'unit_ids' => 'nullable|array',
            'unit_ids.*' => 'exists:organization_units,id',
            'include_grades' => 'nullable|array',
        ]);

        try {
            DB::beginTransaction();

            $session = CalibrationSession::create([
                'name' => $validated['name'],
                'period_id' => $validated['period_id'],
                'description' => $validated['description'] ?? null,
                'scheduled_date' => $validated['scheduled_date'] ?? null,
                'facilitator_id' => $validated['facilitator_id'] ?? null,
                'status' => 'draft',
            ]);

            // Find reviews to calibrate
            $reviewQuery = PerformanceReview::where('period_id', $validated['period_id'])
                ->whereIn('status', ['manager_review', 'calibration', 'completed'])
                ->whereNotNull('final_score');

            if (!empty($validated['unit_ids'])) {
                $reviewQuery->whereHas('employee', function ($q) use ($validated) {
                    $q->whereIn('organization_unit_id', $validated['unit_ids']);
                });
            }

            if (!empty($validated['include_grades'])) {
                $reviewQuery->whereIn('final_grade', $validated['include_grades']);
            }

            $reviews = $reviewQuery->get();

            foreach ($reviews as $review) {
                CalibrationReview::create([
                    'session_id' => $session->id,
                    'review_id' => $review->id,
                    'original_score' => $review->final_score,
                    'original_grade' => $review->final_grade,
                ]);
            }

            DB::commit();

            return redirect()->route('hr.calibration.show', $session->id)
                ->with('success', 'Sesi kalibrasi berhasil dibuat dengan ' . $reviews->count() . ' review');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat sesi: ' . $e->getMessage());
        }
    }

    /**
     * Show session detail
     */
    public function show(Request $request, CalibrationSession $calibration)
    {
        $calibration->load(['period', 'facilitator']);

        $unitId = $request->get('unit_id');
        $originalGrade = $request->get('original_grade');

        $query = CalibrationReview::with([
                'review.employee.organizationUnit',
                'calibratedByUser',
            ])
            ->where('session_id', $calibration->id);

        if ($unitId && $unitId !== '_all') {
            $query->whereHas('review.employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        if ($originalGrade && $originalGrade !== '_all') {
            $query->where('original_grade', $originalGrade);
        }

        $calibrationReviews = $query->get()->map(fn($cr) => [
            'id' => $cr->id,
            'review_id' => $cr->review_id,
            'employee' => [
                'id' => $cr->review->employee->id,
                'employee_id' => $cr->review->employee->employee_id,
                'name' => $cr->review->employee->first_name . ' ' . ($cr->review->employee->last_name ?? ''),
                'organization_unit' => $cr->review->employee->organizationUnit?->name,
            ],
            'original_score' => $cr->original_score,
            'original_grade' => $cr->original_grade,
            'calibrated_score' => $cr->calibrated_score,
            'calibrated_grade' => $cr->calibrated_grade,
            'score_change' => $cr->score_change,
            'grade_changed' => $cr->grade_changed,
            'calibration_notes' => $cr->calibration_notes,
            'calibrated_by' => $cr->calibratedByUser?->name,
            'calibrated_at' => $cr->calibrated_at?->format('Y-m-d H:i'),
        ]);

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/performance/calibration/show', [
            'session' => [
                'id' => $calibration->id,
                'name' => $calibration->name,
                'description' => $calibration->description,
                'period' => $calibration->period ? [
                    'id' => $calibration->period->id,
                    'name' => $calibration->period->name,
                ] : null,
                'status' => $calibration->status,
                'status_label' => $calibration->status_label,
                'scheduled_date' => $calibration->scheduled_date?->format('Y-m-d'),
                'facilitator_name' => $calibration->facilitator?->name,
                'progress' => $calibration->getProgress(),
                'grade_distribution' => $calibration->getGradeDistribution(),
            ],
            'calibrationReviews' => $calibrationReviews,
            'units' => $units,
            'grades' => PerformanceReview::GRADES,
            'filters' => [
                'unit_id' => $unitId ?? '_all',
                'original_grade' => $originalGrade ?? '_all',
            ],
        ]);
    }

    /**
     * Start calibration session
     */
    public function start(CalibrationSession $calibration)
    {
        if ($calibration->status !== 'draft') {
            return back()->with('error', 'Sesi sudah dimulai atau selesai');
        }

        if ($calibration->calibrationReviews()->count() === 0) {
            return back()->with('error', 'Tidak ada review untuk dikalibrasi');
        }

        $calibration->update(['status' => 'in_progress']);

        // Update all related reviews to calibration status
        $reviewIds = $calibration->calibrationReviews()->pluck('review_id');
        PerformanceReview::whereIn('id', $reviewIds)->update(['status' => 'calibration']);

        return back()->with('success', 'Sesi kalibrasi berhasil dimulai');
    }

    /**
     * Complete calibration session
     */
    public function complete(CalibrationSession $calibration)
    {
        if ($calibration->status !== 'in_progress') {
            return back()->with('error', 'Sesi belum dimulai atau sudah selesai');
        }

        $calibration->update(['status' => 'completed']);

        // Apply calibrated scores to original reviews
        foreach ($calibration->calibrationReviews as $cr) {
            if ($cr->calibrated_score !== null) {
                $cr->review->update([
                    'final_score' => $cr->calibrated_score,
                    'final_grade' => $cr->calibrated_grade,
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            } else {
                // Keep original score, just complete
                $cr->review->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            }
        }

        return back()->with('success', 'Sesi kalibrasi berhasil diselesaikan dan skor telah diaplikasikan');
    }

    /**
     * Delete calibration session
     */
    public function destroy(CalibrationSession $calibration)
    {
        if ($calibration->status === 'completed') {
            return back()->with('error', 'Sesi yang sudah selesai tidak dapat dihapus');
        }

        // Reset review status back to manager_review if in_progress
        if ($calibration->status === 'in_progress') {
            $reviewIds = $calibration->calibrationReviews()->pluck('review_id');
            PerformanceReview::whereIn('id', $reviewIds)->update(['status' => 'manager_review']);
        }

        $calibration->delete();

        return redirect()->route('hr.calibration.index')
            ->with('success', 'Sesi kalibrasi berhasil dihapus');
    }

    /**
     * Calibrate a single review
     */
    public function calibrateReview(Request $request, CalibrationReview $calibrationReview)
    {
        $session = $calibrationReview->session;
        
        if ($session->status !== 'in_progress') {
            return back()->with('error', 'Sesi tidak sedang berjalan');
        }

        $validated = $request->validate([
            'calibrated_score' => 'required|numeric|min:0|max:100',
            'calibration_notes' => 'nullable|string|max:1000',
        ]);

        $calibratedGrade = CalibrationReview::calculateGrade($validated['calibrated_score']);

        $calibrationReview->update([
            'calibrated_score' => $validated['calibrated_score'],
            'calibrated_grade' => $calibratedGrade,
            'calibration_notes' => $validated['calibration_notes'] ?? null,
            'calibrated_by' => Auth::id(),
            'calibrated_at' => now(),
        ]);

        return back()->with('success', 'Review berhasil dikalibrasi');
    }

    /**
     * Reset calibration for a review
     */
    public function resetCalibration(CalibrationReview $calibrationReview)
    {
        $session = $calibrationReview->session;
        
        if ($session->status !== 'in_progress') {
            return back()->with('error', 'Sesi tidak sedang berjalan');
        }

        $calibrationReview->update([
            'calibrated_score' => null,
            'calibrated_grade' => null,
            'calibration_notes' => null,
            'calibrated_by' => null,
            'calibrated_at' => null,
        ]);

        return back()->with('success', 'Kalibrasi berhasil direset');
    }

    /**
     * Add comment to calibration review
     */
    public function addComment(Request $request, CalibrationReview $calibrationReview)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        CalibrationComment::create([
            'calibration_review_id' => $calibrationReview->id,
            'user_id' => Auth::id(),
            'comment' => $validated['comment'],
        ]);

        return back()->with('success', 'Komentar berhasil ditambahkan');
    }

    /**
     * Get comments for a calibration review
     */
    public function getComments(CalibrationReview $calibrationReview)
    {
        $comments = $calibrationReview->comments()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'user_name' => $c->user->name,
                'comment' => $c->comment,
                'created_at' => $c->created_at->format('Y-m-d H:i'),
            ]);

        return response()->json(['comments' => $comments]);
    }
}
