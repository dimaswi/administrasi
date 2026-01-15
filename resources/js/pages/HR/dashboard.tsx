import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, AlertTriangle, TrendingUp, Briefcase, Building2, ArrowRight, Clock, CalendarDays, UserMinus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

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
    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Dashboard', href: '/hr' },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDaysUntilExpiry = (dateString: string) => {
        const today = new Date();
        const expiryDate = new Date(dateString);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Colors for charts
    const ATTENDANCE_COLORS = {
        present: '#22c55e',
        late: '#f59e0b',
        absent: '#ef4444',
        leave: '#3b82f6',
    };

    const LEAVE_COLORS = ['#f59e0b', '#22c55e', '#ef4444'];

    const leaveChartData = leaveStats ? [
        { name: 'Pending', value: leaveStats.pending, color: '#f59e0b' },
        { name: 'Disetujui', value: leaveStats.approved, color: '#22c55e' },
        { name: 'Ditolak', value: leaveStats.rejected, color: '#ef4444' },
    ].filter(item => item.value > 0) : [];

    return (
        <HRLayout>
            <Head title="Dashboard HR" />

            <div className="h-[calc(100vh-7rem)] overflow-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard HR</h1>
                        <p className="text-muted-foreground">
                            Overview data karyawan dan statistik HR
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/hr/employees/create">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tambah Karyawan
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards - Enhanced Design */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Karyawan</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">{stats.totalEmployees}</span>
                                        <span className="text-sm text-muted-foreground">orang</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                            {stats.activeEmployees} aktif
                                        </span>
                                        <span className="text-muted-foreground">
                                            ({Math.round((stats.activeEmployees / stats.totalEmployees) * 100) || 0}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Karyawan Baru</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">{stats.newEmployeesThisMonth}</span>
                                        <span className="text-sm text-muted-foreground">orang</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Bergabung bulan ini
                                    </p>
                                </div>
                                <div className="p-3 bg-green-500/10 rounded-xl">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Kontrak Habis</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">{contractsExpiringSoon.length}</span>
                                        <span className="text-sm text-muted-foreground">karyawan</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Dalam 30 hari ke depan
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-500/10 rounded-xl">
                                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">{monthlyAttendance?.attendanceRate || 0}</span>
                                        <span className="text-sm text-muted-foreground">%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Bulan ini dari {monthlyAttendance?.workDays || 0} hari kerja
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <CalendarDays className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Employees by Category */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Briefcase className="h-4 w-4 text-blue-600" />
                                </div>
                                Kategori Pekerjaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {employeesByCategory.length > 0 ? (
                                    employeesByCategory.map((cat) => {
                                        const percentage = stats.totalEmployees > 0 ? Math.round((cat.count / stats.totalEmployees) * 100) : 0;
                                        return (
                                            <div key={cat.name} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{cat.name}</span>
                                                    <span className="text-sm text-muted-foreground">{cat.count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-500 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employees by Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Users className="h-4 w-4 text-green-600" />
                                </div>
                                Status Kepegawaian
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {employeesByStatus.length > 0 ? (
                                    employeesByStatus.map((status, index) => {
                                        const percentage = stats.totalEmployees > 0 ? Math.round((status.count / stats.totalEmployees) * 100) : 0;
                                        const colors = ['bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
                                        return (
                                            <div key={status.name} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{status.name}</span>
                                                    <span className="text-sm text-muted-foreground">{status.count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employees by Unit */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Building2 className="h-4 w-4 text-purple-600" />
                                </div>
                                Unit Organisasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {employeesByUnit.length > 0 ? (
                                    employeesByUnit.slice(0, 5).map((unit, index) => {
                                        const percentage = stats.totalEmployees > 0 ? Math.round((unit.count / stats.totalEmployees) * 100) : 0;
                                        const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500'];
                                        return (
                                            <div key={unit.name} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium truncate max-w-[150px]">{unit.name}</span>
                                                    <span className="text-sm text-muted-foreground">{unit.count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Contracts Expiring Soon */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Kontrak Segera Habis</CardTitle>
                                <CardDescription>Kontrak berakhir dalam 30 hari</CardDescription>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            {contractsExpiringSoon.length > 0 ? (
                                <div className="space-y-3">
                                    {contractsExpiringSoon.slice(0, 5).map((employee) => (
                                        <div key={employee.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{employee.full_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {employee.job_category?.name} • {employee.employee_id}
                                                </p>
                                            </div>
                                            <Badge variant={getDaysUntilExpiry(employee.contract_end_date!) <= 7 ? 'destructive' : 'outline'}>
                                                {getDaysUntilExpiry(employee.contract_end_date!)} hari
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada kontrak yang akan segera berakhir</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Employees */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Karyawan Terbaru</CardTitle>
                                <CardDescription>Karyawan yang baru ditambahkan</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/hr/employees">
                                    Lihat Semua
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentEmployees.length > 0 ? (
                                <div className="space-y-3">
                                    {recentEmployees.map((employee) => (
                                        <div key={employee.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{employee.full_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {employee.job_category?.name} • {employee.position || '-'}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{employee.employee_id}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada karyawan</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Chart Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Daily Attendance Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Kehadiran 7 Hari Terakhir
                            </CardTitle>
                            <CardDescription>Statistik kehadiran karyawan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendanceChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={attendanceChart}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis 
                                            dataKey="day" 
                                            tick={{ fontSize: 12 }} 
                                            className="text-muted-foreground"
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="present" name="Hadir" fill={ATTENDANCE_COLORS.present} stackId="a" />
                                        <Bar dataKey="late" name="Terlambat" fill={ATTENDANCE_COLORS.late} stackId="a" />
                                        <Bar dataKey="absent" name="Absen" fill={ATTENDANCE_COLORS.absent} stackId="a" />
                                        <Bar dataKey="leave" name="Cuti" fill={ATTENDANCE_COLORS.leave} stackId="a" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                    Belum ada data kehadiran
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Attendance Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Ringkasan Kehadiran Bulan Ini
                            </CardTitle>
                            <CardDescription>Statistik kehadiran bulan berjalan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {monthlyAttendance ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Tingkat Kehadiran</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {monthlyAttendance.attendanceRate}%
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Tingkat Keterlambatan</p>
                                            <p className="text-2xl font-bold text-amber-600">
                                                {monthlyAttendance.lateRate}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 pt-4 border-t">
                                        <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                                            <p className="text-lg font-bold text-green-600">{monthlyAttendance.present}</p>
                                            <p className="text-xs text-muted-foreground">Hadir</p>
                                        </div>
                                        <div className="text-center p-2 bg-amber-50 dark:bg-amber-950 rounded">
                                            <p className="text-lg font-bold text-amber-600">{monthlyAttendance.late}</p>
                                            <p className="text-xs text-muted-foreground">Terlambat</p>
                                        </div>
                                        <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
                                            <p className="text-lg font-bold text-red-600">{monthlyAttendance.absent}</p>
                                            <p className="text-xs text-muted-foreground">Absen</p>
                                        </div>
                                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                            <p className="text-lg font-bold text-blue-600">{monthlyAttendance.leave}</p>
                                            <p className="text-xs text-muted-foreground">Cuti</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-center pt-2">
                                        Total {monthlyAttendance.workDays} hari kerja bulan ini
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                    Belum ada data kehadiran
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Leave Stats and Turnover Chart */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Leave Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Status Cuti Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {leaveStats ? (
                                <div className="space-y-4">
                                    {leaveChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={150}>
                                            <PieChart>
                                                <Pie
                                                    data={leaveChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={60}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {leaveChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">
                                            Tidak ada data cuti
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-amber-600">{leaveStats.pending}</p>
                                            <p className="text-xs text-muted-foreground">Pending</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-green-600">{leaveStats.approved}</p>
                                            <p className="text-xs text-muted-foreground">Disetujui</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-red-600">{leaveStats.rejected}</p>
                                            <p className="text-xs text-muted-foreground">Ditolak</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                    Belum ada data cuti
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Turnover Chart */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserMinus className="h-5 w-5" />
                                Turnover Karyawan 12 Bulan Terakhir
                            </CardTitle>
                            <CardDescription>Trend masuk dan keluar karyawan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {turnoverChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={turnoverChart}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis 
                                            dataKey="monthShort" 
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                            labelFormatter={(label) => {
                                                const item = turnoverChart.find(t => t.monthShort === label);
                                                return item?.month || label;
                                            }}
                                        />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="newHires" 
                                            name="Karyawan Baru"
                                            stroke="#22c55e" 
                                            strokeWidth={2}
                                            dot={{ fill: '#22c55e', r: 4 }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="exits" 
                                            name="Keluar"
                                            stroke="#ef4444" 
                                            strokeWidth={2}
                                            dot={{ fill: '#ef4444', r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
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
