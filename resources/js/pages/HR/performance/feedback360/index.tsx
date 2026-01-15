import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    Plus,
    MessageSquareShare,
    Clock,
    CheckCircle,
    FileText,
} from 'lucide-react';

interface Session {
    id: number;
    name: string;
    period: { id: number; name: string } | null;
    status: string;
    status_label: string;
    start_date: string;
    end_date: string;
    is_anonymous: boolean;
    participants_count: number;
    progress: {
        total: number;
        completed: number;
        percentage: number;
    };
    creator_name: string | null;
    created_at: string;
}

interface Period {
    id: number;
    name: string;
}

interface Props {
    sessions: {
        data: Session[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    periods: Period[];
    statuses: Record<string, string>;
    stats: {
        total: number;
        active: number;
        completed: number;
        draft: number;
    };
    filters: {
        search: string | null;
        status: string;
        period_id: string;
        per_page: number;
    };
}

export default function Index({ sessions, periods, statuses, stats, filters }: Props) {
    const getStatusBadge = (status: string, label: string) => {
        const variants: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-700 border-gray-200',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
            'completed': 'bg-green-100 text-green-700 border-green-200',
            'cancelled': 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {label}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Sesi',
            render: (item: Session) => (
                <div>
                    <Link
                        href={route('hr.feedback360.show', item.id)}
                        className="font-medium text-blue-600 hover:underline"
                    >
                        {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        {item.period?.name || 'Tidak ada periode'}
                    </p>
                </div>
            ),
        },
        {
            key: 'date_range',
            label: 'Periode',
            render: (item: Session) => (
                <div className="text-sm">
                    <p>{item.start_date}</p>
                    <p className="text-muted-foreground">s/d {item.end_date}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: Session) => (
                <div className="space-y-1">
                    {getStatusBadge(item.status, item.status_label)}
                    {item.is_anonymous && (
                        <Badge variant="secondary" className="text-xs">Anonim</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'participants',
            label: 'Partisipan',
            render: (item: Session) => (
                <div className="text-sm">
                    <span className="font-medium">{item.participants_count}</span> orang
                </div>
            ),
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (item: Session) => (
                <div className="min-w-[120px]">
                    <div className="flex justify-between text-sm mb-1">
                        <span>{item.progress.completed}/{item.progress.total}</span>
                        <span className="font-medium">{item.progress.percentage}%</span>
                    </div>
                    <Progress value={item.progress.percentage} className="h-2" />
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (item: Session) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.feedback360.show', item.id)}>Detail</Link>
                    </Button>
                </div>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'status',
            type: 'select' as const,
            label: 'Status',
            placeholder: 'Semua Status',
            options: [
                { value: '_all', label: 'Semua Status' },
                ...Object.entries(statuses).map(([value, label]) => ({ value, label })),
            ],
        },
        {
            key: 'period_id',
            type: 'select' as const,
            label: 'Periode',
            placeholder: 'Semua Periode',
            options: [
                { value: '_all', label: 'Semua Periode' },
                ...periods.map((p) => ({ value: String(p.id), label: p.name })),
            ],
        },
    ];

    const pagination = {
        current_page: sessions.current_page,
        last_page: sessions.last_page,
        per_page: sessions.per_page,
        total: sessions.total,
        from: sessions.from,
        to: sessions.to,
    };

    const handlePageChange = (page: number) => {
        router.get(route('hr.feedback360.index'), {
            ...filters,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(route('hr.feedback360.index'), {
            ...filters,
            [key]: value === '_all' ? '' : value,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const statsCards = [
        {
            title: 'Total Sesi',
            value: stats.total,
            icon: FileText,
            color: 'from-slate-500 to-slate-600',
        },
        {
            title: 'Sedang Berjalan',
            value: stats.active,
            icon: Clock,
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: 'Selesai',
            value: stats.completed,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
        },
        {
            title: 'Draft',
            value: stats.draft,
            icon: MessageSquareShare,
            color: 'from-gray-500 to-gray-600',
        },
    ];

    return (
        <HRLayout>
            <Head title="360 Feedback" />

            <div className="pt-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="overflow-hidden">
                                <div className={`bg-gradient-to-br ${stat.color} p-4`}>
                                    <div className="flex items-center justify-between">
                                        <div className="bg-white/20 rounded-lg p-2">
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-white/80">{stat.title}</p>
                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Index Page with consistent layout */}
                <IndexPage
                    title="Daftar Sesi 360 Feedback"
                    description="Kelola sesi penilaian 360 Feedback"
                    columns={columns}
                    data={sessions.data}
                    pagination={pagination}
                    filterFields={filterFields}
                    filterValues={{
                        status: filters.status || '_all',
                        period_id: filters.period_id || '_all',
                    }}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                    actions={[
                        {
                            label: 'Buat Sesi',
                            href: route('hr.feedback360.create'),
                            icon: Plus,
                        },
                    ]}
                    emptyMessage="Belum ada sesi 360 Feedback"
                    emptyIcon={MessageSquareShare}
                />
            </div>
        </HRLayout>
    );
}
