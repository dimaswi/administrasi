import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Edit, 
    Trash2, 
    Star,
    Play,
    Lock,
    Users,
    Target,
    CheckCircle,
    Clock,
} from 'lucide-react';

interface PeriodData {
    id: number;
    name: string;
    type: string;
    type_label: string;
    start_date: string;
    end_date: string;
    start_date_formatted: string;
    end_date_formatted: string;
    status: string;
    status_label: string;
    description: string | null;
    is_current: boolean;
    reviews_count: number;
    completed_reviews_count: number;
    in_progress_reviews_count: number;
    goals_count: number;
    completed_goals_count: number;
}

interface Props {
    period: PeriodData;
}

export default function Show({ period }: Props) {
    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus periode ini?')) {
            router.delete(route('hr.performance-periods.destroy', period.id));
        }
    };

    const handleSetCurrent = () => {
        router.post(route('hr.performance-periods.set-current', period.id));
    };

    const handleActivate = () => {
        router.post(route('hr.performance-periods.activate', period.id));
    };

    const handleClose = () => {
        if (confirm('Apakah Anda yakin ingin menutup periode ini? Setelah ditutup, tidak ada penilaian baru yang dapat dibuat.')) {
            router.post(route('hr.performance-periods.close', period.id));
        }
    };

    const getStatusBadge = () => {
        const variants: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-700',
            'active': 'bg-green-100 text-green-700',
            'closed': 'bg-blue-100 text-blue-700',
        };
        return (
            <Badge className={variants[period.status] || ''}>
                {period.status_label}
            </Badge>
        );
    };

    return (
        <HRLayout>
            <Head title={`Periode: ${period.name}`} />

            <div className="pt-6">
                <DetailPage
                    title={period.name}
                    description="Detail periode penilaian kinerja"
                    backUrl={route('hr.performance-periods.index')}
                    actions={
                        <div className="flex items-center gap-2">
                            {!period.is_current && period.status === 'active' && (
                                <Button variant="outline" onClick={handleSetCurrent}>
                                    <Star className="w-4 h-4 mr-2" />
                                    Jadikan Aktif
                                </Button>
                            )}
                            {period.status === 'draft' && (
                                <Button variant="outline" onClick={handleActivate}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Aktifkan
                                </Button>
                            )}
                            {period.status === 'active' && (
                                <Button variant="outline" onClick={handleClose}>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Tutup Periode
                                </Button>
                            )}
                            <Button variant="outline" asChild>
                                <Link href={route('hr.performance-periods.edit', period.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                            {period.reviews_count === 0 && (
                                <Button variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                </Button>
                            )}
                        </div>
                    }
                >
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Total Penilaian</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{period.reviews_count}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Selesai</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{period.completed_reviews_count}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Dalam Proses</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{period.in_progress_reviews_count}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                                <Target className="w-4 h-4" />
                                <span className="text-sm">Goals ({period.completed_goals_count}/{period.goals_count})</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                {period.goals_count > 0 ? Math.round((period.completed_goals_count / period.goals_count) * 100) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg border-b pb-2 mb-4">Informasi Periode</h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                    <dt className="text-muted-foreground">Nama Periode</dt>
                                    <dd className="font-medium flex items-center gap-2">
                                        {period.name}
                                        {period.is_current && (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                <Star className="w-3 h-3 mr-1" />
                                                Periode Aktif
                                            </Badge>
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                    <dt className="text-muted-foreground">Tipe</dt>
                                    <dd className="font-medium">
                                        <Badge variant="outline">{period.type_label}</Badge>
                                    </dd>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                    <dt className="text-muted-foreground">Periode</dt>
                                    <dd className="font-medium">{period.start_date_formatted} - {period.end_date_formatted}</dd>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                    <dt className="text-muted-foreground">Status</dt>
                                    <dd>{getStatusBadge()}</dd>
                                </div>
                                {period.description && (
                                    <div className="py-2">
                                        <dt className="text-muted-foreground mb-2">Deskripsi</dt>
                                        <dd className="text-sm">{period.description}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Quick Actions */}
                        {period.status === 'active' && (
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Aksi Cepat</h3>
                                <div className="flex gap-2">
                                    <Button asChild>
                                        <Link href={route('hr.performance-reviews.create', { period_id: period.id })}>
                                            Buat Penilaian Baru
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={route('hr.performance-reviews.index', { period_id: period.id })}>
                                            Lihat Semua Penilaian
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DetailPage>
            </div>
        </HRLayout>
    );
}
