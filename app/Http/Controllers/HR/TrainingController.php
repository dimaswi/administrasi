<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Training;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingController extends Controller
{
    /**
     * Display a listing of trainings
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $type = $request->get('type');
        $category = $request->get('category');
        $status = $request->get('status'); // active, inactive, mandatory
        $perPage = $request->get('per_page', 25);

        $query = Training::query()->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%");
            });
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($category) {
            $query->where('category', $category);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'mandatory') {
            $query->where('is_mandatory', true);
        }

        $trainings = $query->paginate($perPage);

        $trainings->through(fn($training) => [
            'id' => $training->id,
            'code' => $training->code,
            'name' => $training->name,
            'type' => $training->type,
            'type_label' => $training->type_label,
            'category' => $training->category,
            'category_label' => $training->category_label,
            'provider' => $training->provider,
            'duration_hours' => $training->duration_hours,
            'formatted_duration' => $training->formatted_duration,
            'cost' => $training->cost,
            'is_mandatory' => $training->is_mandatory,
            'is_active' => $training->is_active,
        ]);

        // Stats
        $stats = [
            'total' => Training::count(),
            'active' => Training::active()->count(),
            'mandatory' => Training::mandatory()->count(),
        ];

        return Inertia::render('HR/training/index', [
            'trainings' => $trainings,
            'types' => Training::TYPES,
            'categories' => Training::CATEGORIES,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'category' => $category,
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create training
     */
    public function create()
    {
        return Inertia::render('HR/training/form', [
            'types' => Training::TYPES,
            'categories' => Training::CATEGORIES,
            'training' => null,
        ]);
    }

    /**
     * Store new training
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:trainings,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:' . implode(',', array_keys(Training::TYPES)),
            'category' => 'nullable|in:' . implode(',', array_keys(Training::CATEGORIES)),
            'provider' => 'nullable|string|max:255',
            'duration_hours' => 'nullable|integer|min:1',
            'cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'objectives' => 'nullable|string',
            'prerequisites' => 'nullable|string',
        ]);

        Training::create($validated);

        return redirect()->route('hr.trainings.index')
            ->with('success', 'Program training berhasil ditambahkan');
    }

    /**
     * Show training detail
     */
    public function show(Training $training)
    {
        $training->load(['employeeTrainings.employee.organizationUnit']);

        return Inertia::render('HR/training/show', [
            'training' => [
                'id' => $training->id,
                'code' => $training->code,
                'name' => $training->name,
                'description' => $training->description,
                'type' => $training->type,
                'type_label' => $training->type_label,
                'category' => $training->category,
                'category_label' => $training->category_label,
                'provider' => $training->provider,
                'duration_hours' => $training->duration_hours,
                'formatted_duration' => $training->formatted_duration,
                'cost' => $training->cost,
                'location' => $training->location,
                'is_mandatory' => $training->is_mandatory,
                'is_active' => $training->is_active,
                'objectives' => $training->objectives,
                'prerequisites' => $training->prerequisites,
                'participants_count' => $training->employeeTrainings->count(),
                'completed_count' => $training->employeeTrainings->where('status', 'completed')->count(),
            ],
            'participants' => $training->employeeTrainings->map(fn($et) => [
                'id' => $et->id,
                'employee' => [
                    'id' => $et->employee->id,
                    'employee_id' => $et->employee->employee_id,
                    'name' => $et->employee->first_name . ' ' . ($et->employee->last_name ?? ''),
                    'organization_unit' => $et->employee->organizationUnit?->name,
                ],
                'status' => $et->status,
                'status_label' => $et->status_label,
                'start_date' => $et->start_date?->format('Y-m-d'),
                'end_date' => $et->end_date?->format('Y-m-d'),
                'score' => $et->score,
                'grade' => $et->grade,
            ]),
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(Training $training)
    {
        return Inertia::render('HR/training/form', [
            'types' => Training::TYPES,
            'categories' => Training::CATEGORIES,
            'training' => [
                'id' => $training->id,
                'code' => $training->code,
                'name' => $training->name,
                'description' => $training->description,
                'type' => $training->type,
                'category' => $training->category,
                'provider' => $training->provider,
                'duration_hours' => $training->duration_hours,
                'cost' => $training->cost,
                'location' => $training->location,
                'is_mandatory' => $training->is_mandatory,
                'is_active' => $training->is_active,
                'objectives' => $training->objectives,
                'prerequisites' => $training->prerequisites,
            ],
        ]);
    }

    /**
     * Update training
     */
    public function update(Request $request, Training $training)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:trainings,code,' . $training->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:' . implode(',', array_keys(Training::TYPES)),
            'category' => 'nullable|in:' . implode(',', array_keys(Training::CATEGORIES)),
            'provider' => 'nullable|string|max:255',
            'duration_hours' => 'nullable|integer|min:1',
            'cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'objectives' => 'nullable|string',
            'prerequisites' => 'nullable|string',
        ]);

        $training->update($validated);

        return redirect()->route('hr.trainings.show', $training)
            ->with('success', 'Program training berhasil diperbarui');
    }

    /**
     * Delete training
     */
    public function destroy(Training $training)
    {
        // Check if training has participants
        if ($training->employeeTrainings()->exists()) {
            return back()->with('error', 'Tidak dapat menghapus training yang sudah memiliki peserta');
        }

        $training->delete();

        return redirect()->route('hr.trainings.index')
            ->with('success', 'Program training berhasil dihapus');
    }

    /**
     * Export trainings to CSV
     */
    public function export(Request $request, ExportService $exportService)
    {
        $type = $request->get('type');
        $category = $request->get('category');
        $status = $request->get('status');

        $query = Training::withCount(['employeeTrainings', 'employeeTrainings as completed_count' => function ($q) {
            $q->where('status', 'completed');
        }])->orderBy('name');

        if ($type) {
            $query->where('type', $type);
        }

        if ($category) {
            $query->where('category', $category);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'mandatory') {
            $query->where('is_mandatory', true);
        }

        $data = $query->get()->map(function ($training) {
            return [
                'code' => $training->code,
                'name' => $training->name,
                'type' => $training->type_label,
                'category' => $training->category_label ?? '-',
                'provider' => $training->provider ?? '-',
                'duration' => $training->formatted_duration ?? '-',
                'cost' => $training->cost ? number_format($training->cost, 0, ',', '.') : '-',
                'location' => $training->location ?? '-',
                'is_mandatory' => $training->is_mandatory ? 'Ya' : 'Tidak',
                'is_active' => $training->is_active ? 'Aktif' : 'Nonaktif',
                'total_participants' => $training->employee_trainings_count ?? 0,
                'completed_participants' => $training->completed_count ?? 0,
            ];
        });

        $headers = [
            'code' => 'Kode',
            'name' => 'Nama Training',
            'type' => 'Tipe',
            'category' => 'Kategori',
            'provider' => 'Penyelenggara',
            'duration' => 'Durasi',
            'cost' => 'Biaya (Rp)',
            'location' => 'Lokasi',
            'is_mandatory' => 'Wajib',
            'is_active' => 'Status',
            'total_participants' => 'Total Peserta',
            'completed_participants' => 'Peserta Selesai',
        ];

        $filename = 'program_training_' . now()->format('Y-m-d') . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }
}
