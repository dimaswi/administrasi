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
    Users,
    UserPlus,
    UserMinus,
    TrendingDown,
    TrendingUp,
    Percent,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TurnoverItem {
    id: number;
    employee_id: string;
    name: string;
    unit: string | null;
    job_category: string | null;
    type: 'new_hire' | 'resignation' | 'termination';
    date: string;
    reason: string | null;
}

interface Unit {
    id: number;
    name: string;
}

interface MonthlyData {
    month: string;
    month_num: number;
    new_hires: number;
    separations: number;
    net: number;
}

interface Summary {
    total_new_hires: number;
    total_separations: number;
    resignations: number;
    terminations: number;
    net_change: number;
    turnover_rate: number;
    voluntary_turnover: number;
    involuntary_turnover: number;
    avg_employees: number;
    employees_start_year: number;
    employees_end_year: number;
    separations_by_reason: Record<string, number>;
    separations_by_unit: Record<string, number>;
    new_hires_by_unit: Record<string, number>;
    monthly_data: MonthlyData[];
}

interface Props {
    data: TurnoverItem[];
    summary: Summary;
    units: Unit[];
    filters: {
        year: number;
        unit_id: string | null;
        type: string | null;
    };
}

const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    new_hire: { label: 'Karyawan Baru', variant: 'default', color: 'text-green-600' },
    resignation: { label: 'Resign', variant: 'secondary', color: 'text-yellow-600' },
    termination: { label: 'Terminasi', variant: 'destructive', color: 'text-red-600' },
};

export default function TurnoverReport({ data, summary, units, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        year: filters.year.toString(),
        unit_id: filters.unit_id || '',
        type: filters.type || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        router.get('/hr/reports/turnover', newFilters, { preserveState: true });
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
        if (filterValues.type) params.append('type', filterValues.type);
        
        window.location.href = `/hr/reports/turnover/export?${params.toString()}`;
    };

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
    };

    // Find max value for chart scaling
    const maxMonthlyValue = Math.max(
        ...summary.monthly_data.map(m => Math.max(m.new_hires, m.separations)),
        1
    );

    return (
        <HRLayout>
            <Head title="Laporan Turnover" />
            
            <Card className="h-[calc(100vh-7rem)] flex flex-col">
                <CardHeader className="bg-muted/40 border-b py-4 flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Laporan Turnover</CardTitle>
                            <CardDescription>Analisis keluar masuk karyawan</CardDescription>
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
                                value={filterValues.type || '_all'} 
                                onValueChange={(v) => handleFilterChange('type', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Tipe</SelectItem>
                                    <SelectItem value="new_hire">Karyawan Baru</SelectItem>
                                    <SelectItem value="resignation">Resign</SelectItem>
                                    <SelectItem value="termination">Terminasi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Main Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Karyawan Baru</p>
                                            <p className="text-3xl font-bold text-green-600">{summary.total_new_hires}</p>
                                            <p className="text-xs text-muted-foreground">Bergabung di {filterValues.year}</p>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-xl">
                                            <UserPlus className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Keluar</p>
                                            <p className="text-3xl font-bold text-red-600">{summary.total_separations}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {summary.resignations} resign, {summary.terminations} terminasi
                                            </p>
                                        </div>
                                        <div className="p-3 bg-red-500/10 rounded-xl">
                                            <UserMinus className="h-5 w-5 text-red-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${summary.net_change >= 0 ? 'from-blue-500/10 to-blue-600/5' : 'from-orange-500/10 to-orange-600/5'}`} />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Perubahan Bersih</p>
                                            <p className={`text-3xl font-bold ${summary.net_change >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                {summary.net_change > 0 ? '+' : ''}{summary.net_change}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                {summary.net_change >= 0 ? (
                                                    <>
                                                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                                                        Pertumbuhan
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                                                        Penurunan
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div className={`p-3 ${summary.net_change >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'} rounded-xl`}>
                                            {summary.net_change >= 0 ? (
                                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                            ) : (
                                                <TrendingDown className="h-5 w-5 text-orange-600" />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Turnover Rate</p>
                                            <p className="text-3xl font-bold">{summary.turnover_rate}%</p>
                                            <p className="text-xs text-muted-foreground">
                                                Dari avg {summary.avg_employees} karyawan
                                            </p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-xl">
                                            <Percent className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Turnover Details */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Voluntary Turnover</p>
                                            <p className="text-2xl font-bold text-yellow-600">{summary.voluntary_turnover}%</p>
                                            <p className="text-xs text-muted-foreground">{summary.resignations} resign</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Involuntary Turnover</p>
                                            <p className="text-2xl font-bold text-red-600">{summary.involuntary_turnover}%</p>
                                            <p className="text-xs text-muted-foreground">{summary.terminations} terminasi</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Rata-rata Karyawan</p>
                                            <p className="text-2xl font-bold">{summary.avg_employees}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Awal: {summary.employees_start_year} | Akhir: {summary.employees_end_year}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Monthly Chart */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    Tren Bulanan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between gap-2 h-48">
                                    {summary.monthly_data.map((month) => (
                                        <div key={month.month_num} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="flex-1 w-full flex items-end gap-1">
                                                <div 
                                                    className="flex-1 bg-green-500/80 rounded-t transition-all"
                                                    style={{ height: `${(month.new_hires / maxMonthlyValue) * 100}%`, minHeight: month.new_hires > 0 ? '8px' : '2px' }}
                                                    title={`Masuk: ${month.new_hires}`}
                                                />
                                                <div 
                                                    className="flex-1 bg-red-500/80 rounded-t transition-all"
                                                    style={{ height: `${(month.separations / maxMonthlyValue) * 100}%`, minHeight: month.separations > 0 ? '8px' : '2px' }}
                                                    title={`Keluar: ${month.separations}`}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground">{month.month}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded" />
                                        <span className="text-sm text-muted-foreground">Masuk</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded" />
                                        <span className="text-sm text-muted-foreground">Keluar</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Separation by Reason & Unit */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {Object.keys(summary.separations_by_reason).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Alasan Keluar</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {Object.entries(summary.separations_by_reason).map(([reason, count], index) => {
                                                const total = summary.total_separations;
                                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                                const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-amber-500', 'bg-rose-500'];
                                                return (
                                                    <div key={reason} className="p-3 rounded-lg border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm capitalize">{reason || 'Tidak Disebutkan'}</span>
                                                            <span className="text-sm font-bold">{count}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${colors[index % colors.length]} rounded-full`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-10">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {Object.keys(summary.separations_by_unit).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Perbandingan per Unit</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {Object.entries(summary.separations_by_unit).map(([unit, separations]) => {
                                                const newHires = summary.new_hires_by_unit[unit] || 0;
                                                const net = newHires - separations;
                                                return (
                                                    <div key={unit} className="p-3 rounded-lg border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm">{unit}</span>
                                                            <span className={`text-sm font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {net > 0 ? '+' : ''}{net}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <span className="text-green-600">+{newHires} masuk</span>
                                                            <span className="text-red-600">-{separations} keluar</span>
                                                        </div>
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
                                <CardTitle className="text-base">Detail Data Turnover</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Karyawan</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Jabatan</TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Alasan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    Tidak ada data turnover
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((item) => {
                                                const typeInfo = typeConfig[item.type];
                                                return (
                                                    <TableRow key={`${item.id}-${item.type}`}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{item.name}</div>
                                                                <div className="text-xs text-muted-foreground">{item.employee_id}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{item.unit || '-'}</TableCell>
                                                        <TableCell>{item.job_category || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={typeInfo.variant}>
                                                                {typeInfo.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{formatDate(item.date)}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate">
                                                            {item.reason || '-'}
                                                        </TableCell>
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
