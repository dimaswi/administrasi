<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\User;
use App\Models\Archive;
use App\Models\IncomingLetter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Meeting Statistics
        $currentMonth = now()->startOfMonth();
        $currentYear = now()->startOfYear();

        // Total meetings
        $totalMeetings = Meeting::count();
        $meetingsThisMonth = Meeting::whereDate('meeting_date', '>=', $currentMonth)->count();
        $meetingsThisYear = Meeting::whereDate('meeting_date', '>=', $currentYear)->count();

        // Meetings by status
        $meetingsByStatus = Meeting::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // Upcoming meetings (next 7 days)
        $upcomingMeetings = Meeting::with(['room', 'organizer', 'participants'])
            ->whereIn('status', ['scheduled', 'ongoing'])
            ->whereDate('meeting_date', '>=', now())
            ->whereDate('meeting_date', '<=', now()->addDays(7))
            ->orderBy('meeting_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->limit(5)
            ->get();

        // Recent completed meetings
        $recentCompletedMeetings = Meeting::with(['room', 'organizer'])
            ->where('status', 'completed')
            ->orderBy('meeting_date', 'desc')
            ->limit(5)
            ->get();

        // Meetings trend (last 6 months)
        $meetingsTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthName = $date->format('M');
            $count = Meeting::whereYear('meeting_date', $date->year)
                ->whereMonth('meeting_date', $date->month)
                ->count();
            
            $meetingsTrend[] = [
                'month' => $monthName,
                'count' => $count,
            ];
        }

        // Average attendance rate
        $completedMeetings = Meeting::where('status', 'completed')
            ->withCount(['participants', 'attendedParticipants'])
            ->get();

        $attendanceRate = 0;
        if ($completedMeetings->count() > 0) {
            $totalParticipants = $completedMeetings->sum('participants_count');
            $totalAttended = $completedMeetings->sum('attended_participants_count');
            $attendanceRate = $totalParticipants > 0 ? round(($totalAttended / $totalParticipants) * 100, 1) : 0;
        }

        // Most used rooms
        $mostUsedRooms = Meeting::select('room_id', DB::raw('count(*) as total'))
            ->with('room')
            ->whereNotNull('room_id')
            ->groupBy('room_id')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($meeting) {
                return [
                    'name' => $meeting->room->name ?? 'Unknown',
                    'total' => $meeting->total,
                ];
            });

        // Top participants (most active)
        $topParticipants = DB::table('meeting_participants')
            ->select('user_id', DB::raw('count(*) as total'))
            ->groupBy('user_id')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($participant) {
                $user = User::find($participant->user_id);
                return [
                    'name' => $user->name ?? 'Unknown',
                    'total' => $participant->total,
                    'attended' => DB::table('meeting_participants')
                        ->where('user_id', $participant->user_id)
                        ->where('attendance_status', 'attended')
                        ->count(),
                ];
            });

        // Today's meetings
        $todaysMeetings = Meeting::with(['room', 'organizer'])
            ->whereDate('meeting_date', now()->toDateString())
            ->orderBy('start_time', 'asc')
            ->get();

        // =====================
        // Archive Statistics
        // =====================
        $totalArchives = Archive::count();
        $archivesThisMonth = Archive::whereDate('created_at', '>=', $currentMonth)->count();
        $archivesThisYear = Archive::whereDate('created_at', '>=', $currentYear)->count();

        // Archives by type
        $archivesByType = Archive::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->pluck('total', 'type')
            ->toArray();

        // Archives by classification
        $archivesByClassification = Archive::select('classification', DB::raw('count(*) as total'))
            ->groupBy('classification')
            ->pluck('total', 'classification')
            ->toArray();

        // Archive trend (last 6 months)
        $archivesTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthName = $date->format('M');
            $count = Archive::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            
            $archivesTrend[] = [
                'month' => $monthName,
                'count' => $count,
            ];
        }

        // Expiring archives (in next 30 days)
        $expiringArchives = Archive::whereNotNull('retention_until')
            ->where('retention_until', '<=', now()->addDays(30))
            ->where('retention_until', '>=', now())
            ->count();

        // Recent archives
        $recentArchives = Archive::with(['incomingLetter', 'archiver'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($archive) {
                return [
                    'id' => $archive->id,
                    'type' => $archive->type,
                    'title' => $archive->title,
                    'document_number' => $archive->document_number,
                    'document_date' => $archive->document_date->format('Y-m-d'),
                    'classification' => $archive->classification,
                    'archiver' => $archive->archiver->name ?? 'Unknown',
                    'created_at' => $archive->created_at->format('Y-m-d H:i'),
                ];
            });

        // Storage size by type
        $storageByType = Archive::select('type', DB::raw('SUM(file_size) as total_size'))
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->type,
                    'size' => $item->total_size,
                    'size_human' => $this->formatBytes($item->total_size),
                ];
            });

        // =====================
        // Letter Statistics
        // =====================
        $totalIncomingLetters = IncomingLetter::count();
        $incomingLettersThisMonth = IncomingLetter::whereDate('received_date', '>=', $currentMonth)->count();

        // Letters by status
        $incomingLettersByStatus = IncomingLetter::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return Inertia::render('dashboard', [
            'statistics' => [
                'total_meetings' => $totalMeetings,
                'meetings_this_month' => $meetingsThisMonth,
                'meetings_this_year' => $meetingsThisYear,
                'meetings_by_status' => $meetingsByStatus,
                'attendance_rate' => $attendanceRate,
            ],
            'archive_statistics' => [
                'total_archives' => $totalArchives,
                'archives_this_month' => $archivesThisMonth,
                'archives_this_year' => $archivesThisYear,
                'archives_by_type' => $archivesByType,
                'archives_by_classification' => $archivesByClassification,
                'expiring_archives' => $expiringArchives,
                'storage_by_type' => $storageByType,
            ],
            'letter_statistics' => [
                'total_incoming_letters' => $totalIncomingLetters,
                'incoming_letters_this_month' => $incomingLettersThisMonth,
                'incoming_letters_by_status' => $incomingLettersByStatus,
                'total_outgoing_letters' => 0, // TODO: Will be implemented with OutgoingLetter
                'outgoing_letters_this_month' => 0,
                'outgoing_letters_by_status' => [],
            ],
            'upcoming_meetings' => $upcomingMeetings,
            'recent_completed_meetings' => $recentCompletedMeetings,
            'todays_meetings' => $todaysMeetings,
            'meetings_trend' => $meetingsTrend,
            'most_used_rooms' => $mostUsedRooms,
            'top_participants' => $topParticipants,
            'recent_archives' => $recentArchives,
            'archives_trend' => $archivesTrend,
        ]);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        if ($bytes == 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
