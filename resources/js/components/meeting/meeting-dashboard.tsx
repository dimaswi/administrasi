import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Calendar, Users, TrendingUp, Clock, CheckCircle, FileText, DoorOpen,
    BarChart3, ArrowUpRight, Archive, Mail, Send, FolderOpen, HardDrive, AlertTriangle,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MeetingDashboardProps {
    statistics?: {
        total_meetings: number; meetings_this_month: number; meetings_this_year: number;
        meetings_by_status: Record<string, number>; attendance_rate: number;
    };
    archive_statistics?: {
        total_archives: number; archives_this_month: number; archives_this_year: number;
        archives_by_type: Record<string, number>; archives_by_classification: Record<string, number>;
        expiring_archives: number; storage_by_type: Array<{ type: string; size: number; size_human: string }>;
    };
    letter_statistics?: {
        total_incoming_letters: number; incoming_letters_this_month: number; incoming_letters_by_status: Record<string, number>;
        total_outgoing_letters: number; outgoing_letters_this_month: number; outgoing_letters_by_status: Record<string, number>;
    };
    upcoming_meetings?: any[]; recent_completed_meetings?: any[]; todays_meetings?: any[];
    meetings_trend?: Array<{ month: string; count: number }>;
    most_used_rooms?: Array<{ name: string; total: number }>;
    top_participants?: Array<{ name: string; total: number; attended: number }>;
    recent_archives?: any[];
    archives_trend?: Array<{ month: string; count: number }>;
}

export function MeetingDashboard({
    statistics, archive_statistics, letter_statistics,
    upcoming_meetings = [], recent_completed_meetings = [], todays_meetings = [],
    meetings_trend = [], most_used_rooms = [], top_participants = [],
    recent_archives = [], archives_trend = [],
}: MeetingDashboardProps) {
    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const pow = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        return (bytes / Math.pow(1024, pow)).toFixed(2) + ' ' + units[pow];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => (
        { draft: 'Draft', scheduled: 'Terjadwal', ongoing: 'Berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan' }[status] || status
    );

    const maxTrendValue = Math.max(...(meetings_trend || []).map(m => m.count), 1);
    const maxArchiveTrendValue = Math.max(...(archives_trend || []).map(m => m.count), 1);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-0 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Statistik dan analitik sistem administrasi</p>
                </div>
            </div>

            <Tabs defaultValue="meetings" className="space-y-4">
                <TabsList className="h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b w-full">
                    <TabsTrigger value="meetings" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                        <Calendar className="h-4 w-4" />Rapat
                    </TabsTrigger>
                    <TabsTrigger value="archives" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                        <Archive className="h-4 w-4" />Arsip
                    </TabsTrigger>
                    <TabsTrigger value="letters" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                        <Mail className="h-4 w-4" />Surat
                    </TabsTrigger>
                </TabsList>

                {/* Meetings Tab */}
                <TabsContent value="meetings" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Manajemen Rapat</p>
                        <Button size="sm" onClick={() => router.visit('/meeting/meetings')}>
                            Lihat Semua <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Total Rapat</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{statistics?.total_meetings || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{statistics?.meetings_this_month || 0} bulan ini</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Tingkat Kehadiran</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{statistics?.attendance_rate || 0}%</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Rata-rata rapat selesai</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Rapat Selesai</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{statistics?.meetings_by_status?.completed || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Total rapat selesai</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Akan Datang</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{(statistics?.meetings_by_status?.scheduled || 0) + (statistics?.meetings_by_status?.ongoing || 0)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Terjadwal & berlangsung</p>
                        </div>
                    </div>

                    {/* Status Distribution & Trend */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Distribusi Status Rapat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {statistics?.meetings_by_status && Object.entries(statistics.meetings_by_status).map(([status, count]) => {
                                    const pct = (statistics?.total_meetings || 0) > 0 ? Math.round((count / (statistics?.total_meetings || 1)) * 100) : 0;
                                    return (
                                        <div key={status}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-medium">{getStatusLabel(status)}</span>
                                                <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                    Trend Rapat (6 Bulan)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-2">
                                {(meetings_trend || []).map((item) => (
                                    <div key={item.month} className="flex items-center gap-3">
                                        <div className="w-10 text-xs text-muted-foreground">{item.month}</div>
                                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                                            <div
                                                className="h-full bg-primary flex items-center px-2 text-xs text-primary-foreground font-medium transition-all"
                                                style={{ width: `${(item.count / maxTrendValue) * 100}%`, minWidth: item.count > 0 ? '32px' : '0' }}
                                            >
                                                {item.count > 0 && item.count}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today & Upcoming */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    Rapat Hari Ini
                                    <span className="text-xs font-normal text-muted-foreground ml-1">
                                        {format(new Date(), 'EEEE, dd MMM', { locale: id })}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {(todays_meetings || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {(todays_meetings || []).map((meeting) => (
                                            <div key={meeting.id} className="flex items-start gap-2 p-2.5 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{meeting.title}</div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />{meeting.start_time} - {meeting.end_time}
                                                        <DoorOpen className="h-3 w-3 ml-1" />{meeting.room?.name}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(meeting.status)}>{getStatusLabel(meeting.status)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-6">Tidak ada rapat hari ini</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    Rapat Mendatang
                                    <span className="text-xs font-normal text-muted-foreground ml-1">7 hari ke depan</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {(upcoming_meetings || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {(upcoming_meetings || []).map((meeting) => (
                                            <div key={meeting.id} className="flex items-start gap-2 p-2.5 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{meeting.title}</div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />{format(new Date(meeting.meeting_date), 'dd MMM', { locale: id })}
                                                        <Clock className="h-3 w-3 ml-1" />{meeting.start_time}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(meeting.status)}>{getStatusLabel(meeting.status)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-6">Tidak ada rapat mendatang</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Rooms & Participants */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                    Ruangan Paling Sering Digunakan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {(most_used_rooms || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {(most_used_rooms || []).map((room, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{index + 1}</div>
                                                <span className="flex-1 text-sm truncate">{room.name}</span>
                                                <Badge variant="secondary" className="text-xs">{room.total} rapat</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                    Peserta Paling Aktif
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {(top_participants || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {(top_participants || []).map((participant, index) => {
                                            const pct = participant.total > 0 ? Math.round((participant.attended / participant.total) * 100) : 0;
                                            return (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{index + 1}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm truncate">{participant.name}</div>
                                                        <div className="text-xs text-muted-foreground">{participant.attended}/{participant.total} hadir ({pct}%)</div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">{participant.total}</Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Completed */}
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                Rapat Selesai Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {(recent_completed_meetings || []).length > 0 ? (
                                <div className="space-y-2">
                                    {(recent_completed_meetings || []).map((meeting) => (
                                        <div key={meeting.id} className="flex items-center gap-3 p-2.5 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}>
                                            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{meeting.title}</div>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />{format(new Date(meeting.meeting_date), 'dd MMMM yyyy', { locale: id })}
                                                    <DoorOpen className="h-3 w-3 ml-1" />{meeting.room?.name}
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.visit(`/meeting/meetings/${meeting.id}`); }}>Detail</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">Belum ada rapat yang selesai</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Archives Tab */}
                <TabsContent value="archives" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Manajemen Arsip</p>
                        <Button size="sm" onClick={() => router.visit('/arsip/archives')}>
                            Lihat Semua <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Total Arsip</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{archive_statistics?.total_archives || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Semua dokumen diarsipkan</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Arsip Bulan Ini</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{archive_statistics?.archives_this_month || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Dari {archive_statistics?.archives_this_year || 0} tahun ini</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Total Storage</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">
                                {archive_statistics?.storage_by_type?.reduce((s, i) => s + i.size, 0)
                                    ? formatBytes(archive_statistics.storage_by_type.reduce((s, i) => s + i.size, 0)) : '0 B'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Ukuran file arsip</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Arsip Kadaluarsa</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{archive_statistics?.expiring_archives || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Perlu ditinjau ulang</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm">Distribusi Tipe Arsip</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {archive_statistics?.storage_by_type && archive_statistics.storage_by_type.map((type) => (
                                    <div key={type.type} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {type.type === 'letter' && <Send className="h-3.5 w-3.5 text-muted-foreground" />}
                                            {type.type === 'incoming_letter' && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                                            {type.type === 'document' && <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                                            <span className="text-sm">{type.type === 'letter' ? 'Surat Keluar' : type.type === 'incoming_letter' ? 'Surat Masuk' : 'Dokumen'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{archive_statistics.archives_by_type?.[type.type] || 0}</Badge>
                                            <span className="text-xs text-muted-foreground">{type.size_human}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!archive_statistics?.storage_by_type || archive_statistics.storage_by_type.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data arsip</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm">Distribusi Klasifikasi</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {archive_statistics?.archives_by_classification && Object.entries(archive_statistics.archives_by_classification).map(([classification, count]) => (
                                    <div key={classification} className="flex items-center justify-between">
                                        <span className="text-sm">{classification}</span>
                                        <Badge variant="secondary">{count}</Badge>
                                    </div>
                                ))}
                                {(!archive_statistics?.archives_by_classification || Object.keys(archive_statistics.archives_by_classification).length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data klasifikasi</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                Trend Pengarsipan (6 Bulan Terakhir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="h-48 flex items-end justify-between gap-2">
                                {(archives_trend || []).map((item) => (
                                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full bg-primary/20 rounded-t-sm relative group cursor-pointer hover:bg-primary/30 transition-colors"
                                            style={{ height: `${(item.count / maxArchiveTrendValue) * 160}px`, minHeight: item.count > 0 ? '4px' : '2px' }}>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded px-1.5 py-0.5 text-xs whitespace-nowrap">{item.count} arsip</div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{item.month}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm">Arsip Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {recent_archives && recent_archives.length > 0 ? (
                                <div className="space-y-2">
                                    {recent_archives.map((archive: any) => (
                                        <div key={archive.id} className="flex items-center justify-between p-2.5 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => router.visit(`/arsip/archives/${archive.id}`)}>
                                            <div className="flex-1 space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {archive.type === 'letter' && <Send className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                                                    {archive.type === 'incoming_letter' && <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                                                    {archive.type === 'document' && <FolderOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                                                    <span className="font-medium text-sm">{archive.document_number}</span>
                                                    <Badge variant="outline" className="text-xs">{archive.classification}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{archive.title}</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="ml-3 flex-shrink-0" onClick={(e) => { e.stopPropagation(); router.visit(`/arsip/archives/${archive.id}`); }}>Detail</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">Belum ada arsip tersedia</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Letters Tab */}
                <TabsContent value="letters" className="space-y-4">
                    <p className="text-sm text-muted-foreground">Statistik Surat</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border rounded-lg overflow-hidden">
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Surat Masuk</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{letter_statistics?.total_incoming_letters || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Total surat masuk</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Surat Keluar</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{letter_statistics?.total_outgoing_letters || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Total surat keluar</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Masuk Bulan Ini</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{letter_statistics?.incoming_letters_this_month || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Surat masuk</p>
                        </div>
                        <div className="bg-card p-4">
                            <p className="text-xs text-muted-foreground">Keluar Bulan Ini</p>
                            <p className="text-2xl font-bold tabular-nums mt-0.5">{letter_statistics?.outgoing_letters_this_month || 0}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Surat dikirim</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    Status Surat Masuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-2">
                                {letter_statistics?.incoming_letters_by_status && Object.entries(letter_statistics.incoming_letters_by_status).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                                        <Badge variant={status === 'completed' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline'}>{count}</Badge>
                                    </div>
                                ))}
                                {(!letter_statistics?.incoming_letters_by_status || Object.keys(letter_statistics.incoming_letters_by_status).length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data surat masuk</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                                    Status Surat Keluar
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-2">
                                {letter_statistics?.outgoing_letters_by_status && Object.entries(letter_statistics.outgoing_letters_by_status).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                                        <Badge variant={status === 'fully_signed' ? 'default' : status === 'pending_approval' ? 'secondary' : 'outline'}>{count}</Badge>
                                    </div>
                                ))}
                                {(!letter_statistics?.outgoing_letters_by_status || Object.keys(letter_statistics.outgoing_letters_by_status).length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data surat keluar</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
