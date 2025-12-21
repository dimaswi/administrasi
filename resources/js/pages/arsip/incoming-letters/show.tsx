import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
    ArrowLeft, Download, Edit, Trash2, Plus, Clock, CheckCircle2, Mail, UserPlus, 
    ChevronRight, Archive, ZoomIn, ZoomOut, RotateCcw, FileText, User, Calendar, 
    Hash, Building2, Tag, Paperclip, Info, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationUnit {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface FollowUp {
    id: number;
    follow_up_date: string;
    follow_up_type: string;
    follow_up_type_label: string;
    description: string;
    status: string;
    creator: {
        name: string;
    };
}

interface Disposition {
    id: number;
    parent_disposition_id: number | null;
    instruction: string;
    priority: 'normal' | 'high' | 'urgent';
    deadline: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    notes: string | null;
    read_at: string | null;
    completed_at: string | null;
    from_user: User;
    to_user: User;
    child_dispositions: Disposition[];
    follow_ups: FollowUp[];
    created_at: string;
}

interface OutgoingLetter {
    id: number;
    letter_number: string;
    subject: string;
    created_at: string;
}

interface Meeting {
    id: number;
    title: string;
    scheduled_at: string;
}

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    sender: string;
    subject: string;
    original_date: string;
    received_date: string;
    category: string;
    classification: 'biasa' | 'penting' | 'segera' | 'rahasia';
    description: string | null;
    attachment_count: number;
    attachment_description: string | null;
    file_path: string | null;
    status: 'new' | 'in_disposition' | 'completed' | 'archived';
    notes: string | null;
    organization_unit: OrganizationUnit;
    registrar: User;
    dispositions: Disposition[];
    outgoing_letters: OutgoingLetter[];
    meetings: Meeting[];
    created_at: string;
    updated_at: string;
    archive?: {
        id: number;
        document_number: string;
        archived_at: string;
    };
}

interface Props {
    letter: IncomingLetter;
    can_edit: boolean;
    can_delete: boolean;
    can_create_disposition: boolean;
}

export default function Show({ letter, can_edit, can_delete, can_create_disposition }: Props) {
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [previewScale, setPreviewScale] = useState(0.7);
    const previewContainerRef = useRef<HTMLDivElement>(null);

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
                const optimalScale = Math.min(scaleByHeight, scaleByWidth, 0.8);
                
                setPreviewScale(Math.max(0.3, optimalScale));
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Helper function to check if all dispositions are completed (recursively)
    const areAllDispositionsCompleted = (dispositions: Disposition[]): boolean => {
        if (dispositions.length === 0) return false; // No dispositions means not completed
        
        return dispositions.every((disposition) => {
            const isThisCompleted = disposition.status === 'completed';
            const areChildrenCompleted = disposition.child_dispositions.length === 0 || 
                                        areAllDispositionsCompleted(disposition.child_dispositions);
            return isThisCompleted && areChildrenCompleted;
        });
    };

    // Check if we should show "Buat Disposisi" button
    // Show if: status is not completed/archived AND (no dispositions OR not all completed)
    const shouldShowCreateDisposition = can_create_disposition && 
                                       !['completed', 'archived'].includes(letter.status) &&
                                       !areAllDispositionsCompleted(letter.dispositions);

    const handleDelete = () => {
        router.delete(route('arsip.incoming-letters.destroy', letter.id), {
            onSuccess: () => {
                toast.success('Surat masuk berhasil dihapus');
                setShowDeleteDialog(false);
            },
            onError: () => {
                toast.error('Gagal menghapus surat masuk');
            },
        });
    };

    const handleArchive = () => {
        router.post(route('arsip.archives.archive-incoming-letter', letter.id), {}, {
            onSuccess: () => {
                setShowArchiveDialog(false);
                toast.success('Surat masuk berhasil diarsipkan');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ') || 'Gagal mengarsipkan surat';
                toast.error(errorMessage);
            },
        });
    };

    const getStatusBadge = (status: IncomingLetter['status']) => {
        const variants: Record<IncomingLetter['status'], { variant: any; icon: any; label: string }> = {
            new: { variant: 'default', icon: Mail, label: 'Baru' },
            in_disposition: { variant: 'secondary', icon: Clock, label: 'Dalam Disposisi' },
            completed: { variant: 'success', icon: CheckCircle2, label: 'Selesai' },
            archived: { variant: 'outline', icon: FileText, label: 'Diarsipkan' },
        };
        const config = variants[status] || variants.new; // Fallback to new if status not found
        const Icon = config.icon;
        return (
            <Badge variant={config.variant as any} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {config.label}
            </Badge>
        );
    };

    const getClassificationBadge = (classification: IncomingLetter['classification']) => {
        const variants: Record<IncomingLetter['classification'], { variant: any; label: string }> = {
            biasa: { variant: 'secondary', label: 'Biasa' },
            penting: { variant: 'default', label: 'Penting' },
            segera: { variant: 'destructive', label: 'Segera' },
            rahasia: { variant: 'outline', label: 'Rahasia' },
        };
        const config = variants[classification] || variants.biasa; // Fallback to biasa if classification not found
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getDispositionStatusBadge = (status: Disposition['status']) => {
        const variants: Record<Disposition['status'], { variant: any; label: string }> = {
            pending: { variant: 'secondary', label: 'Menunggu' },
            in_progress: { variant: 'default', label: 'Dikerjakan' },
            completed: { variant: 'success', label: 'Selesai' },
        };
        const config = variants[status] || variants.pending; // Fallback to pending if status not found
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPriorityBadge = (priority: Disposition['priority']) => {
        const variants: Record<Disposition['priority'], { variant: any; label: string }> = {
            normal: { variant: 'secondary', label: 'Biasa' },
            high: { variant: 'default', label: 'Penting' },
            urgent: { variant: 'destructive', label: 'Segera' },
        };
        const config = variants[priority] || variants.normal; // Fallback to normal if priority not found
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1.5, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.7);
    };

    // Count dispositions recursively
    const countDispositions = (dispositions: Disposition[]): number => {
        return dispositions.reduce((count, d) => count + 1 + countDispositions(d.child_dispositions || []), 0);
    };

    const DispositionTree = ({ dispositions, level = 0 }: { dispositions: Disposition[]; level?: number }) => {
        if (dispositions.length === 0) return null;

        const getFollowUpIcon = (type: string) => {
            switch (type) {
                case 'surat_balasan': return <Mail className="h-3.5 w-3.5" />;
                case 'rapat': return <UserPlus className="h-3.5 w-3.5" />;
                default: return <CheckCircle2 className="h-3.5 w-3.5" />;
            }
        };

        return (
            <div className={level > 0 ? 'ml-8 my-6 border-l-2 border-muted pl-4' : ''}>
                {dispositions.map((disposition) => (
                    <Card key={disposition.id} className="my-4">
                        <CardHeader className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">
                                            {disposition.from_user.name} <ChevronRight className="inline h-4 w-4" /> {disposition.to_user.name}
                                        </CardTitle>
                                        {getDispositionStatusBadge(disposition.status)}
                                        {getPriorityBadge(disposition.priority)}
                                    </div>
                                    <CardDescription>
                                        Dibuat {format(new Date(disposition.created_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                    </CardDescription>
                                </div>
                                <Link href={route('arsip.dispositions.show', disposition.id)}>
                                    <Button variant="outline" size="sm">
                                        Lihat Detail
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Instruksi:</h4>
                                    <p className="text-sm text-muted-foreground">{disposition.instruction}</p>
                                </div>
                                {disposition.deadline && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>Batas waktu: {format(new Date(disposition.deadline), 'dd MMMM yyyy', { locale: idLocale })}</span>
                                    </div>
                                )}
                                {disposition.read_at && (
                                    <div className="text-sm text-muted-foreground">
                                        Dibaca pada {format(new Date(disposition.read_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                    </div>
                                )}
                                {disposition.completed_at && (
                                    <div className="text-sm text-success">
                                        ✓ Diselesaikan pada {format(new Date(disposition.completed_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                    </div>
                                )}
                                
                                {/* Tindak Lanjut Section */}
                                {disposition.follow_ups && disposition.follow_ups.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            Tindak Lanjut ({disposition.follow_ups.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {disposition.follow_ups.map((followUp) => (
                                                <div key={followUp.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                                    <div className="mt-0.5 text-muted-foreground">
                                                        {getFollowUpIcon(followUp.follow_up_type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className="text-xs">
                                                                {followUp.follow_up_type_label}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(new Date(followUp.follow_up_date), 'dd MMM yyyy', { locale: idLocale })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                                                            {followUp.description}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            oleh {followUp.creator.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {disposition.child_dispositions && disposition.child_dispositions.length > 0 && (
                                <DispositionTree dispositions={disposition.child_dispositions} level={level + 1} />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const dispositionCount = countDispositions(letter.dispositions);
    const relatedCount = letter.outgoing_letters.length + letter.meetings.length;

    return (
        <AppLayout>
            <Head title={`Detail Surat Masuk - ${letter.incoming_number}`} />

            <div className="h-[calc(100vh-64px)] flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/arsip/incoming-letters')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-sm font-semibold leading-none">{letter.incoming_number}</h1>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                                {letter.subject}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(letter.status)}
                        {getClassificationBadge(letter.classification)}
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        
                        {letter.file_path && (
                            <a href={route('arsip.incoming-letters.download', letter.id)} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-1.5" />
                                    Unduh
                                </Button>
                            </a>
                        )}
                        
                        {letter.status === 'completed' && !letter.archive && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                onClick={() => setShowArchiveDialog(true)}
                            >
                                <Archive className="h-4 w-4 mr-1.5" />
                                Arsipkan
                            </Button>
                        )}
                        
                        {letter.archive && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-green-600 text-green-600 hover:bg-green-50"
                                onClick={() => router.visit(route('arsip.archives.show', letter.archive!.id))}
                            >
                                <Archive className="h-4 w-4 mr-1.5" />
                                Lihat Arsip
                            </Button>
                        )}
                        
                        {shouldShowCreateDisposition && (
                            <Link href={route('arsip.dispositions.create', { incoming_letter_id: letter.id })}>
                                <Button size="sm">
                                    <UserPlus className="h-4 w-4 mr-1.5" />
                                    Buat Disposisi
                                </Button>
                            </Link>
                        )}
                        
                        {can_edit && (
                            <Link href={route('arsip.incoming-letters.edit', letter.id)}>
                                <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        
                        {can_delete && (
                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Info with Tabs */}
                    <div className="w-[420px] border-r flex flex-col bg-background shrink-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                            <TabsList className="w-full h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b shrink-0">
                                <TabsTrigger 
                                    value="info" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    <Info className="h-3.5 w-3.5 mr-1.5" />
                                    Informasi
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="dispositions" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                    Disposisi {dispositionCount > 0 && `(${dispositionCount})`}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="related" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Terkait {relatedCount > 0 && `(${relatedCount})`}
                                </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="flex-1">
                                <div className="p-4">
                                    {/* Info Tab */}
                                    <TabsContent value="info" className="m-0 space-y-6">
                                        {/* Header Info */}
                                        <div className="space-y-3">
                                            <h2 className="font-semibold text-lg leading-tight">{letter.subject}</h2>
                                            <p className="text-sm text-muted-foreground">Dari: {letter.sender}</p>
                                        </div>

                                        <Separator />

                                        {/* Detail Grid */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <FileText className="h-4 w-4 text-primary" />
                                                Detail Surat
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Nomor Surat Asli</p>
                                                        <p className="text-sm font-medium">{letter.original_number}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Tanggal Surat</p>
                                                        <p className="text-sm font-medium">
                                                            {format(new Date(letter.original_date), 'dd MMMM yyyy', { locale: idLocale })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Tanggal Diterima</p>
                                                        <p className="text-sm font-medium">
                                                            {format(new Date(letter.received_date), 'dd MMMM yyyy', { locale: idLocale })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Classification */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Tag className="h-4 w-4 text-primary" />
                                                Klasifikasi
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Kategori</p>
                                                    <p className="text-sm font-medium">{letter.category || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Sifat</p>
                                                    {getClassificationBadge(letter.classification)}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Organization */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Building2 className="h-4 w-4 text-primary" />
                                                Unit & Registrar
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Unit Organisasi</p>
                                                        <p className="text-sm font-medium">{letter.organization_unit.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Didaftarkan Oleh</p>
                                                        <p className="text-sm font-medium">{letter.registrar.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attachments */}
                                        {letter.attachment_count > 0 && (
                                            <>
                                                <Separator />
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Paperclip className="h-4 w-4 text-primary" />
                                                        Lampiran
                                                    </div>
                                                    <div className="bg-muted/50 rounded-lg p-3">
                                                        <p className="text-sm font-medium">{letter.attachment_count} file</p>
                                                        {letter.attachment_description && (
                                                            <p className="text-xs text-muted-foreground mt-1">{letter.attachment_description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Notes */}
                                        {letter.notes && (
                                            <>
                                                <Separator />
                                                <div className="space-y-3">
                                                    <p className="text-xs font-medium text-muted-foreground">Catatan</p>
                                                    <p className="text-sm">{letter.notes}</p>
                                                </div>
                                            </>
                                        )}

                                        {/* Archive Info */}
                                        {letter.archive && (
                                            <>
                                                <Separator />
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-green-700 mb-2">
                                                        <Archive className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Telah Diarsipkan</span>
                                                    </div>
                                                    <p className="text-xs text-green-600">
                                                        No. Arsip: {letter.archive.document_number}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </TabsContent>

                                    {/* Dispositions Tab */}
                                    <TabsContent value="dispositions" className="m-0 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium">Riwayat Disposisi</h3>
                                            {shouldShowCreateDisposition && (
                                                <Link href={route('arsip.dispositions.create', { incoming_letter_id: letter.id })}>
                                                    <Button size="sm" variant="outline">
                                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                                        Tambah
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>

                                        {letter.dispositions.length === 0 ? (
                                            <div className="text-center py-8">
                                                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                                <p className="text-sm text-muted-foreground">Belum ada disposisi</p>
                                                {shouldShowCreateDisposition && (
                                                    <Link href={route('arsip.dispositions.create', { incoming_letter_id: letter.id })}>
                                                        <Button size="sm" className="mt-3">
                                                            <Plus className="h-4 w-4 mr-1.5" />
                                                            Buat Disposisi Pertama
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        ) : (
                                            <DispositionTree dispositions={letter.dispositions} />
                                        )}
                                    </TabsContent>

                                    {/* Related Tab */}
                                    <TabsContent value="related" className="m-0 space-y-4">
                                        <h3 className="text-sm font-medium">Tindak Lanjut Terkait</h3>

                                        {relatedCount === 0 ? (
                                            <div className="text-center py-8">
                                                <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                                <p className="text-sm text-muted-foreground">Belum ada tindak lanjut terkait</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Outgoing Letters */}
                                                {letter.outgoing_letters.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Surat Keluar</p>
                                                        {letter.outgoing_letters.map((outgoing) => (
                                                            <div key={outgoing.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{outgoing.letter_number}</p>
                                                                    <p className="text-xs text-muted-foreground truncate">{outgoing.subject}</p>
                                                                </div>
                                                                <Link href={route('arsip.letters.show', outgoing.id)}>
                                                                    <Button variant="ghost" size="sm">
                                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Meetings */}
                                                {letter.meetings.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Rapat</p>
                                                        {letter.meetings.map((meeting) => (
                                                            <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{meeting.title}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {format(new Date(meeting.scheduled_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                                                                    </p>
                                                                </div>
                                                                <Link href={route('meeting.meetings.show', meeting.id)}>
                                                                    <Button variant="ghost" size="sm">
                                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </div>

                    {/* Right Panel - Document Preview */}
                    <div ref={previewContainerRef} className="flex-1 bg-muted/30 flex flex-col overflow-hidden">
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b bg-background flex items-center justify-between px-4 shrink-0">
                            <span className="text-xs text-muted-foreground">
                                {letter.file_path ? 'Preview Dokumen' : 'Tidak ada file yang diupload'}
                            </span>
                            {letter.file_path && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleZoom(-0.1)}
                                    >
                                        <ZoomOut className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground w-12 text-center">
                                        {Math.round(previewScale * 100)}%
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleZoom(0.1)}
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
                            )}
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {letter.file_path ? (
                                <div className="flex justify-center">
                                    <iframe
                                        src={`${route('arsip.incoming-letters.preview', letter.id)}#toolbar=0&navpanes=0`}
                                        className="bg-white shadow-lg rounded-lg border"
                                        style={{
                                            width: `${794 * previewScale}px`,
                                            height: `${1123 * previewScale}px`,
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <div 
                                            className="bg-white shadow-lg rounded-lg border flex items-center justify-center mx-auto"
                                            style={{
                                                width: `${794 * previewScale}px`,
                                                height: `${1123 * previewScale}px`,
                                            }}
                                        >
                                            <div className="text-center p-8">
                                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Tidak ada file yang diupload
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Surat masuk ini tidak memiliki file lampiran
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Archive Dialog */}
            <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Arsipkan Surat Masuk</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin mengarsipkan surat masuk ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm text-purple-800">
                                <strong>Info:</strong> Dengan mengarsipkan surat:
                            </p>
                            <ul className="list-disc list-inside text-sm text-purple-800 mt-2 space-y-1">
                                <li>Surat akan disimpan ke dalam sistem arsip untuk penyimpanan jangka panjang</li>
                                <li>Surat harus sudah selesai diproses (status: Selesai)</li>
                                <li>Data surat akan tetap dapat diakses melalui menu Arsip</li>
                                <li>Status surat akan berubah menjadi "Diarsipkan"</li>
                            </ul>
                        </div>
                        <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Nomor Surat:</span>
                                <span className="font-medium">{letter.incoming_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pengirim:</span>
                                <span className="font-medium">{letter.sender}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Perihal:</span>
                                <span className="font-medium">{letter.subject}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tanggal Diterima:</span>
                                <span className="font-medium">
                                    {format(new Date(letter.received_date), 'dd MMMM yyyy', { locale: idLocale })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
                            Batal
                        </Button>
                        <Button 
                            variant="default" 
                            className="bg-purple-600 hover:bg-purple-700" 
                            onClick={handleArchive}
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            Ya, Arsipkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Surat Masuk</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus surat masuk ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">
                                <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan!
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                                <li>Surat masuk akan dihapus secara permanen</li>
                                <li>File yang terlampir akan ikut terhapus</li>
                                <li>Data tidak dapat dipulihkan kembali</li>
                            </ul>
                        </div>
                        <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Nomor Surat:</span>
                                <span className="font-medium">{letter.incoming_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pengirim:</span>
                                <span className="font-medium">{letter.sender}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Perihal:</span>
                                <span className="font-medium">{letter.subject}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Ya, Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
