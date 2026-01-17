<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeCredential;
use App\Models\OrganizationUnit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeCredentialController extends Controller
{
    /**
     * Display a listing of credentials
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $type = $request->get('type');
        $status = $request->get('status'); // expired, expiring_soon, verified, unverified
        $unitId = $request->get('unit_id');
        $perPage = $request->get('per_page', 25);

        $query = EmployeeCredential::with(['employee.organizationUnit'])
            ->latest('updated_at');

        // Search by employee name, number, or name
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($eq) use ($search) {
                        $eq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('employee_id', 'like', "%{$search}%");
                    });
            });
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($status) {
            switch ($status) {
                case 'expired':
                    $query->expired();
                    break;
                case 'expiring_soon':
                    $query->expiringSoon();
                    break;
                case 'verified':
                    $query->verified();
                    break;
                case 'unverified':
                    $query->unverified();
                    break;
            }
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $credentials = $query->paginate($perPage);

        $credentials->through(fn($cred) => [
            'id' => $cred->id,
            'employee' => [
                'id' => $cred->employee->id,
                'employee_id' => $cred->employee->employee_id,
                'name' => $cred->employee->first_name . ' ' . ($cred->employee->last_name ?? ''),
                'organization_unit' => $cred->employee->organizationUnit?->name,
            ],
            'type' => $cred->type,
            'type_label' => $cred->type_label,
            'name' => $cred->name,
            'number' => $cred->number,
            'expiry_date' => $cred->expiry_date?->format('Y-m-d'),
            'expiry_date_formatted' => $cred->expiry_date?->format('d M Y'),
            'is_expired' => $cred->is_expired,
            'is_expiring_soon' => $cred->is_expiring_soon,
            'days_until_expiry' => $cred->days_until_expiry,
            'is_verified' => $cred->is_verified,
            'has_document' => !empty($cred->document_path),
        ]);

        $units = OrganizationUnit::orderBy('name')->get(['id', 'name']);

        // Stats
        $stats = [
            'total' => EmployeeCredential::count(),
            'expired' => EmployeeCredential::expired()->count(),
            'expiring_soon' => EmployeeCredential::expiringSoon()->count(),
            'unverified' => EmployeeCredential::unverified()->count(),
        ];

        return Inertia::render('HR/credential/index', [
            'credentials' => $credentials,
            'types' => EmployeeCredential::TYPES,
            'units' => $units,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'status' => $status,
                'unit_id' => $unitId,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create credential
     */
    public function create(Request $request, Employee $employee)
    {
        $employee->load('organizationUnit');

        return Inertia::render('HR/credential/form', [
            'employee' => [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . ($employee->last_name ?? ''),
                'organization_unit' => $employee->organizationUnit?->name,
            ],
            'types' => EmployeeCredential::TYPES,
            'credential' => null,
        ]);
    }

    /**
     * Store credential
     */
    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'type' => 'required|in:' . implode(',', array_keys(EmployeeCredential::TYPES)),
            'name' => 'required|string|max:255',
            'number' => 'required|string|max:255',
            'issued_by' => 'nullable|string|max:255',
            'issued_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:issued_date',
            'notes' => 'nullable|string|max:1000',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $documentPath = null;
        if ($request->hasFile('document')) {
            $documentPath = $request->file('document')->store(
                "credentials/{$employee->id}",
                'public'
            );
        }

        EmployeeCredential::create([
            'employee_id' => $employee->id,
            'type' => $validated['type'],
            'name' => $validated['name'],
            'number' => $validated['number'],
            'issued_by' => $validated['issued_by'],
            'issued_date' => $validated['issued_date'],
            'expiry_date' => $validated['expiry_date'],
            'notes' => $validated['notes'],
            'document_path' => $documentPath,
        ]);

        return redirect()->route('hr.employees.show', $employee)
            ->with('success', 'Kredensial berhasil ditambahkan');
    }

    /**
     * Show credential detail
     */
    public function show(EmployeeCredential $credential)
    {
        $credential->load(['employee.organizationUnit', 'verifier']);

        return Inertia::render('HR/credential/show', [
            'credential' => [
                'id' => $credential->id,
                'employee' => [
                    'id' => $credential->employee->id,
                    'employee_id' => $credential->employee->employee_id,
                    'name' => $credential->employee->first_name . ' ' . ($credential->employee->last_name ?? ''),
                    'organization_unit' => $credential->employee->organizationUnit?->name,
                ],
                'type' => $credential->type,
                'type_label' => $credential->type_label,
                'name' => $credential->name,
                'number' => $credential->number,
                'issued_by' => $credential->issued_by,
                'issued_date' => $credential->issued_date?->format('Y-m-d'),
                'issued_date_formatted' => $credential->issued_date?->format('d M Y'),
                'expiry_date' => $credential->expiry_date?->format('Y-m-d'),
                'expiry_date_formatted' => $credential->expiry_date?->format('d M Y'),
                'is_expired' => $credential->is_expired,
                'is_expiring_soon' => $credential->is_expiring_soon,
                'days_until_expiry' => $credential->days_until_expiry,
                'notes' => $credential->notes,
                'document_url' => $credential->document_url,
                'is_verified' => $credential->is_verified,
                'verified_by' => $credential->verifier?->name,
                'verified_at' => $credential->verified_at?->format('d M Y H:i'),
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(EmployeeCredential $credential)
    {
        $credential->load(['employee.organizationUnit']);

        return Inertia::render('HR/credential/form', [
            'employee' => [
                'id' => $credential->employee->id,
                'employee_id' => $credential->employee->employee_id,
                'name' => $credential->employee->first_name . ' ' . ($credential->employee->last_name ?? ''),
                'organization_unit' => $credential->employee->organizationUnit?->name,
            ],
            'types' => EmployeeCredential::TYPES,
            'credential' => [
                'id' => $credential->id,
                'type' => $credential->type,
                'name' => $credential->name,
                'number' => $credential->number,
                'issued_by' => $credential->issued_by,
                'issued_date' => $credential->issued_date?->format('Y-m-d'),
                'expiry_date' => $credential->expiry_date?->format('Y-m-d'),
                'notes' => $credential->notes,
                'document_url' => $credential->document_url,
            ],
        ]);
    }

    /**
     * Update credential
     */
    public function update(Request $request, EmployeeCredential $credential)
    {
        $validated = $request->validate([
            'type' => 'required|in:' . implode(',', array_keys(EmployeeCredential::TYPES)),
            'name' => 'required|string|max:255',
            'number' => 'required|string|max:255',
            'issued_by' => 'nullable|string|max:255',
            'issued_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:issued_date',
            'notes' => 'nullable|string|max:1000',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $updateData = [
            'type' => $validated['type'],
            'name' => $validated['name'],
            'number' => $validated['number'],
            'issued_by' => $validated['issued_by'],
            'issued_date' => $validated['issued_date'],
            'expiry_date' => $validated['expiry_date'],
            'notes' => $validated['notes'],
        ];

        if ($request->hasFile('document')) {
            // Delete old document
            if ($credential->document_path) {
                Storage::disk('public')->delete($credential->document_path);
            }
            $updateData['document_path'] = $request->file('document')->store(
                "credentials/{$credential->employee_id}",
                'public'
            );
        }

        $credential->update($updateData);

        return redirect()->route('hr.credentials.show', $credential)
            ->with('success', 'Kredensial berhasil diperbarui');
    }

    /**
     * Verify credential
     */
    public function verify(EmployeeCredential $credential)
    {
        $credential->update([
            'is_verified' => true,
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Kredensial berhasil diverifikasi');
    }

    /**
     * Unverify credential
     */
    public function unverify(EmployeeCredential $credential)
    {
        $credential->update([
            'is_verified' => false,
            'verified_by' => null,
            'verified_at' => null,
        ]);

        return back()->with('success', 'Verifikasi kredensial dibatalkan');
    }

    /**
     * Delete credential
     */
    public function destroy(EmployeeCredential $credential)
    {
        $employeeId = $credential->employee_id;

        // Delete document
        if ($credential->document_path) {
            Storage::disk('public')->delete($credential->document_path);
        }

        $credential->delete();

        return redirect()->route('hr.employees.show', $employeeId)
            ->with('success', 'Kredensial berhasil dihapus');
    }

    /**
     * Export credentials to CSV
     */
    public function export(Request $request, ExportService $exportService)
    {
        $type = $request->get('type');
        $status = $request->get('status');
        $unitId = $request->get('unit_id');

        $query = EmployeeCredential::with(['employee.organizationUnit', 'verifier'])
            ->orderBy('updated_at', 'desc');

        if ($type) {
            $query->where('type', $type);
        }

        if ($status) {
            switch ($status) {
                case 'expired':
                    $query->expired();
                    break;
                case 'expiring_soon':
                    $query->expiringSoon();
                    break;
                case 'verified':
                    $query->verified();
                    break;
                case 'unverified':
                    $query->unverified();
                    break;
            }
        }

        if ($unitId) {
            $query->whereHas('employee', fn($q) => $q->where('organization_unit_id', $unitId));
        }

        $data = $query->get()->map(function ($cred) {
            $statusText = 'Aktif';
            if ($cred->is_expired) {
                $statusText = 'Kedaluwarsa';
            } elseif ($cred->is_expiring_soon) {
                $statusText = 'Segera Kedaluwarsa (' . $cred->days_until_expiry . ' hari lagi)';
            }

            return [
                'employee_id' => $cred->employee->employee_id,
                'employee_name' => $cred->employee->first_name . ' ' . ($cred->employee->last_name ?? ''),
                'organization_unit' => $cred->employee->organizationUnit?->name ?? '-',
                'type' => $cred->type_label,
                'name' => $cred->name,
                'number' => $cred->number,
                'issued_by' => $cred->issued_by ?? '-',
                'issued_date' => $cred->issued_date?->format('d/m/Y') ?? '-',
                'expiry_date' => $cred->expiry_date?->format('d/m/Y') ?? '-',
                'status' => $statusText,
                'is_verified' => $cred->is_verified ? 'Ya' : 'Tidak',
                'verified_by' => $cred->verifier?->name ?? '-',
                'verified_at' => $cred->verified_at?->format('d/m/Y H:i') ?? '-',
            ];
        });

        $headers = [
            'employee_id' => 'NIP',
            'employee_name' => 'Nama Karyawan',
            'organization_unit' => 'Unit Organisasi',
            'type' => 'Jenis Kredensial',
            'name' => 'Nama Kredensial',
            'number' => 'Nomor',
            'issued_by' => 'Diterbitkan Oleh',
            'issued_date' => 'Tanggal Terbit',
            'expiry_date' => 'Tanggal Kadaluarsa',
            'status' => 'Status',
            'is_verified' => 'Terverifikasi',
            'verified_by' => 'Diverifikasi Oleh',
            'verified_at' => 'Tanggal Verifikasi',
        ];

        $filename = 'kredensial_karyawan_' . now()->format('Y-m-d') . '.csv';

        return $exportService->exportToCsv($data, $headers, $filename);
    }
}
