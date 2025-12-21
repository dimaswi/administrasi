import AppLayout from '@/layouts/app-layout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    Mail,
    Play,
    Plus,
    Upload,
    User,
} from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
}

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    sender: string;
    subject: string;
    received_date: string;
}

interface OutgoingLetter {
    id: number;
    letter_number: string;
    subject: string;
}

interface Meeting {
    id: number;
    meeting_number: string;
    title: string;
    meeting_date: string;
}

interface AvailableLetter {
    id: number;
    letter_number: string;
    subject: string;
    letter_date: string;
}

interface FollowUp {
    id: number;
    follow_up_type: string;
    description: string;
    file_path: string | null;
    outgoing_letter: OutgoingLetter | null;
    meeting: Meeting | null;
    creator: User;
    created_at: string;
}

interface ChildDisposition {
    id: number;
    instruction: string;
    priority: 'normal' | 'high' | 'urgent';
    deadline: string | null;
    status: 'pending' | 'read' | 'in_progress' | 'completed';
    to_user: User;
    created_at: string;
}

interface Disposition {
    id: number;
    incoming_letter: IncomingLetter;
    parent_disposition_id: number | null;
    instruction: string;
    priority: 'normal' | 'high' | 'urgent';
    deadline: string | null;
    status: 'pending' | 'read' | 'in_progress' | 'completed';
    notes: string | null;
    read_at: string | null;
    completed_at: string | null;
    from_user: User;
    to_user: User;
    follow_ups: FollowUp[];
    child_dispositions: ChildDisposition[];
    created_at: string;
}

interface Props {
    disposition: Disposition;
    can_update_status: boolean;
    can_add_follow_up: boolean;
    can_create_child_disposition: boolean;
    can_delete: boolean;
    available_meetings: Meeting[];
    available_letters: AvailableLetter[];
    debug_user_org?: number;
}

export default function Show({ 
    disposition, 
    can_update_status, 
    can_add_follow_up, 
    can_create_child_disposition,
    can_delete,
    available_meetings,
    available_letters,
    debug_user_org
}: Props) {
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debug permissions
    console.log('Permission Flags:', {
        can_update_status,
        can_add_follow_up,
        can_create_child_disposition,
        can_delete
    });
    console.log('Disposition Info:', {
        status: disposition.status,
        from_user_id: disposition.from_user.id,
        to_user_id: disposition.to_user.id,
        has_children: disposition.child_dispositions.length
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        follow_up_type: '',
        description: '',
        outgoing_letter_id: 0,
        meeting_id: 0,
        file: null as File | null,
    });

    // Prepare options for SearchableSelect
    const followUpTypeOptions: SearchableSelectOption[] = [
        { value: 'surat_balasan', label: 'Surat Balasan' },
        { value: 'rapat', label: 'Rapat' },
        { value: 'kunjungan', label: 'Kunjungan' },
        { value: 'telepon', label: 'Telepon' },
        { value: 'tidak_perlu', label: 'Tidak Perlu Tindak Lanjut' },
        { value: 'lainnya', label: 'Lainnya' },
    ];

    const meetingOptions: SearchableSelectOption[] = available_meetings.map(meeting => ({
        value: meeting.id.toString(),
        label: `${meeting.meeting_number} - ${meeting.title}`,
        description: format(new Date(meeting.meeting_date), 'dd MMM yyyy', { locale: idLocale })
    }));

    const letterOptions: SearchableSelectOption[] = available_letters.map(letter => ({
        value: letter.id.toString(),
        label: `${letter.letter_number}`,
        description: letter.subject
    }));

    const handleMarkInProgress = () => {
        router.post(route('arsip.dispositions.mark-in-progress', disposition.id), {}, {
            onError: () => toast.error('Gagal memperbarui status'),
        });
    };

    const handleMarkCompleted = () => {
        if (disposition.follow_ups.length === 0) {
            toast.error('Silakan tambahkan tindak lanjut terlebih dahulu');
            return;
        }
        setShowCompleteDialog(true);
    };

    const confirmComplete = () => {
        router.post(route('arsip.dispositions.mark-completed', disposition.id), {}, {
            onSuccess: () => {
                setShowCompleteDialog(false);
            },
            onError: () => toast.error('Gagal menyelesaikan disposisi'),
        });
    };

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        router.delete(route('arsip.dispositions.destroy', disposition.id), {
            onSuccess: () => {
                setShowDeleteDialog(false);
            },
            onError: () => toast.error('Gagal membatalkan disposisi'),
        });
    };

    const handleSubmitFollowUp: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Prepare data based on follow_up_type
        const formData = new FormData();
        formData.append('follow_up_date', format(new Date(), 'yyyy-MM-dd'));
        formData.append('follow_up_type', data.follow_up_type);
        formData.append('description', data.description);
        
        // Only add meeting_id if type is rapat and value is valid
        if (data.follow_up_type === 'rapat' && data.meeting_id > 0) {
            formData.append('meeting_id', data.meeting_id.toString());
        }
        
        // Only add outgoing_letter_id if type is surat_balasan and value is valid
        if (data.follow_up_type === 'surat_balasan' && data.outgoing_letter_id > 0) {
            formData.append('outgoing_letter_id', data.outgoing_letter_id.toString());
        }
        
        // Add file if exists
        if (data.file) {
            formData.append('file', data.file);
        }
        
        router.post(route('arsip.dispositions.follow-up', disposition.id), formData, {
            onSuccess: () => {
                reset();
                setShowFollowUpForm(false);
            },
            onError: () => toast.error('Gagal menambahkan tindak lanjut'),
        });
    };

    const getStatusBadge = (status: Disposition['status']) => {
        const variants: Record<Disposition['status'], { variant: any; icon: any; label: string }> = {
            pending: { variant: 'secondary', icon: Clock, label: 'Menunggu' },
            read: { variant: 'secondary', icon: CheckCircle2, label: 'Sudah Dibaca' },
            in_progress: { variant: 'default', icon: Clock, label: 'Dikerjakan' },
            completed: { variant: 'success', icon: CheckCircle2, label: 'Selesai' },
        };
        const config = variants[status] || variants.pending; // Fallback to pending if status not found
        const Icon = config.icon;
        return (
            <Badge variant={config.variant as any} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {config.label}
            </Badge>
        );
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

    const getFollowUpTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            surat_balasan: 'Surat Balasan',
            rapat: 'Rapat',
            kunjungan: 'Kunjungan',
            telepon: 'Telepon',
            tidak_perlu: 'Tidak Perlu Tindak Lanjut',
            lainnya: 'Lainnya',
        };
        return labels[type] || type;
    };

    const isOverdue = disposition.deadline && new Date(disposition.deadline) < new Date() && disposition.status !== 'completed';

    const actionButtons = (
        <>
            {can_update_status && (disposition.status === 'pending' || disposition.status === 'read') && (
                <Button onClick={handleMarkInProgress} className="gap-2">
                    <Play className="h-4 w-4" />
                    Mulai Kerjakan
                </Button>
            )}
            {can_update_status && disposition.status === 'in_progress' && (
                <Button onClick={handleMarkCompleted} variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Selesaikan Disposisi
                </Button>
            )}
            {can_create_child_disposition && (
                <Link href={route('arsip.dispositions.create', { parent_disposition_id: disposition.id })}>
                    <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Disposisikan Lagi
                    </Button>
                </Link>
            )}
            <Link href={route('arsip.incoming-letters.show', disposition.incoming_letter.id)}>
                <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Lihat Surat
                </Button>
            </Link>
            {can_delete && (
                <Button onClick={handleDelete} variant="destructive" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Batalkan Disposisi
                </Button>
            )}
        </>
    );

    return (
        <AppLayout>
            <Head title={`Detail Disposisi - ${disposition.incoming_letter.incoming_number}`} />

            <DetailPage
                title="Detail Disposisi"
                description={disposition.incoming_letter.subject}
                backUrl={route('arsip.dispositions.index')}
                actions={actionButtons}
            >

                {/* Status Alert */}
                {isOverdue && (
                    <Card className="border-destructive bg-destructive/5">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <div>
                                    <p className="font-medium text-destructive">Disposisi Terlambat</p>
                                    <p className="text-sm text-muted-foreground">
                                        Batas waktu: {format(new Date(disposition.deadline!), 'dd MMMM yyyy', { locale: idLocale })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Info */}
                <Card>
                    <CardHeader className='pt-4'>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                                <CardTitle className="text-xl">
                                    {disposition.from_user.name} <ChevronRight className="inline h-5 w-5" /> {disposition.to_user.name}
                                </CardTitle>
                                <CardDescription>
                                    Dibuat {format(new Date(disposition.created_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {getStatusBadge(disposition.status)}
                                {getPriorityBadge(disposition.priority)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium mb-2">Instruksi:</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{disposition.instruction}</p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Surat Masuk</p>
                                    <p className="text-sm text-muted-foreground">{disposition.incoming_letter.incoming_number}</p>
                                    <p className="text-sm text-muted-foreground">{disposition.incoming_letter.subject}</p>
                                </div>
                            </div>

                            {disposition.deadline && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Batas Waktu</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(disposition.deadline), 'dd MMMM yyyy', { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {disposition.read_at && (
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Dibaca Pada</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(disposition.read_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {disposition.completed_at && (
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Diselesaikan Pada</p>
                                        <p className="text-sm text-success">
                                            {format(new Date(disposition.completed_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {disposition.notes && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Catatan:</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{disposition.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Follow Ups */}
                <div className='pt-6'>
                        <Card>
                    <CardHeader className='pt-6'>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Tindak Lanjut</CardTitle>
                                <CardDescription>Catatan dan tindak lanjut disposisi</CardDescription>
                            </div>
                            {can_add_follow_up && !showFollowUpForm && (
                                <Button onClick={() => setShowFollowUpForm(true)} size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Tambah Tindak Lanjut
                                </Button>
                            )}
                            {(disposition.status === 'pending' || disposition.status === 'read') && !can_add_follow_up && (
                                <p className="text-sm text-muted-foreground">
                                    Klik "Mulai Kerjakan" untuk menambah tindak lanjut
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showFollowUpForm && (
                            <form onSubmit={handleSubmitFollowUp} className="space-y-4 p-4 border rounded-lg">
                                <div className="space-y-2">
                                    <Label htmlFor="follow_up_type">
                                        Jenis Tindak Lanjut <span className="text-destructive">*</span>
                                    </Label>
                                    <SearchableSelect
                                        options={followUpTypeOptions}
                                        value={data.follow_up_type}
                                        onValueChange={(value) => setData('follow_up_type', value)}
                                        placeholder="Pilih jenis tindak lanjut"
                                        searchPlaceholder="Cari jenis tindak lanjut..."
                                    />
                                    {errors.follow_up_type && <p className="text-sm text-destructive">{errors.follow_up_type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Keterangan <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Jelaskan tindak lanjut yang dilakukan"
                                        rows={3}
                                        required
                                    />
                                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                </div>

                                {/* Conditional: Show Letter dropdown if type is surat_balasan */}
                                {data.follow_up_type === 'surat_balasan' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="outgoing_letter_id">
                                            Surat Balasan <span className="text-destructive">*</span>
                                        </Label>
                                        <SearchableSelect
                                            options={letterOptions}
                                            value={data.outgoing_letter_id.toString()}
                                            onValueChange={(value) => setData('outgoing_letter_id', parseInt(value))}
                                            placeholder="Pilih surat balasan"
                                            searchPlaceholder="Cari nomor surat..."
                                        />
                                        {errors.outgoing_letter_id && <p className="text-sm text-destructive">{errors.outgoing_letter_id}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            Pilih surat keluar yang merupakan balasan dari disposisi ini
                                        </p>
                                    </div>
                                )}

                                {/* Conditional: Show Meeting dropdown if type is rapat */}
                                {data.follow_up_type === 'rapat' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting_id">
                                            Rapat <span className="text-destructive">*</span>
                                        </Label>
                                        <SearchableSelect
                                            options={meetingOptions}
                                            value={data.meeting_id.toString()}
                                            onValueChange={(value) => setData('meeting_id', parseInt(value))}
                                            placeholder="Pilih rapat"
                                            searchPlaceholder="Cari rapat..."
                                        />
                                        {errors.meeting_id && <p className="text-sm text-destructive">{errors.meeting_id}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            Pilih rapat yang terkait dengan tindak lanjut ini
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="file">File Pendukung (Opsional)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            ref={fileInputRef}
                                            id="file"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setData('file', file);
                                            }}
                                        />
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                                            <Upload className="h-4 w-4" />
                                            {data.file ? 'Ganti File' : 'Pilih File'}
                                        </Button>
                                        {data.file && (
                                            <span className="text-sm text-muted-foreground self-center">{data.file.name}</span>
                                        )}
                                    </div>
                                    {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowFollowUpForm(false);
                                        reset();
                                    }}>
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        )}

                        {disposition.follow_ups.length === 0 && !showFollowUpForm && (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Belum ada tindak lanjut</p>
                            </div>
                        )}

                        {disposition.follow_ups.map((followUp) => (
                            <div key={followUp.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Badge variant="outline">{getFollowUpTypeLabel(followUp.follow_up_type)}</Badge>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {followUp.creator.name} •{' '}
                                            {format(new Date(followUp.created_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{followUp.description}</p>
                                {followUp.outgoing_letter && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <FileText className="h-4 w-4" />
                                        <span>Surat Keluar: {followUp.outgoing_letter.letter_number}</span>
                                        <Link href={route('arsip.letters.show', followUp.outgoing_letter.id)}>
                                            <Button variant="ghost" size="sm">Lihat</Button>
                                        </Link>
                                    </div>
                                )}
                                {followUp.meeting && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4" />
                                        <span>Rapat: {followUp.meeting.title}</span>
                                        <Link href={route('meetings.show', followUp.meeting.id)}>
                                            <Button variant="ghost" size="sm">Lihat</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
                </div>

                {/* Child Dispositions */}
                {disposition.child_dispositions.length > 0 && (
                    <Card>
                        <CardHeader className="p-6">
                        <CardTitle>Sub Disposisi</CardTitle>
                            <CardDescription>Disposisi yang didelegasikan dari disposisi ini</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {disposition.child_dispositions.map((child) => (
                                <div key={child.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{child.to_user.name}</span>
                                            {getStatusBadge(child.status)}
                                            {getPriorityBadge(child.priority)}
                                        </div>
                                        <Link href={route('arsip.dispositions.show', child.id)}>
                                            <Button variant="ghost" size="sm">Lihat</Button>
                                        </Link>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{child.instruction}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </DetailPage>

            {/* Complete Dialog */}
            <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selesaikan Disposisi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Disposisi akan ditandai sebagai selesai. Pastikan semua tindak lanjut sudah tercatat dengan benar.
                            Anda tidak dapat mengubah status setelah disposisi diselesaikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmComplete} className="bg-green-600 hover:bg-green-700">
                            Ya, Selesaikan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Disposisi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus disposisi secara permanen dan tidak dapat dibatalkan.
                            Penerima disposisi tidak akan bisa melihat disposisi ini lagi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Ya, Batalkan Disposisi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
