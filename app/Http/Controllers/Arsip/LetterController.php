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
use Illuminate\Support\Facades\Log;
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

            // Clone template content and replace variables in TipTap JSON
            $letterContent = $this->templateService->replaceVariablesInContent($template->content, $validated['data']);
            $validated['data']['content'] = $letterContent;

            // Render HTML with kop surat + content with replaced variables
            // This HTML will be used for preview and PDF generation
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

            // Extract signatures from template content (yang sudah ada di editor)
            // Create approval records based on signatures embedded in content
            // Only if letter is submitted (not draft)
            if ($validated['submit_type'] === 'submit') {
                $signatures = $this->templateService->extractSignatures($template->content);
                
                Log::info('Creating approval records', [
                    'letter_id' => $letter->id,
                    'signatures_found' => count($signatures),
                    'signatures' => $signatures,
                ]);
                
                foreach ($signatures as $signature) {
                    $letter->approvals()->create([
                        'user_id' => $signature['userId'],
                        'signature_index' => $signature['signatureIndex'],
                        'position_name' => $signature['position'],
                        'status' => 'pending',
                    ]);
                }
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
            'template:id,name,code,letterhead,content', // Include content for frontend rendering
            'creator', 
            'updater',
            'approvals.user.organizationUnit',
            'certificate',
            'archive'
        ]);

        // Always regenerate HTML from data to ensure latest formatting (e.g., date format)
        // This ensures any changes to TemplateService formatters are applied
        $letterData = $letter->data;
        $letterData['nomor_surat'] = $letter->letter_number;
        
        // Use renderTemplate which handles both old and new format + applies date formatting
        $letter->rendered_html = $this->templateService->renderTemplate($letter->template, $letterData);
        
        // If letter is approved/fully_signed, inject real QR codes for preview
        if (in_array($letter->status, ['approved', 'fully_signed'])) {
            $letter->rendered_html = $this->injectQRCodesForPreview($letter);
        }

        // Check if current user has pending approval
        $userApproval = $letter->approvals()
            ->where('user_id', Auth::id())
            ->first();

        // Debug: Log approval info
        Log::info('Letter Show Debug', [
            'letter_id' => $letter->id,
            'total_approvals' => $letter->approvals()->count(),
            'user_approval_exists' => $userApproval ? true : false,
            'user_approval_status' => $userApproval ? $userApproval->status : null,
            'can_approve' => $userApproval && $userApproval->isPending(),
        ]);

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
     * Approve letter (individual approval)
     */
    public function approve(Request $request, Letter $letter)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            // Find pending approval for this user
            $approval = $letter->approvals()
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->first();

            if (!$approval) {
                return back()->with('error', 'Anda tidak memiliki approval pending untuk surat ini');
            }

            // Generate certificate for this signature
            $certificate = $this->certificateService->generateCertificate($letter, $user, $approval->id);
            
            // Generate signature hash
            $signatureHash = $this->certificateService->generateSignatureHash(
                $approval->id,
                $user->id,
                $letter->letter_number
            );

            // Update approval status with certificate
            $approval->update([
                'status' => 'approved',
                'notes' => $validated['notes'] ?? null,
                'signature_data' => json_encode([
                    'certificate_id' => $certificate->certificate_id,
                    'signature_hash' => $signatureHash,
                    'signed_at' => now()->toISOString(),
                ]),
                'signed_at' => now(),
            ]);

            // Check if all approvals are completed
            $allApproved = $letter->approvals()->where('status', '!=', 'approved')->count() === 0;

            if ($allApproved) {
                // Update letter status
                $letter->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                ]);

                // Generate PDF with all signatures
                $this->generateLetterPDF($letter);

                DB::commit();
                return back()->with('success', 'Surat berhasil disetujui. Semua approval telah selesai dan PDF telah dibuat.');
            }

            DB::commit();
            return back()->with('success', 'Approval Anda berhasil disimpan. Menunggu approval dari penandatangan lainnya.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyetujui surat: ' . $e->getMessage());
        }
    }
    
    /**
     * Inject QR codes for preview (approved letters)
     */
    private function injectQRCodesForPreview(Letter $letter): string
    {
        $html = $letter->rendered_html;
        
        // Get all approved approvals
        $approvals = $letter->approvals()
            ->where('status', 'approved')
            ->with('user')
            ->get();
        
        Log::info('Preview QR Injection', [
            'letter_id' => $letter->id,
            'approved_count' => $approvals->count(),
            'html_has_signature' => strpos($html, 'data-type="signature"') !== false,
        ]);
        
        foreach ($approvals as $approval) {
            $signatureData = json_decode($approval->signature_data, true);
            
            // Generate certificate if not exists (for old approvals)
            if (!$signatureData || !isset($signatureData['certificate_id'])) {
                $certificate = $this->certificateService->generateCertificate(
                    $letter, 
                    $approval->user, 
                    $approval->id
                );
                
                $signatureHash = $this->certificateService->generateSignatureHash(
                    $approval->id,
                    $approval->user->id,
                    $letter->letter_number
                );
                
                $signatureData = [
                    'certificate_id' => $certificate->certificate_id,
                    'signature_hash' => $signatureHash,
                    'signed_at' => $approval->signed_at ? $approval->signed_at->toISOString() : now()->toISOString(),
                ];
                
                $approval->update(['signature_data' => json_encode($signatureData)]);
            }
            
            // Generate QR code
            $qrCode = $this->certificateService->generateApprovalQRCodeBase64(
                $signatureData['certificate_id'],
                $approval->id
            );
            
            // Replace signature placeholder with QR code image
            $qrImage = '<img src="data:image/png;base64,' . $qrCode . '" style="width: 56px; height: 56px; display: inline-block; vertical-align: middle; border: 1px solid #333; margin: 0 2px;" alt="QR" title="Scan untuk verifikasi - ' . $approval->user->name . '" />';
            
            // Try multiple patterns to match signature spans
            $patterns = [
                '/<span[^>]*data-type="signature"[^>]*data-user-id="' . $approval->user_id . '"[^>]*\/>/i',
                '/<span[^>]*data-type="signature"[^>]*data-user-id="' . $approval->user_id . '"[^>]*><\/span>/i',
                '/<span[^>]*data-user-id="' . $approval->user_id . '"[^>]*data-type="signature"[^>]*><\/span>/i',
                '/<span[^>]*data-type="signature"[^>]*data-user-id="' . $approval->user_id . '"[^>]*>.*?<\/span>/is',
            ];
            
            foreach ($patterns as $pattern) {
                $count = 0;
                $html = preg_replace($pattern, $qrImage, $html, -1, $count);
                if ($count > 0) {
                    Log::info('Preview QR Replaced', [
                        'user_id' => $approval->user_id,
                        'user_name' => $approval->user->name,
                        'count' => $count,
                        'certificate_id' => $signatureData['certificate_id'],
                    ]);
                    break;
                }
            }
        }
        
        Log::info('Preview QR Injection Complete', [
            'has_img_tag' => strpos($html, '<img src="data:image/png;base64,') !== false,
        ]);
        
        // Remove any remaining signature placeholders that weren't replaced with QR codes
        $html = preg_replace('/<span[^>]*data-type="signature"[^>]*>.*?<\/span>/is', '', $html);
        
        // Replace text-based signatures in content with QR codes (tanpa hapus CSS wrapper)
        foreach ($approvals as $approval) {
            $signatureData = json_decode($approval->signature_data, true);
            if ($signatureData && isset($signatureData['certificate_id'])) {
                $qrCode = $this->certificateService->generateApprovalQRCodeBase64(
                    $signatureData['certificate_id'],
                    $approval->id
                );
                
                $userName = $approval->user->name;
                
                // Replace entire <span>QR</span> with QR image (ganti seluruh span, bukan hanya teks)
                // Pattern untuk struktur: <span><span>Label</span><span>QR</span><span>Nama</span></span>
                $pattern = '/(<span[^>]*>[^<]*<span[^>]*>[^<]*<\/span>[^<]*)<span[^>]*>QR<\/span>([^<]*<span[^>]*>' . preg_quote($userName, '/') . '<\/span><\/span>)/is';
                $replacement = '$1<img src="data:image/png;base64,' . $qrCode . '" style="width: 85px; height: 85px; display: block; margin: 4px auto;" alt="QR Code" />$2';
                
                $count = 0;
                $html = preg_replace($pattern, $replacement, $html, 1, $count);
                
                // Remove border from wrapper span (hapus border dari kotak signature)
                if ($count > 0) {
                    // Remove "border: 1px solid ..." from the outermost span
                    $html = preg_replace(
                        '/(<span[^>]*style="[^"]*?)border:\s*1px\s+solid[^;]*;?([^"]*")/is',
                        '$1$2',
                        $html
                    );
                }
                
                Log::info('Replaced text QR with image', [
                    'user_name' => $userName,
                    'replaced' => $count > 0,
                ]);
            }
        }
        
        // If no signatures were replaced (old template without embedded signatures), append QR codes at bottom
        if (strpos($html, '<img src="data:image/png;base64,') === false && $approvals->count() > 0) {
            $html .= '<div style="margin-top: 40px; text-align: right; padding-right: 80px;">';
            foreach ($approvals as $approval) {
                $signatureData = json_decode($approval->signature_data, true);
                if ($signatureData && isset($signatureData['certificate_id'])) {
                    $qrCode = $this->certificateService->generateApprovalQRCodeBase64(
                        $signatureData['certificate_id'],
                        $approval->id
                    );
                    $html .= '<div style="display: inline-block; text-align: center; margin: 0 10px; vertical-align: top;">';
                    $html .= '<div style="margin-bottom: 50px; font-size: 12px; font-weight: normal; min-height: 20px;"></div>';
                    $html .= '<img src="data:image/png;base64,' . $qrCode . '" style="width: 80px; height: 80px; border: 1px solid #333; display: block; margin: 0 auto;" alt="QR" title="Scan untuk verifikasi" />';
                    $html .= '<div style="margin-top: 5px; font-size: 12px; font-weight: bold; text-decoration: underline;">' . $approval->user->name . '</div>';
                    $html .= '<div style="font-size: 11px; color: #333;">' . $approval->position_name . '</div>';
                    if ($approval->user->nip) {
                        $html .= '<div style="font-size: 10px; color: #666;">NIP: ' . $approval->user->nip . '</div>';
                    }
                    $html .= '</div>';
                }
            }
            $html .= '</div>';
            
            Log::info('Appended QR codes at bottom for old template');
        }
        
        return $html;
    }
    
    /**
     * Generate PDF for letter with all signatures
     */
    private function generateLetterPDF(Letter $letter): void
    {
        // Get all approved approvals with certificates
        $approvals = $letter->approvals()
            ->where('status', 'approved')
            ->with('user')
            ->orderBy('order')
            ->get();

        $approvalSignatures = [];
        
        foreach ($approvals as $approval) {
            $signatureData = json_decode($approval->signature_data, true);
            
            // If approval doesn't have signature_data (old approvals), generate certificate now
            if (!$signatureData || !isset($signatureData['certificate_id'])) {
                // Generate certificate for this old approval
                $certificate = $this->certificateService->generateCertificate(
                    $letter, 
                    $approval->user, 
                    $approval->id
                );
                
                // Generate signature hash
                $signatureHash = $this->certificateService->generateSignatureHash(
                    $approval->id,
                    $approval->user->id,
                    $letter->letter_number
                );
                
                // Update approval with certificate data
                $signatureData = [
                    'certificate_id' => $certificate->certificate_id,
                    'signature_hash' => $signatureHash,
                    'signed_at' => $approval->signed_at ? $approval->signed_at->toISOString() : now()->toISOString(),
                ];
                
                $approval->update([
                    'signature_data' => json_encode($signatureData)
                ]);
            }
            
            // Generate QR code for this signature
            $qrCode = $this->certificateService->generateApprovalQRCodeBase64(
                $signatureData['certificate_id'],
                $approval->id
            );
            
            $approvalSignatures[] = [
                'user_id' => $approval->user_id,
                'signer_name' => $approval->user->name,
                'position' => $approval->position_name,
                'nip' => $approval->user->nip,
                'certificate_id' => $signatureData['certificate_id'],
                'signed_at' => $approval->signed_at,
                'qr_code' => $qrCode,
            ];
        }

        // Generate PDF with signatures
        $pdfPath = $this->pdfService->generatePDF($letter, $approvalSignatures);
        $letter->update(['pdf_path' => $pdfPath]);
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
     * Regenerate/Generate PDF with signatures
     */
    public function regeneratePDF(Letter $letter)
    {
        try {
            // Allow generate PDF for approved or fully_signed status
            if (!in_array($letter->status, ['approved', 'fully_signed'])) {
                return back()->with('error', 'Hanya surat yang sudah disetujui yang dapat di-generate PDF');
            }

            $this->generateLetterPDF($letter);

            return back()->with('success', 'PDF berhasil di-generate dengan semua tanda tangan');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal generate PDF: ' . $e->getMessage());
        }
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
