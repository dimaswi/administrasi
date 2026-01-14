import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Download,
    Users,
    Building,
    ChevronLeft,
    ChevronRight,
    Palmtree,
    GraduationCap,
    Calendar,
    Target,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface EmployeeItem {
    id: number;
    employee_id: string;
    name: string;
    unit: string | null;
    job_category: string | null;
    employment_status: string | null;
    status: string;
    join_date: string | null;
    attendance_count: number;
    leave_count: number;
    total_leave_days: number;
    training_count: number;
    review_count: number;
}

interface Unit {
    id: number;
    name: string;
}

interface Summary {
    total_employees: number;
    by_unit: Record<string, number>;
    by_status: Record<string, number>;
}

interface Props {
    employees: EmployeeItem[];
    summary: Summary;
    units: Unit[];
    filters: {
        year: number;
        unit_id: string | null;
        status: string | null;
    };
}

export default function EmployeeReport({ employees, summary, units, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        year: filters.year.toString(),
        unit_id: filters.unit_id || '',
        status: filters.status || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        router.get('/hr/reports/employee', newFilters, { preserveState: true });
    };

    const navigateYear = (direction: 'prev' | 'next') => {
        const newYear = direction === 'prev' 
            ? parseInt(filterValues.year) - 1 
            : parseInt(filterValues.year) + 1;
        handleFilterChange('year', newYear.toString());
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filterValues.year) params.append('year', filterValues.year);
        if (filterValues.unit_id) params.append('unit_id', filterValues.unit_id);
        if (filterValues.status) params.append('status', filterValues.status);
        
        window.location.href = `/hr/reports/employee/export?${params.toString()}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
    };

    return (
        <HRLayout>
            <Head title="Laporan Karyawan" />
            
            <Card className="h-[calc(100vh-7rem)] flex flex-col">
                <CardHeader className="bg-muted/40 border-b py-4 flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Laporan Karyawan</CardTitle>
                            <CardDescription>Ringkasan data karyawan dan aktivitas tahunan</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => navigateYear('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold min-w-[80px] text-center">
                                {filterValues.year}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => navigateYear('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                
                <ScrollArea className="flex-1">
                    <CardContent className="p-4 space-y-6">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={filterValues.unit_id || '_all'} onValueChange={(v) => handleFilterChange('unit_id', v === '_all' ? '' : v)}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Semua Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Unit</SelectItem>
                                    {units.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterValues.status || '_all'} onValueChange={(v) => handleFilterChange('status', v === '_all' ? '' : v)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Status</SelectItem>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Non-Aktif</SelectItem>
                                    <SelectItem value="resigned">Resign</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Summary Stats - Enhanced Design */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Karyawan</p>
                                            <p className="text-3xl font-bold">{summary.total_employees}</p>
                                            <p className="text-xs text-muted-foreground">Tahun {filterValues.year}</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Kehadiran</p>
                                            <p className="text-3xl font-bold">
                                                {employees.reduce((sum, e) => sum + e.attendance_count, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Akumulasi semua karyawan</p>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-xl">
                                            <Calendar className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Cuti</p>
                                            <p className="text-3xl font-bold">
                                                {employees.reduce((sum, e) => sum + e.total_leave_days, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Total hari cuti diambil</p>
                                        </div>
                                        <div className="p-3 bg-orange-500/10 rounded-xl">
                                            <Palmtree className="h-5 w-5 text-orange-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Training</p>
                                            <p className="text-3xl font-bold">
                                                {employees.reduce((sum, e) => sum + e.training_count, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Total pelatihan diikuti</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-xl">
                                            <GraduationCap className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Distribution Cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Unit Distribution */}
                            {Object.keys(summary.by_unit).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <Building className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            Distribusi per Unit
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {Object.entries(summary.by_unit).map(([unit, count], index) => {
                                                const percentage = summary.total_employees > 0 ? Math.round((count / summary.total_employees) * 100) : 0;
                                                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500'];
                                                return (
                                                    <div key={unit} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium truncate max-w-[200px]">{unit || 'Tanpa Unit'}</span>
                                                            <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Status Distribution */}
                            {Object.keys(summary.by_status).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                <Users className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            Distribusi per Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-3">
                                            {Object.entries(summary.by_status).map(([status, count]) => {
                                                const percentage = summary.total_employees > 0 ? Math.round((count / summary.total_employees) * 100) : 0;
                                                const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                                                    'active': { bg: 'from-green-500/20 to-green-600/10 border-green-500/30', text: 'text-green-600', label: 'Aktif' },
                                                    'inactive': { bg: 'from-amber-500/20 to-amber-600/10 border-amber-500/30', text: 'text-amber-600', label: 'Non-Aktif' },
                                                    'resigned': { bg: 'from-red-500/20 to-red-600/10 border-red-500/30', text: 'text-red-600', label: 'Resign' },
                                                };
                                                const config = statusConfig[status] || { bg: 'from-gray-500/20 to-gray-600/10 border-gray-500/30', text: 'text-gray-600', label: status };
                                                return (
                                                    <div 
                                                        key={status} 
                                                        className={`flex flex-col items-center p-4 rounded-xl border bg-gradient-to-br ${config.bg}`}
                                                    >
                                                        <span className={`text-3xl font-bold ${config.text}`}>{count}</span>
                                                        <span className="text-xs text-muted-foreground mt-1 capitalize">{config.label}</span>
                                                        <span className="text-xs text-muted-foreground">{percentage}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Data Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Detail Karyawan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>NIP</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Jabatan</TableHead>
                                            <TableHead>Status Kerja</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tgl. Masuk</TableHead>
                                            <TableHead className="text-center">
                                                <Calendar className="h-4 w-4 inline mr-1" />
                                                Hadir
                                            </TableHead>
                                            <TableHead className="text-center">
                                                <Palmtree className="h-4 w-4 inline mr-1" />
                                                Cuti
                                            </TableHead>
                                            <TableHead className="text-center">
                                                <GraduationCap className="h-4 w-4 inline mr-1" />
                                                Training
                                            </TableHead>
                                            <TableHead className="text-center">
                                                <Target className="h-4 w-4 inline mr-1" />
                                                Review
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                                                    Tidak ada data karyawan
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            employees.map((emp) => (
                                                <TableRow key={emp.id} className={emp.status !== 'active' ? 'opacity-60' : ''}>
                                                    <TableCell className="font-mono text-sm">{emp.employee_id}</TableCell>
                                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                                    <TableCell>{emp.unit || '-'}</TableCell>
                                                    <TableCell>{emp.job_category || '-'}</TableCell>
                                                    <TableCell>{emp.employment_status || '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={
                                                            emp.status === 'active' 
                                                                ? 'text-green-600' 
                                                                : emp.status === 'resigned' 
                                                                    ? 'text-red-600' 
                                                                    : 'text-yellow-600'
                                                        }>
                                                            {emp.status === 'active' ? 'Aktif' : emp.status === 'resigned' ? 'Resign' : 'Non-Aktif'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{formatDate(emp.join_date)}</TableCell>
                                                    <TableCell className="text-center">{emp.attendance_count}</TableCell>
                                                    <TableCell className="text-center">
                                                        {emp.leave_count} ({emp.total_leave_days} hari)
                                                    </TableCell>
                                                    <TableCell className="text-center">{emp.training_count}</TableCell>
                                                    <TableCell className="text-center">{emp.review_count}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </CardContent>
                </ScrollArea>
            </Card>
        </HRLayout>
    );
}
