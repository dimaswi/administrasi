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
    GraduationCap,
    CheckCircle,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Users,
    BookOpen,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TrainingItem {
    id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        unit: string | null;
    };
    training: {
        code: string | null;
        name: string | null;
        category: string | null;
        type: string | null;
        duration_hours: number | null;
    };
    start_date: string | null;
    end_date: string | null;
    status: string;
    score: number | null;
    grade: string | null;
    certificate_number: string | null;
}

interface TrainingOption {
    id: number;
    code: string;
    name: string;
}

interface Summary {
    total_participants: number;
    completed: number;
    in_progress: number;
    registered: number;
    failed: number;
    average_score: number;
    total_hours: number;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
}

interface Props {
    trainings: TrainingItem[];
    summary: Summary;
    trainingOptions: TrainingOption[];
    categories: string[];
    filters: {
        year: number;
        month: string | null;
        training_id: string | null;
        status: string | null;
        category: string | null;
    };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    registered: { label: 'Terdaftar', variant: 'secondary', icon: Clock },
    in_progress: { label: 'Berjalan', variant: 'default', icon: BookOpen },
    completed: { label: 'Selesai', variant: 'default', icon: CheckCircle },
    failed: { label: 'Gagal', variant: 'destructive', icon: XCircle },
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

export default function TrainingReport({ trainings, summary, trainingOptions, categories, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        year: filters.year.toString(),
        month: filters.month || '',
        training_id: filters.training_id || '',
        status: filters.status || '',
        category: filters.category || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        router.get('/hr/reports/training', newFilters, { preserveState: true });
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
        if (filterValues.training_id) params.append('training_id', filterValues.training_id);
        if (filterValues.status) params.append('status', filterValues.status);
        
        window.location.href = `/hr/reports/training/export?${params.toString()}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
    };

    return (
        <HRLayout>
            <Head title="Laporan Training" />
            
            <Card className="h-[calc(100vh-7rem)] flex flex-col">
                <CardHeader className="bg-muted/40 border-b py-4 flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Laporan Training</CardTitle>
                            <CardDescription>Statistik dan riwayat pelatihan karyawan</CardDescription>
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
                                value={filterValues.training_id || '_all'} 
                                onValueChange={(v) => handleFilterChange('training_id', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Semua Training" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Training</SelectItem>
                                    {trainingOptions.map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                value={filterValues.category || '_all'} 
                                onValueChange={(v) => handleFilterChange('category', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Kategori</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
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
                                    <SelectItem value="registered">Terdaftar</SelectItem>
                                    <SelectItem value="in_progress">Berjalan</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                    <SelectItem value="failed">Gagal</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
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
                                            <p className="text-sm font-medium text-muted-foreground">Total Peserta</p>
                                            <p className="text-3xl font-bold">{summary.total_participants}</p>
                                            <p className="text-xs text-muted-foreground">Tahun {filterValues.year}</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <GraduationCap className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Selesai</p>
                                            <p className="text-3xl font-bold text-green-600">{summary.completed}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {summary.total_participants > 0 ? Math.round((summary.completed / summary.total_participants) * 100) : 0}% completion
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
                                            <p className="text-sm font-medium text-muted-foreground">Sedang Berjalan</p>
                                            <p className="text-3xl font-bold text-yellow-600">{summary.in_progress}</p>
                                            <p className="text-xs text-muted-foreground">Training aktif</p>
                                        </div>
                                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Jam</p>
                                            <p className="text-3xl font-bold">{summary.total_hours}</p>
                                            <p className="text-xs text-muted-foreground">Jam pelatihan</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-xl">
                                            <Timer className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</p>
                                            <p className="text-3xl font-bold">{summary.average_score || '-'}</p>
                                            <p className="text-xs text-muted-foreground">Skor peserta</p>
                                        </div>
                                        <div className="p-3 bg-orange-500/10 rounded-xl">
                                            <Users className="h-5 w-5 text-orange-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* By Category */}
                        {Object.keys(summary.by_category).length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <BookOpen className="h-4 w-4 text-purple-600" />
                                        </div>
                                        Ringkasan per Kategori Training
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(summary.by_category).map(([category, count], index) => {
                                            const percentage = summary.total_participants > 0 ? Math.round((count / summary.total_participants) * 100) : 0;
                                            const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500'];
                                            return (
                                                <div key={category} className="p-4 rounded-xl border bg-card">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                                            <span className="font-medium">{category || 'Lainnya'}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-lg font-bold">{count}</span>
                                                            <span className="text-sm text-muted-foreground ml-1">peserta</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                                            {percentage}%
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
                                <CardTitle className="text-base">Detail Peserta Training</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Karyawan</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Training</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead>Periode</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Nilai</TableHead>
                                            <TableHead>Grade</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trainings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                    Tidak ada data training
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            trainings.map((item) => {
                                                const status = statusConfig[item.status] || statusConfig.registered;
                                                const StatusIcon = status.icon;
                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{item.employee.name}</div>
                                                                <div className="text-xs text-muted-foreground">{item.employee.employee_id}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{item.employee.unit || '-'}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{item.training.name || '-'}</div>
                                                                <div className="text-xs text-muted-foreground">{item.training.code}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{item.training.category || '-'}</TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={status.variant} className="gap-1">
                                                                <StatusIcon className="h-3 w-3" />
                                                                {status.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">
                                                            {item.score || '-'}
                                                        </TableCell>
                                                        <TableCell>{item.grade || '-'}</TableCell>
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
