import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Target, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { useState } from 'react';

interface ReviewItem {
    id: number;
    employee: { id: number; employee_id: string; name: string; unit: string | null; };
    status: string; self_score: number | null; manager_score: number | null;
    final_score: number | null; final_grade: string | null;
    reviewer: string | null; completed_at: string | null;
}
interface Period { id: number; name: string; is_current: boolean; }
interface Unit { id: number; name: string; }
interface Summary {
    total_reviews: number; completed: number; in_progress: number; average_score: number;
    by_grade?: Record<string, number>; by_status?: Record<string, number>;
    score_distribution?: Record<string, number>;
}
interface Props {
    reviews: ReviewItem[]; summary: Summary; periods: Period[]; period: Period | null;
    units: Unit[]; filters: { period_id: string | null; unit_id: string | null; status: string | null; };
}

const statusCfg: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    draft: { label: 'Draft', variant: 'outline', icon: Clock },
    self_review: { label: 'Self Review', variant: 'secondary', icon: Clock },
    manager_review: { label: 'Manager Review', variant: 'secondary', icon: Clock },
    completed: { label: 'Selesai', variant: 'default', icon: CheckCircle },
};

export default function PerformanceReport({ reviews, summary, periods, period, units, filters }: Props) {
    const [fv, setFv] = useState({
        period_id: filters.period_id || (period?.id?.toString() || ''),
        unit_id: filters.unit_id || '', status: filters.status || '',
    });
    const set = (key: string, value: string) => {
        const nf = { ...fv, [key]: value }; setFv(nf);
        router.get('/hr/reports/performance', nf, { preserveState: true });
    };
    const doExport = () => {
        const p = new URLSearchParams();
        if (fv.period_id) p.append('period_id', fv.period_id);
        if (fv.unit_id) p.append('unit_id', fv.unit_id);
        if (fv.status) p.append('status', fv.status);
        window.location.href = `/hr/reports/performance/export?${p.toString()}`;
    };
    const completionRate = summary.total_reviews > 0 ? Math.round((summary.completed / summary.total_reviews) * 100) : 0;

    return (
        <HRLayout>
            <Head title="Laporan Kinerja" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-4 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Laporan Kinerja</h2>
                    <p className="text-sm text-muted-foreground">{period ? `Periode: ${period.name}` : 'Statistik penilaian kinerja karyawan'}</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <Select value={fv.period_id || '_all'} onValueChange={(v) => set('period_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue placeholder="Pilih Periode" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Periode</SelectItem>
                            {periods.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}{p.is_current ? ' (Aktif)' : ''}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={fv.unit_id || '_all'} onValueChange={(v) => set('unit_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Unit" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Unit</SelectItem>
                            {units.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={fv.status || '_all'} onValueChange={(v) => set('status', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="self_review">Self Review</SelectItem>
                            <SelectItem value="manager_review">Manager Review</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8" onClick={doExport}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Penilaian</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_reviews}</p><p className="text-xs text-muted-foreground mt-0.5">{period?.name || 'Semua periode'}</p></div>
                    <div className="bg-card p-4">
                        <p className="text-xs text-muted-foreground">Selesai</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">{summary.completed}</p>
                        <Progress value={completionRate} className="h-1 mt-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">{completionRate}% selesai</p>
                    </div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Dalam Proses</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.in_progress}</p><p className="text-xs text-muted-foreground mt-0.5">Belum selesai</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Rata-rata Nilai</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.average_score || '-'}</p><p className="text-xs text-muted-foreground mt-0.5">Skor final</p></div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {summary.score_distribution && Object.keys(summary.score_distribution).length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />Distribusi Nilai</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {Object.entries(summary.score_distribution).map(([range, count]) => {
                                    const pct = summary.total_reviews > 0 ? Math.round((count / summary.total_reviews) * 100) : 0;
                                    return (
                                        <div key={range}>
                                            <div className="flex justify-between mb-1"><span className="text-xs">{range}</span><span className="text-xs text-muted-foreground tabular-nums">{count} ({pct}%)</span></div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                    {summary.by_grade && Object.keys(summary.by_grade).length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-muted-foreground" />Distribusi Grade</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {['A','B','C','D','E'].map((grade) => {
                                    const count = summary.by_grade?.[grade] || 0;
                                    const pct = summary.total_reviews > 0 ? Math.round((count / summary.total_reviews) * 100) : 0;
                                    return (
                                        <div key={grade}>
                                            <div className="flex justify-between mb-1"><span className="text-xs font-medium">Grade {grade}</span><span className="text-xs text-muted-foreground tabular-nums">{count} ({pct}%)</span></div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Detail Penilaian Kinerja</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead><TableHead>Unit</TableHead><TableHead>Status</TableHead>
                                    <TableHead className="text-center">Self Score</TableHead><TableHead className="text-center">Manager Score</TableHead>
                                    <TableHead className="text-center">Final Score</TableHead><TableHead>Grade</TableHead><TableHead>Reviewer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-sm">Tidak ada data penilaian</TableCell></TableRow>
                                ) : reviews.map((review) => {
                                    const st = statusCfg[review.status] || statusCfg.draft;
                                    const StIcon = st.icon;
                                    return (
                                        <TableRow key={review.id}>
                                            <TableCell><div className="font-medium text-sm">{review.employee.name}</div><div className="text-xs text-muted-foreground">{review.employee.employee_id}</div></TableCell>
                                            <TableCell className="text-sm">{review.employee.unit || '-'}</TableCell>
                                            <TableCell><Badge variant={st.variant} className="gap-1 text-xs"><StIcon className="h-3 w-3" />{st.label}</Badge></TableCell>
                                            <TableCell className="text-center text-sm">{review.self_score ?? '-'}</TableCell>
                                            <TableCell className="text-center text-sm">{review.manager_score ?? '-'}</TableCell>
                                            <TableCell className="text-center font-medium text-sm">{review.final_score ?? '-'}</TableCell>
                                            <TableCell className="font-bold text-sm">{review.final_grade || '-'}</TableCell>
                                            <TableCell className="text-sm">{review.reviewer || '-'}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </HRLayout>
    );
}
