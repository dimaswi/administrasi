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
    archive_statistics?: {
        total_archives: number;
        archives_this_month: number;
        archives_this_year: number;
        archives_by_type: Record<string, number>;
        archives_by_classification: Record<string, number>;
        expiring_archives: number;
        storage_by_type: Array<{ type: string; size: number; size_human: string }>;
    };
    letter_statistics?: {
        total_incoming_letters: number;
        incoming_letters_this_month: number;
        incoming_letters_by_status: Record<string, number>;
        total_outgoing_letters: number;
        outgoing_letters_this_month: number;
        outgoing_letters_by_status: Record<string, number>;
    };
    upcoming_meetings?: any[];
    recent_completed_meetings?: any[];
    todays_meetings?: any[];
    meetings_trend?: Array<{ month: string; count: number }>;
    most_used_rooms?: Array<{ name: string; total: number }>;
    top_participants?: Array<{ name: string; total: number; attended: number }>;
    recent_archives?: any[];
    archives_trend?: Array<{ month: string; count: number }>;
}

export default function Dashboard({
    statistics,
    archive_statistics,
    letter_statistics,
    upcoming_meetings,
    recent_completed_meetings,
    todays_meetings,
    meetings_trend,
    most_used_rooms,
    top_participants,
    recent_archives,
    archives_trend,
}: DashboardProps) {
    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="h-[calc(100vh-7rem)] overflow-auto p-4 sm:p-6">
                <MeetingDashboard
                    statistics={statistics}
                    archive_statistics={archive_statistics}
                    letter_statistics={letter_statistics}
                    upcoming_meetings={upcoming_meetings}
                    recent_completed_meetings={recent_completed_meetings}
                    todays_meetings={todays_meetings}
                    meetings_trend={meetings_trend}
                    most_used_rooms={most_used_rooms}
                    top_participants={top_participants}
                    recent_archives={recent_archives}
                    archives_trend={archives_trend}
                />
            </div>
        </AppLayout>
    );
}
