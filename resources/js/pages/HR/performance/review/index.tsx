import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardCheck, Download, Plus } from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface Period {
    id: number;
    name: string;
}

interface ReviewItem {
    id: number;
    employee: Employee;
    period: Period;
    status: string;
    status_label: string;
    self_score: number | null;
    manager_score: number | null;
    final_score: number | null;
    final_grade: string | null;
    reviewer_name: string | null;
}

interface PeriodOption {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    reviews: {
        data: ReviewItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    periods: PeriodOption[];
    units: Unit[];
    statuses: Record<string, string>;
    stats: {
        total: number;
        completed: number;
        in_progress: number;
        draft: number;
    };
    filters: {
        search: string | null;
        period_id: string | null;
        status: string | null;
        unit_id: string | null;
        per_page: number;
    };
}

export default function Index({ reviews, periods, units, statuses, stats, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        period_id: filters.period_id || '',
        status: filters.status || '',
        unit_id: filters.unit_id || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);

        router.get(
            route('hr.performance-reviews.index'),
            {
                ...newFilters,
                per_page: filters.per_page,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const getStatusBadge = (status: string, statusLabel: string) => {
        const variants: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700 border-gray-200',
            self_review: 'bg-blue-100 text-blue-700 border-blue-200',
            manager_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            calibration: 'bg-purple-100 text-purple-700 border-purple-200',
            completed: 'bg-green-100 text-green-700 border-green-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {statusLabel}
            </Badge>
        );
    };

    const getGradeBadge = (grade: string | null) => {
        if (!grade) return <span className="text-muted-foreground">-</span>;

        const colors: Record<string, string> = {
            A: 'bg-green-100 text-green-800',
            B: 'bg-blue-100 text-blue-800',
            C: 'bg-yellow-100 text-yellow-800',
            D: 'bg-orange-100 text-orange-800',
            E: 'bg-red-100 text-red-800',
        };
        return <Badge className={colors[grade] || ''}>{grade}</Badge>;
    };

    const columns = [
        {
            key: 'employee',
            label: 'Karyawan',
            render: (item: ReviewItem) => (
                <div>
                    <Link href={route('hr.employees.show', item.employee.id)} className="font-medium text-blue-600 hover:underline">
                        {item.employee.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        {item.employee.employee_id} • {item.employee.organization_unit || '-'}
                    </p>
                </div>
            ),
        },
        {
            key: 'period',
            label: 'Periode',
            render: (item: ReviewItem) => <span className="text-gray-600">{item.period.name}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: ReviewItem) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'scores',
            label: 'Nilai',
            render: (item: ReviewItem) => (
                <div className="text-sm">
                    <div>
                        Self: <span className="font-medium">{item.self_score ?? '-'}</span>
                    </div>
                    <div>
                        Manager: <span className="font-medium">{item.manager_score ?? '-'}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'final',
            label: 'Hasil',
            render: (item: ReviewItem) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{item.final_score ?? '-'}</span>
                    {getGradeBadge(item.final_grade)}
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (item: ReviewItem) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.performance-reviews.show', item.id)}>Detail</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Penilaian Kinerja" />

            <IndexPage
                title="Penilaian Kinerja"
                description="Kelola penilaian kinerja karyawan"
                data={reviews.data}
                columns={columns}
                filterFields={[
                    {
                        key: 'period_id',
                        type: 'select',
                        placeholder: 'Periode',
                        options: periods.map((p) => ({ value: String(p.id), label: p.name })),
                    },
                    {
                        key: 'status',
                        type: 'select',
                        placeholder: 'Status',
                        options: Object.entries(statuses).map(([value, label]) => ({ value, label })),
                    },
                    {
                        key: 'unit_id',
                        type: 'select',
                        placeholder: 'Unit',
                        options: units.map((u) => ({ value: String(u.id), label: u.name })),
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                searchValue={filterValues.search}
                onSearchChange={(value) => handleFilterChange('search', value)}
                searchPlaceholder="Cari nama karyawan..."
                pagination={{
                    current_page: reviews.current_page,
                    last_page: reviews.last_page,
                    per_page: reviews.per_page,
                    total: reviews.total,
                    from: reviews.from,
                    to: reviews.to,
                }}
                actions={[
                    {
                        label: 'Export CSV',
                        href: `/hr/performance-reviews/export?period_id=${filterValues.period_id || ''}&status=${filterValues.status || ''}&unit_id=${filterValues.unit_id || ''}`,
                        icon: Download,
                        variant: 'outline',
                    },
                    {
                        label: 'Buat Penilaian',
                        href: route('hr.performance-reviews.create'),
                        icon: Plus,
                    },
                ]}
                emptyMessage="Belum ada data penilaian kinerja"
                emptyIcon={ClipboardCheck}
            />
        </HRLayout>
    );
}
