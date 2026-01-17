import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Progress } from '@/components/ui/progress';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Plus, Scale } from 'lucide-react';
import { useState } from 'react';

interface Session {
    id: number;
    name: string;
    period: { id: number; name: string } | null;
    status: string;
    status_label: string;
    scheduled_date: string | null;
    facilitator_name: string | null;
    reviews_count: number;
    progress: {
        total: number;
        calibrated: number;
        percentage: number;
    };
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
        in_progress: number;
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
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        period_id: filters.period_id || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get(route('hr.calibration.index'), filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', period_id: '' });
        router.get(route('hr.calibration.index'), {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get(route('hr.calibration.index'), { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('hr.calibration.index'), { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const getStatusBadge = (status: string, label: string) => {
        const variants: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700 border-gray-200',
            in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-green-100 text-green-700 border-green-200',
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
            render: (session: Session) => (
                <div>
                    <Link href={route('hr.calibration.show', session.id)} className="font-medium text-blue-600 hover:underline">
                        {session.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{session.period?.name || 'Tidak ada periode'}</p>
                </div>
            ),
        },
        {
            key: 'scheduled_date',
            label: 'Jadwal',
            render: (session: Session) => (
                <div className="text-sm">
                    <p>{session.scheduled_date || '-'}</p>
                    {session.facilitator_name && <p className="text-muted-foreground">Fasilitator: {session.facilitator_name}</p>}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (session: Session) => getStatusBadge(session.status, session.status_label),
        },
        {
            key: 'reviews_count',
            label: 'Review',
            render: (session: Session) => (
                <span>
                    <span className="font-medium">{session.reviews_count}</span> review
                </span>
            ),
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (session: Session) => (
                <div className="min-w-[120px]">
                    <div className="mb-1 flex justify-between text-sm">
                        <span>
                            {session.progress.calibrated}/{session.progress.total}
                        </span>
                        <span className="font-medium">{session.progress.percentage}%</span>
                    </div>
                    <Progress value={session.progress.percentage} className="h-2" />
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[80px]',
            render: (session: Session) => (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('hr.calibration.show', session.id)}>
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Kalibrasi Penilaian" />

            <IndexPage
                title="Kalibrasi Penilaian"
                description="Kelola sesi kalibrasi untuk menyeragamkan penilaian kinerja"
                actions={[{ label: 'Buat Sesi', href: route('hr.calibration.create'), icon: Plus }]}
                data={sessions.data}
                columns={columns}
                pagination={{
                    current_page: sessions.current_page,
                    last_page: sessions.last_page,
                    per_page: sessions.per_page,
                    total: sessions.total,
                    from: sessions.from,
                    to: sessions.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={[
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [{ value: '', label: 'Semua Status' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))],
                    },
                    {
                        key: 'period_id',
                        label: 'Periode',
                        type: 'select',
                        options: [{ value: '', label: 'Semua Periode' }, ...periods.map((p) => ({ value: String(p.id), label: p.name }))],
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                searchValue={filterValues.search}
                searchPlaceholder="Cari nama sesi..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                emptyMessage="Belum ada sesi kalibrasi"
                emptyIcon={Scale}
            />
        </HRLayout>
    );
}
