<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeTraining;
use App\Models\HR\Training;
use App\Models\OrganizationUnit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeTrainingController extends Controller
{
    /**
     * Display all employee trainings
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $trainingId = $request->get('training_id');
        $status = $request->get('status');
        $unitId = $request->get('unit_id');
        $perPage = $request->get('per_page', 25);

        $query = EmployeeTraining::with(['employee.organizationUnit', 'training'])
            ->latest('updated_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($eq) use ($search) {
                    $eq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                })->orWhereHas('training', function ($tq) use ($search) {
                    $tq->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            });
        }

        if ($trainingId) {
            $query->where('training_id', $trainingId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $employeeTrainings = $query->paginate($perPage);

        $employeeTrainings->through(fn($et) => [
            'id' => $et->id,
            'employee' => [
                'id' => $et->employee->id,
                'employee_id' => $et->employee->employee_id,
                'name' => $et->employee->first_name . ' ' . ($et->employee->last_name ?? ''),
                'organization_unit' => $et->employee->organizationUnit?->name,
            ],
            'training' => [
                'id' => $et->training->id,
                'code' => $et->training->code,
                'name' => $et->training->name,
            ],
            'status' => $et->status,
            'status_label' => $et->status_label,
            'start_date' => $et->start_date?->format('Y-m-d'),
            'end_date' => $et->end_date?->format('Y-m-d'),
            'score' => $et->score,
            'grade' => $et->grade,
            'has_certificate' => !empty($et->certificate_path),
        ]);

        $trainings = Training::active()->orderBy('name')->get(['id', 'code', 'name']);
        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        // Stats
        $stats = [
            'total' => EmployeeTraining::count(),
            'in_progress' => EmployeeTraining::inProgress()->count(),
            'completed' => EmployeeTraining::completed()->count(),
            'registered' => EmployeeTraining::registered()->count(),
        ];

        return Inertia::render('HR/employee-training/index', [
            'employeeTrainings' => $employeeTrainings,
            'trainings' => $trainings,
            'units' => $units,
            'statuses' => EmployeeTraining::STATUSES,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'training_id' => $trainingId,
                'status' => $status,
                'unit_id' => $unitId,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to assign training to employee
     */
    public function create(Request $request)
    {
        $employeeId = $request->get('employee_id');
        $trainingId = $request->get('training_id');

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name']);

        $trainings = Training::active()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return Inertia::render('HR/employee-training/form', [
            'employees' => $employees->map(fn($e) => [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->first_name . ' ' . ($e->last_name ?? ''),
            ]),
            'trainings' => $trainings,
            'statuses' => EmployeeTraining::STATUSES,
            'employeeTraining' => null,
            'preselectedEmployeeId' => $employeeId,
            'preselectedTrainingId' => $trainingId,
        ]);
    }

    /**
     * Store training assignment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'training_id' => 'required|exists:trainings,id',
            'status' => 'required|in:' . implode(',', array_keys(EmployeeTraining::STATUSES)),
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'completion_date' => 'nullable|date',
            'score' => 'nullable|numeric|min:0|max:100',
            'grade' => 'nullable|string|max:10',
            'certificate_number' => 'nullable|string|max:100',
            'certificate_expiry' => 'nullable|date',
            'feedback' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Check for duplicate
        $exists = EmployeeTraining::where('employee_id', $validated['employee_id'])
            ->where('training_id', $validated['training_id'])
            ->where('start_date', $validated['start_date'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['training_id' => 'Karyawan sudah terdaftar di training ini pada tanggal yang sama']);
        }

        $certificatePath = null;
        if ($request->hasFile('certificate')) {
            $certificatePath = $request->file('certificate')->store(
                "training-certificates/{$validated['employee_id']}",
                'public'
            );
        }

        EmployeeTraining::create([
            ...$validated,
            'certificate_path' => $certificatePath,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('hr.employee-trainings.index')
            ->with('success', 'Peserta training berhasil ditambahkan');
    }

    /**
     * Show employee training detail
     */
    public function show(EmployeeTraining $employeeTraining)
    {
        $employeeTraining->load(['employee.organizationUnit', 'training', 'approver']);

        return Inertia::render('HR/employee-training/show', [
            'employeeTraining' => [
                'id' => $employeeTraining->id,
                'employee' => [
                    'id' => $employeeTraining->employee->id,
                    'employee_id' => $employeeTraining->employee->employee_id,
                    'name' => $employeeTraining->employee->first_name . ' ' . ($employeeTraining->employee->last_name ?? ''),
                    'organization_unit' => $employeeTraining->employee->organizationUnit?->name,
                ],
                'training' => [
                    'id' => $employeeTraining->training->id,
                    'code' => $employeeTraining->training->code,
                    'name' => $employeeTraining->training->name,
                    'type_label' => $employeeTraining->training->type_label,
                    'provider' => $employeeTraining->training->provider,
                ],
                'status' => $employeeTraining->status,
                'status_label' => $employeeTraining->status_label,
                'start_date' => $employeeTraining->start_date?->format('Y-m-d'),
                'start_date_formatted' => $employeeTraining->start_date?->format('d M Y'),
                'end_date' => $employeeTraining->end_date?->format('Y-m-d'),
                'end_date_formatted' => $employeeTraining->end_date?->format('d M Y'),
                'completion_date' => $employeeTraining->completion_date?->format('Y-m-d'),
                'completion_date_formatted' => $employeeTraining->completion_date?->format('d M Y'),
                'score' => $employeeTraining->score,
                'grade' => $employeeTraining->grade,
                'certificate_number' => $employeeTraining->certificate_number,
                'certificate_url' => $employeeTraining->certificate_url,
                'certificate_expiry' => $employeeTraining->certificate_expiry?->format('Y-m-d'),
                'certificate_expiry_formatted' => $employeeTraining->certificate_expiry?->format('d M Y'),
                'is_certificate_expired' => $employeeTraining->is_certificate_expired,
                'is_certificate_expiring_soon' => $employeeTraining->is_certificate_expiring_soon,
                'feedback' => $employeeTraining->feedback,
                'rating' => $employeeTraining->rating,
                'notes' => $employeeTraining->notes,
                'approved_by' => $employeeTraining->approver?->name,
                'approved_at' => $employeeTraining->approved_at?->format('d M Y H:i'),
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(EmployeeTraining $employeeTraining)
    {
        $employeeTraining->load(['employee', 'training']);

        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'first_name', 'last_name']);

        $trainings = Training::active()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return Inertia::render('HR/employee-training/form', [
            'employees' => $employees->map(fn($e) => [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->first_name . ' ' . ($e->last_name ?? ''),
            ]),
            'trainings' => $trainings,
            'statuses' => EmployeeTraining::STATUSES,
            'employeeTraining' => [
                'id' => $employeeTraining->id,
                'employee_id' => $employeeTraining->employee_id,
                'training_id' => $employeeTraining->training_id,
                'status' => $employeeTraining->status,
                'start_date' => $employeeTraining->start_date?->format('Y-m-d'),
                'end_date' => $employeeTraining->end_date?->format('Y-m-d'),
                'completion_date' => $employeeTraining->completion_date?->format('Y-m-d'),
                'score' => $employeeTraining->score,
                'grade' => $employeeTraining->grade,
                'certificate_number' => $employeeTraining->certificate_number,
                'certificate_expiry' => $employeeTraining->certificate_expiry?->format('Y-m-d'),
                'certificate_url' => $employeeTraining->certificate_url,
                'feedback' => $employeeTraining->feedback,
                'rating' => $employeeTraining->rating,
                'notes' => $employeeTraining->notes,
            ],
            'preselectedEmployeeId' => null,
            'preselectedTrainingId' => null,
        ]);
    }

    /**
     * Update employee training
     */
    public function update(Request $request, EmployeeTraining $employeeTraining)
    {
        $validated = $request->validate([
            'status' => 'required|in:' . implode(',', array_keys(EmployeeTraining::STATUSES)),
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'completion_date' => 'nullable|date',
            'score' => 'nullable|numeric|min:0|max:100',
            'grade' => 'nullable|string|max:10',
            'certificate_number' => 'nullable|string|max:100',
            'certificate_expiry' => 'nullable|date',
            'feedback' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($request->hasFile('certificate')) {
            // Delete old certificate
            if ($employeeTraining->certificate_path) {
                Storage::disk('public')->delete($employeeTraining->certificate_path);
            }
            $validated['certificate_path'] = $request->file('certificate')->store(
                "training-certificates/{$employeeTraining->employee_id}",
                'public'
            );
        }

        $employeeTraining->update($validated);

        return redirect()->route('hr.employee-trainings.show', $employeeTraining)
            ->with('success', 'Data training karyawan berhasil diperbarui');
    }

    /**
     * Delete employee training
     */
    public function destroy(EmployeeTraining $employeeTraining)
    {
        // Delete certificate
        if ($employeeTraining->certificate_path) {
            Storage::disk('public')->delete($employeeTraining->certificate_path);
        }

        $employeeTraining->delete();

        return redirect()->route('hr.employee-trainings.index')
            ->with('success', 'Data training karyawan berhasil dihapus');
    }

    /**
     * Export employee trainings to CSV
     */
    public function export(Request $request, ExportService $exportService)
    {
        $trainingId = $request->get('training_id');
        $status = $request->get('status');
        $unitId = $request->get('unit_id');

        $query = EmployeeTraining::with(['employee.organizationUnit', 'training'])
            ->orderBy('updated_at', 'desc');

        if ($trainingId) {
            $query->where('training_id', $trainingId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $data = $query->get()->map(function ($et) {
            $certificateStatus = '-';
            if ($et->certificate_expiry) {
                if ($et->certificate_expiry->isPast()) {
                    $certificateStatus = 'Kadaluarsa';
                } elseif ($et->certificate_expiry->diffInDays(now()) <= 90) {
                    $certificateStatus = 'Segera Kadaluarsa';
                } else {
                    $certificateStatus = 'Aktif';
                }
            }

            return [
                'employee_id' => $et->employee->employee_id,
                'employee_name' => $et->employee->first_name . ' ' . ($et->employee->last_name ?? ''),
                'organization_unit' => $et->employee->organizationUnit?->name ?? '-',
                'training_code' => $et->training->code,
                'training_name' => $et->training->name,
                'status' => $et->status_label,
                'start_date' => $et->start_date?->format('d/m/Y') ?? '-',
                'end_date' => $et->end_date?->format('d/m/Y') ?? '-',
                'completion_date' => $et->completion_date?->format('d/m/Y') ?? '-',
                'score' => $et->score ?? '-',
                'grade' => $et->grade ?? '-',
                'certificate_number' => $et->certificate_number ?? '-',
                'certificate_expiry' => $et->certificate_expiry?->format('d/m/Y') ?? '-',
                'certificate_status' => $certificateStatus,
                'rating' => $et->rating ? $et->rating . '/5' : '-',
            ];
        });

        $headers = [
            'employee_id' => 'NIP',
            'employee_name' => 'Nama Karyawan',
            'organization_unit' => 'Unit Organisasi',
            'training_code' => 'Kode Training',
            'training_name' => 'Nama Training',
            'status' => 'Status',
            'start_date' => 'Tanggal Mulai',
            'end_date' => 'Tanggal Selesai',
            'completion_date' => 'Tanggal Penyelesaian',
            'score' => 'Nilai',
            'grade' => 'Grade',
            'certificate_number' => 'Nomor Sertifikat',
            'certificate_expiry' => 'Kadaluarsa Sertifikat',
            'certificate_status' => 'Status Sertifikat',
            'rating' => 'Rating',
        ];

        $filename = 'peserta_training_' . now()->format('Y-m-d') . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }
}
