import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { QrCode, Play, Square, RefreshCw, Timer, Users, Maximize2, Minimize2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import axios from 'axios';

interface Props {
    meetingId: number;
    meetingStatus: string;
    isModeratorOrOrganizer: boolean;
    attendedCount: number;
    totalParticipants: number;
}

export function CheckinQRCode({ meetingId, meetingStatus, isModeratorOrOrganizer, attendedCount, totalParticipants }: Props) {
    const [isActive, setIsActive] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState('5');
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [showQR, setShowQR] = useState(true);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Check current token status on mount
    useEffect(() => {
        if (meetingStatus === 'ongoing' && isModeratorOrOrganizer) {
            checkTokenStatus();
        }
    }, [meetingId, meetingStatus, isModeratorOrOrganizer]);

    // Timer countdown
    useEffect(() => {
        if (isActive && expiresAt) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000));
                setRemainingSeconds(remaining);

                if (remaining === 0) {
                    setIsActive(false);
                    setToken(null);
                    setQrDataUrl(null);
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                }
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [isActive, expiresAt]);

    const checkTokenStatus = async () => {
        try {
            const response = await axios.get(`/meeting/meetings/${meetingId}/checkin-token`);
            if (response.data.active) {
                setToken(response.data.token);
                setExpiresAt(new Date(response.data.expires_at));
                setRemainingSeconds(response.data.remaining_seconds);
                setIsActive(true);
                generateQRImage(response.data.checkin_url);
            }
        } catch (error) {
            console.error('Failed to check token status:', error);
        }
    };

    const generateQRImage = async (url: string) => {
        try {
            const dataUrl = await QRCode.toDataURL(url, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });
            setQrDataUrl(dataUrl);
        } catch (error) {
            console.error('Failed to generate QR:', error);
        }
    };

    const startCheckin = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`/meeting/meetings/${meetingId}/checkin-token`, {
                duration: parseInt(duration),
            });
            
            if (response.data.success) {
                setToken(response.data.token);
                setExpiresAt(new Date(response.data.expires_at));
                setRemainingSeconds(parseInt(duration) * 60);
                setIsActive(true);
                generateQRImage(response.data.checkin_url);
                setStartDialogOpen(false);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal memulai sesi check-in');
        } finally {
            setLoading(false);
        }
    };

    const stopCheckin = async () => {
        setLoading(true);
        try {
            await axios.delete(`/meeting/meetings/${meetingId}/checkin-token`);
            setIsActive(false);
            setToken(null);
            setQrDataUrl(null);
            setExpiresAt(null);
            setRemainingSeconds(0);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menghentikan sesi check-in');
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`/meeting/meetings/${meetingId}/checkin-token`, {
                duration: parseInt(duration),
            });
            
            if (response.data.success) {
                setToken(response.data.token);
                setExpiresAt(new Date(response.data.expires_at));
                setRemainingSeconds(parseInt(duration) * 60);
                generateQRImage(response.data.checkin_url);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal memperbarui QR Code');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Only show for ongoing meetings and moderator/organizer
    if (meetingStatus !== 'ongoing' || !isModeratorOrOrganizer) {
        return null;
    }

    return (
        <>
            <Card className="border-2 border-dashed border-primary/30">
                <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <QrCode className="h-5 w-5" />
                                QR Code Check-in
                            </CardTitle>
                            <CardDescription>
                                Tampilkan QR Code untuk peserta melakukan check-in
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {attendedCount}/{totalParticipants} hadir
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {!isActive ? (
                        <div className="text-center py-6">
                            <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                Sesi check-in belum dimulai
                            </p>
                            <Button onClick={() => setStartDialogOpen(true)} size="lg">
                                <Play className="h-4 w-4 mr-2" />
                                Mulai Sesi Check-in
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Timer */}
                            <div className={`text-center p-3 rounded-lg ${
                                remainingSeconds < 60 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                            }`}>
                                <div className="flex items-center justify-center gap-2">
                                    <Timer className={`h-5 w-5 ${remainingSeconds < 60 ? 'text-red-600' : 'text-green-600'}`} />
                                    <span className={`text-2xl font-bold font-mono ${remainingSeconds < 60 ? 'text-red-700' : 'text-green-700'}`}>
                                        {formatTime(remainingSeconds)}
                                    </span>
                                </div>
                                <p className={`text-xs ${remainingSeconds < 60 ? 'text-red-600' : 'text-green-600'}`}>
                                    {remainingSeconds < 60 ? 'Segera kedaluwarsa!' : 'Sisa waktu check-in'}
                                </p>
                            </div>

                            {/* QR Code */}
                            {showQR && qrDataUrl && (
                                <div className="flex justify-center">
                                    <div 
                                        className="bg-white p-4 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                                        onClick={() => setShowFullscreen(true)}
                                    >
                                        <img 
                                            src={qrDataUrl} 
                                            alt="QR Code Check-in" 
                                            className="w-48 h-48"
                                        />
                                        <p className="text-xs text-center text-muted-foreground mt-2">
                                            Klik untuk fullscreen
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowQR(!showQR)}
                                >
                                    {showQR ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                    {showQR ? 'Sembunyikan' : 'Tampilkan'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowFullscreen(true)}
                                >
                                    <Maximize2 className="h-4 w-4 mr-1" />
                                    Fullscreen
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={refreshToken}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                    Perbarui
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={stopCheckin}
                                    disabled={loading}
                                >
                                    <Square className="h-4 w-4 mr-1" />
                                    Hentikan
                                </Button>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex gap-2 items-start">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800">
                                        <strong>Tips:</strong> Gunakan mode fullscreen saat menampilkan di layar besar. 
                                        QR Code akan otomatis kedaluwarsa setelah waktu habis untuk mencegah penyalahgunaan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Start Checkin Dialog */}
            <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mulai Sesi Check-in</DialogTitle>
                        <DialogDescription>
                            Atur durasi QR Code check-in. QR Code akan otomatis kedaluwarsa setelah waktu yang ditentukan.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Durasi Check-in</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">2 menit</SelectItem>
                                    <SelectItem value="3">3 menit</SelectItem>
                                    <SelectItem value="5">5 menit</SelectItem>
                                    <SelectItem value="10">10 menit</SelectItem>
                                    <SelectItem value="15">15 menit</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Durasi lebih pendek lebih aman untuk mencegah penyalahgunaan
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                Setelah QR Code ditampilkan, peserta dapat scan untuk check-in. 
                                Anda dapat memperbarui QR Code kapan saja untuk memperpanjang waktu.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={startCheckin} disabled={loading}>
                            {loading ? 'Memproses...' : 'Mulai Check-in'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fullscreen QR Dialog */}
            <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>QR Code Check-in</span>
                            <Badge variant={remainingSeconds < 60 ? 'destructive' : 'default'} className="ml-2">
                                <Timer className="h-4 w-4 mr-1" />
                                {formatTime(remainingSeconds)}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Scan QR Code ini untuk melakukan check-in kehadiran
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center py-6">
                        {qrDataUrl && (
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <img 
                                    src={qrDataUrl} 
                                    alt="QR Code Check-in" 
                                    className="w-80 h-80"
                                />
                            </div>
                        )}
                        
                        <div className="mt-6 text-center">
                            <p className="text-lg font-medium">Arahkan kamera HP ke QR Code</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Pilih nama Anda dan masukkan 4 digit terakhir NIP untuk verifikasi
                            </p>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button variant="outline" onClick={refreshToken} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Perbarui QR
                            </Button>
                            <Button variant="outline" onClick={() => setShowFullscreen(false)}>
                                <Minimize2 className="h-4 w-4 mr-2" />
                                Tutup
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
