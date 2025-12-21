import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";
import { Meeting, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import { CheckCircle2, Calendar, Clock, MapPin, Users, FileText } from "lucide-react";

interface Props {
    meeting: Meeting & {
        organizer: User;
        room: { name: string };
        organizationUnit?: { name: string };
    };
    leader: User;
    verified: boolean;
    verifiedAt: string;
}

export default function VerifySignature({ meeting, leader, verified, verifiedAt }: Props) {
    return (
        <AppLayout>
            <Head title="Verifikasi Signature Undangan Rapat" />
            <div className="container max-w-4xl mx-auto p-6">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100 p-4">
                            <CheckCircle2 className="h-16 w-16 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Signature Terverifikasi</h1>
                    <p className="text-muted-foreground">
                        Undangan rapat ini telah ditandatangani secara digital dan terverifikasi
                    </p>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Informasi Undangan Rapat
                        </CardTitle>
                        <CardDescription>Detail undangan rapat yang terverifikasi</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nomor Rapat</label>
                                <p className="text-lg font-semibold">{meeting.meeting_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Terverifikasi
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Judul Rapat</label>
                            <p className="text-lg">{meeting.title}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
                                    <p>{new Date(meeting.meeting_date).toLocaleDateString('id-ID', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Waktu</label>
                                    <p>{meeting.start_time} - {meeting.end_time} WIB</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Tempat</label>
                                <p>{meeting.room.name}</p>
                            </div>
                        </div>

                        {meeting.organizationUnit && (
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Unit Organisasi</label>
                                    <p>{meeting.organizationUnit.name}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader className="p-6">
                        <CardTitle>Ditandatangani Oleh</CardTitle>
                        <CardDescription>Pimpinan rapat yang menandatangani undangan ini</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-lg">{leader.name}</p>
                                {leader.nip && (
                                    <p className="text-sm text-muted-foreground">NIP: {leader.nip}</p>
                                )}
                                {leader.position && (
                                    <p className="text-sm text-muted-foreground">{leader.position}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-6">
                        <CardTitle>Informasi Verifikasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status Verifikasi</span>
                            <span className="font-medium text-green-600">✓ Valid</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Waktu Verifikasi</span>
                            <span className="font-medium">
                                {new Date(verifiedAt).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Metode</span>
                            <span className="font-medium">QR Code Signature Certificate</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/')}
                    >
                        Kembali ke Beranda
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
