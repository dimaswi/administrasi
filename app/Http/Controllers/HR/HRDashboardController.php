<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\JobCategory;
use App\Models\HR\EmploymentStatus;
use App\Models\HR\Attendance;
use App\Models\HR\Leave;
use App\Models\OrganizationUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class HRDashboardController extends Controller
{
    public function index()
    {
        // Employee statistics
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::active()->count();
        $newEmployeesThisMonth = Employee::whereMonth('join_date', now()->month)
            ->whereYear('join_date', now()->year)
            ->count();

        // By job category
        $employeesByCategory = JobCategory::withCount(['employees' => fn($q) => $q->active()])
            ->orderBy('employees_count', 'desc')
            ->get()
            ->map(fn($cat) => [
                'name' => $cat->name,
                'count' => $cat->employees_count,
            ]);

        // By employment status
        $employeesByStatus = EmploymentStatus::withCount(['employees' => fn($q) => $q->active()])
            ->orderBy('employees_count', 'desc')
            ->get()
            ->map(fn($status) => [
                'name' => $status->name,
                'count' => $status->employees_count,
            ]);

        // By organization unit
        $employeesByUnit = OrganizationUnit::withCount(['users'])
            ->where('is_active', true)
            ->orderBy('users_count', 'desc')
            ->take(10)
            ->get()
            ->map(fn($unit) => [
                'name' => $unit->name,
                'count' => $unit->users_count,
            ]);

        // Contract expiring soon (within 30 days)
        $contractsExpiringSoon = Employee::active()
            ->whereNotNull('contract_end_date')
            ->whereBetween('contract_end_date', [now(), now()->addDays(30)])
            ->with(['jobCategory', 'organizationUnit'])
            ->orderBy('contract_end_date')
            ->get();

        // Recent employees
        $recentEmployees = Employee::with(['jobCategory', 'organizationUnit'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Attendance chart data (last 7 days)
        $attendanceChart = $this->getAttendanceChartData();

        // Monthly attendance summary (current month)
        $monthlyAttendance = $this->getMonthlyAttendanceSummary();

        // Leave statistics (current month)
        $leaveStats = $this->getLeaveStats();

        // Employee turnover (last 12 months)
        $turnoverChart = $this->getTurnoverChartData();

        return Inertia::render('HR/dashboard', [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'activeEmployees' => $activeEmployees,
                'newEmployeesThisMonth' => $newEmployeesThisMonth,
            ],
            'employeesByCategory' => $employeesByCategory,
            'employeesByStatus' => $employeesByStatus,
            'employeesByUnit' => $employeesByUnit,
            'contractsExpiringSoon' => $contractsExpiringSoon,
            'recentEmployees' => $recentEmployees,
            'attendanceChart' => $attendanceChart,
            'monthlyAttendance' => $monthlyAttendance,
            'leaveStats' => $leaveStats,
            'turnoverChart' => $turnoverChart,
        ]);
    }

    /**
     * Get attendance data for last 7 days
     */
    private function getAttendanceChartData(): array
    {
        $data = [];
        $activeEmployees = Employee::active()->count();

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayOfWeek = $date->dayOfWeek;
            
            // Skip weekends
            if ($dayOfWeek === 0 || $dayOfWeek === 6) {
                continue;
            }

            $attendances = Attendance::whereDate('date', $date)->get();
            
            $present = $attendances->whereIn('status', ['present', 'late', 'early_leave', 'late_early_leave'])->count();
            $late = $attendances->whereIn('status', ['late', 'late_early_leave'])->count();
            $absent = $activeEmployees - $present;
            $leave = $attendances->whereIn('status', ['leave', 'sick', 'permit'])->count();

            $data[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->translatedFormat('D'),
                'present' => $present,
                'late' => $late,
                'absent' => max(0, $absent - $leave),
                'leave' => $leave,
            ];
        }

        return $data;
    }

    /**
     * Get monthly attendance summary
     */
    private function getMonthlyAttendanceSummary(): array
    {
        $startOfMonth = now()->startOfMonth();
        $today = now();
        
        $activeEmployees = Employee::active()->count();
        
        $attendances = Attendance::whereBetween('date', [$startOfMonth, $today])->get();
        
        $workDays = 0;
        $current = $startOfMonth->copy();
        while ($current <= $today) {
            if ($current->dayOfWeek !== 0 && $current->dayOfWeek !== 6) {
                $workDays++;
            }
            $current->addDay();
        }

        $totalExpected = $activeEmployees * $workDays;
        $totalPresent = $attendances->whereIn('status', ['present', 'late', 'early_leave', 'late_early_leave'])->count();
        $totalLate = $attendances->whereIn('status', ['late', 'late_early_leave'])->count();
        $totalLeave = $attendances->whereIn('status', ['leave', 'sick', 'permit'])->count();
        $totalAbsent = $totalExpected - $totalPresent - $totalLeave;

        return [
            'workDays' => $workDays,
            'totalExpected' => $totalExpected,
            'present' => $totalPresent,
            'late' => $totalLate,
            'absent' => max(0, $totalAbsent),
            'leave' => $totalLeave,
            'attendanceRate' => $totalExpected > 0 ? round(($totalPresent / $totalExpected) * 100, 1) : 0,
            'lateRate' => $totalPresent > 0 ? round(($totalLate / $totalPresent) * 100, 1) : 0,
        ];
    }

    /**
     * Get leave statistics for current month
     */
    private function getLeaveStats(): array
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $leaves = Leave::whereBetween('start_date', [$startOfMonth, $endOfMonth])
            ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
            ->get();

        return [
            'pending' => $leaves->where('status', 'pending')->count(),
            'approved' => $leaves->where('status', 'approved')->count(),
            'rejected' => $leaves->where('status', 'rejected')->count(),
            'total' => $leaves->count(),
        ];
    }

    /**
     * Get employee turnover data for last 12 months
     */
    private function getTurnoverChartData(): array
    {
        $data = [];

        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            // New hires in this month
            $newHires = Employee::whereBetween('join_date', [$startOfMonth, $endOfMonth])->count();

            // Resignations/Terminations in this month
            $exits = Employee::whereIn('status', ['resigned', 'terminated'])
                ->whereBetween('resign_date', [$startOfMonth, $endOfMonth])
                ->count();

            // Total active at end of month
            $totalActive = Employee::where(function ($q) use ($endOfMonth) {
                $q->where('status', 'active')
                    ->orWhere(function ($q2) use ($endOfMonth) {
                        $q2->whereIn('status', ['resigned', 'terminated'])
                            ->where('resign_date', '>', $endOfMonth);
                    });
            })->where('join_date', '<=', $endOfMonth)->count();

            $data[] = [
                'month' => $date->translatedFormat('M Y'),
                'monthShort' => $date->translatedFormat('M'),
                'newHires' => $newHires,
                'exits' => $exits,
                'totalActive' => $totalActive,
            ];
        }

        return $data;
    }
}
