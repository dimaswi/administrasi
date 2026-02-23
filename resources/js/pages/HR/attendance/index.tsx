import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    Calendar, 
    Users, 
    MoreHorizontal,
    Edit,
    Trash2,
    FileText,
    ChevronLeft,
    ChevronRight,
    Download,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AttendanceData {
    id: number;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    status_label: string;
    late_minutes: number;
    is_manual_entry: boolean;
    is_approved: boolean;
    notes: string | null;
}

interface EmployeeAttendance {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
    job_category: string | null;
    attendance: AttendanceData | null;
    is_scheduled: boolean;
    is_day_off: boolean;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    employees: {
        data: EmployeeAttendance[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    date: string;
    units: Unit[];
    filters: {
        date: string;
        unit_id: string | null;
        status: string | null;
        search: string | null;
        per_page: number;
    };
}

const statusColors: Record<string, string> = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    early_leave: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    late_early_leave: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    sick: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    permit: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    holiday: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function Index({ employees, date, units, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        date: filters.date,
        unit_id: filters.unit_id || '',
        status: filters.status || '',
        search: filters.search || '',
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const currentDate = new Date(filterValues.date);
        if (direction === 'prev') {
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        const newDate = currentDate.toISOString().split('T')[0];
        setFilterValues(prev => ({ ...prev, date: newDate }));
        router.get('/hr/attendances', { ...filterValues, date: newDate }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/attendances', Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== '')), { preserveState: true });
    };

    const handleFilterReset = () => {
        const today = new Date().toISOString().split('T')[0];
        setFilterValues({ date: today, unit_id: '', status: '', search: '' });
        router.get('/hr/attendances', { date: today });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/attendances', { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/attendances', { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const handleDelete = (attendance: AttendanceData) => {
        if (confirm('Hapus data kehadiran ini?')) {
            router.delete(`/hr/attendances/${attendance.id}`, {
                onError: () => toast.error('Gagal menghapus data'),
            });
        }
    };

    const columns = [
        {
            key: 'employee_id',
            label: 'NIP',
            className: 'w-[100px]',
        },
        {
            key: 'name',
            label: 'Nama Karyawan',
            render: (item: EmployeeAttendance) => (
                <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {item.organization_unit || '-'} • {item.job_category || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'clock_in',
            label: 'Masuk',
            className: 'w-[80px] text-center',
            render: (item: EmployeeAttendance) => (
                <span className={item.attendance?.late_minutes ? 'text-yellow-600 font-medium' : ''}>
                    {item.attendance?.clock_in || '-'}
                </span>
            ),
        },
        {
            key: 'clock_out',
            label: 'Keluar',
            className: 'w-[80px] text-center',
            render: (item: EmployeeAttendance) => item.attendance?.clock_out || '-',
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[120px]',
            render: (item: EmployeeAttendance) => {
                if (item.is_day_off) {
                    return <Badge variant="outline">Libur</Badge>;
                }
                if (!item.attendance) {
                    return item.is_scheduled ? (
                        <Badge variant="destructive">Belum Absen</Badge>
                    ) : (
                        <Badge variant="outline">-</Badge>
                    );
                }
                return (
                    <Badge className={statusColors[item.attendance.status]}>
                        {item.attendance.status_label}
                    </Badge>
                );
            },
        },
        {
            key: 'late',
            label: 'Terlambat',
            className: 'w-[90px] text-center',
            render: (item: EmployeeAttendance) => {
                if (!item.attendance?.late_minutes) return '-';
                const hours = Math.floor(item.attendance.late_minutes / 60);
                const minutes = item.attendance.late_minutes % 60;
                return hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m`;
            },
        },
        {
            key: 'notes',
            label: 'Catatan',
            className: 'w-[150px]',
            render: (item: EmployeeAttendance) => (
                <span className="text-sm text-muted-foreground truncate block max-w-[150px]">
                    {item.attendance?.notes || '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (item: EmployeeAttendance) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => router.get(`/hr/attendances/${item.id}/create`, { date: filterValues.date })}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            {item.attendance ? 'Edit' : 'Input'} Kehadiran
                        </DropdownMenuItem>
                        {item.attendance && (
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(item.attendance!)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // Date navigation component rendered inside card header
    const dateNavigation = (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
                type="date"
                value={filterValues.date}
                onChange={(e) => {
                    setFilterValues(prev => ({ ...prev, date: e.target.value }));
                    router.get('/hr/attendances', { ...filterValues, date: e.target.value }, { preserveState: true });
                }}
                className="w-[160px]"
            />
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );

    return (
        <HRLayout>
            <Head title="Kehadiran" />
                <IndexPage
                    title="Kehadiran"
                    description={`Kehadiran karyawan pada ${formatDate(filterValues.date)}`}
                    actions={[
                        {
                            label: 'Export CSV',
                            href: `/hr/attendances/export/daily?date=${filterValues.date}&unit_id=${filterValues.unit_id || ''}`,
                            icon: Download,
                            variant: 'outline',
                        },
                        {
                            label: 'Laporan Bulanan',
                            href: `/hr/attendances/report?month=${filterValues.date.substring(0, 7)}`,
                            icon: FileText,
                            variant: 'outline',
                        },
                        {
                            label: 'Input Massal',
                            href: `/hr/attendances/bulk?date=${filterValues.date}`,
                            icon: Users,
                        },
                    ]}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari nama atau NIP..."
                    onSearchChange={(value) => handleFilterChange('search', value)}
                    columns={columns}
                    data={employees.data}
                    pagination={{
                        current_page: employees.current_page,
                        last_page: employees.last_page,
                        per_page: employees.per_page,
                        total: employees.total,
                        from: employees.from,
                        to: employees.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={[
                        {
                            key: 'unit_id',
                            type: 'select',
                            placeholder: 'Unit',
                            options: units.map(u => ({ value: String(u.id), label: u.name })),
                        },
                        {
                            key: 'status',
                            type: 'select',
                            placeholder: 'Status',
                            options: [
                                { value: 'present', label: 'Hadir' },
                                { value: 'late', label: 'Terlambat' },
                                { value: 'absent', label: 'Tidak Hadir' },
                                { value: 'day_off', label: 'Libur' },
                            ],
                        },
                    ]}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    emptyMessage="Tidak ada data kehadiran"
                    emptyIcon={Calendar}
                    headerExtra={dateNavigation}
                />
        </HRLayout>
    );
}
