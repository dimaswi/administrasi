<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AnnouncementRecipient;
use App\Models\User;
use App\Services\FCMService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    protected $fcmService;

    public function __construct(FCMService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    /**
     * Display a listing of announcements
     */
    public function index(Request $request)
    {
        $query = Announcement::with('creator:id,name')
            ->orderBy('created_at', 'desc');

        $announcements = $query->paginate(15)->through(fn($announcement) => [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'message' => $announcement->message,
            'type' => $announcement->type,
            'created_by' => $announcement->created_by,
            'creator' => $announcement->creator,
            'sent_at' => $announcement->sent_at,
            'recipients_count' => $announcement->recipients_count,
            'created_at' => $announcement->created_at,
        ]);

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
        ]);
    }

    /**
     * Show the form for creating a new announcement
     */
    public function create()
    {
        $userCount = User::count();
        
        // Get all users with their employee info
        $users = User::with(['employee:id,user_id,organization_unit_id', 'employee.organizationUnit:id,name'])
            ->select('id', 'name', 'nip', 'position')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nip' => $user->nip,
                    'position' => $user->position,
                    'employee' => $user->employee ? [
                        'organization_unit' => $user->employee->organizationUnit?->name,
                    ] : null,
                ];
            });

        return Inertia::render('announcements/form', [
            'announcement' => null,
            'userCount' => $userCount,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created announcement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:general,urgent,info',
            'send_immediately' => 'boolean',
            'target_type' => 'required|in:all,specific',
            'user_ids' => 'required_if:target_type,specific|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            // Create announcement
            $announcement = Announcement::create([
                'title' => $validated['title'],
                'message' => $validated['message'],
                'type' => $validated['type'],
                'created_by' => Auth::id(),
            ]);

            // Get target users based on target_type
            if ($validated['target_type'] === 'all') {
                $users = User::all();
            } else {
                $users = User::whereIn('id', $validated['user_ids'])->get();
            }

            // Create recipients
            foreach ($users as $user) {
                AnnouncementRecipient::create([
                    'announcement_id' => $announcement->id,
                    'user_id' => $user->id,
                ]);
            }

            // Send FCM notifications if requested
            if ($request->boolean('send_immediately', true)) {
                $userIds = $users->pluck('id')->toArray();
                $result = $this->fcmService->sendToUsers(
                    $userIds,
                    $validated['title'],
                    $validated['message'],
                    [
                        'type' => 'announcement',
                        'announcement_type' => $validated['type'], // general, urgent, info
                        'announcement_id' => (string) $announcement->id,
                    ]
                );

                $announcement->markAsSent($result['success'] ?? 0);
            }

            DB::commit();

            return to_route('hr.announcements.index')
                ->with('success', 'Pengumuman berhasil dikirim ke ' . $users->count() . ' pengguna');
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Gagal mengirim pengumuman: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified announcement
     */
    public function show(Announcement $announcement)
    {
        $announcement->load(['creator:id,name', 'recipients.user:id,name']);

        return Inertia::render('announcements/show', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Mark announcement as read for current user
     */
    public function markAsRead(Announcement $announcement)
    {
        $recipient = AnnouncementRecipient::where([
            'announcement_id' => $announcement->id,
            'user_id' => Auth::id(),
        ])->first();

        if ($recipient) {
            $recipient->markAsRead();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Register FCM token
     */
    public function registerToken(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'device_type' => 'nullable|string',
            'device_name' => 'nullable|string',
        ]);

        $this->fcmService->registerToken(
            Auth::id(),
            $validated['token'],
            $validated['device_type'] ?? null,
            $validated['device_name'] ?? null
        );

        return response()->json(['success' => true]);
    }

    /**
     * Unregister FCM token
     */
    public function unregisterToken(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $this->fcmService->unregisterToken($validated['token']);

        return response()->json(['success' => true]);
    }
}
