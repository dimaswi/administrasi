import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Palmtree, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface LeaveItem {
    id: number;
    employee: { id: number; employee_id: string; name: string; unit: string | null; };
    leave_type: string | null; start_date: string; end_date: string;
    total_days: number; reason: string | null; status: string;
    approver: string | null; approved_at: string | null;
}
interface Unit { id: number; name: string; }
interface LeaveType { id: number; name: string; code: string; }
interface Summary {
    total_requests: number; approved: number; pending: number; rejected: number;
    total_days: number; by_type: Record<string, { count: number; days: number }>;
    by_month: Record<string, number>;
}
interface Props {
    leaves: LeaveItem[]; summary: Summary; units: Unit[]; leaveTypes: LeaveType[];
    filters: { year: number; month: string | null; unit_id: string | null; leave_type_id: string | null; status: string | null; };
}

const statusCfg: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'Menunggu', variant: 'secondary', icon: Clock },
    approved: { label: 'Disetujui', variant: 'default', icon: CheckCircle },
    rejected: { label: 'Ditolak', variant: 'destructive', icon: XCircle },
    cancelled: { label: 'Dibatalkan', variant: 'outline', icon: XCircle },
};
const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((l, i) => ({ value: String(i + 1), label: l }));

export default function LeaveReport({ leaves, summary, units, leaveTypes, filters }: Props) {
    const [fv, setFv] = useState({
        year: filters.year.toString(), month: filters.month || '',
        unit_id: filters.unit_id || '', leave_type_id: filters.leave_type_id || '', status: filters.status || '',
    });
    const set = (key: string, value: string) => {
        const nf = { ...fv, [key]: value }; setFv(nf);
        router.get('/hr/reports/leave', nf, { preserveState: true });
    };
    const nav = (d: 'prev' | 'next') => set('year', (parseInt(fv.year) + (d === 'next' ? 1 : -1)).toString());
    const doExport = () => {
        const p = new URLSearchParams();
        if (fv.year) p.append('year', fv.year); if (fv.month) p.append('month', fv.month);
        if (fv.unit_id) p.append('unit_id', fv.unit_id); if (fv.status) p.append('status', fv.status);
        window.location.href = `/hr/reports/leave/export?${p.toString()}`;
    };

    return (
        <HRLayout>
            <Head title="Laporan Cuti" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-4 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Laporan Cuti</h2>
                    <p className="text-sm text-muted-foreground">Statistik dan riwayat pengajuan cuti karyawan</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-0 border rounded-md overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('prev')}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <span className="text-sm font-semibold tabular-nums w-12 text-center border-x">{fv.year}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('next')}><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Select value={fv.month || '_all'} onValueChange={(v) => set('month', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Bulan</SelectItem>
                            {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={fv.unit_id || '_all'} onValueChange={(v) => set('unit_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Unit" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Unit</SelectItem>
                            {units.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={fv.leave_type_id || '_all'} onValueChange={(v) => set('leave_type_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Jenis</SelectItem>
                            {leaveTypes.map((lt) => <SelectItem key={lt.id} value={lt.id.toString()}>{lt.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={fv.status || '_all'} onValueChange={(v) => set('status', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Status</SelectItem>
                            <SelectItem value="pending">Menunggu</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8" onClick={doExport}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Pengajuan</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_requests}</p><p className="text-xs text-muted-foreground mt-0.5">Tahun {fv.year}</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Disetujui</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.approved}</p><p className="text-xs text-muted-foreground mt-0.5">{summary.total_requests > 0 ? Math.round((summary.approved / summary.total_requests) * 100) : 0}% dari total</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Menunggu</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.pending}</p><p className="text-xs text-muted-foreground mt-0.5">Perlu persetujuan</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Ditolak</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.rejected}</p><p className="text-xs text-muted-foreground mt-0.5">Tidak disetujui</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Hari</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_days}</p><p className="text-xs text-muted-foreground mt-0.5">Hari cuti diambil</p></div>
                </div>

                {Object.keys(summary.by_type).length > 0 && (
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-1.5"><Palmtree className="h-3.5 w-3.5 text-muted-foreground" />Ringkasan per Jenis Cuti</CardTitle></CardHeader>
                        <CardContent className="px-4 pb-4 space-y-3">
                            {Object.entries(summary.by_type).map(([type, data]) => {
                                const pct = summary.total_days > 0 ? Math.round((data.days / summary.total_days) * 100) : 0;
                                return (
                                    <div key={type}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs">{type}</span>
                                            <span className="text-xs text-muted-foreground tabular-nums">{data.days} hari  {data.count} pengajuan</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Detail Pengajuan Cuti</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead><TableHead>Unit</TableHead><TableHead>Jenis Cuti</TableHead>
                                    <TableHead>Tanggal</TableHead><TableHead className="text-center">Hari</TableHead>
                                    <TableHead>Alasan</TableHead><TableHead>Status</TableHead><TableHead>Disetujui Oleh</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-sm">Tidak ada data cuti</TableCell></TableRow>
                                ) : leaves.map((leave) => {
                                    const st = statusCfg[leave.status] || statusCfg.pending;
                                    const StIcon = st.icon;
                                    return (
                                        <TableRow key={leave.id}>
                                            <TableCell><div className="font-medium text-sm">{leave.employee.name}</div><div className="text-xs text-muted-foreground">{leave.employee.employee_id}</div></TableCell>
                                            <TableCell className="text-sm">{leave.employee.unit || '-'}</TableCell>
                                            <TableCell className="text-sm">{leave.leave_type || '-'}</TableCell>
                                            <TableCell className="text-sm">{format(new Date(leave.start_date), 'd MMM yyyy', { locale: idLocale })}  {format(new Date(leave.end_date), 'd MMM yyyy', { locale: idLocale })}</TableCell>
                                            <TableCell className="text-center font-medium text-sm">{leave.total_days}</TableCell>
                                            <TableCell className="max-w-[180px] truncate text-sm">{leave.reason || '-'}</TableCell>
                                            <TableCell><Badge variant={st.variant} className="gap-1 text-xs"><StIcon className="h-3 w-3" />{st.label}</Badge></TableCell>
                                            <TableCell className="text-sm">{leave.approver || '-'}</TableCell>
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
