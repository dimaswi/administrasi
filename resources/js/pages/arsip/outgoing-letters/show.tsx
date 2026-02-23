import { Head, router, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    ArrowLeft, Edit, Send, Download, FileText, User, Calendar, Hash,
    CheckCircle, XCircle, Clock, PenTool, ZoomIn, ZoomOut, RotateCcw,
    Variable, Info, Archive, History, AlertTriangle, MessageSquare
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DocumentTemplate } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';

interface Signatory {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        nip?: string;
    };
    slot_id: string;
    sign_order: number;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    signed_at: string | null;
    slot_info?: {
        label_above?: string;
        label_position?: string;
    } | null;
}

interface Revision {
    id: number;
    version: number;
    type: 'initial' | 'revision_request' | 'revision_submitted';
    type_label: string;
    type_color: string;
    revision_notes: string | null;
    requested_changes: string | null;
    creator: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface OutgoingLetter {
    id: number;
    letter_number: string | null;
    subject: string;
    letter_date: string;
    status: 'pending_approval' | 'partially_signed' | 'fully_signed' | 'rejected' | 'revision_requested';
    variable_values: Record<string, any>;
    pdf_path: string | null;
    notes: string | null;
    current_version: number;
    revision_requested: boolean;
    revision_request_notes: string | null;
    created_at: string;
    updated_at: string;
    template: DocumentTemplate;
    creator: {
        id: number;
        name: string;
    };
    signatories: Signatory[];
    revisions: Revision[];
    revision_requester?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    letter: OutgoingLetter;
    can_edit: boolean;
    can_sign: boolean;
    can_archive: boolean;
    can_request_revision: boolean;
    can_submit_revision: boolean;
    is_creator: boolean;
    user_signatory: Signatory | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    pending_approval: { label: 'Menunggu TTD', variant: 'default', color: 'text-blue-600' },
    partially_signed: { label: 'TTD Sebagian', variant: 'outline', color: 'text-amber-600' },
    fully_signed: { label: 'Selesai', variant: 'default', color: 'text-green-600' },
    rejected: { label: 'Ditolak', variant: 'destructive', color: 'text-red-600' },
    revision_requested: { label: 'Perlu Revisi', variant: 'destructive', color: 'text-orange-600' },
};

const signatoryStatusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-600" />,
    approved: <CheckCircle className="h-4 w-4 text-green-600" />,
    rejected: <XCircle className="h-4 w-4 text-red-600" />,
};

export default function Show({ letter, can_edit, can_sign, can_archive, can_request_revision, can_submit_revision, is_creator, user_signatory }: Props) {
    const [activeTab, setActiveTab] = useState('info');
    const [previewScale, setPreviewScale] = useState(0.5);
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
    const [signDialogOpen, setSignDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const archiveForm = useForm({
        category: '',
        classification: 'internal' as 'public' | 'internal' | 'confidential' | 'secret',
        retention_period: '',
    });

    const revisionForm = useForm({
        notes: '',
    });

    const breadcrumbs = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Surat Keluar', href: '/arsip/outgoing-letters' },
        { title: letter.letter_number || letter.subject, href: '#' },
    ];

    // Auto-fit preview scale based on container size
    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const container = previewContainerRef.current;
                const containerHeight = container.clientHeight - 80;
                const containerWidth = container.clientWidth - 48;
                
                const a4Height = 1123;
                const a4Width = 794;
                
                const scaleByHeight = containerHeight / a4Height;
                const scaleByWidth = containerWidth / a4Width;
                const optimalScale = Math.min(scaleByHeight, scaleByWidth, 0.7);
                
                setPreviewScale(Math.max(0.3, optimalScale));
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const handleSign = () => {
        router.post(`/arsip/outgoing-letters/${letter.id}/sign`, {}, {
            onSuccess: () => setSignDialogOpen(false),
        });
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        router.post(`/arsip/outgoing-letters/${letter.id}/reject`, { 
            rejection_reason: rejectReason 
        }, {
            onSuccess: () => {
                setRejectDialogOpen(false);
                setRejectReason('');
            },
        });
    };

    const handleRequestRevision = () => {
        if (!revisionForm.data.notes.trim()) {
            return;
        }
        revisionForm.post(`/arsip/outgoing-letters/${letter.id}/request-revision`, {
            onSuccess: () => {
                setRevisionDialogOpen(false);
                revisionForm.reset();
            },
        });
    };

    const handleGoToRevisionForm = () => {
        router.visit(`/arsip/outgoing-letters/${letter.id}/revision`);
    };

    const handleArchive = () => {
        archiveForm.post(`/arsip/archives/outgoing-letters/${letter.id}/archive`, {
            onSuccess: () => {
                setArchiveDialogOpen(false);
                archiveForm.reset();
            },
        });
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.5);
    };

    const signedCount = letter.signatories?.filter(s => s.status === 'approved').length || 0;
    const totalSignatories = letter.signatories?.length || 0;
    const template = letter.template;
    const status = statusConfig[letter.status] || statusConfig.pending_approval;

    // Build signatoriesData for preview
    const signatoriesData = (letter.signatories || []).map(s => ({
        slot_id: s.slot_id,
        name: s.user?.name || '',
        nip: s.user?.nip || '',
        signed: s.status === 'approved',
        signed_at: s.signed_at,
    }));

    // Merge variable values with letter_number
    const mergedVariableValues = {
        ...letter.variable_values,
        nomor_surat: letter.letter_number || '(Nomor akan dibuat)',
    };

    // Verification URL for QR code
    const verificationUrl = letter.status === 'fully_signed' 
        ? `${window.location.origin}/verify/letter/${letter.id}` 
        : undefined;

    return (
        <AppLayout>
            <Head title={letter.letter_number || letter.subject} />

            <div className="h-[calc(100vh-64px)] flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/arsip/outgoing-letters')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold leading-none">
                                    {letter.letter_number || letter.subject}
                                </h1>
                                <Badge variant={status.variant} className="text-[10px]">
                                    {status.label}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {template?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {can_edit && !['fully_signed', 'rejected'].includes(letter.status) && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/arsip/outgoing-letters/${letter.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        {can_sign && user_signatory?.status === 'pending' && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(true)}>
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                    Tolak
                                </Button>
                                {can_request_revision && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setRevisionDialogOpen(true)}
                                    >
                                        <MessageSquare className="h-4 w-4 mr-1.5" />
                                        Minta Revisi
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => setSignDialogOpen(true)}>
                                    <PenTool className="h-4 w-4 mr-1.5" />
                                    Tandatangani
                                </Button>
                            </>
                        )}
                        {can_submit_revision && (
                            <Button size="sm" onClick={handleGoToRevisionForm}>
                                <Edit className="h-4 w-4 mr-1.5" />
                                Revisi Surat
                            </Button>
                        )}
                        {can_archive && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setArchiveDialogOpen(true)}
                            >
                                <Archive className="h-4 w-4 mr-1.5" />
                                Arsipkan
                            </Button>
                        )}
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => window.open(`/arsip/outgoing-letters/${letter.id}/preview`, '_blank')}
                        >
                            <Download className="h-4 w-4 mr-1.5" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Info */}
                    <div className="w-[400px] border-r flex flex-col bg-background shrink-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                            <TabsList className="w-full h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b">
                                <TabsTrigger 
                                    value="info" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Info Surat
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="variables" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Data ({Object.keys(letter.variable_values || {}).length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="signatories" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    TTD ({signedCount}/{totalSignatories})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="revisions" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Revisi ({letter.revisions?.length || 0})
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-4">
                                    <TabsContent value="info" className="m-0 space-y-4">
                                        {/* Status Card */}
                                        <div className="bg-muted/40 rounded-lg p-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">Status</span>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">Progress TTD</span>
                                                    <span className="font-medium">{signedCount}/{totalSignatories}</span>
                                                </div>
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-green-500 rounded-full transition-all"
                                                        style={{ 
                                                            width: `${totalSignatories > 0 ? (signedCount / totalSignatories) * 100 : 0}%` 
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Letter Info */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <FileText className="h-3.5 w-3.5" />
                                                Detail Surat
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                {letter.letter_number && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Nomor Surat:</span>
                                                        <span className="font-mono text-xs font-medium">{letter.letter_number}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Template:</span>
                                                    <span className="text-xs font-medium">{template?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Kode:</span>
                                                    <span className="font-mono text-xs">{template?.code}</span>
                                                </div>
                                                <Separator />
                                                <div className="pt-1">
                                                    <span className="text-muted-foreground text-xs">Perihal:</span>
                                                    <p className="text-xs mt-1">{letter.subject}</p>
                                                </div>
                                                {letter.letter_date && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Tanggal Surat:</span>
                                                        <span className="text-xs">
                                                            {new Date(letter.letter_date).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {letter.notes && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <Info className="h-3.5 w-3.5" />
                                                    Catatan
                                                </div>
                                                <div className="bg-muted/40 rounded-lg p-3 text-xs">
                                                    {letter.notes}
                                                </div>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Informasi
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Dibuat oleh:</span>
                                                    <span className="text-xs">{letter.creator?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Dibuat:</span>
                                                    <span className="text-xs">
                                                        {new Date(letter.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Diperbarui:</span>
                                                    <span className="text-xs">
                                                        {new Date(letter.updated_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="variables" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium">Data Surat</h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                Nilai variabel yang diisikan pada surat ini
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            {Object.entries(letter.variable_values || {}).map(([key, value]) => {
                                                const variable = template?.variables?.find(v => v.key === key);
                                                return (
                                                    <div key={key} className="border rounded-lg p-3 bg-muted/20">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-xs font-medium">
                                                                    {variable?.label || key}
                                                                </span>
                                                                <p className="text-sm mt-1">
                                                                    {value || <span className="text-muted-foreground italic">-</span>}
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] shrink-0">
                                                                {variable?.type || 'text'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono mt-2">
                                                            {'{{'}{key}{'}}'}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {Object.keys(letter.variable_values || {}).length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <Variable className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada data variabel</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="signatories" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium flex items-center gap-2">
                                                <PenTool className="h-4 w-4" />
                                                Progress Tanda Tangan
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                {signedCount} dari {totalSignatories} sudah menandatangani
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {(letter.signatories || []).map((signatory, index) => (
                                                <div key={signatory.id} className="border rounded-lg p-3 bg-muted/20">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {signatory.user?.name?.substring(0, 2).toUpperCase() || '??'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium truncate">
                                                                    {signatory.user?.name}
                                                                </span>
                                                                {signatoryStatusIcons[signatory.status]}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {signatory.slot_info?.label_position || `Penanda Tangan ${index + 1}`}
                                                            </p>
                                                            {signatory.user?.nip && (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    NIP. {signatory.user.nip}
                                                                </p>
                                                            )}
                                                            
                                                            {signatory.status === 'approved' && signatory.signed_at && (
                                                                <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    <span>
                                                                        {new Date(signatory.signed_at).toLocaleDateString('id-ID', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            {signatory.status === 'rejected' && signatory.notes && (
                                                                <div className="mt-2 p-2 bg-red-50 rounded text-[10px] text-red-600">
                                                                    Alasan: {signatory.notes}
                                                                </div>
                                                            )}
                                                            
                                                            {signatory.status === 'pending' && (
                                                                <Badge variant="outline" className="text-[9px] mt-2">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Menunggu
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {(letter.signatories || []).length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <PenTool className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada penanda tangan</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Revisions Tab */}
                                    <TabsContent value="revisions" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium flex items-center gap-2">
                                                <History className="h-4 w-4" />
                                                Riwayat Revisi
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                Versi saat ini: {letter.current_version || 1}
                                            </p>
                                        </div>

                                        {/* Revision Request Alert */}
                                        {letter.revision_requested && (
                                            <Alert variant="destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertTitle className="text-xs">Revisi Diperlukan</AlertTitle>
                                                <AlertDescription className="text-xs">
                                                    <p className="mb-2">{letter.revision_request_notes}</p>
                                                    <p className="text-muted-foreground">
                                                        Diminta oleh: {letter.revision_requester?.name}
                                                    </p>
                                                    {can_submit_revision ? (
                                                        <Button 
                                                            size="sm" 
                                                            className="mt-2 h-7 text-xs"
                                                            onClick={handleGoToRevisionForm}
                                                        >
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Revisi Surat
                                                        </Button>
                                                    ) : (
                                                        <p className="mt-2 text-muted-foreground italic">
                                                            Menunggu pembuat surat untuk merevisi.
                                                        </p>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Revision Timeline */}
                                        <div className="space-y-3">
                                            {(letter.revisions || []).map((revision, index) => (
                                                <div 
                                                    key={revision.id} 
                                                    className="relative pl-6 pb-3 border-l-2 border-muted last:border-l-transparent"
                                                >
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                                                        revision.type === 'revision_request' 
                                                            ? 'bg-red-100 border-red-500' 
                                                            : revision.type === 'revision_submitted'
                                                            ? 'bg-green-100 border-green-500'
                                                            : 'bg-blue-100 border-blue-500'
                                                    }`} />
                                                    
                                                    <Card className="border-0 shadow-none bg-muted/30">
                                                        <CardHeader className="p-3 pb-2">
                                                            <div className="flex items-center justify-between">
                                                                <Badge 
                                                                    variant={
                                                                        revision.type === 'revision_request' 
                                                                            ? 'destructive' 
                                                                            : revision.type === 'revision_submitted'
                                                                            ? 'default'
                                                                            : 'secondary'
                                                                    }
                                                                    className="text-[10px]"
                                                                >
                                                                    {revision.type_label}
                                                                </Badge>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    v{revision.version}
                                                                </span>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-3 pt-0">
                                                            {revision.requested_changes && (
                                                                <div className="mb-2">
                                                                    <p className="text-[10px] font-medium text-muted-foreground">Permintaan Perubahan:</p>
                                                                    <p className="text-xs">{revision.requested_changes}</p>
                                                                </div>
                                                            )}
                                                            {revision.revision_notes && (
                                                                <div className="mb-2">
                                                                    <p className="text-[10px] font-medium text-muted-foreground">Catatan:</p>
                                                                    <p className="text-xs">{revision.revision_notes}</p>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                                <span>{revision.creator?.name || 'System'}</span>
                                                                <span>
                                                                    {new Date(revision.created_at).toLocaleDateString('id-ID', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            ))}

                                            {(letter.revisions || []).length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <History className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Belum ada riwayat revisi</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right Panel - Preview */}
                    <div 
                        ref={previewContainerRef}
                        className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                    >
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b bg-background/80 backdrop-blur-sm flex items-center justify-center gap-1 px-4 shrink-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleZoom(-0.1)}
                                disabled={previewScale <= 0.3}
                            >
                                <ZoomOut className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground w-12 text-center font-mono">
                                {Math.round(previewScale * 100)}%
                            </span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleZoom(0.1)}
                                disabled={previewScale >= 1}
                            >
                                <ZoomIn className="h-3.5 w-3.5" />
                            </Button>
                            <Separator orientation="vertical" className="h-4 mx-1" />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={resetZoom}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto" ref={previewRef}>
                            {template ? (
                                <div className="min-h-full flex items-start justify-center py-6 px-4">
                                    <TemplatePreview
                                        pageSettings={template.page_settings}
                                        headerSettings={template.header_settings}
                                        contentBlocks={template.content_blocks}
                                        signatureSettings={template.signature_settings}
                                        footerSettings={template.footer_settings}
                                        variableValues={mergedVariableValues}
                                        scale={previewScale}
                                        signatoriesData={signatoriesData}
                                        showQrCode={letter.status === 'fully_signed'}
                                        verificationUrl={verificationUrl}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-sm">Template tidak ditemukan</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Archive Dialog */}
            <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Arsipkan Surat</DialogTitle>
                        <DialogDescription>
                            Arsipkan surat keluar ini ke dalam sistem arsip digital.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori <span className="text-destructive">*</span></Label>
                            <Input
                                id="category"
                                value={archiveForm.data.category}
                                onChange={(e) => archiveForm.setData('category', e.target.value)}
                                placeholder="Contoh: Surat Keluar, Surat Keputusan"
                            />
                            {archiveForm.errors.category && (
                                <p className="text-sm text-destructive">{archiveForm.errors.category}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classification">Klasifikasi <span className="text-destructive">*</span></Label>
                            <Select
                                value={archiveForm.data.classification}
                                onValueChange={(value: 'public' | 'internal' | 'confidential' | 'secret') => 
                                    archiveForm.setData('classification', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih klasifikasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Publik</SelectItem>
                                    <SelectItem value="internal">Internal</SelectItem>
                                    <SelectItem value="confidential">Rahasia</SelectItem>
                                    <SelectItem value="secret">Sangat Rahasia</SelectItem>
                                </SelectContent>
                            </Select>
                            {archiveForm.errors.classification && (
                                <p className="text-sm text-destructive">{archiveForm.errors.classification}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="retention_period">Masa Retensi (Tahun)</Label>
                            <Input
                                id="retention_period"
                                type="number"
                                min="1"
                                value={archiveForm.data.retention_period}
                                onChange={(e) => archiveForm.setData('retention_period', e.target.value)}
                                placeholder="Kosongkan jika tidak ada batas"
                            />
                            {archiveForm.errors.retention_period && (
                                <p className="text-sm text-destructive">{archiveForm.errors.retention_period}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setArchiveDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleArchive}
                            disabled={archiveForm.processing}
                        >
                            {archiveForm.processing ? 'Menyimpan...' : 'Arsipkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Request Dialog */}
            <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Minta Revisi Surat</DialogTitle>
                        <DialogDescription>
                            Jelaskan perubahan apa yang perlu dilakukan pada surat ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="revision-notes">Catatan Revisi *</Label>
                            <Textarea
                                id="revision-notes"
                                value={revisionForm.data.notes}
                                onChange={(e) => revisionForm.setData('notes', e.target.value)}
                                placeholder="Jelaskan perubahan yang diperlukan..."
                                rows={4}
                            />
                            {revisionForm.errors.notes && (
                                <p className="text-sm text-destructive">{revisionForm.errors.notes}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRevisionDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={revisionForm.processing || !revisionForm.data.notes.trim()}
                        >
                            {revisionForm.processing ? 'Mengirim...' : 'Kirim Permintaan Revisi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sign Confirmation Dialog */}
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Tanda Tangan</DialogTitle>
                        <DialogDescription>
                            Anda akan menandatangani surat ini. Pastikan Anda telah membaca dan menyetujui isi surat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm font-medium">{letter.subject}</p>
                            <p className="text-sm text-muted-foreground">No: {letter.letter_number}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSignDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSign}>
                            <PenTool className="h-4 w-4 mr-1.5" />
                            Ya, Tandatangani
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Surat</DialogTitle>
                        <DialogDescription>
                            Jelaskan alasan penolakan surat ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
                            <Textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Jelaskan alasan penolakan..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false);
                                setRejectReason('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                        >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Tolak Surat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
