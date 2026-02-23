import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Download, Building, Users, ChevronLeft, ChevronRight, Palmtree, GraduationCap, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useState } from 'react';

interface EmployeeItem {
    id: number; employee_id: string; name: string; unit: string | null;
    job_category: string | null; employment_status: string | null; status: string;
    join_date: string | null; attendance_count: number; leave_count: number;
    total_leave_days: number; training_count: number; review_count: number;
}
interface Unit { id: number; name: string; }
interface Summary { total_employees: number; by_unit: Record<string, number>; by_status: Record<string, number>; }
interface Props {
    employees: EmployeeItem[]; summary: Summary; units: Unit[];
    filters: { year: number; unit_id: string | null; status: string | null; };
}
const statusLabels: Record<string, string> = { active: 'Aktif', inactive: 'Non-Aktif', resigned: 'Resign' };

export default function EmployeeReport({ employees, summary, units, filters }: Props) {
    const [fv, setFv] = useState({
        year: filters.year.toString(), unit_id: filters.unit_id || '', status: filters.status || '',
    });
    const set = (key: string, value: string) => {
        const nf = { ...fv, [key]: value }; setFv(nf);
        router.get('/hr/reports/employee', nf, { preserveState: true });
    };
    const nav = (d: 'prev' | 'next') => set('year', (parseInt(fv.year) + (d === 'next' ? 1 : -1)).toString());
    const doExport = () => {
        const p = new URLSearchParams();
        if (fv.year) p.append('year', fv.year);
        if (fv.unit_id) p.append('unit_id', fv.unit_id);
        if (fv.status) p.append('status', fv.status);
        window.location.href = `/hr/reports/employee/export?${p.toString()}`;
    };
    const totalAttendance = employees.reduce((s, e) => s + (Number(e.attendance_count) || 0), 0);
    const totalLeaveDays = employees.reduce((s, e) => s + (Number(e.total_leave_days) || 0), 0);
    const totalTraining = employees.reduce((s, e) => s + (Number(e.training_count) || 0), 0);

    return (
        <HRLayout>
            <Head title="Laporan Karyawan" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-4 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Laporan Karyawan</h2>
                    <p className="text-sm text-muted-foreground">Ringkasan data karyawan dan aktivitas tahunan</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-0 border rounded-md overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('prev')}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <span className="text-sm font-semibold tabular-nums w-12 text-center border-x">{fv.year}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => nav('next')}><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Select value={fv.unit_id || '_all'} onValueChange={(v) => set('unit_id', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Semua Unit" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Unit</SelectItem>
                            {units.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={fv.status || '_all'} onValueChange={(v) => set('status', v === '_all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Status</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Non-Aktif</SelectItem>
                            <SelectItem value="resigned">Resign</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8" onClick={doExport}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Karyawan</p><p className="text-2xl font-bold tabular-nums mt-0.5">{summary.total_employees}</p><p className="text-xs text-muted-foreground mt-0.5">Tahun {fv.year}</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Kehadiran</p><p className="text-2xl font-bold tabular-nums mt-0.5">{totalAttendance}</p><p className="text-xs text-muted-foreground mt-0.5">Akumulasi semua karyawan</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Hari Cuti</p><p className="text-2xl font-bold tabular-nums mt-0.5">{totalLeaveDays}</p><p className="text-xs text-muted-foreground mt-0.5">Hari cuti diambil</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Total Training</p><p className="text-2xl font-bold tabular-nums mt-0.5">{totalTraining}</p><p className="text-xs text-muted-foreground mt-0.5">Pelatihan diikuti</p></div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {Object.keys(summary.by_unit).length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-muted-foreground" />Distribusi per Unit</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {Object.entries(summary.by_unit).map(([unit, count]) => {
                                    const pct = summary.total_employees > 0 ? Math.round((count / summary.total_employees) * 100) : 0;
                                    return (
                                        <div key={unit}>
                                            <div className="flex justify-between mb-1"><span className="text-xs truncate max-w-[200px]">{unit || 'Tanpa Unit'}</span><span className="text-xs text-muted-foreground tabular-nums">{count} ({pct}%)</span></div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                    {Object.keys(summary.by_status).length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" />Distribusi per Status</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {Object.entries(summary.by_status).map(([status, count]) => {
                                    const pct = summary.total_employees > 0 ? Math.round((count / summary.total_employees) * 100) : 0;
                                    return (
                                        <div key={status}>
                                            <div className="flex justify-between mb-1"><span className="text-xs">{statusLabels[status] || status}</span><span className="text-xs text-muted-foreground tabular-nums">{count} ({pct}%)</span></div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Detail Karyawan</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NIP</TableHead><TableHead>Nama</TableHead><TableHead>Unit</TableHead>
                                    <TableHead>Jabatan</TableHead><TableHead>Status Kerja</TableHead><TableHead>Status</TableHead>
                                    <TableHead>Tgl. Masuk</TableHead>
                                    <TableHead className="text-center"><Calendar className="h-3.5 w-3.5 inline mr-1" />Hadir</TableHead>
                                    <TableHead className="text-center"><Palmtree className="h-3.5 w-3.5 inline mr-1" />Cuti</TableHead>
                                    <TableHead className="text-center"><GraduationCap className="h-3.5 w-3.5 inline mr-1" />Training</TableHead>
                                    <TableHead className="text-center"><Target className="h-3.5 w-3.5 inline mr-1" />Review</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8 text-sm">Tidak ada data karyawan</TableCell></TableRow>
                                ) : employees.map((emp) => (
                                    <TableRow key={emp.id} className={emp.status !== 'active' ? 'opacity-60' : ''}>
                                        <TableCell className="font-mono text-xs">{emp.employee_id}</TableCell>
                                        <TableCell className="font-medium text-sm">{emp.name}</TableCell>
                                        <TableCell className="text-sm">{emp.unit || '-'}</TableCell>
                                        <TableCell className="text-sm">{emp.job_category || '-'}</TableCell>
                                        <TableCell className="text-sm">{emp.employment_status || '-'}</TableCell>
                                        <TableCell className="text-sm">{statusLabels[emp.status] || emp.status}</TableCell>
                                        <TableCell className="text-sm">{emp.join_date ? format(new Date(emp.join_date), 'd MMM yyyy', { locale: idLocale }) : '-'}</TableCell>
                                        <TableCell className="text-center text-sm">{emp.attendance_count}</TableCell>
                                        <TableCell className="text-center text-sm">{emp.leave_count} ({emp.total_leave_days}h)</TableCell>
                                        <TableCell className="text-center text-sm">{emp.training_count}</TableCell>
                                        <TableCell className="text-center text-sm">{emp.review_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </HRLayout>
    );
}
