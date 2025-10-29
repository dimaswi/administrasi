import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ActionItems } from "@/components/meeting/action-items";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Meeting, MeetingParticipant, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { 
    Calendar, 
    Clock, 
    DoorOpen, 
    Edit3, 
    FileText, 
    MapPin, 
    User, 
    Users,
    Building2,
    CheckCircle2,
    XCircle,
    Download,
    Loader2,
    Play,
    Ban,
} from "lucide-react";
import { format, parse, isBefore, subMinutes } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface Props extends SharedData {
    meeting: Meeting;
    users: Array<{ id: number; name: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Rapat', href: '/meeting/meetings' },
    { title: 'Detail Rapat', href: '#' },
];

export default function MeetingShow({ meeting, users }: Props) {
    const { auth } = usePage<SharedData>().props;
    
    const [markAttendanceDialog, setMarkAttendanceDialog] = useState<{
        open: boolean;
        participant: MeetingParticipant | null;
        status: string;
        loading: boolean;
    }>({
        open: false,
        participant: null,
        status: 'attended',
        loading: false,
    });

    const [cancelDialog, setCancelDialog] = useState({
        open: false,
        loading: false,
    });

    const [completeDialog, setCompleteDialog] = useState({
        open: false,
        loading: false,
    });

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ongoing':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'completed':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            draft: 'Draft',
            scheduled: 'Terjadwal',
            ongoing: 'Berlangsung',
            completed: 'Selesai',
            cancelled: 'Dibatalkan',
        };
        return labels[status] || status;
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            participant: 'Peserta',
            moderator: 'Moderator',
            secretary: 'Notulis',
            observer: 'Observer',
        };
        return labels[role] || role;
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'moderator':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'secretary':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'observer':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getAttendanceLabel = (status: string) => {
        const labels: Record<string, string> = {
            invited: 'Diundang',
            confirmed: 'Dikonfirmasi',
            attended: 'Hadir',
            absent: 'Tidak Hadir',
            excused: 'Izin',
        };
        return labels[status] || status;
    };

    const getAttendanceBadgeColor = (status: string) => {
        switch (status) {
            case 'attended':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'absent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'excused':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleMarkAttendance = (participant: MeetingParticipant, status: string) => {
        setMarkAttendanceDialog({
            open: true,
            participant,
            status,
            loading: false,
        });
    };

    const handleConfirmMarkAttendance = () => {
        if (!markAttendanceDialog.participant) return;

        setMarkAttendanceDialog(prev => ({ ...prev, loading: true }));

        router.put(
            `/meeting/meetings/${meeting.id}/participants/${markAttendanceDialog.participant.id}/attendance`,
            { attendance_status: markAttendanceDialog.status },
            {
                onSuccess: () => {
                    toast.success('Status kehadiran berhasil diperbarui');
                    setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false });
                },
                onError: () => {
                    toast.error('Gagal memperbarui status kehadiran');
                    setMarkAttendanceDialog(prev => ({ ...prev, loading: false }));
                },
            }
        );
    };

    const handleGenerateDocument = (type: 'invitation' | 'memo' | 'attendance') => {
        // Validasi untuk memo hanya bisa download jika status completed
        if (type === 'memo' && meeting.status !== 'completed') {
            toast.error('Memo hanya dapat didownload setelah rapat selesai');
            return;
        }

        const urls: Record<string, string> = {
            invitation: `/meeting/meetings/${meeting.id}/generate-invitation`,
            memo: `/meeting/meetings/${meeting.id}/generate-memo`,
            attendance: `/meeting/meetings/${meeting.id}/generate-attendance`,
        };

        window.open(urls[type], '_blank');
    };

    const handleStartMeeting = () => {
        router.post(`/meeting/meetings/${meeting.id}/start`, {}, {
            preserveScroll: true,
        });
    };

    const handleCancelMeeting = () => {
        setCancelDialog({ ...cancelDialog, loading: true });
        
        router.post(`/meeting/meetings/${meeting.id}/cancel`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setCancelDialog({ open: false, loading: false });
            },
            onError: () => {
                setCancelDialog({ ...cancelDialog, loading: false });
            },
        });
    };

    const handleCompleteMeeting = () => {
        setCompleteDialog({ ...completeDialog, loading: true });
        
        router.put(`/meeting/meetings/${meeting.id}/complete`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setCompleteDialog({ open: false, loading: false });
            },
            onError: () => {
                setCompleteDialog({ ...completeDialog, loading: false });
            },
        });
    };

    const isModerator = meeting.participants?.some(
        p => p.user_id === auth.user.id && p.role === 'moderator'
    );

    // Check if meeting can be started (30 minutes before)
    const canStartMeeting = useMemo(() => {
        if (!['draft', 'scheduled'].includes(meeting.status)) {
            return false;
        }

        try {
            const now = new Date();
            
            // meeting_date dari Laravel format: "2025-10-27T00:00:00.000000Z"
            // Ambil hanya bagian tanggalnya (YYYY-MM-DD)
            let dateStr = String(meeting.meeting_date);
            
            // Ambil 10 karakter pertama untuk mendapat YYYY-MM-DD
            if (dateStr.length > 10) {
                dateStr = dateStr.substring(0, 10);
            }
            
            // Gabungkan tanggal dan waktu
            // Format: YYYY-MM-DD HH:mm:ss
            const meetingDateTimeStr = `${dateStr} ${meeting.start_time}`;
            
            const meetingDateTime = parse(
                meetingDateTimeStr,
                'yyyy-MM-dd HH:mm:ss',
                new Date()
            );
            
            // Allow starting 30 minutes before
            const allowedStartTime = subMinutes(meetingDateTime, 30);

            return now >= allowedStartTime;
        } catch (error) {
            console.error('Error parsing meeting datetime:', error);
            return false;
        }
    }, [meeting.meeting_date, meeting.start_time, meeting.status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Rapat - ${meeting.title}`} />
            <div className="p-4 max-w-7xl">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold">{meeting.title}</h2>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono">{meeting.meeting_number}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(meeting.status === 'draft' || meeting.status === 'cancelled') && (
                            <Button
                                variant="outline"
                                onClick={() => router.visit(`/meeting/meetings/${meeting.id}/edit`)}
                                className="flex-1 sm:flex-none"
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                {meeting.status === 'cancelled' ? 'Jadwalkan Ulang' : 'Edit'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Informasi Rapat */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                <Calendar className="h-5 w-5" />
                                Informasi Rapat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className={getStatusBadgeColor(meeting.status)}>
                                            {getStatusLabel(meeting.status)}
                                        </Badge>
                                        {isModerator && (meeting.status === 'draft' || meeting.status === 'scheduled') && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={handleStartMeeting}
                                                disabled={!canStartMeeting}
                                                className="h-8"
                                                title={!canStartMeeting ? 'Rapat dapat dimulai 30 menit sebelum waktu yang dijadwalkan' : 'Mulai rapat sekarang'}
                                            >
                                                <Play className="mr-1 h-3 w-3" />
                                                Mulai Rapat
                                            </Button>
                                        )}
                                        {meeting.status === 'ongoing' && isModerator && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => setCompleteDialog({ ...completeDialog, open: true })}
                                                className="h-8 bg-purple-600 hover:bg-purple-700"
                                            >
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Selesaikan Rapat
                                            </Button>
                                        )}
                                        {(meeting.status === 'draft' || meeting.status === 'scheduled' || meeting.status === 'ongoing') && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setCancelDialog({ ...cancelDialog, open: true })}
                                                className="h-8"
                                            >
                                                <Ban className="mr-1 h-3 w-3" />
                                                Batal Rapat
                                            </Button>
                                        )}
                                        {!canStartMeeting && isModerator && (meeting.status === 'draft' || meeting.status === 'scheduled') && (
                                            <p className="text-xs text-muted-foreground w-full mt-1">
                                                Rapat dapat dimulai 30 menit sebelum waktu yang dijadwalkan
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Penyelenggara</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm md:text-base">{meeting.organizer?.name || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm md:text-base">
                                            {format(new Date(meeting.meeting_date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Waktu</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm md:text-base">
                                            {meeting.start_time} - {meeting.end_time} WIB
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Ruangan</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                        <span>{meeting.room?.name || '-'}</span>
                                    </div>
                                    {meeting.room?.building && (
                                        <div className="mt-1 ml-6 text-sm text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            {meeting.room.building} {meeting.room.floor ? `Lt. ${meeting.room.floor}` : ''}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Unit Organisasi</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{meeting.organization_unit?.name || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Agenda</label>
                                <p className="mt-1 text-sm whitespace-pre-line">{meeting.agenda}</p>
                            </div>

                            {meeting.notes && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                                    <p className="mt-1 text-sm whitespace-pre-line">{meeting.notes}</p>
                                </div>
                            )}

                            {meeting.minutes_of_meeting && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Notulensi</label>
                                    <p className="mt-1 text-sm whitespace-pre-line">{meeting.minutes_of_meeting}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Daftar Peserta */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                        <Users className="h-5 w-5" />
                                        Daftar Peserta ({meeting.participants?.length || 0})
                                    </CardTitle>
                                    <CardDescription>
                                        {meeting.attended_participants_count || 0} hadir dari {meeting.participants?.length || 0} peserta
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => router.visit(`/meeting/meetings/${meeting.id}/attendance`)}
                                    className="w-full sm:w-auto"
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    title={meeting.status !== 'ongoing' && meeting.status !== 'completed' ? 'Daftar hadir dapat diakses setelah rapat dimulai' : 'Kelola daftar hadir'}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Kelola Daftar Hadir
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {meeting.participants && meeting.participants.length > 0 ? (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block rounded-md border overflow-x-auto">
                                        <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>NIP</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Peran</TableHead>
                                                <TableHead>Status Kehadiran</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {meeting.participants.map((participant, index) => (
                                                <TableRow key={participant.id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {participant.user?.name || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {participant.user?.nip || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {participant.user?.organization_unit?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getRoleBadgeColor(participant.role)}>
                                                            {getRoleLabel(participant.role)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getAttendanceBadgeColor(participant.attendance_status)}>
                                                            {getAttendanceLabel(participant.attendance_status)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-3">
                                    {meeting.participants.map((participant, index) => (
                                        <div key={participant.id} className="border rounded-lg p-3 space-y-2 bg-card">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{participant.user?.name || '-'}</div>
                                                    <div className="font-mono text-xs text-muted-foreground">{participant.user?.nip || '-'}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {participant.user?.organization_unit?.name || '-'}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <Badge variant="outline" className={getRoleBadgeColor(participant.role)}>
                                                        {getRoleLabel(participant.role)}
                                                    </Badge>
                                                    <Badge variant="outline" className={getAttendanceBadgeColor(participant.attendance_status)}>
                                                        {getAttendanceLabel(participant.attendance_status)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Belum ada peserta
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dokumen */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                        <FileText className="h-5 w-5" />
                                        Dokumen Rapat
                                    </CardTitle>
                                    <CardDescription>Generate dan kelola dokumen terkait rapat</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => router.visit(`/meeting/meetings/${meeting.id}/memo`)}
                                    className="w-full sm:w-auto"
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    title={meeting.status !== 'ongoing' && meeting.status !== 'completed' ? 'Memo dapat diakses setelah rapat dimulai' : 'Edit memo rapat'}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Edit Memo
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start gap-2 p-4 touch-manipulation"
                                    onClick={() => handleGenerateDocument('invitation')}
                                >
                                    <Download className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-sm md:text-base">Undangan Rapat</div>
                                        <div className="text-xs text-muted-foreground">
                                            Download undangan dalam format PDF
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start gap-2 p-4 touch-manipulation"
                                    onClick={() => router.visit(`/meeting/meetings/${meeting.id}/attendance`)}
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    title={meeting.status !== 'ongoing' && meeting.status !== 'completed' ? 'Konfirmasi kehadiran dapat dilakukan setelah rapat dimulai' : 'Konfirmasi kehadiran Anda'}
                                >
                                    <Download className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-sm md:text-base">Konfirmasi Kehadiran</div>
                                        <div className="text-xs text-muted-foreground">
                                            Konfirmasi kehadiran Anda di rapat ini
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start gap-2 p-4 touch-manipulation"
                                    onClick={() => router.visit(`/meeting/meetings/${meeting.id}/memo`)}
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    title={meeting.status !== 'ongoing' && meeting.status !== 'completed' ? 'Memo dapat diakses setelah rapat dimulai' : 'Buat dan download memo hasil rapat'}
                                >
                                    <Download className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-sm md:text-base">Memo Hasil Rapat</div>
                                        <div className="text-xs text-muted-foreground">
                                            Buat dan download memo hasil rapat
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Items */}
                    {(meeting.status === 'ongoing' || meeting.status === 'completed') && (
                        <ActionItems
                            meetingId={meeting.id}
                            canEdit={isModerator || false}
                            users={users}
                        />
                    )}
                </div>
            </div>

            {/* Mark Attendance Dialog */}
            <Dialog open={markAttendanceDialog.open} onOpenChange={(open) => !open && setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Kehadiran</DialogTitle>
                        <DialogDescription>
                            Tandai <strong>{markAttendanceDialog.participant?.user?.name}</strong> sebagai{' '}
                            <strong>{getAttendanceLabel(markAttendanceDialog.status)}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false })}
                            disabled={markAttendanceDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirmMarkAttendance}
                            disabled={markAttendanceDialog.loading}
                        >
                            {markAttendanceDialog.loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Konfirmasi'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Meeting Dialog */}
            <Dialog open={completeDialog.open} onOpenChange={(open) => !open && setCompleteDialog({ open: false, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selesaikan Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyelesaikan rapat <strong>{meeting.title}</strong>?
                            <br />
                            <br />
                            Setelah diselesaikan:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Status rapat akan menjadi "Selesai"</li>
                                <li>Peserta yang belum hadir akan otomatis ditandai "Tidak Hadir"</li>
                                <li>Rapat tidak dapat diubah lagi</li>
                                <li>Memo dapat didownload dalam format PDF</li>
                            </ul>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCompleteDialog({ open: false, loading: false })}
                            disabled={completeDialog.loading}
                        >
                            Tidak
                        </Button>
                        <Button
                            onClick={handleCompleteMeeting}
                            disabled={completeDialog.loading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {completeDialog.loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyelesaikan...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Ya, Selesaikan Rapat
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Meeting Dialog */}
            <Dialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan rapat <strong>{meeting.title}</strong>?
                            <br />
                            <br />
                            Rapat yang dibatalkan dapat dijadwalkan ulang kembali.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCancelDialog({ open: false, loading: false })}
                            disabled={cancelDialog.loading}
                        >
                            Tidak
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelMeeting}
                            disabled={cancelDialog.loading}
                        >
                            {cancelDialog.loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Membatalkan...
                                </>
                            ) : (
                                <>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Ya, Batalkan Rapat
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
