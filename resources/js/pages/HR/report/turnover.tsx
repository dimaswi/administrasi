import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Users, UserPlus, UserMinus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TurnoverItem {
    id: number; employee_id: string; name: string; unit: string | null;
    job_category: string | null; type: 'new_hire' | 'resignation' | 'termination';
    date: string; reason: string | null;
}
interface Unit { id: number; name: string; }
interface MonthlyData { month: string; month_num: number; new_hires: number; separations: number; net: number; }
interface Summary {
    total_new_hires: number; total_separations: number; resignations: number; terminations: number;
    net_change: number; turnover_rate: number; voluntary_turnover: number; involuntary_turnover: number;
    avg_employees: number; employees_start_year: number; employees_end_year: number;
    separations_by_reason: Record<string, number>; separations_by_unit: Record<string, number>;
    new_hires_by_unit: Record<string, number>; monthly_data: MonthlyData[];
}
interface Props {
    data: TurnoverItem[]; summary: Summary; units: Unit[];
    filters: { year: number; unit_id: string | null; type: string | null; };
}

const typeCfg: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    new_hire: { label: 'Karyawan Baru', variant: 'default' },
    resignation: { label: 'Resign', variant: 'secondary' },
    termination: { label: 'Terminasi', variant: 'destructive' },
};

export default function TurnoverReport({ data, summary, units, filters }: Props) {
    const [fv, setFv] = useState({
        year: filters.year.toString(), unit_id: filters.unit_id || '', type: filters.type || '',
    });
    const set = (key: string, value: string) => {
        const nf = { ...fv, [key]: value }; setFv(nf);
        router.get('/hr/reports/turnover', nf, { preserveState: true });
    };
    const nav = (d: 'prev' | 'next') => set('year', (parseInt(fv.year) + (d === 'next' ? 1 : -1)).toString());
    const doExport = () => {
        const p = new URLSearchParams();
        if (fv.year) p.append('year', fv.year);
        if (fv.unit_id) p.append('unit_id', fv.unit_id);
        if (fv.type) p.append('type', fv.type);
        window.location.href = `/hr/reports/turnover/export?${p.toString()}`;
    };
    const maxVal = Math.max(...summary.monthly_data.map(m => Math.max(m.new_hires, m.separations)), 1);

    return (
        <HRLayout>
            <Head title="Laporan Turnover" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-4 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Laporan Turnover</h2>
                    <p className="text-sm text-muted-foreground">Analisis keluar masuk karyawan</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-0 border rounded-md overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('prev')}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <span className="text-sm font-semibold tabular-nums w-12 text-center border-x">{fv.year}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('next')}><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Select value={fv.unit_id || '_all'} onValueChange={(v) => set('unit_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Unit" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Semua Unit</SelectItem>{units.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={fv.type || '_all'} onValueChange={(v) => set('type', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Tipe</SelectItem>
                            <SelectItem value="new_hire">Karyawan Baru</SelectItem>
                            <SelectItem value="resignation">Resign</SelectItem>
                            <SelectItem value="termination">Terminasi</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8" onClick={doExport}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Karyawan Baru</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_new_hires}</p><p className="text-xs text-muted-foreground mt-0.5">Bergabung di {fv.year}</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Keluar</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_separations}</p><p className="text-xs text-muted-foreground mt-0.5">{summary.resignations} resign  {summary.terminations} terminasi</p></div>
                    <div className="bg-card p-4">
                        <p className="text-xs text-muted-foreground">Perubahan Bersih</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">{summary.net_change > 0 ? '+' : ''}{summary.net_change}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            {summary.net_change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {summary.net_change >= 0 ? 'Pertumbuhan' : 'Penurunan'}
                        </p>
                    </div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Turnover Rate</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.turnover_rate}%</p><p className="text-xs text-muted-foreground mt-0.5">Avg {summary.avg_employees} karyawan</p></div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-3 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-3"><p className="text-xs text-muted-foreground">Voluntary Turnover</p><p className="text-xl font-bold tabular-nums mt-0.5">{summary.voluntary_turnover}%</p><p className="text-xs text-muted-foreground mt-0.5">{summary.resignations} resign</p></div>
                    <div className="bg-card p-3"><p className="text-xs text-muted-foreground">Involuntary Turnover</p><p className="text-xl font-bold tabular-nums mt-0.5">{summary.involuntary_turnover}%</p><p className="text-xs text-muted-foreground mt-0.5">{summary.terminations} terminasi</p></div>
                    <div className="bg-card p-3"><p className="text-xs text-muted-foreground">Rata-rata Karyawan</p><p className="text-xl font-bold tabular-nums mt-0.5">{summary.avg_employees}</p><p className="text-xs text-muted-foreground mt-0.5">Awal: {summary.employees_start_year}  Akhir: {summary.employees_end_year}</p></div>
                </div>

                {/* Monthly Chart */}
                <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Tren Bulanan</CardTitle>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-primary/60 rounded-sm inline-block" />Masuk</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-muted-foreground/40 rounded-sm inline-block" />Keluar</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="flex items-end justify-between gap-1 h-32">
                            {summary.monthly_data.map((m) => (
                                <div key={m.month_num} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="flex-1 w-full flex items-end gap-0.5">
                                        <div className="flex-1 bg-primary/60 rounded-t-sm" style={{ height: `${(m.new_hires / maxVal) * 100}%`, minHeight: m.new_hires > 0 ? '4px' : '2px' }} title={`Masuk: ${m.new_hires}`} />
                                        <div className="flex-1 bg-muted-foreground/40 rounded-t-sm" style={{ height: `${(m.separations / maxVal) * 100}%`, minHeight: m.separations > 0 ? '4px' : '2px' }} title={`Keluar: ${m.separations}`} />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{m.month}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* By Reason & Unit */}
                <div className="grid gap-4 md:grid-cols-2">
                    {Object.keys(summary.separations_by_reason).length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Alasan Keluar</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {Object.entries(summary.separations_by_reason).map(([reason, count]) => {
                                    const pct = summary.total_separations > 0 ? Math.round((count / summary.total_separations) * 100) : 0;
                                    return (
                                        <div key={reason}>
                                            <div className="flex justify-between mb-1"><span className="text-xs capitalize">{reason || 'Tidak Disebutkan'}</span><span className="text-xs text-muted-foreground tabular-nums">{count} ({pct}%)</span></div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                    {Object.keys(summary.separations_by_unit).length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Perbandingan per Unit</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 space-y-2">
                                {Object.entries(summary.separations_by_unit).map(([unit, separations]) => {
                                    const newHires = summary.new_hires_by_unit[unit] || 0;
                                    const net = newHires - separations;
                                    return (
                                        <div key={unit} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="text-xs font-medium truncate max-w-[160px]">{unit}</span>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>+{newHires} masuk</span>
                                                <span>-{separations} keluar</span>
                                                <span className="font-medium text-foreground">{net > 0 ? '+' : ''}{net}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Detail Data Turnover</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead><TableHead>Unit</TableHead><TableHead>Jabatan</TableHead>
                                    <TableHead>Tipe</TableHead><TableHead>Tanggal</TableHead><TableHead>Alasan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">Tidak ada data turnover</TableCell></TableRow>
                                ) : data.map((item) => {
                                    const ti = typeCfg[item.type];
                                    return (
                                        <TableRow key={`${item.id}-${item.type}`}>
                                            <TableCell><div className="font-medium text-sm">{item.name}</div><div className="text-xs text-muted-foreground">{item.employee_id}</div></TableCell>
                                            <TableCell className="text-sm">{item.unit || '-'}</TableCell>
                                            <TableCell className="text-sm">{item.job_category || '-'}</TableCell>
                                            <TableCell><Badge variant={ti.variant} className="text-xs">{ti.label}</Badge></TableCell>
                                            <TableCell className="text-sm">{format(new Date(item.date), 'd MMM yyyy', { locale: idLocale })}</TableCell>
                                            <TableCell className="max-w-[180px] truncate text-sm">{item.reason || '-'}</TableCell>
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
