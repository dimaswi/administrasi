import { Head } from '@inertiajs/react';
import { CheckCircle2, XCircle, AlertCircle, Shield, User, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ApprovalData {
    id: number;
    signer_name: string;
    position: string;
    nip: string;
    signed_at: string;
    status: string;
    letter_number: string;
    letter_subject: string;
    signature_hash: string;
}

interface CertificateData {
    certificate_id: string;
    signer_name: string;
    signer_position: string;
    signer_nip: string;
    signed_at: string;
    status: string;
    letter: {
        id: number;
        letter_number: string;
        subject: string;
    } | null;
}

interface MeetingData {
    id: number;
    meeting_number: string;
    title: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    room: {
        name: string;
    };
    organizer: {
        name: string;
    };
    organization_unit: {
        name: string;
    };
}

interface VerificationResult {
    valid: boolean;
    message: string;
    certificate: CertificateData | null;
    hash_valid: boolean;
    is_revoked: boolean;
    is_meeting_certificate?: boolean;
    meeting?: MeetingData;
    approval: ApprovalData | null;
}

interface Props {
    result: VerificationResult;
}

export default function VerifySignature({ result }: Props) {
    const getStatusIcon = () => {
        if (result.is_revoked) {
            return <XCircle className="h-16 w-16 text-destructive" />;
        }
        if (result.valid && result.hash_valid) {
            return <CheckCircle2 className="h-16 w-16 text-green-500" />;
        }
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
    };

    const getStatusBadge = () => {
        if (result.is_revoked) {
            return <Badge variant="destructive">Dicabut</Badge>;
        }
        if (result.valid && result.hash_valid) {
            return <Badge className="bg-green-500">Valid</Badge>;
        }
        return <Badge variant="secondary">Tidak Valid</Badge>;
    };

    return (
        <>
            <Head title="Verifikasi Tanda Tangan Digital" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img src="/1.svg" alt="Logo" className="h-12 w-12" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Verifikasi Tanda Tangan Digital
                        </h1>
                        <p className="text-muted-foreground">
                            Sistem Verifikasi Dokumen Elektronik
                        </p>
                    </div>

                    {/* Status Card */}
                    <Card className="mb-6 border-2">
                        <CardHeader className="text-center pb-4">
                            <div className="flex justify-center mb-4">
                                {getStatusIcon()}
                            </div>
                            <CardTitle className="text-2xl mb-2">{result.message}</CardTitle>
                            <div className="flex justify-center">
                                {getStatusBadge()}
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Approval Details */}
                    {result.approval && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Penandatangan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Nama
                                        </label>
                                        <p className="text-base font-semibold">
                                            {result.approval.signer_name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Jabatan
                                        </label>
                                        <p className="text-base">{result.approval.position}</p>
                                    </div>
                                    {result.approval.nip && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                NIP
                                            </label>
                                            <p className="text-base font-mono">{result.approval.nip}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Status
                                        </label>
                                        <p className="text-base">
                                            <Badge
                                                variant={
                                                    result.approval.status === 'approved'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {result.approval.status === 'approved'
                                                    ? 'Disetujui'
                                                    : result.approval.status === 'rejected'
                                                    ? 'Ditolak'
                                                    : 'Pending'}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4" />
                                        Ditandatangani Pada
                                    </label>
                                    <p className="text-base">
                                        {new Date(result.approval.signed_at).toLocaleString('id-ID', {
                                            dateStyle: 'full',
                                            timeStyle: 'short',
                                        })}
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Signature Hash
                                    </label>
                                    <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                                        {result.approval.signature_hash || 'N/A'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Document Details - Letter */}
                    {result.approval && !result.is_meeting_certificate && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informasi Dokumen
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Nomor Surat
                                    </label>
                                    <p className="text-base font-semibold">
                                        {result.approval.letter_number}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Perihal
                                    </label>
                                    <p className="text-base">{result.approval.letter_subject}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Meeting Details */}
                    {result.is_meeting_certificate && result.meeting && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informasi Undangan Rapat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Nomor Undangan
                                    </label>
                                    <p className="text-base font-semibold">
                                        {result.meeting.meeting_number}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Judul Rapat
                                    </label>
                                    <p className="text-base">{result.meeting.title}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Tanggal
                                        </label>
                                        <p className="text-base">
                                            {new Date(result.meeting.meeting_date).toLocaleDateString('id-ID', {
                                                dateStyle: 'long',
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Waktu
                                        </label>
                                        <p className="text-base">
                                            {result.meeting.start_time} - {result.meeting.end_time}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Tempat
                                    </label>
                                    <p className="text-base">{result.meeting.room.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Unit Organisasi
                                    </label>
                                    <p className="text-base">{result.meeting.organization_unit.name}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Certificate Details */}
                    {result.certificate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Informasi Sertifikat
                                </CardTitle>
                                <CardDescription>Detail sertifikat digital</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Certificate ID
                                    </label>
                                    <p className="text-base font-mono font-semibold">
                                        {result.certificate.certificate_id}
                                    </p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Status Hash
                                        </label>
                                        <p className="text-base">
                                            <Badge
                                                variant={result.hash_valid ? 'default' : 'destructive'}
                                            >
                                                {result.hash_valid
                                                    ? '✓ Hash Valid'
                                                    : '✗ Hash Tidak Valid'}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Status Sertifikat
                                        </label>
                                        <p className="text-base">
                                            <Badge
                                                variant={
                                                    result.certificate.status === 'valid'
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {result.certificate.status === 'valid'
                                                    ? 'Valid'
                                                    : 'Dicabut'}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>

                                {result.is_revoked && (
                                    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                                        <p className="text-sm text-destructive font-medium">
                                            ⚠️ Sertifikat ini telah dicabut dan tidak lagi valid
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-8 text-sm text-muted-foreground">
                        <p>
                            Sistem Administrasi Klinik Rawat Inap Utama Muhammadiyah Kedungadem - Verifikasi Tanda Tangan Elektronik
                        </p>
                        <p className="mt-1">
                            © {new Date().getFullYear()} - Dilindungi oleh teknologi blockchain dan
                            kriptografi
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
