import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Palmtree,
    CheckCircle,
    Clock,
    XCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface LeaveItem {
    id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        unit: string | null;
    };
    leave_type: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string | null;
    status: string;
    approver: string | null;
    approved_at: string | null;
}

interface Unit {
    id: number;
    name: string;
}

interface LeaveType {
    id: number;
    name: string;
    code: string;
}

interface Summary {
    total_requests: number;
    approved: number;
    pending: number;
    rejected: number;
    total_days: number;
    by_type: Record<string, { count: number; days: number }>;
    by_month: Record<string, number>;
}

interface Props {
    leaves: LeaveItem[];
    summary: Summary;
    units: Unit[];
    leaveTypes: LeaveType[];
    filters: {
        year: number;
        month: string | null;
        unit_id: string | null;
        leave_type_id: string | null;
        status: string | null;
    };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'Menunggu', variant: 'secondary', icon: Clock },
    approved: { label: 'Disetujui', variant: 'default', icon: CheckCircle },
    rejected: { label: 'Ditolak', variant: 'destructive', icon: XCircle },
    cancelled: { label: 'Dibatalkan', variant: 'outline', icon: XCircle },
};

const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

export default function LeaveReport({ leaves, summary, units, leaveTypes, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        year: filters.year.toString(),
        month: filters.month || '',
        unit_id: filters.unit_id || '',
        leave_type_id: filters.leave_type_id || '',
        status: filters.status || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        router.get('/hr/reports/leave', newFilters, { preserveState: true });
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
        if (filterValues.month) params.append('month', filterValues.month);
        if (filterValues.unit_id) params.append('unit_id', filterValues.unit_id);
        if (filterValues.status) params.append('status', filterValues.status);
        
        window.location.href = `/hr/reports/leave/export?${params.toString()}`;
    };

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
    };

    return (
        <HRLayout>
            <Head title="Laporan Cuti" />
            
            <Card className="h-[calc(100vh-7rem)] flex flex-col">
                <CardHeader className="bg-muted/40 border-b py-4 flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Laporan Cuti</CardTitle>
                            <CardDescription>Statistik dan riwayat pengajuan cuti karyawan</CardDescription>
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
                            <Select 
                                value={filterValues.month || '_all'} 
                                onValueChange={(v) => handleFilterChange('month', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Semua Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Bulan</SelectItem>
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                value={filterValues.unit_id || '_all'} 
                                onValueChange={(v) => handleFilterChange('unit_id', v === '_all' ? '' : v)}
                            >
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
                            <Select 
                                value={filterValues.leave_type_id || '_all'} 
                                onValueChange={(v) => handleFilterChange('leave_type_id', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Semua Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Jenis</SelectItem>
                                    {leaveTypes.map((lt) => (
                                        <SelectItem key={lt.id} value={lt.id.toString()}>{lt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                value={filterValues.status || '_all'} 
                                onValueChange={(v) => handleFilterChange('status', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Status</SelectItem>
                                    <SelectItem value="pending">Menunggu</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Summary Cards - Enhanced Design */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Pengajuan</p>
                                            <p className="text-3xl font-bold">{summary.total_requests}</p>
                                            <p className="text-xs text-muted-foreground">Tahun {filterValues.year}</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <Palmtree className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Disetujui</p>
                                            <p className="text-3xl font-bold text-green-600">{summary.approved}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {summary.total_requests > 0 ? Math.round((summary.approved / summary.total_requests) * 100) : 0}% dari total
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-xl">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Menunggu</p>
                                            <p className="text-3xl font-bold text-yellow-600">{summary.pending}</p>
                                            <p className="text-xs text-muted-foreground">Perlu persetujuan</p>
                                        </div>
                                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Ditolak</p>
                                            <p className="text-3xl font-bold text-red-600">{summary.rejected}</p>
                                            <p className="text-xs text-muted-foreground">Tidak disetujui</p>
                                        </div>
                                        <div className="p-3 bg-red-500/10 rounded-xl">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Hari</p>
                                            <p className="text-3xl font-bold">{summary.total_days}</p>
                                            <p className="text-xs text-muted-foreground">Hari cuti diambil</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-xl">
                                            <Calendar className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Leave by Type Summary */}
                        {Object.keys(summary.by_type).length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <Palmtree className="h-4 w-4 text-orange-600" />
                                        </div>
                                        Ringkasan per Jenis Cuti
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(summary.by_type).map(([type, data], index) => {
                                            const percentage = summary.total_days > 0 ? Math.round((data.days / summary.total_days) * 100) : 0;
                                            const colors = ['bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500', 'bg-teal-500'];
                                            return (
                                                <div key={type} className="p-4 rounded-xl border bg-card">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                                            <span className="font-medium">{type}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-lg font-bold">{data.days}</span>
                                                            <span className="text-sm text-muted-foreground ml-1">hari</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground w-16 text-right">
                                                            {data.count} pengajuan
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Data Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Detail Pengajuan Cuti</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Karyawan</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Jenis Cuti</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="text-center">Hari</TableHead>
                                            <TableHead>Alasan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Disetujui Oleh</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaves.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                    Tidak ada data cuti
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            leaves.map((leave) => {
                                                const status = statusConfig[leave.status] || statusConfig.pending;
                                                const StatusIcon = status.icon;
                                                return (
                                                    <TableRow key={leave.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{leave.employee.name}</div>
                                                                <div className="text-xs text-muted-foreground">{leave.employee.employee_id}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{leave.employee.unit || '-'}</TableCell>
                                                        <TableCell>{leave.leave_type || '-'}</TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">{leave.total_days}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate">{leave.reason || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={status.variant} className="gap-1">
                                                                <StatusIcon className="h-3 w-3" />
                                                                {status.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{leave.approver || '-'}</TableCell>
                                                    </TableRow>
                                                );
                                            })
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
