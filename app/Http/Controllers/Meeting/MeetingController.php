<?php

namespace App\Http\Controllers\Meeting;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingParticipant;
use App\Models\OrganizationUnit;
use App\Models\Room;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class MeetingController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $status = $request->get('status', '');

        $meetings = Meeting::query()
            ->with(['room', 'organizer', 'organizationUnit'])
            ->withCount(['participants', 'attendedParticipants'])
            ->when($search, function ($query, $search) {
                return $query->where('title', 'like', "%{$search}%")
                    ->orWhere('meeting_number', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('meeting_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('meeting/meeting/index', [
            'meetings' => $meetings,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $rooms = Room::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();
        
        $organizationUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('level', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        
        $users = User::with(['organizationUnit', 'role'])
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('meeting/meeting/create', [
            'rooms' => $rooms,
            'organizationUnits' => $organizationUnits,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'agenda' => 'required|string',
            'meeting_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'room_id' => 'required|exists:rooms,id',
            'organization_unit_id' => 'nullable|exists:organization_units,id',
            'notes' => 'nullable|string',
            'status' => 'required|in:draft,scheduled',
            'participant_ids' => 'array',
            'participant_ids.*' => 'exists:users,id',
            'participant_roles' => 'array',
        ], [
            'title.required' => 'Judul rapat wajib diisi',
            'agenda.required' => 'Agenda rapat wajib diisi',
            'meeting_date.required' => 'Tanggal rapat wajib diisi',
            'meeting_date.after_or_equal' => 'Tanggal rapat tidak boleh di masa lalu',
            'start_time.required' => 'Waktu mulai wajib diisi',
            'end_time.required' => 'Waktu selesai wajib diisi',
            'end_time.after' => 'Waktu selesai harus lebih dari waktu mulai',
            'room_id.required' => 'Ruangan wajib dipilih',
            'status.required' => 'Status rapat wajib dipilih',
        ]);

        // Validasi waktu tidak boleh kebelakang jika tanggal hari ini
        if ($request->meeting_date === today()->format('Y-m-d')) {
            $currentTime = now()->format('H:i');
            if ($request->start_time < $currentTime) {
                return redirect()->back()
                    ->withInput()
                    ->with('error', 'Waktu mulai rapat tidak boleh di masa lalu');
            }
        }

        // Jika status scheduled, validasi tidak boleh bentrok
        if ($request->status === 'scheduled') {
            $hasConflict = Meeting::where('room_id', $request->room_id)
                ->where('meeting_date', $request->meeting_date)
                ->whereIn('status', ['scheduled', 'ongoing'])
                ->where(function ($query) use ($request) {
                    // Check if new meeting overlaps with existing meetings
                    $query->where(function ($q) use ($request) {
                        // New meeting starts during existing meeting
                        $q->where('start_time', '<', $request->end_time)
                          ->where('end_time', '>', $request->start_time);
                    });
                })
                ->exists();

            if ($hasConflict) {
                return redirect()->back()
                    ->withInput()
                    ->with('error', 'Jadwal rapat bentrok dengan rapat lain yang sudah terjadwal di ruangan yang sama');
            }
        }

        DB::transaction(function () use ($request, &$meeting) {
            $meeting = Meeting::create([
                'meeting_number' => Meeting::generateMeetingNumber(),
                'title' => $request->title,
                'agenda' => $request->agenda,
                'meeting_date' => $request->meeting_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'room_id' => $request->room_id,
                'organizer_id' => Auth::user()->id,
                'organization_unit_id' => $request->organization_unit_id,
                'status' => $request->status,
                'notes' => $request->notes,
            ]);

            // Add participants
            if ($request->participant_ids) {
                foreach ($request->participant_ids as $userId) {
                    $role = $request->participant_roles[$userId] ?? 'participant';
                    
                    MeetingParticipant::create([
                        'meeting_id' => $meeting->id,
                        'user_id' => $userId,
                        'role' => $role,
                        'attendance_status' => 'invited',
                    ]);

                    // Send notification to participant
                    $user = User::find($userId);
                    if ($user && $userId !== Auth::id()) {
                        NotificationService::notifyMeetingInvitation($user, $meeting);
                    }
                }
            }
        });

        return redirect()->route('meetings.index')->with('success', 'Rapat berhasil dibuat');
    }

    public function show(Meeting $meeting)
    {
        $meeting->load([
            'room',
            'organizer',
            'organizationUnit',
            'participants.user.organizationUnit',
        ]);

        $users = \App\Models\User::select('id', 'name')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('meeting/meeting/show', [
            'meeting' => $meeting,
            'users' => $users,
        ]);
    }

    public function edit(Meeting $meeting)
    {
        if (!$meeting->canBeEdited()) {
            return redirect()->back()->with('error', 'Rapat tidak dapat diedit');
        }

        $meeting->load(['participants.user']);
        
        $rooms = Room::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();
        
        $organizationUnits = OrganizationUnit::where('is_active', true)
            ->orderBy('level', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        
        $users = User::with(['organizationUnit', 'role'])
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('meeting/meeting/edit', [
            'meeting' => $meeting,
            'rooms' => $rooms,
            'organizationUnits' => $organizationUnits,
            'users' => $users,
        ]);
    }

    public function update(Request $request, Meeting $meeting)
    {
        if (!$meeting->canBeEdited()) {
            return redirect()->back()->with('error', 'Rapat ini tidak dapat diedit. Hanya rapat dengan status draft atau cancelled yang dapat diedit.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'agenda' => 'required|string',
            'meeting_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'room_id' => 'required|exists:rooms,id',
            'organization_unit_id' => 'nullable|exists:organization_units,id',
            'notes' => 'nullable|string',
            'status' => 'required|in:draft,scheduled',
            'participant_ids' => 'array',
            'participant_ids.*' => 'exists:users,id',
            'participant_roles' => 'array',
        ], [
            'title.required' => 'Judul rapat wajib diisi',
            'agenda.required' => 'Agenda rapat wajib diisi',
            'meeting_date.required' => 'Tanggal rapat wajib diisi',
            'meeting_date.after_or_equal' => 'Tanggal rapat tidak boleh di masa lalu',
            'start_time.required' => 'Waktu mulai wajib diisi',
            'end_time.required' => 'Waktu selesai wajib diisi',
            'end_time.after' => 'Waktu selesai harus lebih dari waktu mulai',
            'room_id.required' => 'Ruangan wajib dipilih',
            'status.required' => 'Status rapat wajib dipilih',
        ]);

        // Validasi waktu tidak boleh kebelakang jika tanggal hari ini
        if ($request->meeting_date === today()->format('Y-m-d')) {
            $currentTime = now()->format('H:i');
            if ($request->start_time < $currentTime) {
                return redirect()->back()
                    ->withInput()
                    ->with('error', 'Waktu mulai rapat tidak boleh di masa lalu');
            }
        }

        // Jika status scheduled, validasi tidak boleh bentrok
        if ($request->status === 'scheduled') {
            $hasConflict = Meeting::where('id', '!=', $meeting->id)
                ->where('room_id', $request->room_id)
                ->where('meeting_date', $request->meeting_date)
                ->whereIn('status', ['scheduled', 'ongoing'])
                ->where(function ($query) use ($request) {
                    // Check if new meeting overlaps with existing meetings
                    $query->where(function ($q) use ($request) {
                        // New meeting starts during existing meeting
                        $q->where('start_time', '<', $request->end_time)
                          ->where('end_time', '>', $request->start_time);
                    });
                })
                ->exists();

            if ($hasConflict) {
                return redirect()->back()
                    ->withInput()
                    ->with('error', 'Jadwal rapat bentrok dengan rapat lain yang sudah terjadwal di ruangan yang sama');
            }
        }

        DB::transaction(function () use ($request, $meeting) {
            $meeting->update([
                'title' => $request->title,
                'agenda' => $request->agenda,
                'meeting_date' => $request->meeting_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'room_id' => $request->room_id,
                'organization_unit_id' => $request->organization_unit_id,
                'status' => $request->status,
                'notes' => $request->notes,
            ]);

            // Update participants
            $meeting->participants()->delete();
            
            if ($request->participant_ids) {
                foreach ($request->participant_ids as $userId) {
                    $role = $request->participant_roles[$userId] ?? 'participant';
                    
                    MeetingParticipant::create([
                        'meeting_id' => $meeting->id,
                        'user_id' => $userId,
                        'role' => $role,
                        'attendance_status' => 'invited',
                    ]);
                }
            }
        });

        $successMessage = $meeting->wasChanged('status') && $meeting->status === 'scheduled' 
            ? 'Rapat berhasil dijadwalkan ulang' 
            : 'Rapat berhasil diperbarui';

        return redirect()->route('meetings.show', $meeting)->with('success', $successMessage);
    }

    public function destroy(Meeting $meeting)
    {
        if (!$meeting->canBeEdited()) {
            return redirect()->back()->with('error', 'Rapat tidak dapat dihapus');
        }

        $meeting->participants()->delete();
        $meeting->delete();

        return redirect()->route('meetings.index')->with('success', 'Rapat berhasil dihapus');
    }

    public function startMeeting(Meeting $meeting)
    {
        // Hanya moderator yang bisa memulai rapat
        $isModerator = $meeting->participants()
            ->where('user_id', Auth::user()->id)
            ->where('role', 'moderator')
            ->exists();

        if (!$isModerator) {
            return redirect()->back()->with('error', 'Hanya moderator yang dapat memulai rapat');
        }

        // Hanya meeting draft atau scheduled yang bisa dimulai
        if (!in_array($meeting->status, ['draft', 'scheduled'])) {
            return redirect()->back()->with('error', 'Rapat ini tidak dapat dimulai');
        }

        // Validasi waktu rapat sudah tiba (30 menit sebelum)
        if (!$meeting->canBeStarted()) {
            return redirect()->back()->with('error', 'Rapat belum bisa dimulai. Rapat dapat dimulai 30 menit sebelum waktu yang dijadwalkan.');
        }

        $meeting->update(['status' => 'ongoing']);

        // Notify all participants
        $participants = $meeting->participants()->with('user')->get();
        foreach ($participants as $participant) {
            if ($participant->user && $participant->user_id !== Auth::id()) {
                NotificationService::notifyMeetingStatusChange(
                    $participant->user,
                    $meeting,
                    'ongoing'
                );
            }
        }

        return redirect()->back()->with('success', 'Rapat telah dimulai');
    }

    public function cancelMeeting(Meeting $meeting)
    {
        if (!$meeting->canBeCancelled()) {
            return redirect()->back()->with('error', 'Rapat ini tidak dapat dibatalkan');
        }

        $meeting->update(['status' => 'cancelled']);

        return redirect()->back()->with('success', 'Rapat berhasil dibatalkan. Rapat dapat dijadwalkan ulang dengan mengedit tanggal dan waktu.');
    }

    public function updateStatus(Request $request, Meeting $meeting)
    {
        $request->validate([
            'status' => 'required|in:draft,scheduled,ongoing,completed,cancelled',
        ]);

        $newStatus = $request->status;

        // Validasi transisi status
        if ($newStatus === 'scheduled' && $meeting->status === 'draft') {
            // Cek apakah ada jadwal bentrok dengan meeting yang sudah scheduled/ongoing
            $hasConflict = Meeting::where('id', '!=', $meeting->id)
                ->where('room_id', $meeting->room_id)
                ->where('meeting_date', $meeting->meeting_date)
                ->whereIn('status', ['scheduled', 'ongoing'])
                ->where(function ($query) use ($meeting) {
                    $query->whereBetween('start_time', [$meeting->start_time, $meeting->end_time])
                        ->orWhereBetween('end_time', [$meeting->start_time, $meeting->end_time])
                        ->orWhere(function ($q) use ($meeting) {
                            $q->where('start_time', '<=', $meeting->start_time)
                                ->where('end_time', '>=', $meeting->end_time);
                        });
                })
                ->exists();

            if ($hasConflict) {
                return redirect()->back()->with('error', 'Jadwal rapat bentrok dengan rapat lain yang sudah terjadwal di ruangan yang sama');
            }
        }

        // Update status
        $meeting->update(['status' => $newStatus]);

        // Jika status menjadi completed, tandai peserta yang belum hadir sebagai absent
        if ($newStatus === 'completed') {
            MeetingParticipant::where('meeting_id', $meeting->id)
                ->where('attendance_status', '!=', 'attended')
                ->update(['attendance_status' => 'absent']);
        }

        $statusLabels = [
            'draft' => 'Draft',
            'scheduled' => 'Terjadwal',
            'ongoing' => 'Berlangsung',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
        ];

        return redirect()->back()->with('success', "Status rapat berhasil diubah menjadi {$statusLabels[$newStatus]}");
    }

    public function complete(Request $request, Meeting $meeting)
    {
        // Hanya moderator yang bisa menyelesaikan rapat
        $isModerator = $meeting->participants()
            ->where('user_id', Auth::user()->id)
            ->where('role', 'moderator')
            ->exists();

        if (!$isModerator) {
            return redirect()->back()->with('error', 'Hanya moderator yang dapat menyelesaikan rapat');
        }

        // Hanya rapat ongoing yang bisa diselesaikan
        if ($meeting->status !== 'ongoing') {
            return redirect()->back()->with('error', 'Hanya rapat yang sedang berlangsung yang dapat diselesaikan');
        }

        // Update status menjadi completed
        $meeting->update([
            'status' => 'completed',
        ]);

        // Tandai peserta yang belum hadir sebagai absent
        MeetingParticipant::where('meeting_id', $meeting->id)
            ->where('attendance_status', '!=', 'attended')
            ->update(['attendance_status' => 'absent']);

        // Notify all participants
        $participants = $meeting->participants()->with('user')->get();
        foreach ($participants as $participant) {
            if ($participant->user && $participant->user_id !== Auth::id()) {
                NotificationService::notifyMeetingStatusChange(
                    $participant->user,
                    $meeting,
                    'completed'
                );
            }
        }

        return redirect()->back()->with('success', 'Rapat berhasil diselesaikan. Memo dan daftar hadir dapat didownload dalam format PDF.');
    }

    public function markAttendance(Request $request, Meeting $meeting, MeetingParticipant $participant)
    {
        // Validasi: Rapat harus dalam status ongoing atau completed
        if (!in_array($meeting->status, ['ongoing', 'completed'])) {
            return redirect()->back()->with('error', 'Absensi hanya dapat dilakukan saat rapat berlangsung atau selesai');
        }

        $request->validate([
            'attendance_status' => 'required|in:confirmed,attended,absent,excused',
        ]);

        $participant->update([
            'attendance_status' => $request->attendance_status,
            'check_in_time' => $request->attendance_status === 'attended' ? now()->format('H:i:s') : null,
        ]);

        return redirect()->back()->with('success', 'Status kehadiran berhasil diperbarui');
    }

    public function generateInvitation(Meeting $meeting)
    {
        $meeting->load(['room', 'organizer', 'organizationUnit', 'participants.user.organizationUnit']);

        // Get pimpinan rapat (moderator or organizer)
        $moderator = $meeting->participants->where('role', 'moderator')->first();
        $leader = $moderator ? $moderator->user : $meeting->organizer;
        
        // Generate certificate ID untuk meeting invitation
        $certificateId = 'MTG-' . strtoupper(substr(md5($meeting->id . time()), 0, 12));
        
        $signedAt = now();

        // Generate QR Code dengan URL verifikasi (simplified - no certificate table for now)
        $verificationData = [
            'type' => 'meeting_invitation',
            'meeting_id' => $meeting->id,
            'meeting_number' => $meeting->meeting_number,
            'signed_by' => $leader->name,
            'signed_at' => $signedAt->format('Y-m-d H:i:s'),
        ];
        
        $qrCode = base64_encode(QrCode::format('png')->size(200)->margin(1)->generate(json_encode($verificationData)));

        $pdf = Pdf::loadView('pdf.meeting-invitation', [
            'meeting' => $meeting,
            'qrCode' => $qrCode,
            'certificate' => (object)[
                'certificate_id' => $certificateId,
                'signer_name' => $leader->name,
                'signer_position' => $leader->position ?? 'Pimpinan Rapat',
                'signer_nip' => $leader->nip,
                'signed_at' => $signedAt,
            ],
        ]);

        // Replace "/" and "\" with "-" for filename safety
        $safeNumber = str_replace(['/', '\\'], '-', $meeting->meeting_number);
        $fileName = 'undangan-' . $safeNumber . '.pdf';
        $filePath = 'meetings/' . $meeting->id . '/' . $fileName;
        
        Storage::put($filePath, $pdf->output());
        
        $meeting->update(['invitation_file' => $filePath]);

        return $pdf->download($fileName);
    }

    public function generateMemo(Meeting $meeting)
    {
        if ($meeting->status !== 'completed') {
            return redirect()->back()->with('error', 'Memo hanya dapat digenerate untuk rapat yang sudah selesai');
        }

        $meeting->load(['room', 'organizer', 'organizationUnit', 'attendedParticipants.user.organizationUnit']);

        $pdf = Pdf::loadView('pdf.meeting-memo', [
            'meeting' => $meeting,
        ]);

        // Replace "/" and "\" with "-" for filename safety
        $safeNumber = str_replace(['/', '\\'], '-', $meeting->meeting_number);
        $fileName = 'memo-' . $safeNumber . '.pdf';
        $filePath = 'meetings/' . $meeting->id . '/' . $fileName;
        
        Storage::put($filePath, $pdf->output());
        
        $meeting->update(['memo_file' => $filePath]);

        return $pdf->download($fileName);
    }

    public function generateAttendance(Meeting $meeting)
    {
        $meeting->load(['room', 'organizer', 'organizationUnit', 'participants.user.organizationUnit']);

        $pdf = Pdf::loadView('pdf.meeting-attendance', [
            'meeting' => $meeting,
        ]);

        // Replace "/" and "\" with "-" for filename safety
        $safeNumber = str_replace(['/', '\\'], '-', $meeting->meeting_number);
        $fileName = 'daftar-hadir-' . $safeNumber . '.pdf';
        $filePath = 'meetings/' . $meeting->id . '/' . $fileName;
        
        Storage::put($filePath, $pdf->output());
        
        $meeting->update(['attendance_file' => $filePath]);

        return $pdf->download($fileName);
    }

    public function editMemo(Meeting $meeting)
    {
        // Hanya bisa akses memo jika status ongoing atau completed
        if (!in_array($meeting->status, ['ongoing', 'completed'])) {
            return redirect()->route('meetings.show', $meeting)
                ->with('error', 'Memo hanya dapat diakses saat rapat berlangsung atau selesai');
        }

        return inertia('meeting/meeting/memo', [
            'meeting' => $meeting,
        ]);
    }

    public function updateMemo(Request $request, Meeting $meeting)
    {
        // Validasi: Rapat harus dalam status ongoing atau completed
        if (!in_array($meeting->status, ['ongoing', 'completed'])) {
            return redirect()->route('meetings.show', $meeting)
                ->with('error', 'Memo hanya dapat diisi saat rapat berlangsung atau selesai');
        }

        $request->validate([
            'memo_content' => 'required|string',
        ]);

        $meeting->update([
            'memo_content' => $request->memo_content,
        ]);

        return redirect()->back()->with('success', 'Konten memo berhasil disimpan');
    }

    public function editAttendance(Meeting $meeting)
    {
        // Hanya bisa akses daftar hadir jika status ongoing atau completed
        if (!in_array($meeting->status, ['ongoing', 'completed'])) {
            return redirect()->route('meetings.show', $meeting)
                ->with('error', 'Daftar hadir hanya dapat diakses saat rapat berlangsung atau selesai');
        }

        $meeting->load(['participants.user.organizationUnit', 'room', 'organizer', 'organizationUnit']);
        
        return inertia('meeting/meeting/attendance', [
            'meeting' => $meeting,
        ]);
    }

    public function checkInAttendance(Request $request, Meeting $meeting)
    {
        $user = Auth::user();
        
        // Cek apakah user adalah peserta
        $participant = $meeting->participants()->where('user_id', $user->id)->first();
        
        if (!$participant) {
            return redirect()->back()->with('error', 'Anda bukan peserta rapat ini');
        }

        // Cek apakah sudah check-in
        if ($participant->attendance_status === 'attended') {
            return redirect()->back()->with('info', 'Anda sudah melakukan check-in');
        }

        // Validasi: Rapat harus dalam status ongoing atau completed
        if (!in_array($meeting->status, ['ongoing', 'completed'])) {
            return redirect()->back()->with('error', 'Check-in hanya dapat dilakukan saat rapat berlangsung atau selesai');
        }

        // Update attendance status
        $participant->update([
            'attendance_status' => 'attended',
            'attendance_time' => now(),
        ]);

        return redirect()->back()->with('success', 'Check-in berhasil! Kehadiran Anda telah tercatat.');
    }


}

