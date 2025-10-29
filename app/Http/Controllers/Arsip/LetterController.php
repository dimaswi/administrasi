<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\Letter;
use App\Models\LetterApproval;
use App\Models\LetterTemplate;
use App\Models\LetterNumberingConfig;
use App\Models\Notification;
use App\Services\TemplateService;
use App\Services\CertificateService;
use App\Services\PDFService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LetterController extends Controller
{
    private TemplateService $templateService;
    private CertificateService $certificateService;
    private PDFService $pdfService;

    public function __construct(
        TemplateService $templateService,
        CertificateService $certificateService,
        PDFService $pdfService
    ) {
        $this->templateService = $templateService;
        $this->certificateService = $certificateService;
        $this->pdfService = $pdfService;
    }

    /**
     * Display a listing of letters
     */
    public function index(Request $request)
    {
        $query = Letter::with(['template', 'creator', 'approvals.user', 'certificate'])
            ->accessibleBy(Auth::user()) // Filter by user access
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by template
        if ($request->has('template_id') && $request->template_id) {
            $query->where('template_id', $request->template_id);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('letter_number', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('recipient', 'like', "%{$search}%");
            });
        }

        $letters = $query->paginate(10)->through(function ($letter) {
            return [
                'id' => $letter->id,
                'letter_number' => $letter->letter_number,
                'subject' => $letter->subject,
                'letter_date' => $letter->letter_date,
                'recipient' => $letter->recipient,
                'status' => $letter->status,
                'created_at' => $letter->created_at,
                'template' => $letter->template ? [
                    'id' => $letter->template->id,
                    'name' => $letter->template->name,
                    'code' => $letter->template->code,
                ] : null,
                'creator' => [
                    'id' => $letter->creator->id,
                    'name' => $letter->creator->name,
                ],
                'approval_progress' => $letter->getApprovalProgress(),
            ];
        });

        // Get templates for filter (only from user's organization unit)
        $templates = LetterTemplate::active()
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('arsip/letters/index', [
            'letters' => $letters,
            'templates' => $templates,
            'filters' => $request->only(['status', 'template_id', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new letter
     */
    public function create(Request $request)
    {
        $templateId = $request->get('template_id');
        $template = null;

        if ($templateId) {
            $template = LetterTemplate::active()
                ->where('organization_unit_id', Auth::user()->organization_unit_id)
                ->findOrFail($templateId);
        }

        // Get all active templates from user's organization unit
        $templates = LetterTemplate::active()
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->select('id', 'name', 'code', 'category', 'variables', 'signatures', 'content', 'letterhead')
            ->orderBy('name')
            ->get();

        return Inertia::render('arsip/letters/create', [
            'templates' => $templates,
            'selectedTemplate' => $template,
        ]);
    }

    /**
     * Store a newly created letter
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:letter_templates,id',
            'subject' => 'required|string|max:255',
            'letter_date' => 'required|date',
            'recipient' => 'nullable|string|max:255',
            'data' => 'required|array',
            'notes' => 'nullable|string',
            'submit_type' => 'required|in:draft,submit',
        ]);

        DB::beginTransaction();
        try {
            $template = LetterTemplate::findOrFail($validated['template_id']);

            // Validate template data
            $errors = $this->templateService->validateTemplateData($template, $validated['data']);
            if (!empty($errors)) {
                return back()->withErrors($errors)->withInput();
            }

            // Generate letter number
            $letterNumber = $this->generateLetterNumber($template, $validated['data']);

            // Update nomor_surat in data for template rendering
            $validated['data']['nomor_surat'] = $letterNumber;

            // Render HTML from template
            $renderedHtml = $this->templateService->renderTemplate($template, $validated['data']);

            // Create letter
            $letter = Letter::create([
                'template_id' => $validated['template_id'],
                'letter_number' => $letterNumber,
                'subject' => $validated['subject'],
                'letter_date' => $validated['letter_date'],
                'recipient' => $validated['recipient'],
                'data' => $validated['data'],
                'rendered_html' => $renderedHtml,
                'status' => $validated['submit_type'] === 'submit' ? 'pending_approval' : 'draft',
                'notes' => $validated['notes'],
                'created_by' => Auth::id(),
            ]);

            // Create approval records if submitted for approval
            if ($validated['submit_type'] === 'submit' && $template->signatures) {
                $this->createApprovalRecords($letter, $template->signatures);
            }

            DB::commit();

            $message = $validated['submit_type'] === 'submit' 
                ? 'Surat berhasil dibuat dan dikirim untuk persetujuan'
                : 'Surat berhasil disimpan sebagai draft';

            return redirect()->route('arsip.letters.show', $letter)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat surat: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified letter
     */
    public function show(Letter $letter)
    {
        // Check authorization
        if (!$letter->canUserAccess(Auth::user())) {
            abort(403, 'Anda tidak memiliki akses ke surat ini.');
        }

        $letter->load([
            'template', 
            'creator', 
            'updater',
            'approvals.user.organizationUnit',
            'certificate',
            'archive'
        ]);

        // Re-render HTML to ensure nomor_surat is up-to-date
        // (for backward compatibility with old letters)
        $letterData = $letter->data;
        $letterData['nomor_surat'] = $letter->letter_number;
        $renderedHtml = $this->templateService->renderTemplate($letter->template, $letterData);
        
        // Append signature blocks with approval data
        $letter->rendered_html = $this->templateService->appendSignatures(
            $renderedHtml, 
            $letter->template, 
            $letter->approvals
        );

        // Check if current user has pending approval
        $userApproval = $letter->approvals()
            ->where('user_id', Auth::id())
            ->first();

        return Inertia::render('arsip/letters/show', [
            'letter' => $letter,
            'userApproval' => $userApproval,
            'canApprove' => $userApproval && $userApproval->isPending(),
        ]);
    }

    /**
     * Show the form for editing the specified letter
     */
    public function edit(Letter $letter)
    {
        // Check authorization
        if (!$letter->canUserAccess(Auth::user())) {
            abort(403, 'Anda tidak memiliki akses ke surat ini.');
        }

        // Only allow editing drafts and rejected letters
        if (!in_array($letter->status, ['draft', 'rejected'])) {
            return back()->with('error', 'Hanya draft dan surat yang ditolak yang dapat diedit');
        }

        $letter->load('template');

        return Inertia::render('arsip/letters/edit', [
            'letter' => $letter,
        ]);
    }

    /**
     * Update the specified letter
     */
    public function update(Request $request, Letter $letter)
    {
        // Check authorization
        if (!$letter->canUserAccess(Auth::user())) {
            abort(403, 'Anda tidak memiliki akses ke surat ini.');
        }

        // Only allow updating drafts and rejected letters
        if (!in_array($letter->status, ['draft', 'rejected'])) {
            return back()->with('error', 'Hanya draft dan surat yang ditolak yang dapat diupdate');
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'letter_date' => 'required|date',
            'recipient' => 'nullable|string|max:255',
            'data' => 'required|array',
            'notes' => 'nullable|string',
            'submit_type' => 'required|in:draft,submit',
        ]);

        DB::beginTransaction();
        try {
            // Validate template data
            $errors = $this->templateService->validateTemplateData($letter->template, $validated['data']);
            if (!empty($errors)) {
                return back()->withErrors($errors)->withInput();
            }

            // Update nomor_surat in data with existing letter number for template rendering
            $validated['data']['nomor_surat'] = $letter->letter_number;

            // Re-render HTML
            $renderedHtml = $this->templateService->renderTemplate($letter->template, $validated['data']);

            // Reset approvals if re-submitting after rejection
            if ($letter->status === 'rejected' && $validated['submit_type'] === 'submit') {
                // Delete old approval records
                $letter->approvals()->delete();
                
                // Create new approval records
                $this->createApprovalRecords($letter, $letter->template->signatures);
            }

            $letter->update([
                'subject' => $validated['subject'],
                'letter_date' => $validated['letter_date'],
                'recipient' => $validated['recipient'],
                'data' => $validated['data'],
                'rendered_html' => $renderedHtml,
                'status' => $validated['submit_type'] === 'submit' ? 'pending_approval' : 'draft',
                'notes' => $validated['notes'],
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            $message = $validated['submit_type'] === 'submit' 
                ? 'Surat berhasil diperbarui dan dikirim ulang untuk persetujuan'
                : 'Surat berhasil diperbarui';

            return redirect()->route('arsip.letters.show', $letter)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memperbarui surat: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Remove the specified letter
     */
    public function destroy(Letter $letter)
    {
        // Check authorization
        if (!$letter->canUserAccess(Auth::user())) {
            abort(403, 'Anda tidak memiliki akses ke surat ini.');
        }

        // Only allow deleting drafts
        if ($letter->status !== 'draft') {
            return back()->with('error', 'Hanya draft yang dapat dihapus');
        }

        $letter->delete();

        return redirect()->route('arsip.letters.index')
            ->with('success', 'Surat berhasil dihapus');
    }

    /**
     * Cancel/Withdraw letter approval request (back to draft)
     */
    public function cancelApproval(Letter $letter)
    {
        // Only creator can cancel
        if ($letter->created_by !== Auth::id()) {
            return back()->with('error', 'Hanya pembuat surat yang dapat menarik kembali pengajuan approval');
        }

        // Only allow cancel for pending or partially signed letters
        if (!in_array($letter->status, ['pending_approval', 'partially_signed'])) {
            return back()->with('error', 'Hanya surat yang menunggu persetujuan yang dapat ditarik kembali');
        }

        DB::beginTransaction();
        try {
            // Delete all approval records
            $letter->approvals()->delete();

            // Update letter status to draft
            $letter->update([
                'status' => 'draft',
                'updated_by' => Auth::id(),
            ]);

            // Send notification to all approvers that approval was cancelled
            $approvers = $letter->template->signatures ?? [];
            foreach ($approvers as $signature) {
                if (isset($signature['user_id'])) {
                    Notification::create([
                        'user_id' => $signature['user_id'],
                        'type' => 'approval_cancelled',
                        'title' => 'Pengajuan Persetujuan Dibatalkan',
                        'message' => Auth::user()->name . " membatalkan pengajuan persetujuan untuk surat {$letter->letter_number}",
                        'data' => [
                            'letter_id' => $letter->id,
                        ],
                        'action_url' => route('arsip.letters.show', $letter->id),
                    ]);
                }
            }

            DB::commit();

            return back()->with('success', 'Pengajuan persetujuan berhasil dibatalkan. Surat kembali ke status draft.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membatalkan pengajuan: ' . $e->getMessage());
        }
    }

    /**
     * Submit letter for approval (draft to pending_approval)
     */
    public function submitForApproval(Letter $letter)
    {
        // Only creator can submit
        if ($letter->created_by !== Auth::id()) {
            return back()->with('error', 'Hanya pembuat surat yang dapat mengajukan persetujuan');
        }

        // Only draft letters can be submitted
        if ($letter->status !== 'draft') {
            return back()->with('error', 'Hanya surat dengan status Draft yang dapat diajukan untuk persetujuan');
        }

        // Validate that template has signatures configured
        $signatures = $letter->template->signatures ?? [];
        if (empty($signatures)) {
            return back()->with('error', 'Template tidak memiliki konfigurasi tanda tangan. Silakan hubungi administrator.');
        }

        DB::beginTransaction();
        try {
            // Create approval records for each signature
            $this->createApprovalRecords($letter, $signatures);

            // Update letter status to pending_approval
            $letter->update([
                'status' => 'pending_approval',
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            return back()->with('success', 'Surat berhasil diajukan untuk persetujuan');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal mengajukan surat untuk persetujuan: ' . $e->getMessage());
        }
    }

    /**
     * Approve letter
     */
    public function approve(Letter $letter)
    {
        if ($letter->status !== 'pending_approval') {
            return back()->with('error', 'Surat tidak dalam status pending approval');
        }

        DB::beginTransaction();
        try {
            // Update letter status
            $letter->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Generate certificate
            $certificate = $this->certificateService->generateCertificate($letter, Auth::user());

            // Generate PDF
            $pdfPath = $this->pdfService->generatePDF($letter, $certificate);
            $letter->update(['pdf_path' => $pdfPath]);

            DB::commit();

            return back()->with('success', 'Surat berhasil disetujui dan PDF telah dibuat');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyetujui surat: ' . $e->getMessage());
        }
    }

    /**
     * Reject letter
     */
    public function reject(Request $request, Letter $letter)
    {
        if ($letter->status !== 'pending_approval') {
            return back()->with('error', 'Surat tidak dalam status pending approval');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $letter->update([
            'status' => 'rejected',
            'rejected_by' => Auth::id(),
            'rejected_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', 'Surat telah ditolak');
    }

    /**
     * Download PDF
     */
    public function downloadPDF(Letter $letter)
    {
        if (!$letter->pdf_path) {
            return back()->with('error', 'PDF belum dibuat');
        }

        return $this->pdfService->downloadPDF($letter);
    }

    /**
     * Preview letter
     */
    public function preview(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:letter_templates,id',
            'data' => 'required|array',
        ]);

        $template = LetterTemplate::findOrFail($validated['template_id']);
        $html = $this->templateService->renderTemplate($template, $validated['data']);

        return response()->json(['html' => $html]);
    }

    /**
     * Generate letter number
     */
    private function generateLetterNumber(LetterTemplate $template, array $data): string
    {
        // Try to get numbering config for this template code
        $config = LetterNumberingConfig::where('code', $template->code)
            ->where('is_active', true)
            ->first();

        if ($config) {
            $number = $config->getNextNumber();
            
            // Get replacements from data
            $replacements = [
                'code' => $template->code,
                'unit' => $data['unit_code'] ?? '',
            ];

            return $config->formatNumber($number, $replacements);
        }

        // Fallback: simple numbering
        $year = date('Y');
        $month = $this->romanMonth(date('n'));
        $count = Letter::whereYear('created_at', $year)
            ->where('template_id', $template->id)
            ->count() + 1;

        $number = str_pad($count, 3, '0', STR_PAD_LEFT);

        return "{$number}/{$template->code}/{$month}/{$year}";
    }

    /**
     * Convert month number to Roman numeral
     */
    private function romanMonth(int $month): string
    {
        $romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return $romanNumerals[$month - 1] ?? 'I';
    }

    /**
     * Create approval records for letter signatures
     */
    private function createApprovalRecords(Letter $letter, array $signatures): void
    {
        foreach ($signatures as $index => $signature) {
            if (!isset($signature['user_id'])) {
                continue;
            }

            $approval = LetterApproval::create([
                'letter_id' => $letter->id,
                'user_id' => $signature['user_id'],
                'signature_index' => $index,
                'position_name' => $signature['position'] ?? $signature['label'],
                'status' => 'pending',
                'order' => 0, // Parallel approval untuk semua
            ]);

            // Send notification to approver
            $this->sendApprovalNotification($letter, $approval);
        }
    }

    /**
     * Send approval request notification
     */
    private function sendApprovalNotification(Letter $letter, LetterApproval $approval): void
    {
        Notification::create([
            'user_id' => $approval->user_id,
            'type' => 'approval_request',
            'title' => 'Permintaan Persetujuan Surat',
            'message' => "Anda diminta untuk menyetujui surat {$letter->letter_number} - {$letter->subject}",
            'data' => [
                'letter_id' => $letter->id,
                'approval_id' => $approval->id,
            ],
            'action_url' => route('arsip.letters.show', $letter->id),
        ]);
    }

    /**
     * Approve letter by current user
     */
    public function approveByUser(Request $request, Letter $letter)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        // Find user's approval record
        $approval = $letter->approvals()
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Generate QR code data for this signature
            $signatureData = $this->generateSignatureData($letter, $approval);
            
            // Approve
            $approval->approve($validated['notes'] ?? null, $signatureData);

            DB::commit();

            return back()->with('success', 'Surat berhasil disetujui');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyetujui surat: ' . $e->getMessage());
        }
    }

    /**
     * Reject letter by current user
     */
    public function rejectByUser(Request $request, Letter $letter)
    {
        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        // Find user's approval record
        $approval = $letter->approvals()
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $approval->reject($validated['notes']);

            DB::commit();

            return back()->with('success', 'Surat telah ditolak');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menolak surat: ' . $e->getMessage());
        }
    }

    /**
     * Revoke/Cancel approval by current user
     */
    public function revokeApproval(Request $request, Letter $letter)
    {
        // Find user's approval record that is already approved
        $approval = $letter->approvals()
            ->where('user_id', Auth::id())
            ->where('status', 'approved')
            ->firstOrFail();

        // Only allow revoke if letter is not fully signed yet or not sent/archived
        if (in_array($letter->status, ['sent', 'archived'])) {
            return back()->with('error', 'Tidak dapat membatalkan persetujuan untuk surat yang sudah dikirim atau diarsipkan');
        }

        DB::beginTransaction();
        try {
            // Reset approval to pending
            $approval->update([
                'status' => 'pending',
                'signed_at' => null,
                'signature_data' => null,
                'notes' => null,
            ]);

            // Update letter status
            $letter->updateApprovalStatus();

            // Send notification to creator
            Notification::create([
                'user_id' => $letter->created_by,
                'type' => 'approval_revoked',
                'title' => 'Persetujuan Dibatalkan',
                'message' => Auth::user()->name . " membatalkan persetujuan untuk surat {$letter->letter_number}",
                'data' => [
                    'letter_id' => $letter->id,
                    'approval_id' => $approval->id,
                ],
                'action_url' => route('arsip.letters.show', $letter->id),
            ]);

            DB::commit();

            return back()->with('success', 'Persetujuan berhasil dibatalkan');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membatalkan persetujuan: ' . $e->getMessage());
        }
    }

    /**
     * Get pending approvals for current user
     */
    public function pendingApprovals()
    {
        $approvals = LetterApproval::with(['letter.template', 'letter.creator'])
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->whereHas('letter', function ($query) {
                // Exclude draft letters - only show letters that are submitted for approval
                $query->whereIn('status', ['pending_approval', 'partially_signed']);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($approval) {
                return [
                    'id' => $approval->id,
                    'position_name' => $approval->position_name,
                    'created_at' => $approval->created_at,
                    'letter' => [
                        'id' => $approval->letter->id,
                        'letter_number' => $approval->letter->letter_number,
                        'subject' => $approval->letter->subject,
                        'letter_date' => $approval->letter->letter_date,
                        'status' => $approval->letter->status,
                        'template' => [
                            'name' => $approval->letter->template->name,
                        ],
                        'creator' => [
                            'name' => $approval->letter->creator->name,
                        ],
                    ],
                ];
            });

        return Inertia::render('arsip/letters/approvals', [
            'approvals' => $approvals,
        ]);
    }

    /**
     * Generate signature data (QR code hash)
     */
    private function generateSignatureData(Letter $letter, LetterApproval $approval): string
    {
        $data = [
            'letter_id' => $letter->id,
            'letter_number' => $letter->letter_number,
            'user_id' => $approval->user_id,
            'signed_at' => now()->toIso8601String(),
        ];

        return hash('sha256', json_encode($data));
    }
}
