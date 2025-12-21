<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\Disposition;
use App\Models\DispositionFollowUp;
use App\Models\IncomingLetter;
use App\Models\User;
use App\Models\Meeting;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DispositionController extends Controller
{
    /**
     * Display my dispositions (pending for action)
     */
    public function index(Request $request)
    {
        $query = Disposition::with([
                'incomingLetter.organizationUnit',
                'fromUser',
                'childDispositions.toUser'
            ])
            ->where('to_user_id', Auth::id())
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority) {
            $query->where('priority', $request->priority);
        }

        $dispositions = $query->paginate(15)->through(function ($disposition) {
            return [
                'id' => $disposition->id,
                'incoming_letter' => [
                    'id' => $disposition->incomingLetter->id,
                    'incoming_number' => $disposition->incomingLetter->incoming_number,
                    'subject' => $disposition->incomingLetter->subject,
                    'sender' => $disposition->incomingLetter->sender,
                    'received_date' => $disposition->incomingLetter->received_date->format('Y-m-d'),
                    'classification' => $disposition->incomingLetter->classification,
                ],
                'from_user' => [
                    'name' => $disposition->fromUser->name,
                ],
                'instruction' => $disposition->instruction,
                'priority' => $disposition->priority,
                'deadline' => $disposition->deadline?->format('Y-m-d'),
                'status' => $disposition->status,
                'is_overdue' => $disposition->isOverdue(),
                'created_at' => $disposition->created_at->format('Y-m-d H:i'),
                'child_count' => $disposition->childDispositions->count(),
            ];
        });

        return Inertia::render('arsip/dispositions/index', [
            'dispositions' => $dispositions,
            'filters' => $request->only(['status', 'priority']),
            'statuses' => $this->getStatuses(),
            'priorities' => $this->getPriorities(),
        ]);
    }

    /**
     * Show form to create disposition
     */
    public function create(Request $request)
    {
        $incomingLetterId = $request->get('incoming_letter_id');
        $parentDispositionId = $request->get('parent_disposition_id');

        // If parent_disposition_id is provided, get incoming_letter_id from parent
        if ($parentDispositionId) {
            $parentDisposition = Disposition::with(['incomingLetter.organizationUnit', 'toUser'])
                ->findOrFail($parentDispositionId);
            $incomingLetter = $parentDisposition->incomingLetter;
            
            $parentDispositionData = [
                'id' => $parentDisposition->id,
                'from_user_name' => $parentDisposition->fromUser->name,
                'to_user_name' => $parentDisposition->toUser->name,
                'instruction' => $parentDisposition->instruction,
                'priority' => $parentDisposition->priority,
            ];
        } else {
            $incomingLetter = IncomingLetter::with('organizationUnit')->findOrFail($incomingLetterId);
            $parentDispositionData = null;
        }

        // Get all users for disposition (exclude current user)
        $users = User::with('organizationUnit')
            ->where('id', '!=', Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'organization_unit_id'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->organizationUnit ? $user->organizationUnit->name : '-',
                    'position' => $user->position,
                ];
            });

        return Inertia::render('arsip/dispositions/create', [
            'incoming_letter' => [
                'id' => $incomingLetter->id,
                'incoming_number' => $incomingLetter->incoming_number,
                'original_number' => $incomingLetter->original_number,
                'subject' => $incomingLetter->subject,
                'sender' => $incomingLetter->sender,
                'received_date' => $incomingLetter->received_date->format('Y-m-d'),
            ],
            'parent_disposition' => $parentDispositionData,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created disposition
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'incoming_letter_id' => 'required|exists:incoming_letters,id',
            'parent_disposition_id' => 'nullable|exists:dispositions,id',
            'to_user_id' => 'required|exists:users,id',
            'instruction' => 'required|string',
            'notes' => 'nullable|string',
            'priority' => 'required|in:normal,high,urgent',
            'deadline' => 'nullable|date|after_or_equal:today',
        ]);

        // Check permission for child disposition
        if (!empty($validated['parent_disposition_id'])) {
            if (!Auth::user()->hasPermission('disposition.create_child')) {
                return back()->with('error', 'Anda tidak memiliki permission untuk membuat sub-disposisi');
            }
        } else {
            if (!Auth::user()->hasPermission('disposition.create')) {
                return back()->with('error', 'Anda tidak memiliki permission untuk membuat disposisi');
            }
        }

        DB::beginTransaction();
        try {
            $validated['from_user_id'] = Auth::id();
            $validated['status'] = 'pending';
            
            // Remove parent_disposition_id if it's null or empty
            if (empty($validated['parent_disposition_id'])) {
                unset($validated['parent_disposition_id']);
            }

            $disposition = Disposition::create($validated);

            // Update incoming letter status
            $incomingLetter = IncomingLetter::find($validated['incoming_letter_id']);
            if ($incomingLetter->status === 'new') {
                $incomingLetter->update(['status' => 'disposed']);
            }

            // Create notification for recipient
            Notification::create([
                'user_id' => $validated['to_user_id'],
                'type' => 'disposition_received',
                'title' => 'Disposisi Baru',
                'message' => Auth::user()->name . " mendisposisikan surat {$incomingLetter->incoming_number} kepada Anda",
                'data' => [
                    'disposition_id' => $disposition->id,
                    'incoming_letter_id' => $incomingLetter->id,
                ],
                'action_url' => route('arsip.dispositions.show', $disposition->id),
            ]);

            DB::commit();

            return redirect()->route('arsip.incoming-letters.show', $validated['incoming_letter_id'])
                ->with('success', 'Disposisi berhasil dibuat');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal membuat disposisi: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Display the specified disposition
     */
    public function show(Disposition $disposition)
    {
        // Load required relations for access check
        $disposition->load(['incomingLetter', 'childDispositions', 'parentDisposition']);
        
        // Check access
        if (!$disposition->canUserAccess(Auth::user())) {
            abort(403, 'Anda tidak memiliki akses ke disposisi ini');
        }

        // Mark as read if viewer is the recipient
        if ($disposition->to_user_id === Auth::id() && !$disposition->isRead()) {
            $disposition->markAsRead();
            $disposition->refresh(); // Refresh to get updated status
        }

        $disposition->load([
            'incomingLetter.organizationUnit',
            'fromUser',
            'toUser',
            'parentDisposition.fromUser',
            'parentDisposition.toUser',
            'childDispositions.toUser',
            'followUps.creator',
            'followUps.outgoingLetter',
            'followUps.meeting',
        ]);

        return Inertia::render('arsip/dispositions/show', [
            'disposition' => [
                'id' => $disposition->id,
                'incoming_letter' => [
                    'id' => $disposition->incomingLetter->id,
                    'incoming_number' => $disposition->incomingLetter->incoming_number,
                    'original_number' => $disposition->incomingLetter->original_number,
                    'subject' => $disposition->incomingLetter->subject,
                    'sender' => $disposition->incomingLetter->sender,
                    'received_date' => $disposition->incomingLetter->received_date->format('Y-m-d'),
                    'classification' => $disposition->incomingLetter->classification,
                    'file_url' => $disposition->incomingLetter->file_path ? Storage::url($disposition->incomingLetter->file_path) : null,
                ],
                'from_user' => [
                    'id' => $disposition->fromUser->id,
                    'name' => $disposition->fromUser->name,
                    'position' => $disposition->fromUser->position,
                ],
                'to_user' => [
                    'id' => $disposition->toUser->id,
                    'name' => $disposition->toUser->name,
                    'position' => $disposition->toUser->position,
                ],
                'parent_disposition' => $disposition->parentDisposition ? [
                    'id' => $disposition->parentDisposition->id,
                    'from_user' => ['name' => $disposition->parentDisposition->fromUser->name],
                    'to_user' => ['name' => $disposition->parentDisposition->toUser->name],
                    'instruction' => $disposition->parentDisposition->instruction,
                ] : null,
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
                    return [
                        'id' => $child->id,
                        'to_user' => ['name' => $child->toUser->name],
                        'instruction' => $child->instruction,
                        'status' => $child->status,
                        'created_at' => $child->created_at->format('Y-m-d H:i'),
                    ];
                }),
                'follow_ups' => $disposition->followUps->map(function ($followUp) {
                    return [
                        'id' => $followUp->id,
                        'follow_up_date' => $followUp->follow_up_date->format('Y-m-d'),
                        'follow_up_type' => $followUp->follow_up_type,
                        'follow_up_type_label' => $followUp->getFollowUpTypeLabel(),
                        'description' => $followUp->description,
                        'file_path' => $followUp->file_path,
                        'file_url' => $followUp->file_path ? Storage::url($followUp->file_path) : null,
                        'status' => $followUp->status,
                        'creator' => ['name' => $followUp->creator->name],
                        'outgoing_letter' => $followUp->outgoingLetter ? [
                            'id' => $followUp->outgoingLetter->id,
                            'letter_number' => $followUp->outgoingLetter->letter_number,
                        ] : null,
                        'meeting' => $followUp->meeting ? [
                            'id' => $followUp->meeting->id,
                            'meeting_number' => $followUp->meeting->meeting_number,
                            'title' => $followUp->meeting->title,
                        ] : null,
                        'created_at' => $followUp->created_at->format('Y-m-d H:i'),
                    ];
                }),
            ],
            'can_update_status' => Auth::user()->hasPermission('disposition.update_status') && 
                                  $disposition->to_user_id === Auth::id() && 
                                  $disposition->status !== 'completed',
            'can_add_follow_up' => Auth::user()->hasPermission('disposition.add_follow_up') && 
                                  $disposition->to_user_id === Auth::id() &&
                                  $disposition->status === 'in_progress',
            'can_create_child_disposition' => Auth::user()->hasPermission('disposition.create_child') && 
                                             $disposition->to_user_id === Auth::id() && 
                                             $disposition->status !== 'completed',
            'can_delete' => Auth::user()->hasPermission('disposition.delete') && 
                           $disposition->from_user_id === Auth::id() && 
                           $disposition->status === 'pending' &&
                           count($disposition->childDispositions) === 0,
            'available_meetings' => \App\Models\Meeting::where('organization_unit_id', Auth::user()->organization_unit_id)
                ->whereIn('status', ['scheduled', 'ongoing', 'completed'])
                ->orderBy('meeting_date', 'desc')
                ->limit(100)
                ->get(['id', 'meeting_number', 'title', 'meeting_date', 'status', 'organization_unit_id'])
                ->map(function ($meeting) {
                    return [
                        'id' => $meeting->id,
                        'meeting_number' => $meeting->meeting_number,
                        'title' => $meeting->title,
                        'meeting_date' => $meeting->meeting_date->format('Y-m-d'),
                        'status' => $meeting->status,
                    ];
                }),
            'available_letters' => [], // TODO: Will be replaced with OutgoingLetter when implemented
            'debug_user_org' => Auth::user()->organization_unit_id,
        ]);
    }

    /**
     * Mark disposition as in progress
     */
    public function markInProgress(Disposition $disposition)
    {
        if (!Auth::user()->hasPermission('disposition.update_status')) {
            return back()->with('error', 'Anda tidak memiliki permission untuk mengubah status disposisi');
        }

        if ($disposition->to_user_id !== Auth::id()) {
            return back()->with('error', 'Anda tidak memiliki akses');
        }

        $disposition->markAsInProgress();

        return back()->with('success', 'Status disposisi diupdate menjadi dalam proses');
    }

    /**
     * Mark disposition as completed
     */
    public function markCompleted(Disposition $disposition)
    {
        if (!Auth::user()->hasPermission('disposition.update_status')) {
            return back()->with('error', 'Anda tidak memiliki permission untuk mengubah status disposisi');
        }

        if ($disposition->to_user_id !== Auth::id()) {
            return back()->with('error', 'Anda tidak memiliki akses');
        }

        // Check if has follow up
        if ($disposition->followUps()->count() === 0) {
            return back()->with('error', 'Silakan tambahkan tindak lanjut terlebih dahulu');
        }

        $disposition->markAsCompleted();

        return back()->with('success', 'Disposisi berhasil diselesaikan');
    }

    /**
     * Store follow up
     */
    public function storeFollowUp(Request $request, Disposition $disposition)
    {
        if (!Auth::user()->hasPermission('disposition.add_follow_up')) {
            return back()->with('error', 'Anda tidak memiliki permission untuk menambahkan tindak lanjut');
        }

        if ($disposition->to_user_id !== Auth::id()) {
            return back()->with('error', 'Anda tidak memiliki akses');
        }

        $validated = $request->validate([
            'follow_up_date' => 'required|date',
            'follow_up_type' => 'required|in:surat_balasan,rapat,kunjungan,telepon,tidak_perlu,lainnya',
            'description' => 'required|string',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'outgoing_letter_id' => 'nullable|exists:letters,id',
            'meeting_id' => 'nullable|exists:meetings,id',
        ]);

        DB::beginTransaction();
        try {
            $validated['disposition_id'] = $disposition->id;
            $validated['created_by'] = Auth::id();
            $validated['status'] = 'completed';

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $filename = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());
                $path = $file->storeAs('disposition-follow-ups', $filename, 'public');
                $validated['file_path'] = $path;
            }

            $followUp = DispositionFollowUp::create($validated);

            // Auto mark disposition as in progress if still pending
            if ($disposition->status === 'pending') {
                $disposition->markAsInProgress();
            }

            DB::commit();

            return back()->with('success', 'Tindak lanjut berhasil ditambahkan');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menambahkan tindak lanjut: ' . $e->getMessage()]);
        }
    }

    /**
     * Get available instructions
     */
    private function getInstructions(): array
    {
        return [
            'Untuk diketahui',
            'Untuk ditindaklanjuti',
            'Untuk dipelajari',
            'Untuk koordinasi',
            'Untuk perhatian',
            'Untuk diselesaikan',
            'Mohon saran/pendapat',
            'Segera ditindaklanjuti',
        ];
    }

    /**
     * Get available statuses
     */
    private function getStatuses(): array
    {
        return [
            ['value' => 'pending', 'label' => 'Menunggu'],
            ['value' => 'read', 'label' => 'Sudah Dibaca'],
            ['value' => 'in_progress', 'label' => 'Dalam Proses'],
            ['value' => 'completed', 'label' => 'Selesai'],
        ];
    }

    /**
     * Delete/Cancel disposition
     */
    public function destroy(Disposition $disposition)
    {
        // Check permission
        if (!Auth::user()->hasPermission('disposition.delete')) {
            return back()->with('error', 'Anda tidak memiliki permission untuk menghapus disposisi');
        }

        // Only allow deletion by creator and only if status is pending
        if ($disposition->from_user_id !== Auth::id()) {
            return back()->with('error', 'Anda tidak dapat membatalkan disposisi ini');
        }

        if ($disposition->status !== 'pending') {
            return back()->with('error', 'Hanya disposisi dengan status Menunggu yang dapat dibatalkan');
        }

        // Check if has child dispositions
        if ($disposition->childDispositions()->count() > 0) {
            return back()->with('error', 'Tidak dapat membatalkan disposisi yang sudah memiliki sub-disposisi');
        }

        DB::beginTransaction();
        try {
            // Delete notifications related to this disposition
            Notification::where('data->disposition_id', $disposition->id)->delete();

            // Delete the disposition
            $disposition->delete();

            DB::commit();

            return redirect()->route('arsip.dispositions.index')
                ->with('success', 'Disposisi berhasil dibatalkan');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membatalkan disposisi: ' . $e->getMessage());
        }
    }

    /**
     * Get available priorities
     */
    private function getPriorities(): array
    {
        return [
            ['value' => 'normal', 'label' => 'Normal'],
            ['value' => 'high', 'label' => 'Tinggi'],
            ['value' => 'urgent', 'label' => 'Mendesak'],
        ];
    }
}
