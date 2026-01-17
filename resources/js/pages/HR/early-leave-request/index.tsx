import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Clock, Timer } from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface EarlyLeaveRequestItem {
    id: number;
    employee: Employee;
    date: string;
    date_formatted: string;
    requested_leave_time: string;
    scheduled_leave_time: string;
    early_minutes: number;
    reason: string;
    status: string;
    status_label: string;
    approved_by: string | null;
    approved_at: string | null;
    approval_notes: string | null;
    auto_checkout: boolean;
    created_at: string;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    requests: {
        data: EarlyLeaveRequestItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    units: Unit[];
    filters: {
        search: string | null;
        status: string | null;
        unit_id: string | null;
        date: string | null;
        per_page: number;
    };
    statusOptions: Record<string, string>;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    pending_delegation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending_supervisor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    pending_hr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    pending_director_sign: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function Index({ requests, units, filters, statusOptions }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        unit_id: filters.unit_id || '',
        date: filters.date || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/early-leave-requests', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', unit_id: '', date: '' });
        router.get('/hr/early-leave-requests', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/early-leave-requests', { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/early-leave-requests', { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const formatMinutes = (minutes: number) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}j ${mins}m` : `${hours}j`;
        }
        return `${minutes}m`;
    };

    const columns = [
        {
            key: 'employee',
            label: 'Karyawan',
            render: (item: EarlyLeaveRequestItem) => (
                <div>
                    <div className="font-medium">{item.employee.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {item.employee.employee_id}
                        {item.employee.organization_unit && ` • ${item.employee.organization_unit}`}
                    </div>
                </div>
            ),
        },
        {
            key: 'date',
            label: 'Tanggal',
            render: (item: EarlyLeaveRequestItem) => <span>{item.date_formatted}</span>,
        },
        {
            key: 'time',
            label: 'Jam Pulang',
            render: (item: EarlyLeaveRequestItem) => (
                <div className="text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Jadwal:</span>
                        <span>{item.scheduled_leave_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Diminta:</span>
                        <span className="font-medium text-orange-600">{item.requested_leave_time}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'early_minutes',
            label: 'Lebih Cepat',
            render: (item: EarlyLeaveRequestItem) => (
                <Badge variant="outline" className="font-mono">
                    {formatMinutes(item.early_minutes)}
                </Badge>
            ),
        },
        {
            key: 'reason',
            label: 'Alasan',
            render: (item: EarlyLeaveRequestItem) => (
                <div className="max-w-[200px] truncate text-sm" title={item.reason}>
                    {item.reason}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: EarlyLeaveRequestItem) => <Badge className={statusColors[item.status]}>{item.status_label}</Badge>,
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (item: EarlyLeaveRequestItem) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/hr/early-leave-requests/${item.id}`}>Detail</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Izin Pulang Cepat" />
            <IndexPage
                title="Izin Pulang Cepat"
                description="Kelola pengajuan izin pulang cepat karyawan"
                searchValue={filterValues.search}
                searchPlaceholder="Cari karyawan..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={requests.data}
                pagination={{
                    current_page: requests.current_page,
                    last_page: requests.last_page,
                    per_page: requests.per_page,
                    total: requests.total,
                    from: requests.from,
                    to: requests.to,
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
                        key: 'unit_id',
                        type: 'select',
                        placeholder: 'Unit',
                        options: units.map((u) => ({ value: String(u.id), label: u.name })),
                    },
                    {
                        key: 'date',
                        type: 'text',
                        placeholder: 'Tanggal (YYYY-MM-DD)',
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                emptyMessage="Belum ada pengajuan izin pulang cepat"
                emptyIcon={Timer}
            />
        </HRLayout>
    );
}
