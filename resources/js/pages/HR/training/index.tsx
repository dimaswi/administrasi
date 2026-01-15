import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Download, GraduationCap, Plus, XCircle } from 'lucide-react';
import { useState } from 'react';

interface TrainingItem {
    id: number;
    code: string;
    name: string;
    type: string;
    type_label: string;
    category: string;
    category_label: string;
    provider: string | null;
    formatted_duration: string | null;
    cost: number | null;
    is_mandatory: boolean;
    is_active: boolean;
    participants_count: number;
}

interface Props {
    trainings: {
        data: TrainingItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    types: Record<string, string>;
    categories: Record<string, string>;
    filters: {
        search: string | null;
        type: string | null;
        category: string | null;
        is_mandatory: boolean | null;
        is_active: boolean | null;
        per_page: number;
    };
}

export default function Index({ trainings, types, categories, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        type: filters.type || '',
        category: filters.category || '',
        is_mandatory: filters.is_mandatory !== null ? String(filters.is_mandatory) : '',
        is_active: filters.is_active !== null ? String(filters.is_active) : '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);

        router.get(
            route('hr.trainings.index'),
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

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            sortable: true,
            render: (training: TrainingItem) => <span className="font-mono text-sm">{training.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Training',
            sortable: true,
            render: (training: TrainingItem) => (
                <div>
                    <Link href={route('hr.trainings.show', training.id)} className="font-medium text-blue-600 hover:underline">
                        {training.name}
                    </Link>
                    {training.is_mandatory && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                            Wajib
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Tipe',
            sortable: true,
            render: (training: TrainingItem) => <Badge variant="outline">{training.type_label}</Badge>,
        },
        {
            key: 'category',
            label: 'Kategori',
            sortable: true,
            render: (training: TrainingItem) => <Badge variant="secondary">{training.category_label}</Badge>,
        },
        {
            key: 'provider',
            label: 'Provider',
            render: (training: TrainingItem) => <span className="text-gray-600">{training.provider || '-'}</span>,
        },
        {
            key: 'duration',
            label: 'Durasi',
            render: (training: TrainingItem) => <span className="text-gray-600">{training.formatted_duration || '-'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (training: TrainingItem) =>
                training.is_active ? (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                        <XCircle className="mr-1 h-3 w-3" />
                        Nonaktif
                    </Badge>
                ),
        },
        {
            key: 'participants',
            label: 'Peserta',
            render: (training: TrainingItem) => <span className="text-gray-600">{training.participants_count}</span>,
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[150px]',
            render: (training: TrainingItem) => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.trainings.show', training.id)}>Detail</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.trainings.edit', training.id)}>Edit</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Training" />

            <IndexPage
                title="Training"
                description="Kelola program training dan pelatihan karyawan"
                data={trainings.data}
                columns={columns}
                filterFields={[
                    {
                        key: 'type',
                        type: 'select',
                        placeholder: 'Tipe',
                        options: Object.entries(types).map(([value, label]) => ({ value, label })),
                    },
                    {
                        key: 'category',
                        type: 'select',
                        placeholder: 'Kategori',
                        options: Object.entries(categories).map(([value, label]) => ({ value, label })),
                    },
                    {
                        key: 'is_active',
                        type: 'select',
                        placeholder: 'Status',
                        options: [
                            { value: '1', label: 'Aktif' },
                            { value: '0', label: 'Nonaktif' },
                        ],
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                searchValue={filterValues.search}
                onSearchChange={(value) => handleFilterChange('search', value)}
                searchPlaceholder="Cari kode atau nama training..."
                pagination={{
                    current_page: trainings.current_page,
                    last_page: trainings.last_page,
                    per_page: trainings.per_page,
                    total: trainings.total,
                    from: trainings.from,
                    to: trainings.to,
                }}
                actions={[
                    {
                        label: 'Export CSV',
                        href: `/hr/trainings/export?type=${filterValues.type || ''}&category=${filterValues.category || ''}&status=${filterValues.is_active || ''}`,
                        icon: Download,
                        variant: 'outline',
                    },
                    {
                        label: 'Tambah Training',
                        href: route('hr.trainings.create'),
                        icon: Plus,
                    },
                ]}
                emptyMessage="Belum ada program training"
                emptyIcon={GraduationCap}
            />
        </HRLayout>
    );
}
