<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\EmploymentStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmploymentStatusController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $statuses = EmploymentStatus::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/master/employment-status/index', [
            'statuses' => $statuses,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('HR/master/employment-status/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:employment_statuses,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_permanent' => 'boolean',
            'is_active' => 'boolean',
        ]);

        EmploymentStatus::create($validated);

        return redirect()->route('hr.employment-statuses.index')
            ->with('success', 'Status kepegawaian berhasil ditambahkan');
    }

    public function show(EmploymentStatus $employmentStatus)
    {
        $employmentStatus->loadCount('employees');
        
        return Inertia::render('HR/master/employment-status/show', [
            'employmentStatus' => $employmentStatus,
        ]);
    }

    public function edit(EmploymentStatus $employmentStatus)
    {
        return Inertia::render('HR/master/employment-status/edit', [
            'employmentStatus' => $employmentStatus,
        ]);
    }

    public function update(Request $request, EmploymentStatus $employmentStatus)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:employment_statuses,code,' . $employmentStatus->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_permanent' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $employmentStatus->update($validated);

        return redirect()->route('hr.employment-statuses.index')
            ->with('success', 'Status kepegawaian berhasil diperbarui');
    }

    public function destroy(EmploymentStatus $employmentStatus)
    {
        if ($employmentStatus->employees()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus status yang masih digunakan');
        }

        $employmentStatus->delete();

        return redirect()->route('hr.employment-statuses.index')
            ->with('success', 'Status kepegawaian berhasil dihapus');
    }
}
