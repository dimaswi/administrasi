import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
    Calendar, 
    FileText, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
    job_category: string | null;
}

interface DayData {
    status: string;
    clock_in: string | null;
    clock_out: string | null;
}

interface Summary {
    present: number;
    absent: number;
    late: number;
    leave: number;
    sick: number;
    permit: number;
    total_late_minutes: number;
    total_work_minutes: number;
}

interface ReportItem {
    employee: Employee;
    days: Record<string, DayData | null>;
    summary: Summary;
}

interface Unit {
    id: number;
    name: string;
}

interface EmployeeOption {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string | null;
}

interface Props {
    report: ReportItem[];
    month: string;
    startDate: string;
    endDate: string;
    units: Unit[];
    employees: EmployeeOption[];
    filters: {
        month: string;
        unit_id: string | null;
        employee_id: string | null;
    };
}

const statusConfig: Record<string, { 
    bg: string; 
    label: string; 
    abbr: string;
}> = {
    present: { 
        bg: 'bg-green-500', 
        label: 'Hadir', 
        abbr: 'H',
    },
    late: { 
        bg: 'bg-yellow-500', 
        label: 'Terlambat', 
        abbr: 'T',
    },
    early_leave: { 
        bg: 'bg-orange-500', 
        label: 'Pulang Awal', 
        abbr: 'PA',
    },
    late_early_leave: { 
        bg: 'bg-orange-600', 
        label: 'Terlambat & Pulang Awal', 
        abbr: 'TP',
    },
    absent: { 
        bg: 'bg-red-500', 
        label: 'Tidak Hadir', 
        abbr: 'A',
    },
    leave: { 
        bg: 'bg-blue-500', 
        label: 'Cuti', 
        abbr: 'C',
    },
    sick: { 
        bg: 'bg-purple-500', 
        label: 'Sakit', 
        abbr: 'S',
    },
    permit: { 
        bg: 'bg-cyan-500', 
        label: 'Izin', 
        abbr: 'I',
    },
    holiday: { 
        bg: 'bg-gray-400', 
        label: 'Libur', 
        abbr: 'L',
    },
};

export default function Report({ report, month, startDate, endDate, units, employees, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        month: filters.month,
        unit_id: filters.unit_id || '',
        employee_id: filters.employee_id || '',
    });

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const [year, monthNum] = filterValues.month.split('-').map(Number);
        let newYear = year;
        let newMonth = monthNum;
        
        if (direction === 'prev') {
            newMonth--;
            if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
        } else {
            newMonth++;
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }
        }
        
        const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
        setFilterValues(prev => ({ ...prev, month: newMonthStr }));
        router.get('/hr/attendances/report', { ...filterValues, month: newMonthStr }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        router.get('/hr/attendances/report', newFilters, { preserveState: true });
    };

    // Generate dates for the month
    const getDaysInMonth = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days: { date: string; day: number; dayName: string; isWeekend: boolean }[] = [];
        
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            days.push({
                date: current.toISOString().split('T')[0],
                day: current.getDate(),
                dayName: current.toLocaleDateString('id-ID', { weekday: 'short' }),
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            });
            current.setDate(current.getDate() + 1);
        }
        return days;
    };

    const days = getDaysInMonth();

    // Calculate overall statistics
    const totalStats = report.reduce((acc, item) => ({
        present: acc.present + item.summary.present,
        late: acc.late + item.summary.late,
        absent: acc.absent + item.summary.absent,
        leave: acc.leave + item.summary.leave,
        sick: acc.sick + item.summary.sick,
        permit: acc.permit + item.summary.permit,
    }), { present: 0, late: 0, absent: 0, leave: 0, sick: 0, permit: 0 });

    return (
        <HRLayout>
            <Head title={`Laporan Kehadiran - ${formatMonth(filterValues.month)}`} />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Laporan Kehadiran Bulanan
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Rekap kehadiran karyawan - {formatMonth(filterValues.month)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Input
                                type="month"
                                value={filterValues.month}
                                onChange={(e) => handleFilterChange('month', e.target.value)}
                                className="w-[160px]"
                            />
                            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
                            <div className="text-xs text-green-700 dark:text-green-400 font-medium">Hadir</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{totalStats.present}</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                            <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Terlambat</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{totalStats.late}</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                            <div className="text-xs text-red-700 dark:text-red-400 font-medium">Tidak Hadir</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-500">{totalStats.absent}</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                            <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Cuti</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{totalStats.leave}</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg p-3">
                            <div className="text-xs text-purple-700 dark:text-purple-400 font-medium">Sakit</div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">{totalStats.sick}</div>
                        </div>
                        <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 rounded-lg p-3">
                            <div className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">Izin</div>
                            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-500">{totalStats.permit}</div>
                        </div>
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                            <Select 
                                value={filterValues.unit_id || 'all'} 
                                onValueChange={(val) => handleFilterChange('unit_id', val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Unit</SelectItem>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                value={filterValues.employee_id || 'all'} 
                                onValueChange={(val) => handleFilterChange('employee_id', val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter Karyawan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Karyawan</SelectItem>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.first_name} {emp.last_name || ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                {report.length} karyawan
                            </div>
                        </div>

                        <Button variant="outline" asChild>
                            <a href={`/hr/attendances/export/monthly?month=${filterValues.month}&unit_id=${filterValues.unit_id || ''}`}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-max min-w-full border-collapse">
                            <thead className="bg-muted/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-sm border-r min-w-[200px]">
                                        Karyawan
                                    </th>
                                    {days.map((day) => (
                                        <th 
                                            key={day.date} 
                                            className={cn(
                                                "px-1 py-2 text-center font-medium w-[44px]",
                                                day.isWeekend && 'bg-muted/80'
                                            )}
                                        >
                                            <div className="text-xs text-muted-foreground">{day.dayName}</div>
                                            <div className="text-sm font-semibold">{day.day}</div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-center font-semibold text-sm border-l min-w-[280px]">
                                        Ringkasan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {report.length === 0 ? (
                                    <tr>
                                        <td colSpan={days.length + 2} className="text-center py-16 text-muted-foreground">
                                            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                            <p className="text-lg font-medium">Tidak ada data kehadiran</p>
                                            <p className="text-sm">Data kehadiran untuk bulan {formatMonth(filterValues.month)} belum tersedia</p>
                                        </td>
                                    </tr>
                                ) : (
                                    report.map((item) => (
                                        <tr key={item.employee.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 border-r bg-background">
                                                <div className="min-w-[180px]">
                                                    <div className="font-semibold text-sm">{item.employee.name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        <span>{item.employee.employee_id}</span>
                                                        {item.employee.organization_unit && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[100px]">{item.employee.organization_unit}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {days.map((day) => {
                                                const dayData = item.days[day.date];
                                                const config = dayData ? statusConfig[dayData.status] : null;
                                                return (
                                                    <td 
                                                        key={day.date} 
                                                        className={cn(
                                                            "px-1 py-2 text-center",
                                                            day.isWeekend && 'bg-muted/30'
                                                        )}
                                                    >
                                                        {dayData && config ? (
                                                            <TooltipProvider delayDuration={100}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div 
                                                                            className={cn(
                                                                                "w-9 h-9 rounded-md text-white text-xs font-bold flex items-center justify-center mx-auto cursor-help hover:scale-110 transition-transform",
                                                                                config.bg
                                                                            )}
                                                                        >
                                                                            {config.abbr}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <div className="space-y-1">
                                                                            <p className="font-semibold">{config.label}</p>
                                                                            <p className="text-xs">
                                                                                {new Date(day.date).toLocaleDateString('id-ID', { 
                                                                                    weekday: 'long', 
                                                                                    day: 'numeric', 
                                                                                    month: 'long' 
                                                                                })}
                                                                            </p>
                                                                            {dayData.clock_in && (
                                                                                <p className="text-xs">Masuk: <strong>{dayData.clock_in}</strong></p>
                                                                            )}
                                                                            {dayData.clock_out && (
                                                                                <p className="text-xs">Keluar: <strong>{dayData.clock_out}</strong></p>
                                                                            )}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-800 mx-auto" />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-2 border-l bg-background">
                                                <div className="flex flex-wrap gap-1.5 justify-center min-w-[260px]">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                        H:{item.summary.present}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                                        T:{item.summary.late}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                                        A:{item.summary.absent}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                        C:{item.summary.leave}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                        S:{item.summary.sick}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                                                        I:{item.summary.permit}
                                                    </Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}
