import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Meeting, BreadcrumbItem, Auth } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Props {
    meeting: Meeting;
    auth: Auth;
}

export default function AttendanceCheck({ meeting, auth }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Rapat', href: '/meeting/meetings' },
        { title: meeting.title, href: `/meeting/meetings/${meeting.id}` },
        { title: 'Konfirmasi Kehadiran', href: `/meeting/meetings/${meeting.id}/attendance` },
    ];

    const [confirmDialog, setConfirmDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Cari partisipan untuk user yang login
    const userParticipant = meeting.participants?.find(p => p.user_id === auth.user.id);

    // Check if meeting is ongoing or completed
    const canCheckIn = ['ongoing', 'completed'].includes(meeting.status);

    const handleMarkAttendance = () => {
        if (!userParticipant) return;

        setProcessing(true);
        router.post(`/meeting/meetings/${meeting.id}/check-in`, {}, {
            onFinish: () => {
                setProcessing(false);
                setConfirmDialog(false);
            },
        });
    };

    const meetingDate = new Date(meeting.meeting_date);
    const formattedDate = format(meetingDate, 'EEEE, dd MMMM yyyy', { locale: indonesianLocale });

    const getAttendanceBadge = (status: string) => {
        const badges = {
            invited: <Badge className="bg-gray-100 text-gray-800">Diundang</Badge>,
            confirmed: <Badge className="bg-blue-100 text-blue-800">Dikonfirmasi</Badge>,
            attended: <Badge className="bg-green-100 text-green-800">Hadir</Badge>,
            absent: <Badge className="bg-red-100 text-red-800">Tidak Hadir</Badge>,
            excused: <Badge className="bg-yellow-100 text-yellow-800">Berhalangan</Badge>,
        };
        return badges[status as keyof typeof badges] || badges.invited;
    };

    const getRoleBadge = (role: string) => {
        const badges = {
            participant: <Badge variant="outline">Peserta</Badge>,
            moderator: <Badge className="bg-purple-100 text-purple-800">Moderator</Badge>,
            secretary: <Badge className="bg-green-100 text-green-800">Sekretaris</Badge>,
            observer: <Badge variant="outline">Observer</Badge>,
        };
        return badges[role as keyof typeof badges] || badges.participant;
    };

    return (
        <AppLayout>
            <Head title={`Kehadiran - ${meeting.title}`} />

            <div className="p-4 max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold">Konfirmasi Kehadiran</h2>
                        <p className="text-xs md:text-sm text-muted-foreground">Konfirmasi kehadiran Anda untuk rapat ini</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}
                        className="w-full sm:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                {/* Meeting Info */}
                <Card className='mb-6'>
                    <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Informasi Rapat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">No. Rapat</p>
                                <p className="font-medium text-sm md:text-base">{meeting.meeting_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="mt-1">
                                    {meeting.status === 'draft' && <Badge variant="outline">Draft</Badge>}
                                    {meeting.status === 'scheduled' && <Badge className="bg-blue-100 text-blue-800">Dijadwalkan</Badge>}
                                    {meeting.status === 'ongoing' && <Badge className="bg-green-100 text-green-800">Berlangsung</Badge>}
                                    {meeting.status === 'completed' && <Badge className="bg-gray-100 text-gray-800">Selesai</Badge>}
                                    {meeting.status === 'cancelled' && <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Judul</p>
                                <p className="font-medium text-sm md:text-base">{meeting.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tanggal</p>
                                <p className="font-medium text-sm md:text-base">{formattedDate}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Waktu</p>
                                <p className="font-medium text-sm md:text-base">{meeting.start_time} - {meeting.end_time} WIB</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tempat</p>
                                <p className="font-medium text-sm md:text-base">
                                    {meeting.room?.name} - {meeting.room?.location}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Agenda</p>
                            <p className="mt-1 text-sm">{meeting.agenda}</p>
                        </div>

                        {meeting.notes && (
                            <div>
                                <p className="text-sm text-muted-foreground">Catatan</p>
                                <p className="mt-1 text-sm">{meeting.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance Status */}
                {!userParticipant ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-base md:text-lg font-semibold mb-2">Anda Bukan Peserta</h3>
                                <p className="text-sm md:text-base text-muted-foreground">
                                    Anda tidak terdaftar sebagai peserta dalam rapat ini.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Status Kehadiran Anda</CardTitle>
                            <CardDescription>
                                Informasi kehadiran dan role Anda dalam rapat ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Nama</p>
                                    <p className="font-medium text-sm md:text-base">{auth.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Role</p>
                                    {getRoleBadge(userParticipant.role)}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Status Kehadiran</p>
                                    {getAttendanceBadge(userParticipant.attendance_status)}
                                </div>
                            </div>

                            {userParticipant.check_in_time && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Waktu Check-in</p>
                                    <p className="font-medium">{userParticipant.check_in_time}</p>
                                </div>
                            )}

                            {/* Action Button */}
                            {(meeting.status === 'ongoing' || meeting.status === 'scheduled') && 
                             userParticipant.attendance_status !== 'attended' && (
                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={() => setConfirmDialog(true)}
                                        className="w-full touch-manipulation"
                                        size="lg"
                                        disabled={!canCheckIn}
                                        title={!canCheckIn ? 'Check-in dapat dilakukan setelah rapat dimulai' : 'Konfirmasi kehadiran Anda'}
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Konfirmasi Kehadiran
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        {canCheckIn 
                                            ? 'Check-in dapat dilakukan hingga akhir rapat'
                                            : 'Check-in dibuka setelah rapat dimulai'
                                        }
                                    </p>
                                </div>
                            )}

                            {userParticipant.attendance_status === 'attended' && (
                                <div className="pt-4 border-t">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                        <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                                        <p className="text-sm md:text-base font-semibold text-green-800">Kehadiran Telah Dikonfirmasi</p>
                                        <p className="text-xs md:text-sm text-green-600 mt-1">
                                            Terima kasih atas partisipasi Anda dalam rapat ini
                                        </p>
                                    </div>
                                </div>
                            )}

                            {meeting.status === 'completed' && userParticipant.attendance_status !== 'attended' && (
                                <div className="pt-4 border-t">
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                        <p className="text-sm md:text-base font-semibold text-gray-800">Rapat Telah Selesai</p>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                                            Konfirmasi kehadiran tidak dapat dilakukan lagi
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Kehadiran</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin mengkonfirmasi kehadiran Anda untuk rapat ini?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleMarkAttendance}
                            disabled={processing}
                        >
                            {processing ? 'Memproses...' : 'Ya, Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
