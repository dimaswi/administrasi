<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\JobCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JobCategoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');

        $categories = JobCategory::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/master/job-category/index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('HR/master/job-category/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:job_categories,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_medical' => 'boolean',
            'requires_str' => 'boolean',
            'requires_sip' => 'boolean',
            'is_active' => 'boolean',
        ]);

        JobCategory::create($validated);

        return redirect()->route('hr.job-categories.index')
            ->with('success', 'Kategori pekerjaan berhasil ditambahkan');
    }

    public function show(JobCategory $jobCategory)
    {
        $jobCategory->loadCount('employees');
        
        return Inertia::render('HR/master/job-category/show', [
            'jobCategory' => $jobCategory,
        ]);
    }

    public function edit(JobCategory $jobCategory)
    {
        return Inertia::render('HR/master/job-category/edit', [
            'jobCategory' => $jobCategory,
        ]);
    }

    public function update(Request $request, JobCategory $jobCategory)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:job_categories,code,' . $jobCategory->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_medical' => 'boolean',
            'requires_str' => 'boolean',
            'requires_sip' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $jobCategory->update($validated);

        return redirect()->route('hr.job-categories.index')
            ->with('success', 'Kategori pekerjaan berhasil diperbarui');
    }

    public function destroy(JobCategory $jobCategory)
    {
        if ($jobCategory->employees()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus kategori yang masih memiliki karyawan');
        }

        $jobCategory->delete();

        return redirect()->route('hr.job-categories.index')
            ->with('success', 'Kategori pekerjaan berhasil dihapus');
    }
}
