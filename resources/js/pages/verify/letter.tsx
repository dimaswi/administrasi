import { Head } from '@inertiajs/react';
import { CheckCircle, XCircle, FileText, User, Calendar, Hash, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Signatory {
    id: number;
    name: string;
    nip: string | null;
    position: string | null;
    status: 'pending' | 'approved' | 'rejected';
    signed_at: string | null;
}

interface Letter {
    id: number;
    letter_number: string | null;
    subject: string;
    letter_date: string;
    status: string;
    created_at: string;
    template_name: string | null;
    creator_name: string | null;
}

interface Props {
    letter: Letter;
    signatories: Signatory[];
    is_valid: boolean;
}

export default function VerifyLetter({ letter, signatories, is_valid }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Verifikasi Dokumen" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Verifikasi Dokumen Digital</h1>
                        <p className="text-slate-600 mt-2">Sistem Verifikasi Tanda Tangan Elektronik</p>
                    </div>

                    {/* Verification Status */}
                    <Card className={`mb-6 border-2 ${is_valid ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                {is_valid ? (
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                ) : (
                                    <XCircle className="w-12 h-12 text-amber-600" />
                                )}
                                <div>
                                    <h2 className={`text-xl font-bold ${is_valid ? 'text-green-800' : 'text-amber-800'}`}>
                                        {is_valid ? 'Dokumen Valid' : 'Dokumen Belum Selesai'}
                                    </h2>
                                    <p className={`${is_valid ? 'text-green-700' : 'text-amber-700'}`}>
                                        {is_valid 
                                            ? 'Dokumen ini telah ditandatangani secara digital dan sah sesuai UU ITE.'
                                            : 'Dokumen ini masih dalam proses penandatanganan.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document Info */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Informasi Dokumen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Hash className="w-3.5 h-3.5" />
                                        Nomor Surat
                                    </div>
                                    <div className="font-medium">{letter.letter_number || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Tanggal Surat
                                    </div>
                                    <div className="font-medium">{formatDate(letter.letter_date)}</div>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                                <div className="text-sm text-muted-foreground">Perihal</div>
                                <div className="font-medium">{letter.subject}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Template</div>
                                    <div className="font-medium">{letter.template_name || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Dibuat oleh</div>
                                    <div className="font-medium">{letter.creator_name || '-'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signatories */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Penandatangan
                            </CardTitle>
                            <CardDescription>
                                Daftar pejabat yang menandatangani dokumen ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {signatories.map((signatory, index) => (
                                    <div 
                                        key={signatory.id}
                                        className={`p-4 rounded-lg border ${
                                            signatory.status === 'approved' 
                                                ? 'bg-green-50 border-green-200' 
                                                : signatory.status === 'rejected'
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold">{signatory.name}</div>
                                                {signatory.nip && (
                                                    <div className="text-sm text-muted-foreground">
                                                        NIP. {signatory.nip}
                                                    </div>
                                                )}
                                                {signatory.position && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {signatory.position}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <Badge 
                                                    variant={
                                                        signatory.status === 'approved' ? 'default' 
                                                            : signatory.status === 'rejected' ? 'destructive' 
                                                            : 'secondary'
                                                    }
                                                >
                                                    {signatory.status === 'approved' ? '✓ Ditandatangani' 
                                                        : signatory.status === 'rejected' ? '✗ Ditolak'
                                                        : 'Menunggu'}
                                                </Badge>
                                                {signatory.signed_at && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {formatDateTime(signatory.signed_at)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center mt-8 text-sm text-slate-500">
                        <p>Verifikasi dilakukan pada {formatDateTime(new Date().toISOString())}</p>
                        <p className="mt-1">
                            Dokumen ID: <span className="font-mono">{letter.id}</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
