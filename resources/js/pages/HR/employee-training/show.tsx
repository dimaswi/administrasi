import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Star,
    FileText,
    ExternalLink,
    AlertTriangle,
    CheckCircle,
    Edit,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeTrainingData {
    id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        organization_unit: string | null;
    };
    training: {
        id: number;
        code: string;
        name: string;
        type_label: string;
        provider: string | null;
    };
    status: string;
    status_label: string;
    start_date: string | null;
    start_date_formatted: string | null;
    end_date: string | null;
    end_date_formatted: string | null;
    completion_date: string | null;
    completion_date_formatted: string | null;
    score: number | null;
    grade: string | null;
    certificate_number: string | null;
    certificate_url: string | null;
    certificate_expiry: string | null;
    certificate_expiry_formatted: string | null;
    is_certificate_expired: boolean;
    is_certificate_expiring_soon: boolean;
    feedback: string | null;
    rating: number | null;
    notes: string | null;
    approved_by: string | null;
    approved_at: string | null;
}

interface Props {
    employeeTraining: EmployeeTrainingData;
}

export default function Show({ employeeTraining }: Props) {
    const handleDelete = () => {
        if (confirm('Hapus data training ini? Tindakan ini tidak dapat dibatalkan.')) {
            router.delete(route('hr.employee-trainings.destroy', employeeTraining.id), {
                onError: () => toast.error('Gagal menghapus data training'),
            });
        }
    };

    const getStatusBadge = () => {
        const variants: Record<string, string> = {
            'registered': 'bg-blue-50 text-blue-700 border-blue-200',
            'in_progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'completed': 'bg-green-50 text-green-700 border-green-200',
            'failed': 'bg-red-50 text-red-700 border-red-200',
            'cancelled': 'bg-gray-50 text-gray-700 border-gray-200',
        };
        return (
            <Badge variant="outline" className={`${variants[employeeTraining.status] || ''}`}>
                {employeeTraining.status_label}
            </Badge>
        );
    };

    const getCertificateStatus = () => {
        if (!employeeTraining.certificate_number) return null;
        
        if (employeeTraining.is_certificate_expired) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Kedaluwarsa
                </Badge>
            );
        }
        if (employeeTraining.is_certificate_expiring_soon) {
            return (
                <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Segera Kedaluwarsa
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
            </Badge>
        );
    };

    const renderRating = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>
            </div>
        );
    };

    const actions = (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href={route('hr.employee-trainings.edit', employeeTraining.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
            </Button>
        </div>
    );

    return (
        <HRLayout>
            <Head title={`Training ${employeeTraining.employee.name} - ${employeeTraining.training.name}`} />

            <DetailPage
                title="Detail Training Karyawan"
                description={`${employeeTraining.employee.name} - ${employeeTraining.training.name}`}
                backUrl={route('hr.employee-trainings.index')}
                actions={actions}
            >
                <div className="space-y-8">
                    {/* Status */}
                    <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge()}
                    </div>

                    {/* Info Dasar */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Informasi Karyawan</h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">NIP</dt>
                                    <dd className="font-mono">{employeeTraining.employee.employee_id}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Nama</dt>
                                    <dd>
                                        <Link
                                            href={route('hr.employees.show', employeeTraining.employee.id)}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {employeeTraining.employee.name}
                                        </Link>
                                    </dd>
                                </div>
                                {employeeTraining.employee.organization_unit && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Unit</dt>
                                        <dd>{employeeTraining.employee.organization_unit}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Informasi Training</h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Kode</dt>
                                    <dd className="font-mono">{employeeTraining.training.code}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Nama</dt>
                                    <dd>
                                        <Link
                                            href={route('hr.trainings.show', employeeTraining.training.id)}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {employeeTraining.training.name}
                                        </Link>
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Tipe</dt>
                                    <dd><Badge variant="outline">{employeeTraining.training.type_label}</Badge></dd>
                                </div>
                                {employeeTraining.training.provider && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Provider</dt>
                                        <dd>{employeeTraining.training.provider}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Jadwal & Hasil */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Jadwal & Hasil</h3>
                            <dl className="space-y-3">
                                {employeeTraining.start_date_formatted && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Tanggal Mulai</dt>
                                        <dd>{employeeTraining.start_date_formatted}</dd>
                                    </div>
                                )}
                                {employeeTraining.end_date_formatted && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Tanggal Selesai</dt>
                                        <dd>{employeeTraining.end_date_formatted}</dd>
                                    </div>
                                )}
                                {employeeTraining.completion_date_formatted && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Tanggal Kelulusan</dt>
                                        <dd>{employeeTraining.completion_date_formatted}</dd>
                                    </div>
                                )}
                                {employeeTraining.score !== null && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Nilai</dt>
                                        <dd className="font-bold text-lg">{employeeTraining.score}</dd>
                                    </div>
                                )}
                                {employeeTraining.grade && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Grade</dt>
                                        <dd><Badge variant="secondary">{employeeTraining.grade}</Badge></dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Sertifikat</h3>
                            {employeeTraining.certificate_number ? (
                                <dl className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <dt className="text-muted-foreground">Status</dt>
                                        <dd>{getCertificateStatus()}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Nomor</dt>
                                        <dd className="font-mono">{employeeTraining.certificate_number}</dd>
                                    </div>
                                    {employeeTraining.certificate_expiry_formatted && (
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Berlaku Hingga</dt>
                                            <dd>{employeeTraining.certificate_expiry_formatted}</dd>
                                        </div>
                                    )}
                                    {employeeTraining.certificate_url && (
                                        <div className="pt-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={employeeTraining.certificate_url} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Lihat Sertifikat
                                                    <ExternalLink className="h-3 w-3 ml-2" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="text-muted-foreground italic">Belum ada sertifikat</p>
                            )}
                        </div>
                    </div>

                    {/* Feedback & Notes */}
                    {(employeeTraining.feedback || employeeTraining.rating || employeeTraining.notes) && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Feedback & Catatan</h3>
                            <div className="space-y-4">
                                {employeeTraining.rating && (
                                    <div>
                                        <span className="text-sm font-medium block mb-2">Rating</span>
                                        {renderRating(employeeTraining.rating)}
                                    </div>
                                )}
                                {employeeTraining.feedback && (
                                    <div>
                                        <span className="text-sm font-medium block mb-2">Feedback</span>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{employeeTraining.feedback}</p>
                                    </div>
                                )}
                                {employeeTraining.notes && (
                                    <div>
                                        <span className="text-sm font-medium block mb-2">Catatan</span>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{employeeTraining.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Approval Info */}
                    {employeeTraining.approved_by && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Disetujui oleh <span className="font-medium">{employeeTraining.approved_by}</span>
                                {employeeTraining.approved_at && ` pada ${employeeTraining.approved_at}`}
                            </p>
                        </div>
                    )}
                </div>
            </DetailPage>
        </HRLayout>
    );
}
