import { MeetingDashboard } from '@/components/meeting/meeting-dashboard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    statistics?: {
        total_meetings: number;
        meetings_this_month: number;
        meetings_this_year: number;
        meetings_by_status: Record<string, number>;
        attendance_rate: number;
    };
    upcoming_meetings?: any[];
    recent_completed_meetings?: any[];
    todays_meetings?: any[];
    meetings_trend?: Array<{ month: string; count: number }>;
    most_used_rooms?: Array<{ name: string; total: number }>;
    top_participants?: Array<{ name: string; total: number; attended: number }>;
}

export default function Dashboard({
    statistics,
    upcoming_meetings,
    recent_completed_meetings,
    todays_meetings,
    meetings_trend,
    most_used_rooms,
    top_participants,
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 overflow-x-auto">
                <MeetingDashboard
                    statistics={statistics}
                    upcoming_meetings={upcoming_meetings}
                    recent_completed_meetings={recent_completed_meetings}
                    todays_meetings={todays_meetings}
                    meetings_trend={meetings_trend}
                    most_used_rooms={most_used_rooms}
                    top_participants={top_participants}
                />
            </div>
        </AppLayout>
    );
}
