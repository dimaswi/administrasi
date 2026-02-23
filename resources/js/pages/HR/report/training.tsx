import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, GraduationCap, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TrainingItem {
    id: number;
    employee: { id: number; employee_id: string; name: string; unit: string | null; };
    training: { code: string | null; name: string | null; category: string | null; type: string | null; duration_hours: number | null; };
    start_date: string | null; end_date: string | null; status: string;
    score: number | null; grade: string | null; certificate_number: string | null;
}
interface TrainingOption { id: number; code: string; name: string; }
interface Summary {
    total_participants: number; completed: number; in_progress: number;
    registered: number; failed: number; average_score: number;
    total_hours: number; by_category: Record<string, number>; by_status: Record<string, number>;
}
interface Props {
    trainings: TrainingItem[]; summary: Summary; trainingOptions: TrainingOption[];
    categories: string[];
    filters: { year: number; month: string | null; training_id: string | null; status: string | null; category: string | null; };
}

const statusCfg: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    registered: { label: 'Terdaftar', variant: 'secondary', icon: Clock },
    in_progress: { label: 'Berjalan', variant: 'default', icon: BookOpen },
    completed: { label: 'Selesai', variant: 'default', icon: CheckCircle },
    failed: { label: 'Gagal', variant: 'destructive', icon: XCircle },
    cancelled: { label: 'Dibatalkan', variant: 'outline', icon: XCircle },
};
const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((l, i) => ({ value: String(i + 1), label: l }));

export default function TrainingReport({ trainings, summary, trainingOptions, categories, filters }: Props) {
    const [fv, setFv] = useState({
        year: filters.year.toString(), month: filters.month || '',
        training_id: filters.training_id || '', status: filters.status || '', category: filters.category || '',
    });
    const set = (key: string, value: string) => {
        const nf = { ...fv, [key]: value }; setFv(nf);
        router.get('/hr/reports/training', nf, { preserveState: true });
    };
    const nav = (d: 'prev' | 'next') => set('year', (parseInt(fv.year) + (d === 'next' ? 1 : -1)).toString());
    const doExport = () => {
        const p = new URLSearchParams();
        if (fv.year) p.append('year', fv.year); if (fv.month) p.append('month', fv.month);
        if (fv.training_id) p.append('training_id', fv.training_id); if (fv.status) p.append('status', fv.status);
        window.location.href = `/hr/reports/training/export?${p.toString()}`;
    };
    const completionPct = summary.total_participants > 0 ? Math.round((summary.completed / summary.total_participants) * 100) : 0;

    return (
        <HRLayout>
            <Head title="Laporan Training" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-4 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Laporan Training</h2>
                    <p className="text-sm text-muted-foreground">Statistik dan riwayat pelatihan karyawan</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-0 border rounded-md overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('prev')}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <span className="text-sm font-semibold tabular-nums w-12 text-center border-x">{fv.year}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('next')}><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Select value={fv.month || '_all'} onValueChange={(v) => set('month', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Semua Bulan</SelectItem>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={fv.training_id || '_all'} onValueChange={(v) => set('training_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Semua Training" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Semua Training</SelectItem>{trainingOptions.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={fv.category || '_all'} onValueChange={(v) => set('category', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Semua Kategori</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={fv.status || '_all'} onValueChange={(v) => set('status', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Status</SelectItem>
                            <SelectItem value="registered">Terdaftar</SelectItem>
                            <SelectItem value="in_progress">Berjalan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="failed">Gagal</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8" onClick={doExport}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Peserta</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_participants}</p><p className="text-xs text-muted-foreground mt-0.5">Tahun {fv.year}</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Selesai</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.completed}</p><p className="text-xs text-muted-foreground mt-0.5">{completionPct}% completion</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Sedang Berjalan</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.in_progress}</p><p className="text-xs text-muted-foreground mt-0.5">Training aktif</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Jam</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_hours}</p><p className="text-xs text-muted-foreground mt-0.5">Jam pelatihan</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Rata-rata Nilai</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.average_score || '-'}</p><p className="text-xs text-muted-foreground mt-0.5">Skor peserta</p></div>
                </div>

                {Object.keys(summary.by_category).length > 0 && (
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />Ringkasan per Kategori</CardTitle></CardHeader>
                        <CardContent className="px-4 pb-4 space-y-3">
                            {Object.entries(summary.by_category).map(([cat, count]) => {
                                const pct = summary.total_participants > 0 ? Math.round((count / summary.total_participants) * 100) : 0;
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between mb-1"><span className="text-xs">{cat || 'Lainnya'}</span><span className="text-xs text-muted-foreground tabular-nums">{count} peserta ({pct}%)</span></div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Detail Peserta Training</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead><TableHead>Unit</TableHead><TableHead>Training</TableHead>
                                    <TableHead>Kategori</TableHead><TableHead>Periode</TableHead><TableHead>Status</TableHead>
                                    <TableHead className="text-center">Nilai</TableHead><TableHead>Grade</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trainings.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-sm">Tidak ada data training</TableCell></TableRow>
                                ) : trainings.map((item) => {
                                    const st = statusCfg[item.status] || statusCfg.registered;
                                    const StIcon = st.icon;
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell><div className="font-medium text-sm">{item.employee.name}</div><div className="text-xs text-muted-foreground">{item.employee.employee_id}</div></TableCell>
                                            <TableCell className="text-sm">{item.employee.unit || '-'}</TableCell>
                                            <TableCell><div className="font-medium text-sm">{item.training.name || '-'}</div><div className="text-xs text-muted-foreground">{item.training.code}</div></TableCell>
                                            <TableCell className="text-sm">{item.training.category || '-'}</TableCell>
                                            <TableCell className="text-sm">{item.start_date ? format(new Date(item.start_date), 'd MMM yyyy', { locale: idLocale }) : '-'}  {item.end_date ? format(new Date(item.end_date), 'd MMM yyyy', { locale: idLocale }) : '-'}</TableCell>
                                            <TableCell><Badge variant={st.variant} className="gap-1 text-xs"><StIcon className="h-3 w-3" />{st.label}</Badge></TableCell>
                                            <TableCell className="text-center text-sm font-medium">{item.score || '-'}</TableCell>
                                            <TableCell className="text-sm">{item.grade || '-'}</TableCell>
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
