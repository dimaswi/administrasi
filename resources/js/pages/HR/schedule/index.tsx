import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, Calendar, Eye, Users } from 'lucide-react';
import { useState } from 'react';

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
}

interface Schedule {
    id: number;
    effective_date: string;
    end_date: string | null;
    monday_shift_id: number | null;
    tuesday_shift_id: number | null;
    wednesday_shift_id: number | null;
    thursday_shift_id: number | null;
    friday_shift_id: number | null;
    saturday_shift_id: number | null;
    sunday_shift_id: number | null;
    monday_shift: WorkSchedule | null;
    tuesday_shift: WorkSchedule | null;
    wednesday_shift: WorkSchedule | null;
    thursday_shift: WorkSchedule | null;
    friday_shift: WorkSchedule | null;
    saturday_shift: WorkSchedule | null;
    sunday_shift: WorkSchedule | null;
}

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string | null;
    position: string | null;
    organization_unit: {
        id: number;
        name: string;
    } | null;
    job_category: {
        id: number;
        name: string;
    } | null;
    schedules: Schedule[];
}

interface OrganizationUnit {
    id: number;
    name: string;
    code: string;
}

interface Props {
    employees: {
        data: Employee[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    units: OrganizationUnit[];
    filters: {
        search: string;
        perPage: number;
        unit_id: number | null;
    };
}

const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formatTime = (time: string | null) => time?.substring(0, 5) || '-';

const getCurrentSchedule = (schedules: Schedule[]): Schedule | null => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find((s) => s.effective_date <= today && (!s.end_date || s.end_date >= today)) || null;
};

const getShiftForDay = (schedule: Schedule, day: string): WorkSchedule | null => {
    const shiftKey = `${day}_shift` as keyof Schedule;
    return schedule[shiftKey] as WorkSchedule | null;
};

const getWorkDaysFromSchedule = (schedule: Schedule): string[] => {
    const workDays: string[] = [];
    dayKeys.forEach((day, index) => {
        if (getShiftForDay(schedule, day)) {
            workDays.push(dayLabels[index]);
        }
    });
    return workDays;
};

export default function Index({ employees, units, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        unit_id: filters.unit_id?.toString() || '',
    });

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Jadwal Karyawan', href: '/hr/schedules' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get(
            '/hr/schedules',
            {
                search: filterValues.search,
                unit_id: filterValues.unit_id || undefined,
            },
            { preserveState: true },
        );
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', unit_id: '' });
        router.get('/hr/schedules', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/schedules', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/schedules', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const columns = [
        {
            key: 'employee',
            label: 'Karyawan',
            render: (item: Employee) => (
                <div>
                    <div className="font-medium">
                        {item.first_name} {item.last_name || ''}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.employee_id}</div>
                </div>
            ),
        },
        {
            key: 'unit',
            label: 'Unit / Jabatan',
            render: (item: Employee) => (
                <div className="text-sm">
                    <div>{item.organization_unit?.name || '-'}</div>
                    <div className="text-xs text-muted-foreground">{item.job_category?.name || '-'}</div>
                </div>
            ),
        },
        {
            key: 'schedule',
            label: 'Jadwal Aktif',
            render: (item: Employee) => {
                const schedule = getCurrentSchedule(item.schedules);
                if (!schedule) {
                    return (
                        <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Belum ada jadwal</span>
                        </div>
                    );
                }

                const workDays = getWorkDaysFromSchedule(schedule);

                return (
                    <div className="space-y-1">
                        <div className="flex flex-wrap gap-0.5">
                            {dayKeys.map((day, index) => {
                                const shift = getShiftForDay(schedule, day);
                                return (
                                    <div
                                        key={day}
                                        className={`w-8 rounded p-1 text-center text-[10px] ${
                                            shift ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                        }`}
                                        title={
                                            shift ? `${shift.name} (${formatTime(shift.clock_in_time)}-${formatTime(shift.clock_out_time)})` : 'Libur'
                                        }
                                    >
                                        <div className="font-medium">{dayLabels[index]}</div>
                                        <div className="truncate">{shift?.code || '-'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'effective',
            label: 'Berlaku',
            render: (item: Employee) => {
                const schedule = getCurrentSchedule(item.schedules);
                if (!schedule) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="text-xs">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(schedule.effective_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </div>
                        {schedule.end_date && (
                            <div className="mt-0.5 text-muted-foreground">
                                s/d{' '}
                                {new Date(schedule.end_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[80px]',
            render: (item: Employee) => (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/hr/schedules/${item.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Detail
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Jadwal Karyawan" />

            <IndexPage
                title="Jadwal Karyawan"
                description="Kelola jadwal kerja setiap karyawan. Shift dapat diatur berbeda per hari."
                actions={[
                    {
                        label: 'Atur Massal',
                        href: '/hr/schedules/bulk',
                        icon: Users,
                        variant: 'outline' as const,
                    },
                ]}
                filterFields={[
                    {
                        key: 'unit_id',
                        label: 'Unit',
                        type: 'select',
                        options: units.map((u) => ({ value: u.id.toString(), label: u.name })),
                        placeholder: 'Semua Unit',
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                searchValue={filterValues.search}
                searchPlaceholder="Cari nama atau NIP..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                data={employees.data}
                columns={columns}
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
                emptyMessage="Tidak ada karyawan yang cocok dengan filter."
            />
        </HRLayout>
    );
}
