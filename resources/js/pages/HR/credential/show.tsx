import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    CreditCard, 
    User, 
    FileText,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    AlertTriangle,
    ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface CredentialData {
    id: number;
    employee: Employee;
    type: string;
    type_label: string;
    name: string;
    number: string;
    issued_by: string | null;
    issued_date: string | null;
    issued_date_formatted: string | null;
    expiry_date: string | null;
    expiry_date_formatted: string | null;
    is_expired: boolean;
    is_expiring_soon: boolean;
    days_until_expiry: number | null;
    notes: string | null;
    document_url: string | null;
    is_verified: boolean;
    verified_by: string | null;
    verified_at: string | null;
}

interface Props {
    credential: CredentialData;
}

export default function Show({ credential }: Props) {
    const handleDelete = () => {
        if (confirm('Hapus kredensial ini? Tindakan ini tidak dapat dibatalkan.')) {
            router.delete(`/hr/credentials/${credential.id}`, {
                onError: () => toast.error('Gagal menghapus kredensial'),
            });
        }
    };

    const handleVerify = () => {
        router.post(`/hr/credentials/${credential.id}/verify`, {}, {
            onSuccess: () => toast.success('Kredensial berhasil diverifikasi'),
            onError: () => toast.error('Gagal memverifikasi kredensial'),
        });
    };

    const handleUnverify = () => {
        if (confirm('Batalkan verifikasi kredensial ini?')) {
            router.post(`/hr/credentials/${credential.id}/unverify`, {}, {
                onSuccess: () => toast.success('Verifikasi dibatalkan'),
                onError: () => toast.error('Gagal membatalkan verifikasi'),
            });
        }
    };

    const getStatusBadge = () => {
        if (credential.is_expired) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Kedaluwarsa
                </Badge>
            );
        }
        if (credential.is_expiring_soon) {
            return (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {credential.days_until_expiry} hari lagi
                </Badge>
            );
        }
        if (credential.expiry_date_formatted) {
            return <Badge variant="outline">Berlaku hingga {credential.expiry_date_formatted}</Badge>;
        }
        return <Badge variant="secondary">Tidak ada masa berlaku</Badge>;
    };

    const actions = (
        <div className="flex items-center gap-2">
            <Button 
                variant={credential.is_verified ? 'outline' : 'default'}
                size="sm"
                onClick={credential.is_verified ? handleUnverify : handleVerify}
            >
                {credential.is_verified ? (
                    <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Batalkan Verifikasi
                    </>
                ) : (
                    <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verifikasi
                    </>
                )}
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link href={`/hr/credentials/${credential.id}/edit`}>
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
            <Head title={`Kredensial - ${credential.name}`} />

            <DetailPage
                title={credential.name}
                description={credential.number}
                backUrl="/hr/credentials"
                actions={actions}
            >
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Credential Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Informasi Kredensial
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">Jenis</span>
                                    <Badge variant="outline">{credential.type_label}</Badge>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">Nama/Label</span>
                                    <span className="font-medium text-right">{credential.name}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">Nomor</span>
                                    <span className="font-mono font-medium">{credential.number}</span>
                                </div>
                                {credential.issued_by && (
                                    <div className="flex justify-between items-start">
                                        <span className="text-muted-foreground">Diterbitkan Oleh</span>
                                        <span className="text-right">{credential.issued_by}</span>
                                    </div>
                                )}
                                {credential.issued_date_formatted && (
                                    <div className="flex justify-between items-start">
                                        <span className="text-muted-foreground">Tanggal Terbit</span>
                                        <span>{credential.issued_date_formatted}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">Status Masa Berlaku</span>
                                    {getStatusBadge()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employee Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Pemilik Kredensial
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">Nama</span>
                                    <Link 
                                        href={`/hr/employees/${credential.employee.id}`}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        {credential.employee.name}
                                    </Link>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">NIP</span>
                                    <span className="font-mono">{credential.employee.employee_id}</span>
                                </div>
                                {credential.employee.organization_unit && (
                                    <div className="flex justify-between items-start">
                                        <span className="text-muted-foreground">Unit Organisasi</span>
                                        <span className="text-right">{credential.employee.organization_unit}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Verification Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {credential.is_verified ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-gray-400" />
                                    )}
                                    Status Verifikasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground">Status</span>
                                    {credential.is_verified ? (
                                        <Badge className="bg-green-100 text-green-800">Terverifikasi</Badge>
                                    ) : (
                                        <Badge variant="outline">Belum Diverifikasi</Badge>
                                    )}
                                </div>
                                {credential.is_verified && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className="text-muted-foreground">Diverifikasi Oleh</span>
                                            <span>{credential.verified_by || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-muted-foreground">Tanggal Verifikasi</span>
                                            <span>{credential.verified_at || '-'}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Document & Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Dokumen & Catatan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-muted-foreground block mb-2">Dokumen</span>
                                    {credential.document_url ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a 
                                                href={credential.document_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Lihat Dokumen
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Tidak ada dokumen</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-2">Catatan</span>
                                    <p className="text-sm">
                                        {credential.notes || 'Tidak ada catatan'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
