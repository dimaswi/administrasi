import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Edit, Trash2 } from 'lucide-react';
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

interface EducationLevel {
    id: number;
    code: string;
    name: string;
    level: number;
    is_active: boolean;
    employees_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    educationLevel: EducationLevel;
}

export default function Show({ educationLevel }: Props) {
    const breadcrumbs = [
        { title: <GraduationCap className="h-4 w-4" />, href: '/hr/education-levels' },
        { title: educationLevel.name, href: `/hr/education-levels/${educationLevel.id}` },
    ];

    const handleDelete = () => {
        router.delete(`/hr/education-levels/${educationLevel.id}`, {
            onError: () => toast.error('Gagal menghapus jenjang'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Detail ${educationLevel.name}`} />

            <DetailPage
                title={educationLevel.name}
                description={`Kode: ${educationLevel.code}`}
                backUrl="/hr/education-levels"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/hr/education-levels/${educationLevel.id}/edit`}>
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
                                    <AlertDialogTitle>Hapus Jenjang?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus jenjang "{educationLevel.name}"? 
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
                        <Badge variant={educationLevel.is_active ? 'default' : 'secondary'}>
                            {educationLevel.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    </div>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Kode Jenjang</p>
                            <p className="font-medium">{educationLevel.code}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Nama Jenjang</p>
                            <p className="font-medium">{educationLevel.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Tingkat</p>
                            <p className="font-medium">{educationLevel.level}</p>
                        </div>
                    </div>

                    {/* Statistics */}
                    {educationLevel.employees_count !== undefined && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Statistik</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Jumlah Karyawan</p>
                                    <p className="font-medium">{educationLevel.employees_count} orang</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Dibuat pada</p>
                                <p>{new Date(educationLevel.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Diperbarui pada</p>
                                <p>{new Date(educationLevel.updated_at).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
