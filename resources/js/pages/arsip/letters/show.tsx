import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Archive, ArrowLeft, Calendar, CheckCircle2, Clock, Download, Edit, FileText, Send, Trash2, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Approval {
    id: number;
    user_id: number;
    signature_index: number;
    position_name: string;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    signed_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
        organization_unit?: {
            name: string;
        };
    };
}

interface Letter {
    id: number;
    letter_number: string;
    subject: string;
    letter_date: string;
    recipient: string | null;
    status: string;
    notes: string | null;
    data: Record<string, any>;
    rendered_html: string;
    pdf_path: string | null;
    created_at: string;
    template: {
        id: number;
        name: string;
        code: string;
        letterhead: any;
    };
    creator: {
        id: number;
        name: string;
    };
    approvals: Approval[];
    archive?: {
        id: number;
        document_number: string;
        archived_at: string;
    };
}

interface Props extends SharedData {
    letter: Letter;
    userApproval?: Approval;
    canApprove: boolean;
}

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-500' },
    pending_approval: { label: 'Menunggu Persetujuan', color: 'bg-yellow-500' },
    partially_signed: { label: 'Sebagian Disetujui', color: 'bg-blue-500' },
    fully_signed: { label: 'Semua Disetujui', color: 'bg-green-500' },
    approved: { label: 'Disetujui', color: 'bg-green-600' },
    rejected: { label: 'Ditolak', color: 'bg-red-500' },
    sent: { label: 'Terkirim', color: 'bg-purple-500' },
    archived: { label: 'Diarsipkan', color: 'bg-gray-600' },
};

export default function ShowLetter({ letter, userApproval, canApprove, auth }: Props) {
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showRevokeDialog, setShowRevokeDialog] = useState(false);
    const [showCancelApprovalDialog, setShowCancelApprovalDialog] = useState(false);
    const [showSubmitApprovalDialog, setShowSubmitApprovalDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');

    // Debug: Log letter data
    console.log('Letter Show Debug:', {
        letter_id: letter.id,
        has_rendered_html: !!letter.rendered_html,
        rendered_html_length: letter.rendered_html?.length || 0,
        rendered_html_preview: letter.rendered_html?.substring(0, 200) || 'empty',
    });

    // Check if current user is the creator
    const isCreator = auth.user.id === letter.creator.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Surat Keluar', href: '/arsip/letters' },
        { title: letter.letter_number, href: `/arsip/letters/${letter.id}` },
    ];

    const handleApprove = () => {
        router.post(
            `/arsip/letters/${letter.id}/approve-by-user`,
            {
                notes: approvalNotes || null,
            },
            {
                onSuccess: () => {
                    setShowApproveDialog(false);
                    setApprovalNotes('');
                },
                onError: (error) => {
                    toast.error('Gagal menyetujui surat');
                },
            },
        );
    };

    const handleReject = () => {
        if (!rejectNotes.trim()) {
            toast.error('Alasan penolakan harus diisi');
            return;
        }

        router.post(
            `/arsip/letters/${letter.id}/reject-by-user`,
            {
                notes: rejectNotes,
            },
            {
                onSuccess: () => {
                    setShowRejectDialog(false);
                    setRejectNotes('');
                },
                onError: (error) => {
                    toast.error('Gagal menolak surat');
                },
            },
        );
    };

    const handleRevokeApproval = () => {
        router.post(
            `/arsip/letters/${letter.id}/revoke-approval`,
            {},
            {
                onSuccess: () => {
                    setShowRevokeDialog(false);
                },
                onError: (error) => {
                    toast.error('Gagal membatalkan persetujuan');
                },
            },
        );
    };

    const handleCancelApproval = () => {
        router.post(
            `/arsip/letters/${letter.id}/cancel-approval`,
            {},
            {
                onSuccess: () => {
                    setShowCancelApprovalDialog(false);
                },
                onError: (error) => {
                    toast.error('Gagal membatalkan pengajuan');
                },
            },
        );
    };

    const handleSubmitForApproval = () => {
        router.post(
            `/arsip/letters/${letter.id}/submit-for-approval`,
            {},
            {
                onSuccess: () => {
                    setShowSubmitApprovalDialog(false);
                },
                onError: (error) => {
                    toast.error('Gagal mengajukan surat untuk persetujuan');
                },
            },
        );
    };

    const handleDelete = () => {
        if (confirm('Yakin ingin menghapus surat ini?')) {
            router.delete(`/arsip/letters/${letter.id}`, {
                onSuccess: () => {
                    toast.success('Surat berhasil dihapus');
                },
            });
        }
    };

    const handleArchive = () => {
        router.post(
            `/arsip/archives/letters/${letter.id}/archive`,
            {},
            {
                onSuccess: () => {
                    setShowArchiveDialog(false);
                    toast.success('Surat berhasil diarsipkan');
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat().join(', ') || 'Gagal mengarsipkan surat';
                    toast.error(errorMessage);
                },
            },
        );
    };

    const getApprovalStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getApprovalStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500">Disetujui</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500">Ditolak</Badge>;
            default:
                return <Badge className="bg-yellow-500">Menunggu</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Surat ${letter.letter_number}`} />

            <div className="my-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold md:text-2xl">{letter.letter_number}</h2>
                            <p className="font-mono text-xs text-muted-foreground md:text-sm">{letter.subject}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Edit and Delete buttons - only for creator */}
                        {isCreator && (letter.status === 'draft' || letter.status === 'rejected') && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => router.visit(`/arsip/letters/${letter.id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                {letter.status === 'draft' && (
                                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus
                                    </Button>
                                )}
                            </>
                        )}
                        {/* PDF Actions */}
                        {letter.pdf_path ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => window.open(`/arsip/letters/${letter.id}/download-pdf`, '_blank')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </Button>
                                {(letter.status === 'approved' || letter.status === 'fully_signed') && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                            router.post(`/arsip/letters/${letter.id}/regenerate-pdf`, {}, {
                                                onSuccess: () => {
                                                },
                                            });
                                        }}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Regenerate PDF
                                    </Button>
                                )}
                            </>
                        ) : (
                            /* Generate PDF button if not exists but letter is approved/fully_signed */
                            (letter.status === 'approved' || letter.status === 'fully_signed') && (
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => {
                                        router.post(`/arsip/letters/${letter.id}/regenerate-pdf`, {}, {
                                            onSuccess: () => {
                                            },
                                            onError: (errors) => {
                                                const errorMessage = Object.values(errors).flat().join(', ') || 'Gagal generate PDF';
                                                toast.error(errorMessage);
                                            },
                                        });
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate PDF
                                </Button>
                            )
                        )}
                        {/* Approve button - for approvers */}
                        {canApprove && userApproval?.status === 'pending' && letter.status === 'pending_approval' && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setShowApproveDialog(true)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                        )}
                        {/* Archive button - only for fully signed letters that are not archived yet */}
                        {letter.status === 'fully_signed' && !letter.archive && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowArchiveDialog(true)}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                Arsipkan
                            </Button>
                        )}
                        {/* Show archive info if already archived */}
                        {letter.archive && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit(`/arsip/archives/${letter.archive!.id}`)}
                                className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                Lihat Arsip
                            </Button>
                        )}
                        {/* Cancel Approval button - only for creator */}
                        {isCreator && (letter.status === 'pending_approval' || letter.status === 'partially_signed') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCancelApprovalDialog(true)}
                                className="border-orange-600 text-orange-600 hover:bg-orange-50"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Tarik Kembali
                            </Button>
                        )}
                        {/* Submit for Approval button - only for creator */}
                        {isCreator && letter.status === 'draft' && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setShowSubmitApprovalDialog(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Ajukan Persetujuan
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => router.visit('/arsip/letters')}>
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Button>
                    </div>
                </div>

                {/* User Approval Action */}
                {canApprove && userApproval && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-600" />
                                Menunggu Persetujuan Anda
                            </CardTitle>
                            <CardDescription>Anda diminta untuk menandatangani surat ini sebagai {userApproval.position_name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button onClick={() => setShowApproveDialog(true)} className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Setujui
                                </Button>
                                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Tolak
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* User Can Revoke Approval */}
                {!canApprove && userApproval && userApproval.status === 'approved' && !['sent', 'archived'].includes(letter.status) && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                Anda Sudah Menyetujui Surat Ini
                            </CardTitle>
                            <CardDescription>Anda dapat membatalkan persetujuan jika diperlukan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={() => setShowRevokeDialog(true)}
                                className="border-orange-600 text-orange-600 hover:bg-orange-50"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Batal Persetujuan
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Letter Info */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Surat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="text-sm text-muted-foreground">Template</div>
                                        <div className="font-medium">{letter.template.name}</div>
                                        <div className="text-xs text-muted-foreground">{letter.template.code}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="text-sm text-muted-foreground">Tanggal Surat</div>
                                        <div className="font-medium">{format(new Date(letter.letter_date), 'dd MMMM yyyy', { locale: id })}</div>
                                    </div>
                                </div>

                                {letter.recipient && (
                                    <div className="flex items-start gap-3">
                                        <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="text-sm text-muted-foreground">Penerima</div>
                                            <div className="font-medium">{letter.recipient}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="text-sm text-muted-foreground">Pembuat</div>
                                        <div className="font-medium">{letter.creator.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(letter.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                        </div>
                                    </div>
                                </div>

                                {letter.notes && (
                                    <div>
                                        <div className="mb-1 text-sm text-muted-foreground">Catatan Internal</div>
                                        <div className="rounded bg-muted p-2 text-sm">{letter.notes}</div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="text-sm text-muted-foreground">Status Surat</div>
                                        <Badge className={`${statusConfig[letter.status as keyof typeof statusConfig]?.color} text-white`}>
                                            {statusConfig[letter.status as keyof typeof statusConfig]?.label}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Approval Timeline */}
                        {letter.approvals && letter.approvals.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Status Persetujuan</CardTitle>
                                    <CardDescription>
                                        {letter.approvals.filter((a) => a.status === 'approved').length} dari {letter.approvals.length} penandatangan
                                        telah menyetujui
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {letter.approvals.map((approval, index) => (
                                            <div key={approval.id}>
                                                <div className="flex items-start gap-3">
                                                    {getApprovalStatusIcon(approval.status)}
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-medium">{approval.user.name}</div>
                                                            {getApprovalStatusBadge(approval.status)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{approval.position_name}</div>
                                                        {approval.user.organization_unit && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {approval.user.organization_unit.name}
                                                            </div>
                                                        )}
                                                        {approval.signed_at && (
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                {format(new Date(approval.signed_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                                            </div>
                                                        )}
                                                        {approval.notes && <div className="mt-1 rounded bg-muted p-2 text-xs">{approval.notes}</div>}
                                                    </div>
                                                </div>
                                                {index < letter.approvals.length - 1 && <Separator className="my-3" />}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Letter Preview */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview Surat</CardTitle>
                                <CardDescription>Preview tampilan surat lengkap dengan kop surat (seperti saat dicetak)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="overflow-auto rounded-lg bg-gray-100 p-6">
                                    {/* A4 Paper - Preview surat dengan kop dan konten */}
                                    <div
                                        className="mx-auto bg-white shadow-sm"
                                        style={{
                                            maxWidth: '850px',
                                            minHeight: '1100px',
                                            padding: '48px',
                                            whiteSpace: 'pre-wrap', // Preserve tabs and spaces
                                            tabSize: 20, // Tab width for aligned text
                                        }}
                                    >
                                        {/* Rendered HTML dari backend - variable sudah ter-replace, kop sudah included */}
                                        {letter.rendered_html ? (
                                            <div dangerouslySetInnerHTML={{ __html: letter.rendered_html }} />
                                        ) : (
                                            <div className="text-center text-gray-500 py-20">
                                                <p>Preview tidak tersedia</p>
                                                <p className="text-sm mt-2">rendered_html kosong atau tidak ditemukan</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Surat</DialogTitle>
                        <DialogDescription>Anda akan menandatangani surat ini sebagai {userApproval?.position_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="approval_notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="approval_notes"
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                placeholder="Tambahkan catatan jika diperlukan"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Setujui
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Surat</DialogTitle>
                        <DialogDescription>Mohon berikan alasan penolakan surat ini</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject_notes">
                                Alasan Penolakan <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="reject_notes"
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Jelaskan alasan penolakan"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Tolak
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Approval Dialog */}
            <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan Persetujuan</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin membatalkan persetujuan Anda untuk surat ini?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <p className="text-sm text-orange-800">
                                <strong>Perhatian:</strong> Dengan membatalkan persetujuan, status surat akan kembali ke "Menunggu Persetujuan" dan
                                Anda perlu menyetujui ulang jika diperlukan.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
                            Tidak, Tetap Setuju
                        </Button>
                        <Button variant="destructive" onClick={handleRevokeApproval}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Ya, Batalkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Approval Request Dialog */}
            <Dialog open={showCancelApprovalDialog} onOpenChange={setShowCancelApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tarik Kembali Pengajuan Persetujuan</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menarik kembali pengajuan persetujuan surat ini?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Info:</strong> Dengan menarik kembali pengajuan:
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-800">
                                <li>Semua approval yang sudah diberikan akan dihapus</li>
                                <li>
                                    Status surat akan kembali ke <strong>Draft</strong>
                                </li>
                                <li>Anda dapat mengedit surat kembali</li>
                                <li>Semua approver akan mendapat notifikasi pembatalan</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelApprovalDialog(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleCancelApproval}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Ya, Tarik Kembali
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submit for Approval Dialog */}
            <Dialog open={showSubmitApprovalDialog} onOpenChange={setShowSubmitApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan Surat untuk Persetujuan</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin mengajukan surat ini untuk persetujuan?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Info:</strong> Dengan mengajukan persetujuan:
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                                <li>
                                    Status surat akan berubah menjadi <strong>Menunggu Persetujuan</strong>
                                </li>
                                <li>Semua approver akan mendapat notifikasi</li>
                                <li>
                                    Anda tidak dapat mengedit surat sampai semua approver memberikan persetujuan atau Anda menarik kembali pengajuan
                                </li>
                                <li>Approver dapat menyetujui atau menolak surat ini</li>
                            </ul>
                        </div>
                        {letter.approvals && letter.approvals.length > 0 && (
                            <div className="rounded-lg border p-4">
                                <p className="mb-2 text-sm font-medium">Akan diajukan kepada:</p>
                                <ul className="space-y-2">
                                    {letter.approvals.map((approval) => (
                                        <li key={approval.id} className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{approval.user.name}</span>
                                            <span className="text-gray-500">({approval.position_name})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitApprovalDialog(false)}>
                            Batal
                        </Button>
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmitForApproval}>
                            <Send className="mr-2 h-4 w-4" />
                            Ya, Ajukan Persetujuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Archive Dialog */}
            <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Arsipkan Surat Keluar</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin mengarsipkan surat ini?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                            <p className="text-sm text-purple-800">
                                <strong>Info:</strong> Dengan mengarsipkan surat:
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-purple-800">
                                <li>Surat akan disimpan ke dalam sistem arsip untuk penyimpanan jangka panjang</li>
                                <li>Surat harus sudah ditandatangani lengkap dan PDF sudah dibuat</li>
                                <li>Data surat akan tetap dapat diakses melalui menu Arsip</li>
                                <li>Metadata surat akan tersimpan untuk kemudahan pencarian</li>
                            </ul>
                        </div>
                        <div className="space-y-2 rounded-lg border p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Nomor Surat:</span>
                                <span className="font-medium">{letter.letter_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Perihal:</span>
                                <span className="font-medium">{letter.subject}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tanggal:</span>
                                <span className="font-medium">{format(new Date(letter.letter_date), 'dd MMMM yyyy', { locale: id })}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
                            Batal
                        </Button>
                        <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={handleArchive}>
                            <Archive className="mr-2 h-4 w-4" />
                            Ya, Arsipkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
