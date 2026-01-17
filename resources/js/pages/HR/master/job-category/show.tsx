import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Edit, Trash2, Stethoscope, FileCheck } from 'lucide-react';
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

interface JobCategory {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_medical: boolean;
    requires_str: boolean;
    requires_sip: boolean;
    is_active: boolean;
    employees_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    jobCategory: JobCategory;
}

export default function Show({ jobCategory }: Props) {
    const breadcrumbs = [
        { title: <Briefcase className="h-4 w-4" />, href: '/hr/job-categories' },
        { title: jobCategory.name, href: `/hr/job-categories/${jobCategory.id}` },
    ];

    const handleDelete = () => {
        router.delete(`/hr/job-categories/${jobCategory.id}`, {
            onError: () => toast.error('Gagal menghapus kategori'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Detail ${jobCategory.name}`} />

            <DetailPage
                title={jobCategory.name}
                description={`Kode: ${jobCategory.code}`}
                backUrl="/hr/job-categories"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/hr/job-categories/${jobCategory.id}/edit`}>
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
                                    <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus kategori "{jobCategory.name}"? 
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
                        <Badge variant={jobCategory.is_active ? 'default' : 'secondary'}>
                            {jobCategory.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        {jobCategory.is_medical && (
                            <Badge variant="outline" className="gap-1">
                                <Stethoscope className="h-3 w-3" />
                                Tenaga Medis
                            </Badge>
                        )}
                    </div>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Kode Kategori</p>
                            <p className="font-medium">{jobCategory.code}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Nama Kategori</p>
                            <p className="font-medium">{jobCategory.name}</p>
                        </div>
                    </div>

                    {jobCategory.description && (
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Deskripsi</p>
                            <p>{jobCategory.description}</p>
                        </div>
                    )}

                    {/* Medical Requirements */}
                    {jobCategory.is_medical && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Persyaratan Dokumen</h4>
                            <div className="flex flex-wrap gap-2">
                                {jobCategory.requires_str && (
                                    <Badge variant="outline" className="gap-1">
                                        <FileCheck className="h-3 w-3" />
                                        Wajib STR
                                    </Badge>
                                )}
                                {jobCategory.requires_sip && (
                                    <Badge variant="outline" className="gap-1">
                                        <FileCheck className="h-3 w-3" />
                                        Wajib SIP
                                    </Badge>
                                )}
                                {!jobCategory.requires_str && !jobCategory.requires_sip && (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada persyaratan dokumen khusus
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    {jobCategory.employees_count !== undefined && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Statistik</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Jumlah Karyawan</p>
                                    <p className="font-medium">{jobCategory.employees_count} orang</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Dibuat pada</p>
                                <p>{new Date(jobCategory.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Diperbarui pada</p>
                                <p>{new Date(jobCategory.updated_at).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
