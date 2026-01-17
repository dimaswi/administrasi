import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Download, Plus } from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface LeaveType {
    id: number;
    name: string;
    color: string;
}

interface LeaveItem {
    id: number;
    employee: Employee;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    date_range: string;
    total_days: number;
    is_half_day: boolean;
    half_day_label: string | null;
    status: string;
    status_label: string;
    reason: string;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    leaves: {
        data: LeaveItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    leaveTypes: LeaveType[];
    units: Unit[];
    filters: {
        search: string | null;
        status: string | null;
        leave_type_id: string | null;
        unit_id: string | null;
        start_date: string | null;
        end_date: string | null;
        per_page: number;
    };
    statusOptions: Record<string, string>;
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
<<<<<<< HEAD
    pending_delegation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending_supervisor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    pending_hr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    pending_director_sign: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const leaveTypeColors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
    gray: 'bg-gray-500',
};

export default function Index({ leaves, leaveTypes, units, filters, statusOptions }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        leave_type_id: filters.leave_type_id || '',
        unit_id: filters.unit_id || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/leaves', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', leave_type_id: '', unit_id: '' });
        router.get('/hr/leaves', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/leaves', { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/leaves', { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const columns = [
        {
            key: 'employee',
            label: 'Karyawan',
            render: (leave: LeaveItem) => (
                <div>
                    <div className="font-medium">{leave.employee.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {leave.employee.employee_id}
                        {leave.employee.organization_unit && ` • ${leave.employee.organization_unit}`}
                    </div>
                </div>
            ),
        },
        {
            key: 'leave_type',
            label: 'Jenis Cuti',
            render: (leave: LeaveItem) => (
                <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${leaveTypeColors[leave.leave_type.color] || 'bg-gray-500'}`}></div>
                    <span>{leave.leave_type.name}</span>
                </div>
            ),
        },
        {
            key: 'period',
            label: 'Periode',
            render: (leave: LeaveItem) => (
                <div>
                    <div>{leave.date_range}</div>
                    {leave.is_half_day && <div className="text-xs text-muted-foreground">({leave.half_day_label})</div>}
                </div>
            ),
        },
        {
            key: 'total_days',
            label: 'Jumlah',
            className: 'text-center',
            render: (leave: LeaveItem) => (
                <div className="text-center">
                    <span className="font-medium">{leave.total_days}</span>
                    <span className="text-sm text-muted-foreground"> hari</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (leave: LeaveItem) => <Badge className={statusColors[leave.status]}>{leave.status_label}</Badge>,
        },
        {
            key: 'created_at',
            label: 'Diajukan',
            render: (leave: LeaveItem) => (
                <span className="text-sm text-muted-foreground">{new Date(leave.created_at).toLocaleDateString('id-ID')}</span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (leave: LeaveItem) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/hr/leaves/${leave.id}`}>Detail</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Cuti & Izin" />
            <IndexPage
                title="Cuti & Izin"
                description="Kelola pengajuan cuti dan izin karyawan"
                actions={[
                    {
                        label: 'Export CSV',
                        href: `/hr/leaves/export?status=${filterValues.status || ''}&leave_type_id=${filterValues.leave_type_id || ''}&unit_id=${filterValues.unit_id || ''}`,
                        icon: Download,
                        variant: 'outline',
                    },
                    {
                        label: 'Ajukan Cuti',
                        href: '/hr/leaves/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari karyawan..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={leaves.data}
                pagination={{
                    current_page: leaves.current_page,
                    last_page: leaves.last_page,
                    per_page: leaves.per_page,
                    total: leaves.total,
                    from: leaves.from,
                    to: leaves.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={[
                    {
                        key: 'status',
                        type: 'select',
                        placeholder: 'Status',
                        options: Object.entries(statusOptions).map(([key, label]) => ({ value: key, label })),
                    },
                    {
                        key: 'leave_type_id',
                        type: 'select',
                        placeholder: 'Jenis Cuti',
                        options: leaveTypes.map((t) => ({ value: String(t.id), label: t.name })),
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
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                emptyMessage="Belum ada pengajuan cuti"
                emptyIcon={ClipboardList}
            />
        </HRLayout>
    );
}
