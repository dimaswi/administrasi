<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\EarlyLeaveRequest;
use App\Models\OrganizationUnit;
use App\Services\FCMService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EarlyLeaveRequestController extends Controller
{
    protected $fcmService;

    public function __construct(FCMService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    public function index(Request $request)
    {
        $query = EarlyLeaveRequest::with(['employee:id,employee_id,first_name,last_name,organization_unit_id', 'employee.organizationUnit:id,name', 'approver:id,name'])
            ->orderBy('created_at', 'desc');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by unit
        if ($request->filled('unit_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('organization_unit_id', $request->unit_id);
            });
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        $perPage = $request->input('per_page', 20);
        $requests = $query->paginate($perPage)->withQueryString();

        // Transform data
        $requests->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'employee' => [
                    'id' => $item->employee->id ?? null,
                    'employee_id' => $item->employee->employee_id ?? '-',
                    'name' => trim(($item->employee->first_name ?? '') . ' ' . ($item->employee->last_name ?? '')) ?: '-',
                    'organization_unit' => $item->employee->organizationUnit->name ?? null,
                ],
                'date' => $item->date->format('Y-m-d'),
                'date_formatted' => $item->date->format('d M Y'),
                'requested_leave_time' => $item->requested_leave_time->format('H:i'),
                'scheduled_leave_time' => $item->scheduled_leave_time->format('H:i'),
                'early_minutes' => $item->early_leave_minutes,
                'reason' => $item->reason,
                'status' => $item->status,
                'status_label' => $item->status_label,
                'approved_by' => $item->approver->name ?? null,
                'approved_at' => $item->approved_at?->format('d M Y H:i'),
                'approval_notes' => $item->approval_notes,
                'auto_checkout' => $item->auto_checkout,
                'created_at' => $item->created_at->format('d M Y H:i'),
            ];
        });

        return Inertia::render('HR/early-leave-request/index', [
            'requests' => $requests,
            'units' => OrganizationUnit::select('id', 'name')->orderBy('name')->get(),
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'unit_id' => $request->unit_id,
                'date' => $request->date,
                'per_page' => $perPage,
            ],
            'statusOptions' => EarlyLeaveRequest::STATUS_LABELS,
        ]);
    }

    public function show(EarlyLeaveRequest $earlyLeaveRequest)
    {
        $earlyLeaveRequest->load([
            'employee:id,employee_id,first_name,last_name,organization_unit_id,position',
            'employee.organizationUnit:id,name',
            'attendance',
            'approver:id,name',
        ]);

        return Inertia::render('HR/early-leave-request/show', [
            'request' => [
                'id' => $earlyLeaveRequest->id,
                'employee' => [
                    'id' => $earlyLeaveRequest->employee->id ?? null,
                    'employee_id' => $earlyLeaveRequest->employee->employee_id ?? '-',
                    'name' => trim(($earlyLeaveRequest->employee->first_name ?? '') . ' ' . ($earlyLeaveRequest->employee->last_name ?? '')) ?: '-',
                    'position' => $earlyLeaveRequest->employee->position ?? '-',
                    'organization_unit' => $earlyLeaveRequest->employee->organizationUnit->name ?? null,
                ],
                'date' => $earlyLeaveRequest->date->format('Y-m-d'),
                'date_formatted' => $earlyLeaveRequest->date->format('l, d F Y'),
                'requested_leave_time' => $earlyLeaveRequest->requested_leave_time->format('H:i'),
                'scheduled_leave_time' => $earlyLeaveRequest->scheduled_leave_time->format('H:i'),
                'early_minutes' => $earlyLeaveRequest->early_leave_minutes,
                'reason' => $earlyLeaveRequest->reason,
                'status' => $earlyLeaveRequest->status,
                'status_label' => $earlyLeaveRequest->status_label,
                'approved_by' => $earlyLeaveRequest->approver->name ?? null,
                'approved_at' => $earlyLeaveRequest->approved_at?->format('d M Y H:i'),
                'approval_notes' => $earlyLeaveRequest->approval_notes,
                'auto_checkout' => $earlyLeaveRequest->auto_checkout,
                'attendance' => $earlyLeaveRequest->attendance ? [
                    'id' => $earlyLeaveRequest->attendance->id,
                    'clock_in' => $earlyLeaveRequest->attendance->clock_in?->format('H:i'),
                    'clock_out' => $earlyLeaveRequest->attendance->clock_out?->format('H:i'),
                    'status' => $earlyLeaveRequest->attendance->status,
                ] : null,
                'created_at' => $earlyLeaveRequest->created_at->format('d M Y H:i'),
            ],
        ]);
    }

    /**
     * Approve early leave request (by HR Admin)
     * HR Admin reviews pending_hr early leaves and sends to Director for signature
     */
    public function approve(Request $request, EarlyLeaveRequest $earlyLeaveRequest)
    {
        if ($earlyLeaveRequest->status !== 'pending_hr') {
            return back()->with('error', 'Pengajuan tidak dapat diproses. Status saat ini: ' . ($earlyLeaveRequest->status_label ?? $earlyLeaveRequest->status));
        }

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        // Get director (Level 1 organization head)
        $directorUser = $earlyLeaveRequest->getDirectorUser();
        
        if (!$directorUser) {
            return back()->with('error', 'Direktur/Kepala Organisasi Level 1 tidak ditemukan');
        }

        // Approve by HR and move to pending_director_sign
        $earlyLeaveRequest->approveHr(auth()->id(), $request->notes);
        $earlyLeaveRequest->director_id = $directorUser->id;
        
        // Generate response letter number
        $leaveApprovalService = app(\App\Services\LeaveApprovalService::class);
        $letterNumber = $leaveApprovalService->generateEarlyLeaveResponseLetterNumber($earlyLeaveRequest);
        $earlyLeaveRequest->response_letter_number = $letterNumber;
        $earlyLeaveRequest->response_letter_generated_at = now();
        
        $earlyLeaveRequest->save();

        // Send FCM notification to the Director
        $this->fcmService->sendToUsers(
            [$directorUser->id],
            'Menunggu Tanda Tangan Izin Pulang Cepat',
            'Surat izin pulang cepat a.n. ' . ($earlyLeaveRequest->employee->first_name ?? '') . ' menunggu tanda tangan Anda.',
            [
                'type' => 'early_leave_pending_director_sign',
                'early_leave_request_id' => (string) $earlyLeaveRequest->id,
            ]
        );

        // Notify employee about progress
        $employee = $earlyLeaveRequest->employee;
        if ($employee && $employee->user_id) {
            $this->fcmService->sendToUsers(
                [$employee->user_id],
                'Izin Pulang Cepat Diproses HR',
                'Izin pulang cepat Anda untuk tanggal ' . $earlyLeaveRequest->date->format('d M Y') . ' telah diproses HR dan menunggu tanda tangan Direktur.',
                [
                    'type' => 'early_leave_pending_director',
                    'early_leave_request_id' => (string) $earlyLeaveRequest->id,
                ]
            );
        }

        return back()->with('success', 'Izin pulang cepat telah disetujui HR dan dikirim ke Direktur untuk ditandatangani');
    }

    /**
     * Director signs the early leave response letter (Final approval)
     */
    public function directorSign(Request $request, EarlyLeaveRequest $earlyLeaveRequest)
    {
        if ($earlyLeaveRequest->status !== 'pending_director_sign') {
            return back()->with('error', 'Pengajuan tidak dapat ditandatangani. Status: ' . ($earlyLeaveRequest->status_label ?? $earlyLeaveRequest->status));
        }

        // Verify current user is the director
        if ($earlyLeaveRequest->director_id !== auth()->id()) {
            return back()->with('error', 'Anda tidak berwenang menandatangani surat ini');
        }

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $earlyLeaveRequest->signDirector($request->notes);

        // Send FCM notification to the employee
        $employee = $earlyLeaveRequest->employee;
        if ($employee && $employee->user_id) {
            $this->fcmService->sendToUsers(
                [$employee->user_id],
                'Izin Pulang Cepat Disetujui',
                'Izin pulang cepat Anda untuk tanggal ' . $earlyLeaveRequest->date->format('d M Y') . ' telah disetujui dan ditandatangani Direktur.',
                [
                    'type' => 'early_leave_approved',
                    'early_leave_request_id' => (string) $earlyLeaveRequest->id,
                ]
            );
        }

        return back()->with('success', 'Surat izin pulang cepat berhasil ditandatangani dan disetujui');
    }

    /**
     * Director rejects/declines to sign the early leave
     */
    public function directorReject(Request $request, EarlyLeaveRequest $earlyLeaveRequest)
    {
        if ($earlyLeaveRequest->status !== 'pending_director_sign') {
            return back()->with('error', 'Pengajuan tidak dapat ditolak');
        }

        // Verify current user is the director
        if ($earlyLeaveRequest->director_id !== auth()->id()) {
            return back()->with('error', 'Anda tidak berwenang menolak surat ini');
        }

        $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $earlyLeaveRequest->reject(auth()->user(), $request->notes);

        // Notify employee
        $employee = $earlyLeaveRequest->employee;
        if ($employee && $employee->user_id) {
            $this->fcmService->sendToUsers(
                [$employee->user_id],
                'Izin Pulang Cepat Ditolak Direktur',
                'Izin pulang cepat Anda ditolak oleh Direktur. Alasan: ' . $request->notes,
                [
                    'type' => 'early_leave_rejected',
                    'early_leave_request_id' => (string) $earlyLeaveRequest->id,
                ]
            );
        }

        return back()->with('success', 'Izin pulang cepat berhasil ditolak');
    }

    /**
     * Reject early leave request (by HR Admin)
     * Can reject early leaves that are pending_hr
     */
    public function reject(Request $request, EarlyLeaveRequest $earlyLeaveRequest)
    {
        if ($earlyLeaveRequest->status !== 'pending_hr') {
            return back()->with('error', 'Pengajuan tidak dapat ditolak pada status ini');
        }

        $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $earlyLeaveRequest->reject(auth()->user(), $request->notes);

        // Send FCM notification to the employee
        $employee = $earlyLeaveRequest->employee;
        if ($employee && $employee->user_id) {
            $this->fcmService->sendToUsers(
                [$employee->user_id],
                'Izin Pulang Cepat Ditolak HR',
                'Izin pulang cepat Anda untuk tanggal ' . $earlyLeaveRequest->date->format('d M Y') . ' ditolak oleh HR.' . ($request->notes ? ' Catatan: ' . $request->notes : ''),
                [
                    'type' => 'early_leave_rejected',
                    'early_leave_request_id' => (string) $earlyLeaveRequest->id,
                ]
            );
        }

        return back()->with('success', 'Izin pulang cepat ditolak');
    }

    /**
     * Download early leave letter as PDF
     */
    public function downloadPdf(EarlyLeaveRequest $earlyLeaveRequest)
    {
        // Only approved requests can generate letter
        if ($earlyLeaveRequest->status !== 'approved') {
            return back()->with('error', 'Surat hanya dapat diunduh untuk izin yang sudah disetujui');
        }

        $earlyLeaveRequest->load(['employee.user', 'employee.organizationUnit', 'approver']);

        // Get early leave template for this organization
        $template = \App\Models\DocumentTemplate::active()
            ->ofType(\App\Models\DocumentTemplate::TYPE_EARLY_LEAVE)
            ->where('organization_unit_id', $earlyLeaveRequest->employee->organization_unit_id)
            ->first();

        if (!$template) {
            return back()->with('error', 'Template surat izin pulang cepat belum dikonfigurasi untuk unit organisasi ini');
        }

        // Generate letter number
        $letterNumber = $this->generateEarlyLeaveLetterNumber($earlyLeaveRequest, $template);

        // Generate PDF
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.early-leave-letter', [
            'earlyLeave' => $earlyLeaveRequest,
            'template' => $template,
            'letterNumber' => $letterNumber,
        ]);

        // Set paper size from template
        $pageSettings = $template->page_settings;
        $paperSize = strtolower($pageSettings['paper_size'] ?? 'a4');
        $orientation = $pageSettings['orientation'] ?? 'portrait';
        
        $pdf->setPaper($paperSize, $orientation);

        $filename = 'Surat_Izin_Pulang_Cepat_' . ($earlyLeaveRequest->employee->user->name ?? 'draft') . '_' . now()->format('Y-m-d') . '.pdf';
        $filename = str_replace([' ', '/', '\\'], '_', $filename);

        return $pdf->download($filename);
    }

    /**
     * Generate letter number for early leave
     */
    private function generateEarlyLeaveLetterNumber(EarlyLeaveRequest $earlyLeave, \App\Models\DocumentTemplate $template): string
    {
        $format = $template->numbering_format ?? '{no}/PLC/{unit}/{tahun}';
        
        // Get next number
        $year = now()->year;
        $month = now()->format('m');
        
        // Count existing early leaves this year for this template type
        $count = EarlyLeaveRequest::whereYear('approved_at', $year)
            ->where('status', 'approved')
            ->whereHas('employee', fn($q) => $q->where('organization_unit_id', $earlyLeave->employee->organization_unit_id))
            ->count();
        
        $nextNumber = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        
        // Get unit code
        $unitCode = $earlyLeave->employee->organizationUnit->code ?? 'UNIT';
        
        // Replace placeholders
        $letterNumber = str_replace(
            ['{no}', '{unit}', '{tahun}', '{bulan}'],
            [$nextNumber, $unitCode, $year, $month],
            $format
        );
        
        return $letterNumber;
    }
}
