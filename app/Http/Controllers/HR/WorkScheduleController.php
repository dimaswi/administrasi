<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\EmployeeSchedule;
use App\Models\HR\WorkSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkScheduleController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $schedules = WorkSchedule::query()
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/master/work-schedule/index', [
            'schedules' => $schedules,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('HR/master/work-schedule/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:work_schedules,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'clock_in_time' => 'required|date_format:H:i',
            'clock_out_time' => 'required|date_format:H:i',
            'break_start' => 'nullable|date_format:H:i',
            'break_end' => 'nullable|date_format:H:i|required_with:break_start',
            'late_tolerance' => 'required|integer|min:0|max:120',
            'early_leave_tolerance' => 'required|integer|min:0|max:120',
            'is_flexible' => 'boolean',
            'flexible_minutes' => 'nullable|integer|min:0|max:120',
            'work_hours_per_day' => 'required|integer|min:60|max:1440',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['is_flexible'] = $validated['is_flexible'] ?? false;

        WorkSchedule::create($validated);

        return redirect()->route('hr.work-schedules.index')
            ->with('success', 'Shift berhasil ditambahkan');
    }

    public function edit(WorkSchedule $workSchedule)
    {
        return Inertia::render('HR/master/work-schedule/edit', [
            'workSchedule' => $workSchedule,
        ]);
    }

    public function update(Request $request, WorkSchedule $workSchedule)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:work_schedules,code,' . $workSchedule->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'clock_in_time' => 'required|date_format:H:i',
            'clock_out_time' => 'required|date_format:H:i',
            'break_start' => 'nullable|date_format:H:i',
            'break_end' => 'nullable|date_format:H:i|required_with:break_start',
            'late_tolerance' => 'required|integer|min:0|max:120',
            'early_leave_tolerance' => 'required|integer|min:0|max:120',
            'is_flexible' => 'boolean',
            'flexible_minutes' => 'nullable|integer|min:0|max:120',
            'work_hours_per_day' => 'required|integer|min:60|max:1440',
            'is_active' => 'boolean',
        ]);

        $workSchedule->update($validated);

        return redirect()->route('hr.work-schedules.index')
            ->with('success', 'Shift berhasil diperbarui');
    }

    public function destroy(WorkSchedule $workSchedule)
    {
        // Check if used by any employee schedules (via any day column)
        $isUsed = EmployeeSchedule::where('monday_shift_id', $workSchedule->id)
            ->orWhere('tuesday_shift_id', $workSchedule->id)
            ->orWhere('wednesday_shift_id', $workSchedule->id)
            ->orWhere('thursday_shift_id', $workSchedule->id)
            ->orWhere('friday_shift_id', $workSchedule->id)
            ->orWhere('saturday_shift_id', $workSchedule->id)
            ->orWhere('sunday_shift_id', $workSchedule->id)
            ->exists();

        if ($isUsed) {
            return back()->with('error', 'Shift tidak dapat dihapus karena masih digunakan');
        }

        $workSchedule->delete();

        return redirect()->route('hr.work-schedules.index')
            ->with('success', 'Shift berhasil dihapus');
    }
}
