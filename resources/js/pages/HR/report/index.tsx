import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    Calendar,
    GraduationCap,
    TrendingUp,
    FileText,
    ArrowRight,
    Palmtree,
} from 'lucide-react';

interface Props {
    stats: {
        total_employees: number;
        leaves_this_month: number;
        trainings_this_month: number;
        reviews_active: number;
    };
}

const reports = [
    {
        title: 'Laporan Karyawan',
        description: 'Ringkasan data karyawan berdasarkan unit, jabatan, dan status',
        icon: Users,
        href: '/hr/reports/employee',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
        title: 'Laporan Kehadiran',
        description: 'Rekap kehadiran bulanan per karyawan',
        icon: Calendar,
        href: '/hr/attendances/report',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
        title: 'Laporan Cuti',
        description: 'Statistik pengajuan cuti dan izin karyawan',
        icon: Palmtree,
        href: '/hr/reports/leave',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
        title: 'Laporan Training',
        description: 'Riwayat dan statistik pelatihan karyawan',
        icon: GraduationCap,
        href: '/hr/reports/training',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
        title: 'Laporan Kinerja',
        description: 'Hasil penilaian kinerja per periode',
        icon: TrendingUp,
        href: '/hr/reports/performance',
        color: 'text-pink-500',
        bgColor: 'bg-pink-50 dark:bg-pink-950',
    },
];

export default function ReportIndex({ stats }: Props) {
    return (
        <HRLayout>
            <Head title="Laporan HR" />
            
            <div className="h-[calc(100vh-7rem)] overflow-auto">
                <div className="space-y-6 p-1">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan HR</h1>
                        <p className="text-muted-foreground">
                            Akses berbagai laporan dan statistik HR
                        </p>
                    </div>

                    {/* Quick Stats - Enhanced Design */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                            <CardContent className="p-5 relative">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Karyawan Aktif</p>
                                        <p className="text-3xl font-bold">{stats.total_employees}</p>
                                        <p className="text-xs text-muted-foreground">Total saat ini</p>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                            <CardContent className="p-5 relative">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Cuti Bulan Ini</p>
                                        <p className="text-3xl font-bold">{stats.leaves_this_month}</p>
                                        <p className="text-xs text-muted-foreground">Pengajuan disetujui</p>
                                    </div>
                                    <div className="p-3 bg-orange-500/10 rounded-xl">
                                        <Palmtree className="h-5 w-5 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                            <CardContent className="p-5 relative">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Training Bulan Ini</p>
                                        <p className="text-3xl font-bold">{stats.trainings_this_month}</p>
                                        <p className="text-xs text-muted-foreground">Pelatihan berlangsung</p>
                                    </div>
                                    <div className="p-3 bg-purple-500/10 rounded-xl">
                                        <GraduationCap className="h-5 w-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                            <CardContent className="p-5 relative">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Review Aktif</p>
                                        <p className="text-3xl font-bold">{stats.reviews_active}</p>
                                        <p className="text-xs text-muted-foreground">Penilaian sedang berjalan</p>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-xl">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Report Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map((report) => (
                            <Card key={report.href} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${report.bgColor}`}>
                                            <report.icon className={`h-6 w-6 ${report.color}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{report.title}</CardTitle>
                                            <CardDescription>{report.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href={report.href}>
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}
