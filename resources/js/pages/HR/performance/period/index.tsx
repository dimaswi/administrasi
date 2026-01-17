import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Plus, Star } from 'lucide-react';
import { useState } from 'react';

interface PeriodItem {
    id: number;
    name: string;
    type: string;
    type_label: string;
    start_date: string;
    end_date: string;
    start_date_formatted: string;
    end_date_formatted: string;
    status: string;
    status_label: string;
    is_current: boolean;
    reviews_count: number;
}

interface Props {
    periods: {
        data: PeriodItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    types: Record<string, string>;
    statuses: Record<string, string>;
    filters: {
        search: string | null;
        type: string | null;
        status: string | null;
        per_page: number;
    };
}

export default function Index({ periods, types, statuses, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        type: filters.type || '',
        status: filters.status || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);

        router.get(
            route('hr.performance-periods.index'),
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
            active: 'bg-green-100 text-green-700 border-green-200',
            closed: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {statusLabel}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Periode',
            render: (item: PeriodItem) => (
                <div className="flex items-center gap-2">
                    <Link href={route('hr.performance-periods.show', item.id)} className="font-medium text-blue-600 hover:underline">
                        {item.name}
                    </Link>
                    {item.is_current && (
                        <Badge className="border-yellow-300 bg-yellow-100 text-yellow-800">
                            <Star className="mr-1 h-3 w-3" />
                            Aktif
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Tipe',
            render: (item: PeriodItem) => <Badge variant="outline">{item.type_label}</Badge>,
        },
        {
            key: 'period',
            label: 'Periode',
            render: (item: PeriodItem) => (
                <span className="text-gray-600">
                    {item.start_date_formatted} - {item.end_date_formatted}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: PeriodItem) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'reviews',
            label: 'Penilaian',
            render: (item: PeriodItem) => <span className="text-gray-600">{item.reviews_count}</span>,
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[150px]',
            render: (item: PeriodItem) => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.performance-periods.show', item.id)}>Detail</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.performance-periods.edit', item.id)}>Edit</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Periode Penilaian" />

            <IndexPage
                title="Periode Penilaian"
                description="Kelola periode penilaian kinerja karyawan"
                data={periods.data}
                columns={columns}
                filterFields={[
                    {
                        key: 'type',
                        type: 'select',
                        placeholder: 'Tipe',
                        options: Object.entries(types).map(([value, label]) => ({ value, label })),
                    },
                    {
                        key: 'status',
                        type: 'select',
                        placeholder: 'Status',
                        options: Object.entries(statuses).map(([value, label]) => ({ value, label })),
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                searchValue={filterValues.search}
                onSearchChange={(value) => handleFilterChange('search', value)}
                searchPlaceholder="Cari nama periode..."
                pagination={{
                    current_page: periods.current_page,
                    last_page: periods.last_page,
                    per_page: periods.per_page,
                    total: periods.total,
                    from: periods.from,
                    to: periods.to,
                }}
                actions={[
                    {
                        label: 'Tambah Periode',
                        href: route('hr.performance-periods.create'),
                        icon: Plus,
                    },
                ]}
                emptyMessage="Belum ada periode penilaian"
                emptyIcon={Calendar}
            />
        </HRLayout>
    );
}
