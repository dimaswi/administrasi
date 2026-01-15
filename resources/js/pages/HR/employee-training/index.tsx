import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Download, GraduationCap, Plus } from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface Training {
    id: number;
    code: string;
    name: string;
}

interface EmployeeTrainingItem {
    id: number;
    employee: Employee;
    training: Training;
    status: string;
    status_label: string;
    start_date: string | null;
    end_date: string | null;
    score: number | null;
    grade: string | null;
    has_certificate: boolean;
}

interface TrainingOption {
    id: number;
    code: string;
    name: string;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    employeeTrainings: {
        data: EmployeeTrainingItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    trainings: TrainingOption[];
    units: Unit[];
    statuses: Record<string, string>;
    filters: {
        search: string | null;
        training_id: string | null;
        status: string | null;
        unit_id: string | null;
        per_page: number;
    };
}

export default function Index({ employeeTrainings, trainings, units, statuses, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        training_id: filters.training_id || '',
        status: filters.status || '',
        unit_id: filters.unit_id || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);

        router.get(
            route('hr.employee-trainings.index'),
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
            registered: 'bg-blue-50 text-blue-700 border-blue-200',
            in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            completed: 'bg-green-50 text-green-700 border-green-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
            cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {statusLabel}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'employee',
            label: 'Karyawan',
            sortable: true,
            render: (item: EmployeeTrainingItem) => (
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
            key: 'training',
            label: 'Training',
            sortable: true,
            render: (item: EmployeeTrainingItem) => (
                <div>
                    <Link href={route('hr.trainings.show', item.training.id)} className="font-medium text-blue-600 hover:underline">
                        {item.training.name}
                    </Link>
                    <p className="font-mono text-sm text-muted-foreground">{item.training.code}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: EmployeeTrainingItem) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'date',
            label: 'Tanggal',
            render: (item: EmployeeTrainingItem) => (
                <span className="text-gray-600">
                    {item.start_date && item.end_date ? `${item.start_date} - ${item.end_date}` : item.start_date || '-'}
                </span>
            ),
        },
        {
            key: 'result',
            label: 'Hasil',
            render: (item: EmployeeTrainingItem) => (
                <div>
                    {item.score !== null ? (
                        <span className="font-medium">
                            {item.score}
                            {item.grade && ` (${item.grade})`}
                        </span>
                    ) : (
                        <span className="text-gray-400">-</span>
                    )}
                    {item.has_certificate && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                            Sertifikat
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[150px]',
            render: (item: EmployeeTrainingItem) => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.employee-trainings.show', item.id)}>Detail</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.employee-trainings.edit', item.id)}>Edit</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Peserta Training" />
            <IndexPage
                title="Peserta Training"
                description="Kelola data peserta training dan sertifikasi"
                data={employeeTrainings.data}
                columns={columns}
                filterFields={[
                    {
                        key: 'training_id',
                        type: 'select',
                        placeholder: 'Training',
                        options: trainings.map((t) => ({ value: String(t.id), label: `${t.code} - ${t.name}` })),
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
                searchPlaceholder="Cari nama karyawan atau training..."
                pagination={{
                    current_page: employeeTrainings.current_page,
                    last_page: employeeTrainings.last_page,
                    per_page: employeeTrainings.per_page,
                    total: employeeTrainings.total,
                    from: employeeTrainings.from,
                    to: employeeTrainings.to,
                }}
                actions={[
                    {
                        label: 'Export CSV',
                        href: `/hr/employee-trainings/export?training_id=${filterValues.training_id || ''}&status=${filterValues.status || ''}&unit_id=${filterValues.unit_id || ''}`,
                        icon: Download,
                        variant: 'outline',
                    },
                    {
                        label: 'Tambah Peserta',
                        href: route('hr.employee-trainings.create'),
                        icon: Plus,
                    },
                ]}
                emptyMessage="Belum ada data peserta training"
                emptyIcon={GraduationCap}
            />
        </HRLayout>
    );
}
