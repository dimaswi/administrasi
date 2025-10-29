import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Room, Meeting, SharedData } from "@/types";
import { Head, router } from "@inertiajs/react";
import { DoorOpen, Edit3, Users, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props extends SharedData {
    room: Room & {
        meetings?: Meeting[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruangan', href: '/meeting/rooms' },
    { title: 'Detail Ruangan', href: '#' },
];

export default function RoomShow({ room }: Props) {
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ongoing':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'completed':
                return 'bg-gray-100 text-gray-800 border-gray-200';
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Ruangan - ${room.name}`} />
            <div className="p-4 max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">{room.name}</h2>
                        <p className="text-sm text-muted-foreground">Detail informasi ruangan rapat</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(`/meeting/rooms/${room.id}/edit`)}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>

                <div className="grid gap-6">
                    {/* Informasi Umum */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DoorOpen className="h-5 w-5" />
                                Informasi Ruangan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kode Ruangan</label>
                                    <p className="mt-1 font-mono text-lg">{room.code}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Ruangan</label>
                                    <p className="mt-1 text-lg">{room.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        {room.is_active ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Aktif
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                Nonaktif
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Gedung</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{room.building || '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Lantai</label>
                                    <p className="mt-1">{room.floor || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kapasitas</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{room.capacity} Orang</span>
                                    </div>
                                </div>
                            </div>

                            {room.facilities && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Fasilitas</label>
                                    <p className="mt-1 text-sm whitespace-pre-line">{room.facilities}</p>
                                </div>
                            )}

                            {room.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                                    <p className="mt-1 text-sm">{room.description}</p>
                                </div>
                            )}

                            {room.location && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Lokasi Lengkap</label>
                                    <p className="mt-1 text-sm">{room.location}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Riwayat Rapat */}
                    {room.meetings && room.meetings.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Rapat (10 Terakhir)</CardTitle>
                                <CardDescription>Daftar rapat yang menggunakan ruangan ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>No. Rapat</TableHead>
                                                <TableHead>Judul</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Waktu</TableHead>
                                                <TableHead>Penyelenggara</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {room.meetings.map((meeting) => (
                                                <TableRow key={meeting.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {meeting.meeting_number}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {meeting.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {format(new Date(meeting.meeting_date), 'dd MMM yyyy', { locale: id })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            {meeting.start_time} - {meeting.end_time}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {meeting.organizer?.name || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {meeting.organization_unit?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getStatusBadgeColor(meeting.status)}>
                                                            {getStatusLabel(meeting.status)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State untuk Meetings */}
                    {(!room.meetings || room.meetings.length === 0) && (
                        <Card>
                            <CardContent className="py-12">
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <Calendar className="h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="text-lg font-medium">Belum Ada Rapat</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ruangan ini belum pernah digunakan untuk rapat
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
