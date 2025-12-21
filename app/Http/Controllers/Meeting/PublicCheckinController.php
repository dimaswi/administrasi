<?php

namespace App\Http\Controllers\Meeting;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicCheckinController extends Controller
{
    /**
     * Generate atau refresh check-in token
     * Hanya moderator/organizer yang bisa melakukan ini
     */
    public function generateToken(Request $request, Meeting $meeting)
    {
        // Validasi: hanya moderator atau organizer
        $user = Auth::user();
        $isModerator = $meeting->participants()
            ->where('user_id', $user->id)
            ->where('role', 'moderator')
            ->exists();
        
        $isOrganizer = $meeting->organizer_id === $user->id;
        
        if (!$isModerator && !$isOrganizer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya moderator atau penyelenggara yang dapat memulai sesi check-in'
            ], 403);
        }

        // Validasi: rapat harus ongoing
        if ($meeting->status !== 'ongoing') {
            return response()->json([
                'success' => false,
                'message' => 'Sesi check-in hanya dapat dimulai saat rapat berlangsung'
            ], 400);
        }

        $request->validate([
            'duration' => 'nullable|integer|min:1|max:30',
        ]);

        $duration = $request->duration ?? 5;
        $token = $meeting->generateCheckinToken($duration);

        return response()->json([
            'success' => true,
            'token' => $token,
            'expires_at' => $meeting->checkin_token_expires_at->toIso8601String(),
            'duration' => $duration,
            'checkin_url' => route('public.checkin', $token),
        ]);
    }

    /**
     * Get current token status
     */
    public function getTokenStatus(Meeting $meeting)
    {
        if (!$meeting->checkin_token) {
            return response()->json([
                'active' => false,
                'message' => 'Tidak ada sesi check-in aktif'
            ]);
        }

        $isValid = $meeting->isCheckinTokenValid();
        
        return response()->json([
            'active' => $isValid,
            'token' => $isValid ? $meeting->checkin_token : null,
            'expires_at' => $meeting->checkin_token_expires_at?->toIso8601String(),
            'remaining_seconds' => $meeting->getCheckinTokenRemainingSeconds(),
            'checkin_url' => $isValid ? route('public.checkin', $meeting->checkin_token) : null,
        ]);
    }

    /**
     * Stop/invalidate check-in session
     */
    public function stopCheckin(Meeting $meeting)
    {
        $user = Auth::user();
        $isModerator = $meeting->participants()
            ->where('user_id', $user->id)
            ->where('role', 'moderator')
            ->exists();
        
        $isOrganizer = $meeting->organizer_id === $user->id;
        
        if (!$isModerator && !$isOrganizer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya moderator atau penyelenggara yang dapat menghentikan sesi check-in'
            ], 403);
        }

        $meeting->invalidateCheckinToken();

        return response()->json([
            'success' => true,
            'message' => 'Sesi check-in berhasil dihentikan'
        ]);
    }

    /**
     * Halaman public check-in (tanpa login)
     */
    public function showCheckinPage(string $token)
    {
        $meeting = Meeting::findByCheckinToken($token);
        
        if (!$meeting) {
            return inertia('meeting/public-checkin/expired');
        }

        $meeting->load(['participants.user.organizationUnit', 'room', 'organizationUnit']);

        // Hitung peserta yang belum check-in
        $pendingCount = $meeting->participants->filter(fn($p) => $p->attendance_status !== 'attended')->count();
        $totalCount = $meeting->participants->count();

        return inertia('meeting/public-checkin/index', [
            'meeting' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'meeting_number' => $meeting->meeting_number,
                'meeting_date' => $meeting->meeting_date->format('Y-m-d'),
                'start_time' => $meeting->start_time,
                'end_time' => $meeting->end_time,
                'room' => $meeting->room?->name,
                'organization_unit' => $meeting->organizationUnit?->name,
            ],
            'token' => $token,
            'expires_at' => $meeting->checkin_token_expires_at->toIso8601String(),
            'pending_count' => $pendingCount,
            'total_count' => $totalCount,
        ]);
    }

    /**
     * Helper: Get 4 digit terakhir NIP (tanpa titik/karakter non-angka)
     */
    private function getNipLast4(string $nip): string
    {
        // Hapus semua karakter non-angka (titik, spasi, dll)
        $nipDigitsOnly = preg_replace('/[^0-9]/', '', $nip);
        // Ambil 4 digit terakhir
        return substr($nipDigitsOnly, -4);
    }

    /**
     * Process public check-in
     */
    public function processCheckin(Request $request, string $token)
    {
        $meeting = Meeting::findByCheckinToken($token);
        
        if (!$meeting) {
            return back()->with('error', 'Sesi check-in sudah kedaluwarsa atau tidak valid. Silakan minta moderator untuk memperbarui QR Code.');
        }

        $request->validate([
            'nip_last4' => 'required|string|min:4|max:4',
        ]);

        $inputNipLast4 = $request->nip_last4;

        // Cari peserta berdasarkan 4 digit terakhir NIP
        $meeting->load('participants.user');
        $matchedParticipant = null;

        foreach ($meeting->participants as $participant) {
            if ($participant->user) {
                $participantNipLast4 = $this->getNipLast4($participant->user->nip);
                if ($participantNipLast4 === $inputNipLast4) {
                    $matchedParticipant = $participant;
                    break;
                }
            }
        }

        if (!$matchedParticipant) {
            return back()->with('error', 'NIP tidak ditemukan dalam daftar peserta rapat ini.');
        }

        // Cek apakah sudah check-in
        if ($matchedParticipant->attendance_status === 'attended') {
            return back()->with('info', 'Anda sudah melakukan check-in sebelumnya.');
        }

        // Update attendance
        $matchedParticipant->update([
            'attendance_status' => 'attended',
            'check_in_time' => now()->format('H:i:s'),
        ]);

        return inertia('meeting/public-checkin/success', [
            'participant_name' => $matchedParticipant->user->name,
            'meeting_title' => $meeting->title,
            'check_in_time' => now()->format('H:i'),
        ]);
    }
}
