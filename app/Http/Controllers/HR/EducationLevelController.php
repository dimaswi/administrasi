<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\EducationLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EducationLevelController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $levels = EducationLevel::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('level')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/master/education-level/index', [
            'levels' => $levels,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('HR/master/education-level/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:education_levels,code',
            'name' => 'required|string|max:100',
            'level' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        EducationLevel::create($validated);

        return redirect()->route('hr.education-levels.index')
            ->with('success', 'Tingkat pendidikan berhasil ditambahkan');
    }

    public function show(EducationLevel $educationLevel)
    {
        $educationLevel->loadCount('employees');
        
        return Inertia::render('HR/master/education-level/show', [
            'educationLevel' => $educationLevel,
        ]);
    }

    public function edit(EducationLevel $educationLevel)
    {
        return Inertia::render('HR/master/education-level/edit', [
            'educationLevel' => $educationLevel,
        ]);
    }

    public function update(Request $request, EducationLevel $educationLevel)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:education_levels,code,' . $educationLevel->id,
            'name' => 'required|string|max:100',
            'level' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $educationLevel->update($validated);

        return redirect()->route('hr.education-levels.index')
            ->with('success', 'Tingkat pendidikan berhasil diperbarui');
    }

    public function destroy(EducationLevel $educationLevel)
    {
        if ($educationLevel->employees()->exists() || $educationLevel->employeeEducations()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus tingkat pendidikan yang masih digunakan');
        }

        $educationLevel->delete();

        return redirect()->route('hr.education-levels.index')
            ->with('success', 'Tingkat pendidikan berhasil dihapus');
    }
}
