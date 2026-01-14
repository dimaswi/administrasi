<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 25);
        $status = $request->get('status');

        $query = LeaveType::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('is_active', $status === '1');
        }

        $leaveTypes = $query->ordered()->paginate($perPage);

        return Inertia::render('HR/leave-type/index', [
            'leaveTypes' => $leaveTypes,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('HR/leave-type/form', [
            'leaveType' => null,
            'colors' => LeaveType::COLORS,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:leave_types,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'default_quota' => 'required|integer|min:0',
            'is_paid' => 'boolean',
            'requires_approval' => 'boolean',
            'allow_carry_over' => 'boolean',
            'max_carry_over_days' => 'required_if:allow_carry_over,true|integer|min:0',
            'min_advance_days' => 'required|integer|min:0',
            'max_consecutive_days' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'sort_order' => 'required|integer|min:0',
            'color' => 'required|string|in:' . implode(',', array_keys(LeaveType::COLORS)),
        ]);

        LeaveType::create($validated);

        return redirect()->route('hr.leave-types.index')
            ->with('success', 'Jenis cuti berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(LeaveType $leaveType)
    {
        return Inertia::render('HR/leave-type/show', [
            'leaveType' => $leaveType,
            'colors' => LeaveType::COLORS,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LeaveType $leaveType)
    {
        return Inertia::render('HR/leave-type/form', [
            'leaveType' => $leaveType,
            'colors' => LeaveType::COLORS,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LeaveType $leaveType)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:leave_types,code,' . $leaveType->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'default_quota' => 'required|integer|min:0',
            'is_paid' => 'boolean',
            'requires_approval' => 'boolean',
            'allow_carry_over' => 'boolean',
            'max_carry_over_days' => 'required_if:allow_carry_over,true|integer|min:0',
            'min_advance_days' => 'required|integer|min:0',
            'max_consecutive_days' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'sort_order' => 'required|integer|min:0',
            'color' => 'required|string|in:' . implode(',', array_keys(LeaveType::COLORS)),
        ]);

        $leaveType->update($validated);

        return redirect()->route('hr.leave-types.index')
            ->with('success', 'Jenis cuti berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LeaveType $leaveType)
    {
        // Check if there are leaves using this type
        if ($leaveType->leaves()->count() > 0) {
            return redirect()->route('hr.leave-types.index')
                ->with('error', 'Jenis cuti tidak dapat dihapus karena sudah digunakan');
        }

        $leaveType->delete();

        return redirect()->route('hr.leave-types.index')
            ->with('success', 'Jenis cuti berhasil dihapus');
    }
}
