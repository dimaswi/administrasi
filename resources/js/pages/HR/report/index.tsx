import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Card, CardContent } from '@/components/ui/card';
import {
    Users,
    Calendar,
    GraduationCap,
    TrendingUp,
    ArrowRight,
    Palmtree,
    UserMinus,
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
    },
    {
        title: 'Laporan Kehadiran',
        description: 'Rekap kehadiran bulanan per karyawan',
        icon: Calendar,
        href: '/hr/attendances/report',
    },
    {
        title: 'Laporan Cuti',
        description: 'Statistik pengajuan cuti dan izin karyawan',
        icon: Palmtree,
        href: '/hr/reports/leave',
    },
    {
        title: 'Laporan Training',
        description: 'Riwayat dan statistik pelatihan karyawan',
        icon: GraduationCap,
        href: '/hr/reports/training',
    },
    {
        title: 'Laporan Kinerja',
        description: 'Hasil penilaian kinerja per periode',
        icon: TrendingUp,
        href: '/hr/reports/performance',
    },
    {
        title: 'Laporan Turnover',
        description: 'Analisis keluar masuk karyawan',
        icon: UserMinus,
        href: '/hr/reports/turnover',
    },
];

export default function ReportIndex({ stats }: Props) {
    return (
        <HRLayout>
            <Head title="Laporan HR" />

            <div className="h-[calc(100vh-7rem)] overflow-auto">
                <div className="space-y-4">
                    {/* Header + Quick Stats */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold">Laporan HR</h1>
                            <p className="text-sm text-muted-foreground">Akses berbagai laporan dan statistik HR</p>
                        </div>
                        <div className="flex gap-3 text-right">
                            <div>
                                <p className="text-lg font-bold tabular-nums">{stats.total_employees}</p>
                                <p className="text-xs text-muted-foreground">Karyawan</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold tabular-nums">{stats.leaves_this_month}</p>
                                <p className="text-xs text-muted-foreground">Cuti Bulan Ini</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold tabular-nums">{stats.trainings_this_month}</p>
                                <p className="text-xs text-muted-foreground">Training Bulan Ini</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold tabular-nums">{stats.reviews_active}</p>
                                <p className="text-xs text-muted-foreground">Review Aktif</p>
                            </div>
                        </div>
                    </div>

                    {/* Report List */}
                    <div className="grid gap-2">
                        {reports.map((report) => (
                            <Link key={report.href} href={report.href}>
                                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <report.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{report.title}</p>
                                            <p className="text-xs text-muted-foreground">{report.description}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}
