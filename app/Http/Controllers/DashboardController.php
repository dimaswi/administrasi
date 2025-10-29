<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\User;
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

        return Inertia::render('dashboard', [
            'statistics' => [
                'total_meetings' => $totalMeetings,
                'meetings_this_month' => $meetingsThisMonth,
                'meetings_this_year' => $meetingsThisYear,
                'meetings_by_status' => $meetingsByStatus,
                'attendance_rate' => $attendanceRate,
            ],
            'upcoming_meetings' => $upcomingMeetings,
            'recent_completed_meetings' => $recentCompletedMeetings,
            'todays_meetings' => $todaysMeetings,
            'meetings_trend' => $meetingsTrend,
            'most_used_rooms' => $mostUsedRooms,
            'top_participants' => $topParticipants,
        ]);
    }
}
