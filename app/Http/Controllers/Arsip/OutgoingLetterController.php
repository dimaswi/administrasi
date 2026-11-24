<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\OutgoingLetter;
use App\Models\DocumentTemplate;
use App\Models\LetterRevision;
use App\Models\LetterSignatory;
use App\Models\User;
use App\Models\IncomingLetter;
use App\Services\LetterRenderService;
use App\Services\NotificationService;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OutgoingLetterController extends Controller
{
    /**
     * Display a listing of outgoing letters
     */
    public function index(Request $request)
    {
        $query = OutgoingLetter::with(['template', 'creator', 'signatories.user'])
            ->accessibleBy(Auth::user())
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
                $q->where('letter_number', 'ilike', "%{$search}%")
                  ->orWhere('subject', 'ilike', "%{$search}%");
            });
        }

        $currentUser = Auth::user();
        $currentUserId = $currentUser->id;
        
        $letters = $query->paginate($request->input('perPage', 15))->through(function ($letter) use ($currentUser, $currentUserId) {
            // Check all signatory slots for current user
            $userSignatories = $letter->signatories->where('user_id', $currentUserId);
            $isSignatory = $userSignatories->isNotEmpty();
            $hasPending = $userSignatories->contains('status', LetterSignatory::STATUS_PENDING);
            $hasRejected = $userSignatories->contains('status', LetterSignatory::STATUS_REJECTED);

            $signatoryStatus = null;
            if ($isSignatory) {
                if ($hasRejected) {
                    $signatoryStatus = LetterSignatory::STATUS_REJECTED;
                } elseif ($hasPending) {
                    $signatoryStatus = LetterSignatory::STATUS_PENDING;
                } else {
                    $signatoryStatus = LetterSignatory::STATUS_APPROVED;
                }
            }
            
            return [
                'id' => $letter->id,
                'letter_number' => $letter->letter_number,
                'subject' => $letter->subject,
                'letter_date' => $letter->letter_date,
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
                // Signatory info for current user
                'is_signatory' => $isSignatory,
                'signatory_status' => $signatoryStatus,
                'can_sign' => $hasPending && $letter->canBeSignedBy($currentUser),
            ];
        });

        // Get templates for filter
        $templates = DocumentTemplate::active()
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('arsip/outgoing-letters/index', [
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
        $templates = DocumentTemplate::active()
            ->where('organization_unit_id', Auth::user()->organization_unit_id)
            ->get();

        // Get users for signatory selection
        $users = User::with('organizationUnit')
            ->whereNotNull('organization_unit_id')
            ->select('id', 'name', 'position', 'nip', 'organization_unit_id')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position ?? '-',
                    'nip' => $user->nip,
                    'organization_unit' => $user->organizationUnit?->name ?? '-',
                ];
            });

        // Check if creating from incoming letter
        $incomingLetter = null;
        if ($request->has('incoming_letter_id')) {
            $incomingLetter = IncomingLetter::find($request->incoming_letter_id);
        }

        return Inertia::render('arsip/outgoing-letters/create', [
            'templates' => $templates,
            'users' => $users,
            'incoming_letter' => $incomingLetter,
        ]);
    }

    /**
     * Store a newly created letter
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:document_templates,id',
            'subject' => 'required|string|max:500',
            'letter_date' => 'required|date',
            'variable_values' => 'required|array',
            'signatories' => 'required|array|min:1',
            'signatories.*.user_id' => 'required|exists:users,id',
            'signatories.*.slot_id' => 'required|string',
            'signatories.*.sign_order' => 'required|integer|min:0',
            'incoming_letter_id' => 'nullable|exists:incoming_letters,id',
            'notes' => 'nullable|string',
        ]);

        // Verify template belongs to user's organization
        $template = DocumentTemplate::findOrFail($validated['template_id']);
        if ($template->organization_unit_id !== Auth::user()->organization_unit_id) {
            return back()->with('error', 'Template tidak valid');
        }

        DB::beginTransaction();
        try {
            $letter = OutgoingLetter::create([
                'template_id' => $validated['template_id'],
                'incoming_letter_id' => $validated['incoming_letter_id'] ?? null,
                'subject' => $validated['subject'],
                'letter_date' => $validated['letter_date'],
                'variable_values' => $validated['variable_values'],
                'status' => OutgoingLetter::STATUS_PENDING, // Langsung pending, bisa TTD
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Load relations needed for letter number generation
            $letter->load(['template', 'creator.organizationUnit']);
            
            // Generate letter number immediately
            $letter->update([
                'letter_number' => $letter->generateLetterNumber(),
            ]);

            // Create signatories
            foreach ($validated['signatories'] as $signatory) {
                LetterSignatory::create([
                    'letter_id' => $letter->id,
                    'user_id' => $signatory['user_id'],
                    'slot_id' => $signatory['slot_id'],
                    'sign_order' => $signatory['sign_order'],
                    'status' => LetterSignatory::STATUS_PENDING,
                ]);
            }

            DB::commit();

            // Clear related cache
            CacheService::clearLetterCache(null, 'outgoing');

            // Send notifications to signatories
            NotificationService::notifyLetterCreated($letter);

            return redirect()->route('arsip.outgoing-letters.show', $letter)
                ->with('success', 'Surat berhasil dibuat');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat surat: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified letter
     */
    public function show(OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        $outgoingLetter->load([
            'template',
            'creator',
            'signatories.user',
            'incomingLetter',
            'archive',
            'revisions.creator',
            'revisionRequester',
        ]);

        // Check if current user can sign and which slots are signable right now
        $currentUser = Auth::user();
        $signableSignatoryIds = $outgoingLetter->getSignableSignatoryIdsForUser($currentUser);
        $canSign = count($signableSignatoryIds) > 0;
        $userSignatories = $outgoingLetter->signatories->where('user_id', Auth::id())->values();
        $hasPendingSignatory = $userSignatories->contains('status', LetterSignatory::STATUS_PENDING);

        // Prioritize currently signable slot, then any pending slot, then first assigned slot
        $userSignatory = $userSignatories->firstWhere('id', $signableSignatoryIds[0] ?? null)
            ?? $userSignatories->firstWhere('status', LetterSignatory::STATUS_PENDING)
            ?? $userSignatories->first();

        // Transform signatories to include slot_id and slot_info
        $signatories = $outgoingLetter->signatories->map(function ($signatory) {
            return [
                'id' => $signatory->id,
                'user' => [
                    'id' => $signatory->user->id,
                    'name' => $signatory->user->name,
                    'email' => $signatory->user->email,
                    'nip' => $signatory->user->nip,
                ],
                'slot_id' => $signatory->slot_id,
                'sign_order' => $signatory->sign_order,
                'status' => $signatory->status,
                'notes' => $signatory->notes,
                'signed_at' => $signatory->signed_at,
                'slot_info' => $signatory->getSlotInfo(),
            ];
        });

        $letterData = $outgoingLetter->toArray();
        $letterData['signatories'] = $signatories;

        // Transform revisions for frontend
        $revisions = $outgoingLetter->revisions->map(function ($revision) {
            return [
                'id' => $revision->id,
                'version' => $revision->version,
                'type' => $revision->type,
                'type_label' => $revision->type_label,
                'type_color' => $revision->type_color,
                'revision_notes' => $revision->revision_notes,
                'requested_changes' => $revision->requested_changes,
                'creator' => $revision->creator ? [
                    'id' => $revision->creator->id,
                    'name' => $revision->creator->name,
                ] : null,
                'created_at' => $revision->created_at,
            ];
        });
        $letterData['revisions'] = $revisions;

        // Check if can be archived (fully signed and not yet archived)
        $canArchive = $outgoingLetter->status === OutgoingLetter::STATUS_SIGNED && 
                      !$outgoingLetter->archive;

        // Check if user can request revision (has any pending signatory slot, letter not yet fully signed)
        $canRequestRevision = $hasPendingSignatory && 
                              !in_array($outgoingLetter->status, [OutgoingLetter::STATUS_SIGNED, OutgoingLetter::STATUS_REJECTED]) &&
                              !$outgoingLetter->revision_requested;

        // Check if user can submit revision (creator when revision requested)
        $canSubmitRevision = $outgoingLetter->canRevise();
        $isCreator = $outgoingLetter->created_by === Auth::id();

        return Inertia::render('arsip/outgoing-letters/show', [
            'letter' => $letterData,
            'can_edit' => $outgoingLetter->canEdit() && $isCreator,
            'can_sign' => $canSign,
            'can_archive' => $canArchive,
            'can_request_revision' => $canRequestRevision,
            'can_submit_revision' => $canSubmitRevision,
            'is_creator' => $isCreator,
            'user_signatory' => $userSignatory,
            'signable_signatory_ids' => $signableSignatoryIds,
            'paper_sizes' => DocumentTemplate::paperSizes(),
        ]);
    }

    /**
     * Show the form for editing the letter
     */
    public function edit(OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        if (!$outgoingLetter->canEdit()) {
            return back()->with('error', 'Surat tidak dapat diedit');
        }

        $outgoingLetter->load(['template', 'signatories.user']);

        $users = User::with('organizationUnit')
            ->whereNotNull('organization_unit_id')
            ->select('id', 'name', 'position', 'nip', 'organization_unit_id')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position ?? '-',
                    'nip' => $user->nip,
                    'organization_unit' => $user->organizationUnit?->name ?? '-',
                ];
            });

        return Inertia::render('arsip/outgoing-letters/edit', [
            'letter' => $outgoingLetter,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified letter
     */
    public function update(Request $request, OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        if (!$outgoingLetter->canEdit()) {
            return back()->with('error', 'Surat tidak dapat diedit');
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:500',
            'letter_date' => 'required|date',
            'variable_values' => 'required|array',
            'signatories' => 'required|array|min:1',
            'signatories.*.user_id' => 'required|exists:users,id',
            'signatories.*.slot_id' => 'required|string',
            'signatories.*.sign_order' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $outgoingLetter->update([
                'subject' => $validated['subject'],
                'letter_date' => $validated['letter_date'],
                'variable_values' => $validated['variable_values'],
                'notes' => $validated['notes'] ?? null,
                'updated_by' => Auth::id(),
            ]);

            // Update signatories - delete old and create new
            $outgoingLetter->signatories()->delete();
            
            foreach ($validated['signatories'] as $signatory) {
                LetterSignatory::create([
                    'letter_id' => $outgoingLetter->id,
                    'user_id' => $signatory['user_id'],
                    'slot_id' => $signatory['slot_id'],
                    'sign_order' => $signatory['sign_order'],
                    'status' => LetterSignatory::STATUS_PENDING,
                ]);
            }

            DB::commit();

            // Clear related cache
            CacheService::clearLetterCache($outgoingLetter->id, 'outgoing');

            return redirect()->route('arsip.outgoing-letters.show', $outgoingLetter)
                ->with('success', 'Surat berhasil diperbarui');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memperbarui surat: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified letter
     */
    public function destroy(OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        if (!$outgoingLetter->canEdit()) {
            return back()->with('error', 'Surat tidak dapat dihapus');
        }

        $outgoingLetter->delete();

        // Clear related cache
        CacheService::clearLetterCache($outgoingLetter->id, 'outgoing');

        return redirect()->route('arsip.outgoing-letters.index')
            ->with('success', 'Surat berhasil dihapus');
    }

    /**
     * Sign/Approve letter
     */
    public function sign(Request $request, OutgoingLetter $outgoingLetter)
    {
        if (
            $outgoingLetter->status === OutgoingLetter::STATUS_REVISION
            || $outgoingLetter->revision_requested
            || in_array($outgoingLetter->status, [OutgoingLetter::STATUS_SIGNED, OutgoingLetter::STATUS_REJECTED], true)
        ) {
            return back()->with('error', 'Surat tidak dapat ditandatangani saat ini');
        }

        $validated = $request->validate([
            'signature_image' => 'nullable|string', // base64 image
            'signatory_ids' => 'nullable|array|min:1',
            'signatory_ids.*' => 'integer|exists:letter_signatories,id',
        ]);

        $requestedIds = isset($validated['signatory_ids'])
            ? array_values(array_unique(array_map('intval', $validated['signatory_ids'])))
            : null;
        $signedCount = 0;

        try {
            DB::transaction(function () use ($outgoingLetter, $validated, $requestedIds, &$signedCount) {
                $pendingForUser = $outgoingLetter->signatories()
                    ->where('user_id', Auth::id())
                    ->where('status', LetterSignatory::STATUS_PENDING)
                    ->orderBy('sign_order')
                    ->get();

                if ($requestedIds !== null) {
                    $requestedLookup = array_flip($requestedIds);
                    $targets = $pendingForUser->filter(fn ($s) => isset($requestedLookup[$s->id]))->values();

                    if ($targets->count() !== count($requestedIds)) {
                        throw new \RuntimeException('Slot tanda tangan tidak valid atau sudah ditandatangani.');
                    }
                } else {
                    $targets = $pendingForUser;
                }

                foreach ($targets as $signatory) {
                    if ($signatory->canSign()) {
                        $signatory->approve($validated['signature_image'] ?? null);
                        $signedCount++;
                    } elseif ($requestedIds !== null) {
                        throw new \RuntimeException('Slot tanda tangan belum mencapai gilirannya.');
                    }
                }
            });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        if ($signedCount === 0) {
            return back()->with('error', 'Anda tidak dapat menandatangani surat ini');
        }

        // Refresh letter to get updated status
        $outgoingLetter->refresh();

        // Send notification
        if ($outgoingLetter->status === OutgoingLetter::STATUS_SIGNED) {
            // Letter is fully signed
            NotificationService::notifyLetterFullySigned($outgoingLetter);
        } else {
            // Notify creator about progress and next signatory
            NotificationService::notifyLetterSigned($outgoingLetter, Auth::user());
        }

        $message = $signedCount > 1
            ? "Surat berhasil ditandatangani ({$signedCount} posisi TTD)"
            : 'Surat berhasil ditandatangani';

        return back()->with('success', $message);
    }

    /**
     * Reject letter
     */
    public function reject(Request $request, OutgoingLetter $outgoingLetter)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
            'signatory_id' => 'nullable|integer|exists:letter_signatories,id',
        ]);

        $query = $outgoingLetter->signatories()
            ->where('user_id', Auth::id())
            ->where('status', LetterSignatory::STATUS_PENDING);

        if (!empty($validated['signatory_id'])) {
            $query->where('id', $validated['signatory_id']);
        }

        $signatory = $query->orderBy('sign_order')->first();

        if (!$signatory) {
            return back()->with('error', 'Anda tidak dapat menolak surat ini');
        }

        $signatory->reject($validated['rejection_reason']);

        // Send notification to creator
        NotificationService::notifyLetterRejected($outgoingLetter, Auth::user(), $validated['rejection_reason']);

        return back()->with('success', 'Surat berhasil ditolak');
    }

    /**
     * Get pending approvals for current user
     */
    public function pendingApprovals()
    {
        $pendingSignatories = LetterSignatory::with(['letter.template', 'letter.creator'])
            ->where('user_id', Auth::id())
            ->where('status', LetterSignatory::STATUS_PENDING)
            ->whereHas('letter', function ($q) {
                $q->whereIn('status', [OutgoingLetter::STATUS_PENDING, OutgoingLetter::STATUS_PARTIAL]);
            })
            ->get()
            ->filter(function ($signatory) {
                return $signatory->canSign();
            })
            ->map(function ($signatory) {
                return [
                    'id' => $signatory->id,
                    'letter' => [
                        'id' => $signatory->letter->id,
                        'letter_number' => $signatory->letter->letter_number,
                        'subject' => $signatory->letter->subject,
                        'letter_date' => $signatory->letter->letter_date,
                        'template' => [
                            'name' => $signatory->letter->template->name,
                        ],
                        'creator' => [
                            'name' => $signatory->letter->creator->name,
                        ],
                    ],
                    'slot_info' => $signatory->getSlotInfo(),
                ];
            });

        return Inertia::render('arsip/outgoing-letters/approvals', [
            'pending_approvals' => $pendingSignatories->values(),
        ]);
    }

    /**
     * Preview letter (render HTML)
     */
    public function preview(OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        $outgoingLetter->load(['template', 'signatories.user']);

        return Inertia::render('arsip/outgoing-letters/preview', [
            'letter' => $outgoingLetter,
            'paper_sizes' => DocumentTemplate::paperSizes(),
        ]);
    }

    /**
     * Download PDF
     */
    public function downloadPdf(OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        $outgoingLetter->load(['template', 'signatories.user']);

        // Generate PDF using dompdf
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.outgoing-letter', [
            'letter' => $outgoingLetter,
            'template' => $outgoingLetter->template,
            'signatories' => $outgoingLetter->signatories,
        ]);

        // Set paper size from template
        $pageSettings = $outgoingLetter->template->page_settings;
        $paperSize = strtolower($pageSettings['paper_size'] ?? 'a4');
        $orientation = $pageSettings['orientation'] ?? 'portrait';
        
        $pdf->setPaper($paperSize, $orientation);

        $filename = ($outgoingLetter->letter_number ?? 'draft') . '.pdf';
        $filename = str_replace(['/', '\\'], '-', $filename);

        return $pdf->download($filename);
    }

    /**
     * Request revision for a letter
     */
    public function requestRevision(Request $request, OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        // Check if user is a signatory with pending status
        $signatory = $outgoingLetter->signatories()
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (!$signatory) {
            return back()->with('error', 'Anda tidak memiliki hak untuk meminta revisi');
        }

        // Check if letter is in correct status (not fully signed, not rejected, and no pending revision)
        if (in_array($outgoingLetter->status, [OutgoingLetter::STATUS_SIGNED, OutgoingLetter::STATUS_REJECTED])) {
            return back()->with('error', 'Surat sudah selesai dan tidak dapat direvisi');
        }

        if ($outgoingLetter->revision_requested) {
            return back()->with('error', 'Permintaan revisi sudah ada, menunggu revisi dari pembuat surat');
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $outgoingLetter->requestRevision($validated['notes'], Auth::id());

        // Send notification to creator
        NotificationService::notifyRevisionRequested($outgoingLetter, Auth::user(), $validated['notes']);

        return back()->with('success', 'Permintaan revisi telah dikirim');
    }

    /**
     * Submit revision for a letter
     */
    public function submitRevision(Request $request, OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        // Refresh from database to get latest status
        $outgoingLetter->refresh();

        // Check if letter is actually in revision status
        if ($outgoingLetter->status !== OutgoingLetter::STATUS_REVISION) {
            return redirect()->route('arsip.outgoing-letters.show', $outgoingLetter)
                ->with('error', 'Surat tidak dalam status revisi');
        }

        // Check if user is the creator and revision is requested
        if (!$outgoingLetter->canRevise()) {
            return redirect()->route('arsip.outgoing-letters.show', $outgoingLetter)
                ->with('error', 'Anda tidak memiliki hak untuk merevisi surat ini');
        }

        $validated = $request->validate([
            'variable_values' => 'required|array',
            'revision_notes' => 'nullable|string|max:1000',
        ]);

        $outgoingLetter->submitRevision(
            $validated['variable_values'],
            $validated['revision_notes'] ?? null
        );

        // Refresh and send notifications to all signatories
        $outgoingLetter->refresh();
        NotificationService::notifyRevisionSubmitted($outgoingLetter);

        return redirect()->route('arsip.outgoing-letters.show', $outgoingLetter)
            ->with('success', 'Revisi berhasil disubmit');
    }

    /**
     * Show revision form
     */
    public function revisionForm(OutgoingLetter $outgoingLetter)
    {
        $this->authorizeAccess($outgoingLetter);

        // Refresh from database to get latest status
        $outgoingLetter->refresh();

        // Check if letter is actually in revision status
        if ($outgoingLetter->status !== OutgoingLetter::STATUS_REVISION) {
            return redirect()->route('arsip.outgoing-letters.show', $outgoingLetter)
                ->with('error', 'Surat tidak dalam status revisi');
        }

        if (!$outgoingLetter->canRevise()) {
            return redirect()->route('arsip.outgoing-letters.show', $outgoingLetter)
                ->with('error', 'Anda tidak memiliki hak untuk merevisi surat ini');
        }

        $outgoingLetter->load(['template', 'signatories.user', 'revisionRequester']);

        return Inertia::render('arsip/outgoing-letters/revision', [
            'letter' => $outgoingLetter,
            'paper_sizes' => DocumentTemplate::paperSizes(),
        ]);
    }

    /**
     * Check if user can access this letter
     */
    private function authorizeAccess(OutgoingLetter $letter): void
    {
        $user = Auth::user();
        
        // User can access if they are a signatory
        $isSignatory = $letter->signatories()->where('user_id', $user->id)->exists();
        if ($isSignatory) {
            return;
        }
        
        // User can access if letter belongs to their organization unit
        $template = $letter->template;
        if ($template && $template->organization_unit_id === $user->organization_unit_id) {
            return;
        }
        
        abort(403, 'Anda tidak memiliki akses ke surat ini');
    }
}
