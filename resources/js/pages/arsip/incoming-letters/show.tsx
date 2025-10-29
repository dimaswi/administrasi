import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
    ArrowLeft, 
    Calendar, 
    Building2, 
    User, 
    FileText, 
    Hash, 
    Tag, 
    Shield, 
    Paperclip, 
    Download, 
    Edit, 
    Trash2,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Mail,
    UserPlus,
    ChevronRight,
    Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    follow_ups_count: number;
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

    const DispositionTree = ({ dispositions, level = 0 }: { dispositions: Disposition[]; level?: number }) => {
        if (dispositions.length === 0) return null;

        return (
            <div className={level > 0 ? 'ml-8 my-6 border-l-2 border-muted pl-4' : ''}>
                {dispositions.map((disposition) => (
                    <Card key={disposition.id} className="my-4">
                        <CardHeader>
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
                                {disposition.follow_ups_count > 0 && (
                                    <Badge variant="outline">
                                        {disposition.follow_ups_count} Tindak Lanjut
                                    </Badge>
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

    return (
        <AppLayout>
            <Head title={`Detail Surat Masuk - ${letter.incoming_number}`} />

            <div className="space-y-6 my-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold">Detail Surat Masuk</h2>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono">{letter.incoming_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {letter.file_path && (
                            <a href={route('arsip.incoming-letters.download', letter.id)} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Unduh File
                                </Button>
                            </a>
                        )}
                        {/* Archive button - only for completed letters that are not archived yet */}
                        {letter.status === 'completed' && !letter.archive && (
                            <Button
                                variant="outline"
                                className="gap-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                                onClick={() => setShowArchiveDialog(true)}
                            >
                                <Archive className="h-4 w-4" />
                                Arsipkan
                            </Button>
                        )}
                        {/* Show archive info if already archived */}
                        {letter.archive && (
                            <Button
                                variant="outline"
                                className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                                onClick={() => router.visit(route('arsip.archives.show', letter.archive!.id))}
                            >
                                <Archive className="h-4 w-4" />
                                Lihat Arsip
                            </Button>
                        )}
                        {shouldShowCreateDisposition && (
                            <Link href={route('arsip.dispositions.create', { incoming_letter_id: letter.id })}>
                                <Button className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Buat Disposisi
                                </Button>
                            </Link>
                        )}
                        {can_edit && (
                            <Link href={route('arsip.incoming-letters.edit', letter.id)}>
                                <Button variant="outline" className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {can_delete && (
                            <Button variant="destructive" className="gap-2" onClick={() => setShowDeleteDialog(true)}>
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={() => router.visit('/arsip/incoming-letters')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>

                {/* Main Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                                <CardTitle className="text-xl">{letter.subject}</CardTitle>
                                <CardDescription>
                                    Dari: <span className="font-medium">{letter.sender}</span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {getStatusBadge(letter.status)}
                                {getClassificationBadge(letter.classification)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Nomor Surat Asli</p>
                                        <p className="text-sm text-muted-foreground">{letter.original_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Tanggal Surat</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(letter.original_date), 'dd MMMM yyyy', { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Tanggal Diterima</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(letter.received_date), 'dd MMMM yyyy', { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Kategori</p>
                                        <p className="text-sm text-muted-foreground">{letter.category}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Unit Organisasi</p>
                                        <p className="text-sm text-muted-foreground">{letter.organization_unit.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Didaftarkan Oleh</p>
                                        <p className="text-sm text-muted-foreground">{letter.registrar.name}</p>
                                    </div>
                                </div>
                                {letter.attachment_count > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Paperclip className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Lampiran</p>
                                            <p className="text-sm text-muted-foreground">
                                                {letter.attachment_count} file
                                                {letter.attachment_description && ` - ${letter.attachment_description}`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {letter.description && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Keterangan</h3>
                                    <p className="text-sm text-muted-foreground">{letter.description}</p>
                                </div>
                            </>
                        )}

                        {letter.notes && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Catatan</h3>
                                    <p className="text-sm text-muted-foreground">{letter.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Dispositions */}
                {letter.dispositions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Riwayat Disposisi</h2>
                            {shouldShowCreateDisposition && (
                                <Link href={route('arsip.dispositions.create', { incoming_letter_id: letter.id })}>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Tambah Disposisi
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <DispositionTree dispositions={letter.dispositions} />
                    </div>
                )}

                {/* Integrations */}
                {(letter.outgoing_letters.length > 0 || letter.meetings.length > 0) && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Tindak Lanjut</h2>
                        
                        {letter.outgoing_letters.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Surat Keluar Terkait</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {letter.outgoing_letters.map((outgoing) => (
                                            <div key={outgoing.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{outgoing.letter_number}</p>
                                                    <p className="text-sm text-muted-foreground">{outgoing.subject}</p>
                                                </div>
                                                <Link href={route('arsip.letters.show', outgoing.id)}>
                                                    <Button variant="ghost" size="sm">Lihat</Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {letter.meetings.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Rapat Terkait</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {letter.meetings.map((meeting) => (
                                            <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{meeting.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(meeting.scheduled_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                                    </p>
                                                </div>
                                                <Link href={route('meetings.show', meeting.id)}>
                                                    <Button variant="ghost" size="sm">Lihat</Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
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
