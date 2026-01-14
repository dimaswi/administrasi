import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EmploymentStatus {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_permanent: boolean;
    is_active: boolean;
    employees_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    employmentStatus: EmploymentStatus;
}

export default function Show({ employmentStatus }: Props) {
    const breadcrumbs = [
        { title: <FileText className="h-4 w-4" />, href: '/hr/employment-statuses' },
        { title: employmentStatus.name, href: `/hr/employment-statuses/${employmentStatus.id}` },
    ];

    const handleDelete = () => {
        router.delete(`/hr/employment-statuses/${employmentStatus.id}`, {
            onError: () => toast.error('Gagal menghapus status'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Detail ${employmentStatus.name}`} />

            <DetailPage
                title={employmentStatus.name}
                description={`Kode: ${employmentStatus.code}`}
                backUrl="/hr/employment-statuses"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/hr/employment-statuses/${employmentStatus.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Status?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus status "{employmentStatus.name}"? 
                                        Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>
                                        Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <Badge variant={employmentStatus.is_active ? 'default' : 'secondary'}>
                            {employmentStatus.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        {employmentStatus.is_permanent && (
                            <Badge variant="outline" className="gap-1">
                                <UserCheck className="h-3 w-3" />
                                Pegawai Tetap
                            </Badge>
                        )}
                    </div>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Kode Status</p>
                            <p className="font-medium">{employmentStatus.code}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Nama Status</p>
                            <p className="font-medium">{employmentStatus.name}</p>
                        </div>
                    </div>

                    {employmentStatus.description && (
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Deskripsi</p>
                            <p>{employmentStatus.description}</p>
                        </div>
                    )}

                    {/* Type Info */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Jenis Kepegawaian</h4>
                        <p className="text-sm">
                            {employmentStatus.is_permanent 
                                ? 'Status ini untuk pegawai tetap (tidak memiliki masa kontrak)'
                                : 'Status ini untuk pegawai kontrak/tidak tetap'
                            }
                        </p>
                    </div>

                    {/* Statistics */}
                    {employmentStatus.employees_count !== undefined && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Statistik</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Jumlah Karyawan</p>
                                    <p className="font-medium">{employmentStatus.employees_count} orang</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Dibuat pada</p>
                                <p>{new Date(employmentStatus.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Diperbarui pada</p>
                                <p>{new Date(employmentStatus.updated_at).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
