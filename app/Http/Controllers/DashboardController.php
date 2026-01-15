<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\User;
use App\Models\Archive;
use App\Models\IncomingLetter;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Meeting Statistics - cached
        $currentMonth = now()->startOfMonth();
        $currentYear = now()->startOfYear();

        // Cache dashboard statistics
        $statistics = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'statistics'),
            CacheService::DASHBOARD_TTL,
            function () use ($currentMonth, $currentYear) {
                return [
                    'total_meetings' => Meeting::count(),
                    'meetings_this_month' => Meeting::whereDate('meeting_date', '>=', $currentMonth)->count(),
                    'meetings_this_year' => Meeting::whereDate('meeting_date', '>=', $currentYear)->count(),
                    'meetings_by_status' => Meeting::select('status', DB::raw('count(*) as total'))
                        ->groupBy('status')
                        ->pluck('total', 'status')
                        ->toArray(),
                    'attendance_rate' => $this->calculateAttendanceRate(),
                ];
            }
        );

        // Upcoming meetings (next 7 days) - short cache
        $upcomingMeetings = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'upcoming_meetings'),
            CacheService::SHORT_TTL,
            function () {
                return Meeting::with(['room', 'organizer', 'participants'])
                    ->whereIn('status', ['scheduled', 'ongoing'])
                    ->whereDate('meeting_date', '>=', now())
                    ->whereDate('meeting_date', '<=', now()->addDays(7))
                    ->orderBy('meeting_date', 'asc')
                    ->orderBy('start_time', 'asc')
                    ->limit(5)
                    ->get();
            }
        );

        // Recent completed meetings - cached
        $recentCompletedMeetings = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'recent_completed'),
            CacheService::DEFAULT_TTL,
            function () {
                return Meeting::with(['room', 'organizer'])
                    ->where('status', 'completed')
                    ->orderBy('meeting_date', 'desc')
                    ->limit(5)
                    ->get();
            }
        );

        // Meetings trend (last 6 months) - longer cache
        $meetingsTrend = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'meetings_trend'),
            CacheService::LONG_TTL,
            function () {
                $trend = [];
                for ($i = 5; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $monthName = $date->format('M');
                    $count = Meeting::whereYear('meeting_date', $date->year)
                        ->whereMonth('meeting_date', $date->month)
                        ->count();
                    
                    $trend[] = [
                        'month' => $monthName,
                        'count' => $count,
                    ];
                }
                return $trend;
            }
        );

        // Most used rooms - cached
        $mostUsedRooms = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'most_used_rooms'),
            CacheService::DEFAULT_TTL,
            function () {
                return Meeting::select('room_id', DB::raw('count(*) as total'))
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
            }
        );

        // Top participants - cached
        $topParticipants = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'top_participants'),
            CacheService::DEFAULT_TTL,
            function () {
                return DB::table('meeting_participants')
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
            }
        );

        // Today's meetings - short cache as it changes frequently
        $todaysMeetings = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'todays_meetings', now()->toDateString()),
            CacheService::SHORT_TTL,
            function () {
                return Meeting::with(['room', 'organizer'])
                    ->whereDate('meeting_date', now()->toDateString())
                    ->orderBy('start_time', 'asc')
                    ->get();
            }
        );

        // =====================
        // Archive Statistics - cached
        // =====================
        $archiveStatistics = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'archive_statistics'),
            CacheService::DASHBOARD_TTL,
            function () use ($currentMonth, $currentYear) {
                $totalArchives = Archive::count();
                $archivesThisMonth = Archive::whereDate('created_at', '>=', $currentMonth)->count();
                $archivesThisYear = Archive::whereDate('created_at', '>=', $currentYear)->count();

                $archivesByType = Archive::select('type', DB::raw('count(*) as total'))
                    ->groupBy('type')
                    ->pluck('total', 'type')
                    ->toArray();

                $archivesByClassification = Archive::select('classification', DB::raw('count(*) as total'))
                    ->groupBy('classification')
                    ->pluck('total', 'classification')
                    ->toArray();

                $expiringArchives = Archive::whereNotNull('retention_until')
                    ->where('retention_until', '<=', now()->addDays(30))
                    ->where('retention_until', '>=', now())
                    ->count();

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

                return [
                    'total_archives' => $totalArchives,
                    'archives_this_month' => $archivesThisMonth,
                    'archives_this_year' => $archivesThisYear,
                    'archives_by_type' => $archivesByType,
                    'archives_by_classification' => $archivesByClassification,
                    'expiring_archives' => $expiringArchives,
                    'storage_by_type' => $storageByType,
                ];
            }
        );

        // Archive trend (last 6 months) - longer cache
        $archivesTrend = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'archives_trend'),
            CacheService::LONG_TTL,
            function () {
                $trend = [];
                for ($i = 5; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $monthName = $date->format('M');
                    $count = Archive::whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->count();
                    
                    $trend[] = [
                        'month' => $monthName,
                        'count' => $count,
                    ];
                }
                return $trend;
            }
        );

        // Recent archives - cached
        $recentArchives = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'recent_archives'),
            CacheService::DEFAULT_TTL,
            function () {
                return Archive::with(['incomingLetter', 'archiver'])
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
            }
        );

        // =====================
        // Letter Statistics - cached
        // =====================
        $letterStatistics = CacheService::remember(
            CacheService::key(CacheService::PREFIX_DASHBOARD, 'letter_statistics'),
            CacheService::DASHBOARD_TTL,
            function () use ($currentMonth) {
                $totalIncomingLetters = IncomingLetter::count();
                $incomingLettersThisMonth = IncomingLetter::whereDate('received_date', '>=', $currentMonth)->count();

                $incomingLettersByStatus = IncomingLetter::select('status', DB::raw('count(*) as total'))
                    ->groupBy('status')
                    ->pluck('total', 'status')
                    ->toArray();

                return [
                    'total_incoming_letters' => $totalIncomingLetters,
                    'incoming_letters_this_month' => $incomingLettersThisMonth,
                    'incoming_letters_by_status' => $incomingLettersByStatus,
                    'total_outgoing_letters' => 0,
                    'outgoing_letters_this_month' => 0,
                    'outgoing_letters_by_status' => [],
                ];
            }
        );

        return Inertia::render('dashboard', [
            'statistics' => $statistics,
            'archive_statistics' => $archiveStatistics,
            'letter_statistics' => $letterStatistics,
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
     * Calculate average attendance rate
     */
    private function calculateAttendanceRate(): float
    {
        $completedMeetings = Meeting::where('status', 'completed')
            ->withCount(['participants', 'attendedParticipants'])
            ->get();

        if ($completedMeetings->count() === 0) {
            return 0;
        }

        $totalParticipants = $completedMeetings->sum('participants_count');
        $totalAttended = $completedMeetings->sum('attended_participants_count');
        
        return $totalParticipants > 0 ? round(($totalAttended / $totalParticipants) * 100, 1) : 0;
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
