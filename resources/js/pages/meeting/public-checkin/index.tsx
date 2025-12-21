import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Users, CheckCircle, Timer, AlertTriangle, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';

interface Meeting {
    id: number;
    title: string;
    meeting_number: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    room: string | null;
    organization_unit: string | null;
}

interface Props {
    meeting: Meeting;
    token: string;
    expires_at: string;
    pending_count: number;
    total_count: number;
}

export default function PublicCheckin({ meeting, token, expires_at, pending_count, total_count }: Props) {
    const { flash } = usePage().props as any;
    
    const [nip, setNip] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [expired, setExpired] = useState(false);

    // Calculate remaining time
    useEffect(() => {
        const expiresAt = new Date(expires_at).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setRemainingTime(remaining);
            
            if (remaining === 0) {
                setExpired(true);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(interval);
    }, [expires_at]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = () => {
        if (nip.length < 4) return;
        setConfirmDialog(true);
    };

    const handleConfirmCheckin = () => {
        setProcessing(true);
        router.post(`/meeting/checkin/${token}`, {
            nip: nip,
        }, {
            onFinish: () => {
                setProcessing(false);
                setConfirmDialog(false);
            }
        });
    };

    const formattedDate = format(new Date(meeting.meeting_date), 'EEEE, dd MMMM yyyy', { locale: indonesianLocale });

    if (expired) {
        return (
            <>
                <Head title="Sesi Check-in Kedaluwarsa" />
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Timer className="h-10 w-10 text-red-600" />
                            </div>
                            <CardTitle className="text-xl text-red-800">
                                Waktu Check-in Habis
                            </CardTitle>
                            <CardDescription>
                                Silakan minta moderator untuk menampilkan QR Code baru
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Check-in - ${meeting.title}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 px-4">
                <div className="max-w-lg mx-auto space-y-4">
                    {/* Timer Card */}
                    <Card className={`border-2 ${remainingTime < 60 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-center gap-3">
                                <Timer className={`h-6 w-6 ${remainingTime < 60 ? 'text-red-600' : 'text-green-600'}`} />
                                <div className="text-center">
                                    <div className={`text-2xl font-bold font-mono ${remainingTime < 60 ? 'text-red-700' : 'text-green-700'}`}>
                                        {formatTime(remainingTime)}
                                    </div>
                                    <p className={`text-xs ${remainingTime < 60 ? 'text-red-600' : 'text-green-600'}`}>
                                        Waktu tersisa untuk check-in
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Flash Messages */}
                    {flash?.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex gap-2 items-start">
                                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-800">{flash.error}</p>
                            </div>
                        </div>
                    )}
                    {flash?.info && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">{flash.info}</p>
                        </div>
                    )}

                    {/* Meeting Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{meeting.title}</CardTitle>
                            <CardDescription>{meeting.meeting_number}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4 flex-shrink-0" />
                                    <span>{meeting.start_time} - {meeting.end_time}</span>
                                </div>
                                {meeting.room && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{meeting.room}</span>
                                    </div>
                                )}
                                {meeting.organization_unit && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{meeting.organization_unit}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                                <Users className="h-4 w-4" />
                                <span>{total_count - pending_count} dari {total_count} peserta sudah hadir</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Check-in Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Konfirmasi Kehadiran
                            </CardTitle>
                            <CardDescription>
                                Masukkan NIP Anda (angka saja, tanpa titik)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pending_count === 0 ? (
                                <div className="text-center py-6">
                                    <Users className="h-12 w-12 mx-auto text-green-500 mb-3" />
                                    <p className="text-green-700 font-medium">Semua peserta sudah check-in!</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="nip">NIP (angka saja)</Label>
                                        <Input
                                            id="nip"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Contoh: 2023010203"
                                            value={nip}
                                            onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
                                            className="text-center text-xl tracking-widest font-mono h-14"
                                            autoFocus
                                        />
                                        <p className="text-xs text-muted-foreground text-center">
                                            Contoh: NIP 2023.01.02.03 → masukkan <strong>2023010203</strong>
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={nip.length < 4}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Konfirmasi Kehadiran
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-muted-foreground">
                        Sistem Administrasi Rapat
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Check-in</DialogTitle>
                        <DialogDescription>
                            Pastikan NIP yang Anda masukkan sudah benar
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="bg-muted rounded-lg p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-1">NIP</p>
                            <p className="text-2xl font-bold font-mono tracking-widest">{nip}</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-800">
                                Dengan menekan "Check-in Sekarang", Anda menyatakan hadir dalam rapat <strong>{meeting.title}</strong>.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDialog(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleConfirmCheckin} disabled={processing}>
                            {processing ? 'Memproses...' : 'Check-in Sekarang'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
