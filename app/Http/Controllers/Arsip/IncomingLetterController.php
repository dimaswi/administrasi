<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\IncomingLetter;
use App\Models\OrganizationUnit;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class IncomingLetterController extends Controller
{
    /**
     * Display a listing of incoming letters
     */
    public function index(Request $request)
    {
        $query = IncomingLetter::with(['organizationUnit', 'registrar', 'dispositions.toUser'])
            ->accessibleBy(Auth::user())
            ->orderBy('received_date', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by classification
        if ($request->has('classification') && $request->classification) {
            $query->where('classification', $request->classification);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('incoming_number', 'like', "%{$search}%")
                  ->orWhere('original_number', 'like', "%{$search}%")
                  ->orWhere('sender', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('received_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('received_date', '<=', $request->date_to);
        }

        $letters = $query->paginate(15)->through(function ($letter) {
            return [
                'id' => $letter->id,
                'incoming_number' => $letter->incoming_number,
                'original_number' => $letter->original_number,
                'original_date' => $letter->original_date->format('Y-m-d'),
                'received_date' => $letter->received_date->format('Y-m-d'),
                'sender' => $letter->sender,
                'subject' => $letter->subject,
                'category' => $letter->category,
                'classification' => $letter->classification,
                'status' => $letter->status,
                'has_file' => !empty($letter->file_path),
                'organization_unit' => [
                    'name' => $letter->organizationUnit->name,
                ],
                'registrar' => [
                    'name' => $letter->registrar->name,
                ],
                'disposition_count' => $letter->dispositions->count(),
                'disposition_progress' => $letter->getDispositionProgress(),
            ];
        });

        return Inertia::render('arsip/incoming-letters/index', [
            'letters' => $letters,
            'filters' => $request->only(['status', 'category', 'classification', 'search', 'date_from', 'date_to']),
            'categories' => $this->getCategories(),
            'statuses' => $this->getStatuses(),
            'classifications' => $this->getClassifications(),
        ]);
    }

    /**
     * Show the form for creating a new incoming letter
     */
    public function create()
    {
        $organizationUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('arsip/incoming-letters/create', [
            'organizationUnits' => $organizationUnits,
            'categories' => $this->getCategories(),
            'classifications' => $this->getClassifications(),
        ]);
    }

    /**
     * Store a newly created incoming letter
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'original_number' => 'required|string|max:255',
            'original_date' => 'required|date',
            'received_date' => 'required|date',
            'sender' => 'required|string|max:255',
            'subject' => 'required|string',
            'category' => 'nullable|string|max:255',
            'classification' => 'required|in:biasa,penting,segera,rahasia',
            'attachment_count' => 'nullable|integer|min:0',
            'attachment_description' => 'nullable|string',
            'organization_unit_id' => 'required|exists:organization_units,id',
            'notes' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:20480',
        ]);

        DB::beginTransaction();
        try {
            // Generate incoming number
            $validated['incoming_number'] = $this->generateIncomingNumber($validated['organization_unit_id']);
            $validated['registered_by'] = Auth::id();
            $validated['status'] = 'new';

            // Handle file upload
            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                $file = $request->file('file');
                $filename = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());
                $path = $file->storeAs('incoming-letters', $filename, 'public');
                $validated['file_path'] = $path;
            }

            $letter = IncomingLetter::create($validated);

            // Create notification for organization unit head
            $orgUnit = OrganizationUnit::find($validated['organization_unit_id']);
            if ($orgUnit && $orgUnit->head_id) {
                Notification::create([
                    'user_id' => $orgUnit->head_id,
                    'type' => 'incoming_letter_received',
                    'title' => 'Surat Masuk Baru',
                    'message' => "Surat masuk baru dari {$letter->sender} dengan nomor {$letter->incoming_number}",
                    'data' => [
                        'incoming_letter_id' => $letter->id,
                    ],
                    'action_url' => route('arsip.incoming-letters.show', $letter->id),
                ]);
            }

            DB::commit();

            return redirect()->route('arsip.incoming-letters.show', $letter->id)
                ->with('success', 'Surat masuk berhasil didaftarkan');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to store incoming letter', ['error' => $e->getMessage()]);
            
            return back()->withErrors(['error' => 'Gagal menyimpan surat masuk: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Display the specified incoming letter
     */
    public function show(IncomingLetter $incomingLetter)
    {
        $incomingLetter->load([
            'organizationUnit',
            'registrar',
            'dispositions.fromUser',
            'dispositions.toUser',
            'dispositions.followUps.creator',
            'dispositions.childDispositions.toUser',
            'outgoingLetters.template',
            'meetings.room',
            'archive',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        $canEdit = $user->hasPermission('incoming_letter.edit') && $incomingLetter->status === 'new';
        $canDelete = $user->hasPermission('incoming_letter.delete') && $incomingLetter->status === 'new';
        
        // User can create disposition ONLY if:
        // 1. Has permission disposition.create
        // 2. Letter is not archived
        // 3. User is the registrar (creator) of this letter
        $canCreateDisposition = $user->hasPermission('disposition.create') && 
                               $incomingLetter->status !== 'archived' &&
                               (int) $incomingLetter->registered_by === (int) $user->id;

        return Inertia::render('arsip/incoming-letters/show', [
            'letter' => [
                'id' => $incomingLetter->id,
                'incoming_number' => $incomingLetter->incoming_number,
                'original_number' => $incomingLetter->original_number,
                'original_date' => $incomingLetter->original_date->format('Y-m-d'),
                'received_date' => $incomingLetter->received_date->format('Y-m-d'),
                'sender' => $incomingLetter->sender,
                'subject' => $incomingLetter->subject,
                'category' => $incomingLetter->category,
                'classification' => $incomingLetter->classification,
                'attachment_count' => $incomingLetter->attachment_count,
                'attachment_description' => $incomingLetter->attachment_description,
                'file_path' => $incomingLetter->file_path,
                'file_url' => $incomingLetter->file_path ? Storage::url($incomingLetter->file_path) : null,
                'status' => $incomingLetter->status,
                'notes' => $incomingLetter->notes,
                'created_at' => $incomingLetter->created_at->format('Y-m-d H:i'),
                'organization_unit' => [
                    'id' => $incomingLetter->organizationUnit->id,
                    'name' => $incomingLetter->organizationUnit->name,
                ],
                'registrar' => [
                    'id' => $incomingLetter->registrar->id,
                    'name' => $incomingLetter->registrar->name,
                ],
                'dispositions' => $incomingLetter->dispositions->map(function ($disposition) {
                    return $this->formatDisposition($disposition);
                }),
                'disposition_progress' => $incomingLetter->getDispositionProgress(),
                'outgoing_letters' => $incomingLetter->outgoingLetters->map(function ($letter) {
                    return [
                        'id' => $letter->id,
                        'letter_number' => $letter->letter_number,
                        'subject' => $letter->subject,
                        'status' => $letter->status,
                    ];
                }),
                'meetings' => $incomingLetter->meetings->map(function ($meeting) {
                    return [
                        'id' => $meeting->id,
                        'meeting_number' => $meeting->meeting_number,
                        'title' => $meeting->title,
                        'meeting_date' => $meeting->meeting_date->format('Y-m-d'),
                        'status' => $meeting->status,
                    ];
                }),
            ],
            'can_edit' => $canEdit,
            'can_delete' => $canDelete,
            'can_create_disposition' => $canCreateDisposition,
        ]);
    }

    /**
     * Show the form for editing the specified incoming letter
     */
    public function edit(IncomingLetter $incomingLetter)
    {
        // Only allow editing if status is 'new' or user is admin
        if ($incomingLetter->status !== 'new' && Auth::user()->role_id !== 1) {
            return back()->with('error', 'Hanya surat dengan status baru yang dapat diedit');
        }

        $organizationUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('arsip/incoming-letters/edit', [
            'letter' => [
                'id' => $incomingLetter->id,
                'incoming_number' => $incomingLetter->incoming_number,
                'original_number' => $incomingLetter->original_number,
                'original_date' => $incomingLetter->original_date->format('Y-m-d'),
                'received_date' => $incomingLetter->received_date->format('Y-m-d'),
                'sender' => $incomingLetter->sender,
                'subject' => $incomingLetter->subject,
                'category' => $incomingLetter->category,
                'classification' => $incomingLetter->classification,
                'attachment_count' => $incomingLetter->attachment_count,
                'attachment_description' => $incomingLetter->attachment_description,
                'organization_unit_id' => $incomingLetter->organization_unit_id,
                'notes' => $incomingLetter->notes,
                'file_path' => $incomingLetter->file_path,
            ],
            'organizationUnits' => $organizationUnits,
            'categories' => $this->getCategories(),
            'classifications' => $this->getClassifications(),
        ]);
    }

    /**
     * Update the specified incoming letter
     */
    public function update(Request $request, IncomingLetter $incomingLetter)
    {
        // Only allow editing if status is 'new' or user is admin
        if ($incomingLetter->status !== 'new' && Auth::user()->role_id !== 1) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['message' => 'Hanya surat dengan status baru yang dapat diedit'], 403);
            }
            return back()->with('error', 'Hanya surat dengan status baru yang dapat diedit');
        }

        $validated = $request->validate([
            'original_number' => 'required|string|max:255',
            'original_date' => 'required|date',
            'received_date' => 'required|date',
            'sender' => 'required|string|max:255',
            'subject' => 'required|string',
            'category' => 'nullable|string|max:255',
            'classification' => 'required|in:biasa,penting,segera,rahasia',
            'attachment_count' => 'nullable|integer|min:0',
            'attachment_description' => 'nullable|string',
            'organization_unit_id' => 'required|exists:organization_units,id',
            'notes' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:20480',
        ]);

        DB::beginTransaction();
        try {
            // Handle file upload
            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                // Delete old file
                if ($incomingLetter->file_path) {
                    Storage::disk('public')->delete($incomingLetter->file_path);
                }

                $file = $request->file('file');
                $filename = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());
                $path = $file->storeAs('incoming-letters', $filename, 'public');
                $validated['file_path'] = $path;
            }

            $incomingLetter->update($validated);

            DB::commit();

            return redirect()->route('arsip.incoming-letters.show', $incomingLetter->id)
                ->with('success', 'Surat masuk berhasil diupdate');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to update incoming letter', ['error' => $e->getMessage()]);
            
            return back()->withErrors(['error' => 'Gagal mengupdate surat masuk: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Remove the specified incoming letter
     */
    public function destroy(IncomingLetter $incomingLetter)
    {
        // Only admin or registrar can delete
        if (Auth::user()->role_id !== 1 && $incomingLetter->registered_by !== Auth::id()) {
            return back()->with('error', 'Anda tidak memiliki akses untuk menghapus surat ini');
        }

        // Can't delete if has dispositions
        if ($incomingLetter->dispositions()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus surat yang sudah memiliki disposisi');
        }

        DB::beginTransaction();
        try {
            // Delete file
            if ($incomingLetter->file_path) {
                Storage::disk('public')->delete($incomingLetter->file_path);
            }

            $incomingLetter->delete();

            DB::commit();

            return redirect()->route('arsip.incoming-letters.index')
                ->with('success', 'Surat masuk berhasil dihapus');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus surat masuk: ' . $e->getMessage());
        }
    }

    /**
     * Download file
     */
    public function download(IncomingLetter $incomingLetter)
    {
        if (!$incomingLetter->file_path) {
            abort(404, 'File tidak tersedia');
        }

        $filePath = storage_path('app/public/' . $incomingLetter->file_path);
        
        if (!file_exists($filePath)) {
            abort(404, 'File tidak ditemukan di: ' . $filePath);
        }

        // Sanitize filename - remove / and \ characters
        $filename = str_replace(['/', '\\'], '-', $incomingLetter->incoming_number);
        
        // Get original file extension
        $extension = pathinfo($incomingLetter->file_path, PATHINFO_EXTENSION);
        
        $downloadFilename = $filename . '.' . $extension;
        
        return response()->download($filePath, $downloadFilename, [
            'Content-Type' => mime_content_type($filePath),
        ]);
    }

    /**
     * Preview file (inline)
     */
    public function preview(IncomingLetter $incomingLetter)
    {
        if (!$incomingLetter->file_path) {
            abort(404, 'File tidak tersedia');
        }

        $filePath = storage_path('app/public/' . $incomingLetter->file_path);
        
        if (!file_exists($filePath)) {
            abort(404, 'File tidak ditemukan');
        }

        $mimeType = mime_content_type($filePath);
        
        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline',
        ]);
    }

    /**
     * Generate incoming number
     */
    private function generateIncomingNumber($organizationUnitId): string
    {
        $orgUnit = OrganizationUnit::find($organizationUnitId);
        $year = date('Y');
        $month = date('m');

        // Get last number for this month
        $lastLetter = IncomingLetter::where('organization_unit_id', $organizationUnitId)
            ->whereYear('received_date', $year)
            ->whereMonth('received_date', $month)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastLetter ? (int) explode('/', $lastLetter->incoming_number)[1] + 1 : 1;

        // Format: SM/001/UNIT/X/2025
        return sprintf('SM/%03d/%s/%s/%s', 
            $nextNumber, 
            $orgUnit->code ?? 'ORG', 
            strtoupper(date('F')), 
            $year
        );
    }

    /**
     * Format disposition for response
     */
    private function formatDisposition($disposition)
    {
        return [
            'id' => $disposition->id,
            'from_user' => [
                'id' => $disposition->fromUser->id,
                'name' => $disposition->fromUser->name,
            ],
            'to_user' => [
                'id' => $disposition->toUser->id,
                'name' => $disposition->toUser->name,
            ],
            'instruction' => $disposition->instruction,
            'notes' => $disposition->notes,
            'priority' => $disposition->priority,
            'deadline' => $disposition->deadline?->format('Y-m-d'),
            'status' => $disposition->status,
            'read_at' => $disposition->read_at?->format('Y-m-d H:i'),
            'completed_at' => $disposition->completed_at?->format('Y-m-d H:i'),
            'created_at' => $disposition->created_at->format('Y-m-d H:i'),
            'is_overdue' => $disposition->isOverdue(),
            'child_dispositions' => $disposition->childDispositions->map(function ($child) {
                return $this->formatDisposition($child);
            }),
            'follow_ups' => $disposition->followUps->map(function ($followUp) {
                return [
                    'id' => $followUp->id,
                    'follow_up_date' => $followUp->follow_up_date->format('Y-m-d'),
                    'follow_up_type' => $followUp->follow_up_type,
                    'follow_up_type_label' => $followUp->getFollowUpTypeLabel(),
                    'description' => $followUp->description,
                    'status' => $followUp->status,
                    'creator' => [
                        'name' => $followUp->creator->name,
                    ],
                ];
            }),
        ];
    }

    /**
     * Get available categories
     */
    private function getCategories(): array
    {
        return [
            'Undangan',
            'Permohonan',
            'Pemberitahuan',
            'Surat Tugas',
            'Surat Keputusan',
            'Surat Edaran',
            'Nota Dinas',
            'Lainnya',
        ];
    }

    /**
     * Get available statuses
     */
    private function getStatuses(): array
    {
        return [
            ['value' => 'new', 'label' => 'Baru'],
            ['value' => 'disposed', 'label' => 'Sudah Disposisi'],
            ['value' => 'in_progress', 'label' => 'Dalam Proses'],
            ['value' => 'completed', 'label' => 'Selesai'],
            ['value' => 'archived', 'label' => 'Diarsipkan'],
        ];
    }

    /**
     * Get available classifications
     */
    private function getClassifications(): array
    {
        return [
            ['value' => 'biasa', 'label' => 'Biasa'],
            ['value' => 'penting', 'label' => 'Penting'],
            ['value' => 'segera', 'label' => 'Segera'],
            ['value' => 'rahasia', 'label' => 'Rahasia'],
        ];
    }
}
