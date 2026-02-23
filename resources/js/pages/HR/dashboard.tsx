import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, AlertTriangle, Briefcase, Building2, ArrowRight, Clock, CalendarDays, UserMinus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string | null;
    full_name: string;
    position: string | null;
    contract_end_date: string | null;
    job_category: { name: string } | null;
    organization_unit: { name: string } | null;
}

interface AttendanceChartData {
    date: string;
    day: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
}

interface MonthlyAttendance {
    workDays: number;
    totalExpected: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    attendanceRate: number;
    lateRate: number;
}

interface LeaveStats {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

interface TurnoverData {
    month: string;
    monthShort: string;
    newHires: number;
    exits: number;
    totalActive: number;
}

interface Props {
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        newEmployeesThisMonth: number;
    };
    employeesByCategory: Array<{ name: string; count: number }>;
    employeesByStatus: Array<{ name: string; count: number }>;
    employeesByUnit: Array<{ name: string; count: number }>;
    contractsExpiringSoon: Employee[];
    recentEmployees: Employee[];
    attendanceChart: AttendanceChartData[];
    monthlyAttendance: MonthlyAttendance;
    leaveStats: LeaveStats;
    turnoverChart: TurnoverData[];
}

export default function HRDashboard({
    stats,
    employeesByCategory,
    employeesByStatus,
    employeesByUnit,
    contractsExpiringSoon,
    recentEmployees,
    attendanceChart = [],
    monthlyAttendance,
    leaveStats,
    turnoverChart = [],
}: Props) {
    const getDaysUntilExpiry = (dateString: string) => {
        const today = new Date();
        const expiryDate = new Date(dateString);
        const diffTime = expiryDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <HRLayout>
            <Head title="Dashboard HR" />
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-0">
                    <div>
                        <h1 className="text-xl font-semibold">Dashboard HR</h1>
                        <p className="text-sm text-muted-foreground">Overview data karyawan dan statistik HR</p>
                    </div>
                    <Button size="sm" asChild>
                        <Link href="/hr/employees/create">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tambah Karyawan
                        </Link>
                    </Button>
                </div>

                {/* Compact Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                    <div className="bg-card p-4">
                        <p className="text-xs text-muted-foreground">Total Karyawan</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">{stats.totalEmployees}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stats.activeEmployees} aktif · {Math.round((stats.activeEmployees / stats.totalEmployees) * 100) || 0}%</p>
                    </div>
                    <div className="bg-card p-4">
                        <p className="text-xs text-muted-foreground">Karyawan Baru</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">{stats.newEmployeesThisMonth}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Bergabung bulan ini</p>
                    </div>
                    <div className="bg-card p-4">
                        <p className="text-xs text-muted-foreground">Kontrak Habis</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">{contractsExpiringSoon.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Dalam 30 hari ke depan</p>
                    </div>
                    <div className="bg-card p-4">
                        <p className="text-xs text-muted-foreground">Tingkat Kehadiran</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">{monthlyAttendance?.attendanceRate || 0}%</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{monthlyAttendance?.workDays || 0} hari kerja bulan ini</p>
                    </div>
                </div>

                {/* Distribution Cards */}
                <div className="grid gap-3 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                Kategori Pekerjaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2.5">
                            {employeesByCategory.length > 0 ? (
                                employeesByCategory.map((cat) => {
                                    const pct = stats.totalEmployees > 0 ? Math.round((cat.count / stats.totalEmployees) * 100) : 0;
                                    return (
                                        <div key={cat.name}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-medium">{cat.name}</span>
                                                <span className="text-muted-foreground">{cat.count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                Status Kepegawaian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2.5">
                            {employeesByStatus.length > 0 ? (
                                employeesByStatus.map((status) => {
                                    const pct = stats.totalEmployees > 0 ? Math.round((status.count / stats.totalEmployees) * 100) : 0;
                                    return (
                                        <div key={status.name}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-medium">{status.name}</span>
                                                <span className="text-muted-foreground">{status.count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                Unit Organisasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2.5">
                            {employeesByUnit.length > 0 ? (
                                employeesByUnit.slice(0, 5).map((unit) => {
                                    const pct = stats.totalEmployees > 0 ? Math.round((unit.count / stats.totalEmployees) * 100) : 0;
                                    return (
                                        <div key={unit.name}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-medium truncate max-w-[150px]">{unit.name}</span>
                                                <span className="text-muted-foreground">{unit.count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Contracts + Recent Employees */}
                <div className="grid gap-3 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm">Kontrak Segera Habis</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {contractsExpiringSoon.length > 0 ? (
                                <div className="space-y-2">
                                    {contractsExpiringSoon.slice(0, 5).map((employee) => (
                                        <div key={employee.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <p className="text-sm font-medium">{employee.full_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {employee.job_category?.name}  {employee.employee_id}
                                                </p>
                                            </div>
                                            <Badge variant={getDaysUntilExpiry(employee.contract_end_date!) <= 7 ? 'destructive' : 'outline'}>
                                                {getDaysUntilExpiry(employee.contract_end_date!)} hari
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Tidak ada kontrak yang akan segera berakhir</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm">Karyawan Terbaru</CardTitle>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <Link href="/hr/employees">
                                    Lihat Semua
                                    <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {recentEmployees.length > 0 ? (
                                <div className="space-y-2">
                                    {recentEmployees.map((employee) => (
                                        <div key={employee.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <p className="text-sm font-medium">{employee.full_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {employee.job_category?.name}  {employee.position || '-'}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{employee.employee_id}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Belum ada karyawan</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Chart + Monthly Summary */}
                <div className="grid gap-3 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                Kehadiran 7 Hari Terakhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {attendanceChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={attendanceChart}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '6px',
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Bar dataKey="present" name="Hadir" fill="#22c55e" stackId="a" />
                                        <Bar dataKey="late" name="Terlambat" fill="#f59e0b" stackId="a" />
                                        <Bar dataKey="absent" name="Absen" fill="#ef4444" stackId="a" />
                                        <Bar dataKey="leave" name="Cuti" fill="#94a3b8" stackId="a" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                                    Belum ada data kehadiran
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                Ringkasan Kehadiran Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {monthlyAttendance ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tingkat Kehadiran</p>
                                            <p className="text-2xl font-bold tabular-nums">{monthlyAttendance.attendanceRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tingkat Keterlambatan</p>
                                            <p className="text-2xl font-bold tabular-nums">{monthlyAttendance.lateRate}%</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                                        <div className="text-center p-2 rounded border">
                                            <p className="text-base font-bold tabular-nums">{monthlyAttendance.present}</p>
                                            <p className="text-xs text-muted-foreground">Hadir</p>
                                        </div>
                                        <div className="text-center p-2 rounded border">
                                            <p className="text-base font-bold tabular-nums">{monthlyAttendance.late}</p>
                                            <p className="text-xs text-muted-foreground">Terlambat</p>
                                        </div>
                                        <div className="text-center p-2 rounded border">
                                            <p className="text-base font-bold tabular-nums">{monthlyAttendance.absent}</p>
                                            <p className="text-xs text-muted-foreground">Absen</p>
                                        </div>
                                        <div className="text-center p-2 rounded border">
                                            <p className="text-base font-bold tabular-nums">{monthlyAttendance.leave}</p>
                                            <p className="text-xs text-muted-foreground">Cuti</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">Total {monthlyAttendance.workDays} hari kerja bulan ini</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                                    Belum ada data kehadiran
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Leave Stats + Turnover Chart */}
                <div className="grid gap-3 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                Status Cuti Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {leaveStats ? (
                                <div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 rounded border">
                                            <p className="text-xl font-bold tabular-nums">{leaveStats.pending}</p>
                                            <p className="text-xs text-muted-foreground">Pending</p>
                                        </div>
                                        <div className="p-2 rounded border">
                                            <p className="text-xl font-bold tabular-nums">{leaveStats.approved}</p>
                                            <p className="text-xs text-muted-foreground">Disetujui</p>
                                        </div>
                                        <div className="p-2 rounded border">
                                            <p className="text-xl font-bold tabular-nums">{leaveStats.rejected}</p>
                                            <p className="text-xs text-muted-foreground">Ditolak</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center mt-2">Total {leaveStats.total} pengajuan</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">Belum ada data</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                                Turnover Karyawan 12 Bulan Terakhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {turnoverChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={turnoverChart}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="monthShort" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '6px',
                                            }}
                                            labelFormatter={(label) => {
                                                const item = turnoverChart.find((t) => t.monthShort === label);
                                                return item?.month || label;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Line type="monotone" dataKey="newHires" name="Karyawan Baru" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                                        <Line type="monotone" dataKey="exits" name="Keluar" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                                    Belum ada data turnover
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HRLayout>
    );
}
