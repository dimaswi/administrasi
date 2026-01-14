import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
    Target,
    CheckCircle,
    Clock,
    TrendingUp,
    Award,
} from 'lucide-react';
import { useState } from 'react';

interface ReviewItem {
    id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        unit: string | null;
    };
    status: string;
    self_score: number | null;
    manager_score: number | null;
    final_score: number | null;
    final_grade: string | null;
    reviewer: string | null;
    completed_at: string | null;
}

interface Period {
    id: number;
    name: string;
    is_current: boolean;
}

interface Unit {
    id: number;
    name: string;
}

interface Summary {
    total_reviews: number;
    completed: number;
    in_progress: number;
    average_score: number;
    by_grade?: Record<string, number>;
    by_status?: Record<string, number>;
    score_distribution?: Record<string, number>;
}

interface Props {
    reviews: ReviewItem[];
    summary: Summary;
    periods: Period[];
    period: Period | null;
    units: Unit[];
    filters: {
        period_id: string | null;
        unit_id: string | null;
        status: string | null;
    };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    draft: { label: 'Draft', variant: 'outline', icon: Clock },
    self_review: { label: 'Self Review', variant: 'secondary', icon: Clock },
    manager_review: { label: 'Manager Review', variant: 'secondary', icon: Clock },
    completed: { label: 'Selesai', variant: 'default', icon: CheckCircle },
};

const gradeColors: Record<string, string> = {
    'A': 'text-green-600',
    'B': 'text-blue-600',
    'C': 'text-yellow-600',
    'D': 'text-orange-600',
    'E': 'text-red-600',
};

export default function PerformanceReport({ reviews, summary, periods, period, units, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        period_id: filters.period_id || (period?.id?.toString() || ''),
        unit_id: filters.unit_id || '',
        status: filters.status || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        router.get('/hr/reports/performance', newFilters, { preserveState: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filterValues.period_id) params.append('period_id', filterValues.period_id);
        if (filterValues.unit_id) params.append('unit_id', filterValues.unit_id);
        if (filterValues.status) params.append('status', filterValues.status);
        
        window.location.href = `/hr/reports/performance/export?${params.toString()}`;
    };

    const completionRate = summary.total_reviews > 0 
        ? Math.round((summary.completed / summary.total_reviews) * 100) 
        : 0;

    return (
        <HRLayout>
            <Head title="Laporan Kinerja" />
            
            <Card className="h-[calc(100vh-7rem)] flex flex-col">
                <CardHeader className="bg-muted/40 border-b py-4 flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Laporan Kinerja</CardTitle>
                            <CardDescription>
                                {period ? `Periode: ${period.name}` : 'Statistik penilaian kinerja karyawan'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
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
                                value={filterValues.period_id || '_all'} 
                                onValueChange={(v) => handleFilterChange('period_id', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Pilih Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Periode</SelectItem>
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.name} {p.is_current && '(Aktif)'}
                                        </SelectItem>
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
                                value={filterValues.status || '_all'} 
                                onValueChange={(v) => handleFilterChange('status', v === '_all' ? '' : v)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Semua Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="self_review">Self Review</SelectItem>
                                    <SelectItem value="manager_review">Manager Review</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Summary Cards - Enhanced Design */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                                <CardContent className="p-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Penilaian</p>
                                            <p className="text-3xl font-bold">{summary.total_reviews}</p>
                                            <p className="text-xs text-muted-foreground">{period?.name || 'Semua periode'}</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <Target className="h-5 w-5 text-blue-600" />
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
                                            <div className="mt-2">
                                                <Progress value={completionRate} className="h-1.5" />
                                                <p className="text-xs text-muted-foreground mt-1">{completionRate}% selesai</p>
                                            </div>
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
                                            <p className="text-sm font-medium text-muted-foreground">Dalam Proses</p>
                                            <p className="text-3xl font-bold text-yellow-600">{summary.in_progress}</p>
                                            <p className="text-xs text-muted-foreground">Belum selesai</p>
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
                                            <p className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</p>
                                            <p className="text-3xl font-bold">{summary.average_score || '-'}</p>
                                            <p className="text-xs text-muted-foreground">Skor final</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-xl">
                                            <TrendingUp className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Score & Grade Distribution */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Score Distribution */}
                            {summary.score_distribution && Object.keys(summary.score_distribution).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                            </div>
                                            Distribusi Nilai
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {Object.entries(summary.score_distribution).map(([range, count], index) => {
                                                const percentage = summary.total_reviews > 0 ? Math.round((count / summary.total_reviews) * 100) : 0;
                                                const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];
                                                return (
                                                    <div key={range} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">{range}</span>
                                                            <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                                                        </div>
                                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
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

                            {/* Grade Distribution */}
                            {summary.by_grade && Object.keys(summary.by_grade).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                                <Award className="h-4 w-4 text-purple-600" />
                                            </div>
                                            Distribusi Grade
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-5 gap-3">
                                            {['A', 'B', 'C', 'D', 'E'].map((grade) => {
                                                const count = summary.by_grade?.[grade] || 0;
                                                const percentage = summary.total_reviews > 0 ? Math.round((count / summary.total_reviews) * 100) : 0;
                                                const bgColors: Record<string, string> = {
                                                    'A': 'from-green-500/20 to-green-600/10 border-green-500/30',
                                                    'B': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
                                                    'C': 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
                                                    'D': 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
                                                    'E': 'from-red-500/20 to-red-600/10 border-red-500/30',
                                                };
                                                return (
                                                    <div 
                                                        key={grade} 
                                                        className={`flex flex-col items-center p-4 rounded-xl border bg-gradient-to-br ${bgColors[grade]}`}
                                                    >
                                                        <span className={`text-3xl font-bold ${gradeColors[grade]}`}>{count}</span>
                                                        <span className="text-xs text-muted-foreground mt-1">Grade {grade}</span>
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
                                <CardTitle className="text-base">Detail Penilaian Kinerja</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Karyawan</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Self Score</TableHead>
                                            <TableHead className="text-center">Manager Score</TableHead>
                                            <TableHead className="text-center">Final Score</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Reviewer</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviews.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                    Tidak ada data penilaian
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            reviews.map((review) => {
                                                const status = statusConfig[review.status] || statusConfig.draft;
                                                const StatusIcon = status.icon;
                                                return (
                                                    <TableRow key={review.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{review.employee.name}</div>
                                                                <div className="text-xs text-muted-foreground">{review.employee.employee_id}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{review.employee.unit || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={status.variant} className="gap-1">
                                                                <StatusIcon className="h-3 w-3" />
                                                                {status.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {review.self_score ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {review.manager_score ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">
                                                            {review.final_score ?? '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {review.final_grade && (
                                                                <span className={`font-bold ${gradeColors[review.final_grade] || ''}`}>
                                                                    {review.final_grade}
                                                                </span>
                                                            )}
                                                            {!review.final_grade && '-'}
                                                        </TableCell>
                                                        <TableCell>{review.reviewer || '-'}</TableCell>
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
