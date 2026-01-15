<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\PerformancePeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PerformancePeriodController extends Controller
{
    /**
     * Display a listing of periods
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $type = $request->get('type');
        $status = $request->get('status');
        $perPage = $request->get('per_page', 25);

        $query = PerformancePeriod::withCount('reviews')
            ->latest('start_date');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $periods = $query->paginate($perPage);

        $periods->through(fn($period) => [
            'id' => $period->id,
            'name' => $period->name,
            'type' => $period->type,
            'type_label' => $period->type_label,
            'start_date' => $period->start_date->format('Y-m-d'),
            'end_date' => $period->end_date->format('Y-m-d'),
            'start_date_formatted' => $period->start_date->format('d M Y'),
            'end_date_formatted' => $period->end_date->format('d M Y'),
            'status' => $period->status,
            'status_label' => $period->status_label,
            'is_current' => $period->is_current,
            'reviews_count' => $period->reviews_count,
        ]);

        return Inertia::render('HR/performance/period/index', [
            'periods' => $periods,
            'types' => PerformancePeriod::TYPES,
            'statuses' => PerformancePeriod::STATUSES,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('HR/performance/period/form', [
            'types' => PerformancePeriod::TYPES,
            'period' => null,
        ]);
    }

    /**
     * Store new period
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:' . implode(',', array_keys(PerformancePeriod::TYPES)),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string',
            'is_current' => 'boolean',
        ]);

        // If setting as current, unset other current periods
        if ($validated['is_current'] ?? false) {
            PerformancePeriod::where('is_current', true)->update(['is_current' => false]);
        }

        PerformancePeriod::create($validated);

        return redirect()->route('hr.performance-periods.index')
            ->with('success', 'Periode penilaian berhasil ditambahkan');
    }

    /**
     * Show period detail
     */
    public function show(PerformancePeriod $performancePeriod)
    {
        $performancePeriod->loadCount([
            'reviews',
            'reviews as completed_reviews_count' => fn($q) => $q->where('status', 'completed'),
            'reviews as in_progress_reviews_count' => fn($q) => $q->whereIn('status', ['self_review', 'manager_review', 'calibration']),
            'goals',
            'goals as completed_goals_count' => fn($q) => $q->where('status', 'completed'),
        ]);

        return Inertia::render('HR/performance/period/show', [
            'period' => [
                'id' => $performancePeriod->id,
                'name' => $performancePeriod->name,
                'type' => $performancePeriod->type,
                'type_label' => $performancePeriod->type_label,
                'start_date' => $performancePeriod->start_date->format('Y-m-d'),
                'end_date' => $performancePeriod->end_date->format('Y-m-d'),
                'start_date_formatted' => $performancePeriod->start_date->format('d M Y'),
                'end_date_formatted' => $performancePeriod->end_date->format('d M Y'),
                'status' => $performancePeriod->status,
                'status_label' => $performancePeriod->status_label,
                'description' => $performancePeriod->description,
                'is_current' => $performancePeriod->is_current,
                'reviews_count' => $performancePeriod->reviews_count,
                'completed_reviews_count' => $performancePeriod->completed_reviews_count,
                'in_progress_reviews_count' => $performancePeriod->in_progress_reviews_count,
                'goals_count' => $performancePeriod->goals_count,
                'completed_goals_count' => $performancePeriod->completed_goals_count,
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(PerformancePeriod $performancePeriod)
    {
        return Inertia::render('HR/performance/period/form', [
            'types' => PerformancePeriod::TYPES,
            'period' => [
                'id' => $performancePeriod->id,
                'name' => $performancePeriod->name,
                'type' => $performancePeriod->type,
                'start_date' => $performancePeriod->start_date->format('Y-m-d'),
                'end_date' => $performancePeriod->end_date->format('Y-m-d'),
                'description' => $performancePeriod->description,
                'status' => $performancePeriod->status,
                'is_current' => $performancePeriod->is_current,
            ],
        ]);
    }

    /**
     * Update period
     */
    public function update(Request $request, PerformancePeriod $performancePeriod)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:' . implode(',', array_keys(PerformancePeriod::TYPES)),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string',
            'status' => 'required|in:' . implode(',', array_keys(PerformancePeriod::STATUSES)),
            'is_current' => 'boolean',
        ]);

        // If setting as current, unset other current periods
        if (($validated['is_current'] ?? false) && !$performancePeriod->is_current) {
            PerformancePeriod::where('is_current', true)->update(['is_current' => false]);
        }

        $performancePeriod->update($validated);

        return redirect()->route('hr.performance-periods.show', $performancePeriod)
            ->with('success', 'Periode penilaian berhasil diperbarui');
    }

    /**
     * Delete period
     */
    public function destroy(PerformancePeriod $performancePeriod)
    {
        // Check if period has reviews
        if ($performancePeriod->reviews()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus periode yang sudah memiliki penilaian');
        }

        $performancePeriod->delete();

        return redirect()->route('hr.performance-periods.index')
            ->with('success', 'Periode penilaian berhasil dihapus');
    }

    /**
     * Set as current period
     */
    public function setCurrent(PerformancePeriod $performancePeriod)
    {
        // Unset other current periods
        PerformancePeriod::where('is_current', true)->update(['is_current' => false]);
        
        $performancePeriod->update(['is_current' => true]);

        return back()->with('success', 'Periode aktif berhasil diubah');
    }

    /**
     * Activate period
     */
    public function activate(PerformancePeriod $performancePeriod)
    {
        $performancePeriod->update(['status' => 'active']);

        return back()->with('success', 'Periode berhasil diaktifkan');
    }

    /**
     * Close period
     */
    public function close(PerformancePeriod $performancePeriod)
    {
        $performancePeriod->update(['status' => 'closed']);

        return back()->with('success', 'Periode berhasil ditutup');
    }
}
