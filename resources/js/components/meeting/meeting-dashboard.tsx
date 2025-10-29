import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Calendar, 
    Users, 
    TrendingUp, 
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    DoorOpen,
    BarChart3,
    ArrowUpRight,
    Archive,
    Mail,
    Send,
    FolderOpen,
    HardDrive,
    AlertTriangle,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MeetingDashboardProps {
    statistics?: {
        total_meetings: number;
        meetings_this_month: number;
        meetings_this_year: number;
        meetings_by_status: Record<string, number>;
        attendance_rate: number;
    };
    archive_statistics?: {
        total_archives: number;
        archives_this_month: number;
        archives_this_year: number;
        archives_by_type: Record<string, number>;
        archives_by_classification: Record<string, number>;
        expiring_archives: number;
        storage_by_type: Array<{ type: string; size: number; size_human: string }>;
    };
    letter_statistics?: {
        total_incoming_letters: number;
        incoming_letters_this_month: number;
        incoming_letters_by_status: Record<string, number>;
        total_outgoing_letters: number;
        outgoing_letters_this_month: number;
        outgoing_letters_by_status: Record<string, number>;
    };
    upcoming_meetings?: any[];
    recent_completed_meetings?: any[];
    todays_meetings?: any[];
    meetings_trend?: Array<{ month: string; count: number }>;
    most_used_rooms?: Array<{ name: string; total: number }>;
    top_participants?: Array<{ name: string; total: number; attended: number }>;
    recent_archives?: any[];
    archives_trend?: Array<{ month: string; count: number }>;
}

export function MeetingDashboard({
    statistics,
    archive_statistics,
    letter_statistics,
    upcoming_meetings = [],
    recent_completed_meetings = [],
    todays_meetings = [],
    meetings_trend = [],
    most_used_rooms = [],
    top_participants = [],
    recent_archives = [],
    archives_trend = [],
}: MeetingDashboardProps) {
    // Helper function to format bytes
    const formatBytes = (bytes: number, precision = 2) => {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const pow = Math.floor((bytes ? Math.log(bytes) : 0) / Math.log(1024));
        const powLimited = Math.min(pow, units.length - 1);
        
        const value = bytes / Math.pow(1024, powLimited);
        
        return value.toFixed(precision) + ' ' + units[powLimited];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'ongoing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'scheduled':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

    const maxTrendValue = Math.max(...(meetings_trend || []).map(m => m.count), 1);
    const maxArchiveTrendValue = Math.max(...(archives_trend || []).map(m => m.count), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">
                        Statistik dan analitik sistem administrasi
                    </p>
                </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="meetings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="meetings" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Rapat
                    </TabsTrigger>
                    <TabsTrigger value="archives" className="gap-2">
                        <Archive className="h-4 w-4" />
                        Arsip
                    </TabsTrigger>
                    <TabsTrigger value="letters" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Surat
                    </TabsTrigger>
                </TabsList>

                {/* Meetings Tab */}
                <TabsContent value="meetings" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Manajemen Rapat</h3>
                        <Button onClick={() => router.visit('/meeting/meetings')}>
                            Lihat Semua Rapat
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Meetings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rapat</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.total_meetings || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {statistics?.meetings_this_month || 0} rapat bulan ini
                        </p>
                    </CardContent>
                </Card>

                {/* Attendance Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.attendance_rate || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                            Rata-rata dari rapat selesai
                        </p>
                    </CardContent>
                </Card>

                {/* Completed This Month */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rapat Selesai</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(statistics?.meetings_by_status?.completed || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total rapat yang telah selesai
                        </p>
                    </CardContent>
                </Card>

                {/* Upcoming Meetings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Akan Datang</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(statistics?.meetings_by_status?.scheduled || 0) + (statistics?.meetings_by_status?.ongoing || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Rapat terjadwal & berlangsung
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Status Distribution & Trend Chart */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Distribusi Status Rapat
                        </CardTitle>
                        <CardDescription>
                            Breakdown berdasarkan status saat ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {statistics?.meetings_by_status && Object.entries(statistics.meetings_by_status).map(([status, count]) => {
                                const percentage = (statistics?.total_meetings || 0) > 0 
                                    ? Math.round((count / (statistics?.total_meetings || 1)) * 100) 
                                    : 0;
                                
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium capitalize">{getStatusLabel(status)}</span>
                                            <span className="text-muted-foreground">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${
                                                    status === 'completed' ? 'bg-green-500' :
                                                    status === 'ongoing' ? 'bg-blue-500' :
                                                    status === 'scheduled' ? 'bg-yellow-500' :
                                                    status === 'cancelled' ? 'bg-red-500' :
                                                    'bg-gray-500'
                                                }`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Trend Rapat (6 Bulan)
                        </CardTitle>
                        <CardDescription>
                            Jumlah rapat per bulan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(meetings_trend || []).map((item) => (
                                <div key={item.month} className="flex items-center gap-3">
                                    <div className="w-12 text-sm font-medium">{item.month}</div>
                                    <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 flex items-center px-2 text-xs text-white font-medium transition-all"
                                            style={{ width: `${(item.count / maxTrendValue) * 100}%`, minWidth: item.count > 0 ? '40px' : '0' }}
                                        >
                                            {item.count > 0 && item.count}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Meetings & Upcoming */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Today's Meetings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Rapat Hari Ini
                        </CardTitle>
                        <CardDescription>
                            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(todays_meetings || []).length > 0 ? (
                            <div className="space-y-3">
                                {(todays_meetings || []).map((meeting) => (
                                    <div 
                                        key={meeting.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{meeting.title}</div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {meeting.start_time} - {meeting.end_time}
                                                <DoorOpen className="h-3 w-3 ml-2" />
                                                {meeting.room?.name}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={getStatusColor(meeting.status)}>
                                            {getStatusLabel(meeting.status)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Tidak ada rapat hari ini</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Meetings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Rapat Mendatang
                        </CardTitle>
                        <CardDescription>
                            7 hari ke depan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(upcoming_meetings || []).length > 0 ? (
                            <div className="space-y-3">
                                {(upcoming_meetings || []).map((meeting) => (
                                    <div 
                                        key={meeting.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{meeting.title}</div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(meeting.meeting_date), 'dd MMM', { locale: id })}
                                                <Clock className="h-3 w-3 ml-2" />
                                                {meeting.start_time}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={getStatusColor(meeting.status)}>
                                            {getStatusLabel(meeting.status)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Tidak ada rapat mendatang</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Most Used Rooms & Top Participants */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Most Used Rooms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DoorOpen className="h-5 w-5" />
                            Ruangan Paling Sering Digunakan
                        </CardTitle>
                        <CardDescription>
                            Top 5 ruangan rapat
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(most_used_rooms || []).length > 0 ? (
                            <div className="space-y-3">
                                {(most_used_rooms || []).map((room, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{room.name}</div>
                                        </div>
                                        <Badge variant="secondary">{room.total} rapat</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">Belum ada data</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Participants */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Peserta Paling Aktif
                        </CardTitle>
                        <CardDescription>
                            Top 5 peserta berdasarkan kehadiran
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(top_participants || []).length > 0 ? (
                            <div className="space-y-3">
                                {(top_participants || []).map((participant, index) => {
                                    const attendancePercentage = participant.total > 0 
                                        ? Math.round((participant.attended / participant.total) * 100) 
                                        : 0;
                                    
                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{participant.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {participant.attended}/{participant.total} hadir ({attendancePercentage}%)
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {participant.total} rapat
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">Belum ada data</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Completed Meetings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Rapat Selesai Terbaru
                    </CardTitle>
                    <CardDescription>
                        5 rapat terakhir yang telah diselesaikan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(recent_completed_meetings || []).length > 0 ? (
                        <div className="space-y-3">
                            {(recent_completed_meetings || []).map((meeting) => (
                                <div 
                                    key={meeting.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}
                                >
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{meeting.title}</div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(meeting.meeting_date), 'dd MMMM yyyy', { locale: id })}
                                            <DoorOpen className="h-3 w-3 ml-2" />
                                            {meeting.room?.name}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.visit(`/meeting/meetings/${meeting.id}`);
                                        }}
                                    >
                                        Lihat Detail
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Belum ada rapat yang selesai</p>
                        </div>
                    )}
                </CardContent>
            </Card>
                </TabsContent>

                {/* Archives Tab */}
                <TabsContent value="archives" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Manajemen Arsip</h3>
                        <Button onClick={() => router.visit('/arsip/archives')}>
                            Lihat Semua Arsip
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {/* Archive Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Arsip</CardTitle>
                                <Archive className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{archive_statistics?.total_archives || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Semua dokumen yang diarsipkan
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Arsip Bulan Ini</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{archive_statistics?.archives_this_month || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dari total {archive_statistics?.archives_this_year || 0} tahun ini
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {archive_statistics?.storage_by_type?.reduce((sum, item) => sum + item.size, 0) 
                                        ? formatBytes(archive_statistics.storage_by_type.reduce((sum, item) => sum + item.size, 0))
                                        : '0 B'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total ukuran file arsip
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Arsip Kadaluarsa</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-500">{archive_statistics?.expiring_archives || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Perlu ditinjau ulang
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Archive Type Distribution */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribusi Tipe Arsip</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {archive_statistics?.storage_by_type && archive_statistics.storage_by_type.map((type) => (
                                        <div key={type.type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {type.type === 'letter' && <Send className="h-4 w-4 text-blue-500" />}
                                                {type.type === 'incoming_letter' && <Mail className="h-4 w-4 text-green-500" />}
                                                {type.type === 'document' && <FolderOpen className="h-4 w-4 text-purple-500" />}
                                                <span className="text-sm font-medium">
                                                    {type.type === 'letter' ? 'Surat Keluar' : 
                                                     type.type === 'incoming_letter' ? 'Surat Masuk' : 'Dokumen'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    {archive_statistics.archives_by_type?.[type.type] || 0}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{type.size_human}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!archive_statistics?.storage_by_type || archive_statistics.storage_by_type.length === 0) && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            Belum ada data arsip
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Distribusi Klasifikasi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {archive_statistics?.archives_by_classification && Object.entries(archive_statistics.archives_by_classification).map(([classification, count]) => (
                                        <div key={classification} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{classification}</span>
                                            <Badge variant="secondary">{count}</Badge>
                                        </div>
                                    ))}
                                    {(!archive_statistics?.archives_by_classification || Object.keys(archive_statistics.archives_by_classification).length === 0) && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            Belum ada data klasifikasi
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Archive Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trend Pengarsipan (6 Bulan Terakhir)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-end justify-between gap-2">
                                {(archives_trend || []).map((item) => (
                                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full bg-primary/20 rounded-t relative group cursor-pointer hover:bg-primary/30 transition-colors"
                                             style={{ height: `${(item.count / maxArchiveTrendValue) * 200}px` }}>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap">
                                                {item.count} arsip
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{item.month}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Archives */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Arsip Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recent_archives && recent_archives.length > 0 ? (
                                <div className="space-y-3">
                                    {recent_archives.map((archive: any) => (
                                        <div
                                            key={archive.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                            onClick={() => router.visit(`/arsip/archives/${archive.id}`)}
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {archive.type === 'letter' && <Send className="h-4 w-4 text-blue-500" />}
                                                    {archive.type === 'incoming_letter' && <Mail className="h-4 w-4 text-green-500" />}
                                                    {archive.type === 'document' && <FolderOpen className="h-4 w-4 text-purple-500" />}
                                                    <span className="font-medium">{archive.document_number}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {archive.classification}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{archive.title}</p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>{archive.document_date ? format(new Date(archive.document_date), 'dd MMMM yyyy', { locale: id }) : 'N/A'}</span>
                                                    {archive.created_at && (
                                                        <span>• Diarsipkan: {format(new Date(archive.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.visit(`/arsip/archives/${archive.id}`);
                                                }}
                                            >
                                                Lihat Detail
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Belum ada arsip tersedia</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Letters Tab */}
                <TabsContent value="letters" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Statistik Surat</h3>
                    </div>

                    {/* Letter Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{letter_statistics?.total_incoming_letters || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total surat masuk
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Surat Keluar</CardTitle>
                                <Send className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{letter_statistics?.total_outgoing_letters || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total surat keluar
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Surat Masuk Bulan Ini</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-500">
                                    {letter_statistics?.incoming_letters_this_month || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Masuk bulan ini
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Surat Keluar Bulan Ini</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-500">
                                    {letter_statistics?.outgoing_letters_this_month || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dikirim bulan ini
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Letter Status Breakdown */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Surat Masuk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {letter_statistics?.incoming_letters_by_status && Object.entries(letter_statistics.incoming_letters_by_status).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm font-medium capitalize">{status}</span>
                                            <Badge variant={
                                                status === 'pending' ? 'outline' : 
                                                status === 'in_progress' ? 'secondary' : 
                                                status === 'completed' ? 'default' : 
                                                'default'
                                            }>{count}</Badge>
                                        </div>
                                    ))}
                                    {(!letter_statistics?.incoming_letters_by_status || Object.keys(letter_statistics.incoming_letters_by_status).length === 0) && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            Belum ada data surat masuk
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Status Surat Keluar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {letter_statistics?.outgoing_letters_by_status && Object.entries(letter_statistics.outgoing_letters_by_status).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                                            <Badge variant={
                                                status === 'draft' ? 'outline' : 
                                                status === 'pending_approval' ? 'secondary' : 
                                                status === 'fully_signed' ? 'default' : 
                                                'default'
                                            }>{count}</Badge>
                                        </div>
                                    ))}
                                    {(!letter_statistics?.outgoing_letters_by_status || Object.keys(letter_statistics.outgoing_letters_by_status).length === 0) && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            Belum ada data surat keluar
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
