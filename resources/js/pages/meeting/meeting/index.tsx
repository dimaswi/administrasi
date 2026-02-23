import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IndexPage } from "@/components/ui/index-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Meeting, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Calendar as CalendarIcon, Edit3, Eye, Loader2, List, MapPin, PlusCircle, Trash, Users, Clock, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { route } from "ziggy-js";
import { format, startOfMonth, endOfMonth, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import axios from "axios";

interface PaginatedMeetings {
    data: Meeting[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    meetings: PaginatedMeetings;
    filters: {
        search: string;
        status: string;
        perPage: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Rapat', href: '/meeting/meetings' },
];

export default function MeetingIndex() {
    const { meetings, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters.search);
    const [status, setStatus] = useState(initialFilters.status);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarMeetings, setCalendarMeetings] = useState<Meeting[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        meeting: Meeting | null;
        loading: boolean;
    }>({ open: false, meeting: null, loading: false });

    useEffect(() => {
        if (viewMode === 'calendar') fetchCalendarData();
    }, [currentMonth, viewMode, status]);

    const fetchCalendarData = async () => {
        setCalendarLoading(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
            const response = await axios.get(route('meetings.calendar-data'), {
                params: {
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    status,
                }
            });
            setCalendarMeetings(response.data.meetings);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        } finally {
            setCalendarLoading(false);
        }
    };

    const applySearch = (value: string, statusValue: string) => {
        router.get('/meeting/meetings', {
            search: value,
            status: statusValue,
            perPage: initialFilters.perPage,
        }, { preserveState: true, replace: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/meeting/meetings', {
            search: initialFilters.search,
            status: initialFilters.status,
            perPage: initialFilters.perPage,
            page,
        }, { preserveState: true, replace: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/meeting/meetings', {
            search: initialFilters.search,
            status: initialFilters.status,
            perPage,
            page: 1,
        }, { preserveState: true, replace: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'status') {
            setStatus(value);
            applySearch(search, value);
        }
    };

    const handleFilterSubmit = () => applySearch(search, status);

    const handleFilterReset = () => {
        setSearch('');
        setStatus('');
        applySearch('', '');
    };

    const handleDeleteClick = (meeting: Meeting) => {
        setDeleteDialog({ open: true, meeting, loading: false });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.meeting) return;
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        router.delete(route('meetings.destroy', deleteDialog.meeting.id), {
            onSuccess: () => setDeleteDialog({ open: false, meeting: null, loading: false }),
            onError: () => setDeleteDialog(prev => ({ ...prev, loading: false })),
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'draft':     return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ongoing':   return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default:          return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => (
        { draft: 'Draft', scheduled: 'Terjadwal', ongoing: 'Berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan' }[status] || status
    );

    const listColumns = [
        {
            key: 'meeting_number',
            label: 'No. Rapat',
            render: (m: Meeting) => <span className="font-mono text-sm">{m.meeting_number}</span>,
        },
        {
            key: 'title',
            label: 'Judul',
            render: (m: Meeting) => <div className="font-medium max-w-xs truncate">{m.title}</div>,
        },
        {
            key: 'meeting_date',
            label: 'Tanggal & Waktu',
            render: (m: Meeting) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1 font-medium">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(m.meeting_date), 'dd MMM yyyy', { locale: id })}
                    </div>
                    <div className="text-muted-foreground">{m.start_time} - {m.end_time}</div>
                </div>
            ),
        },
        {
            key: 'room',
            label: 'Ruangan',
            render: (m: Meeting) => <span className="text-sm">{m.room?.name || '-'}</span>,
        },
        {
            key: 'organizer',
            label: 'Penyelenggara',
            render: (m: Meeting) => <span className="text-sm">{m.organizer?.name || '-'}</span>,
        },
        {
            key: 'organization_unit',
            label: 'Unit',
            render: (m: Meeting) => <span className="text-sm">{m.organization_unit?.name || '-'}</span>,
        },
        {
            key: 'participants_count',
            label: 'Peserta',
            render: (m: Meeting) => (
                <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    <span>{m.participants_count || 0}</span>
                    {m.attended_participants_count !== undefined && (
                        <span className="text-muted-foreground">({m.attended_participants_count} hadir)</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (m: Meeting) => (
                <Badge variant="outline" className={getStatusBadgeColor(m.status)}>
                    {getStatusLabel(m.status)}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[110px]',
            sortable: false,
            render: (m: Meeting) => (
                <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('meetings.show', m.id))} title="Lihat Detail">
                        <Eye className="h-4 w-4" />
                    </Button>
                    {(m.status === 'draft' || m.status === 'cancelled') && (
                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('meetings.edit', m.id))} title="Edit">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(m)} title="Hapus">
                        <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Rapat" />
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-0 border-b">
                    <div>
                        <h2 className="text-xl font-semibold">Daftar Rapat</h2>
                        <p className="text-sm text-muted-foreground">Manajemen jadwal dan agenda rapat</p>
                    </div>
                    <Button size="sm" onClick={() => router.visit('/meeting/meetings/create')}>
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Tambah Rapat
                    </Button>
                </div>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')} className="space-y-4">
                    <TabsList className="h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b w-full">
                        <TabsTrigger value="calendar" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Kalender</span>
                        </TabsTrigger>
                        <TabsTrigger value="list" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2">
                            <List className="h-4 w-4" />
                            <span className="hidden sm:inline">Daftar</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-0">
                        <IndexPage
                            title=""
                            data={meetings.data}
                            columns={listColumns}
                            filterFields={[
                                {
                                    key: 'status',
                                    type: 'select',
                                    placeholder: 'Semua Status',
                                    options: [
                                        { value: 'draft', label: 'Draft' },
                                        { value: 'scheduled', label: 'Terjadwal' },
                                        { value: 'ongoing', label: 'Berlangsung' },
                                        { value: 'completed', label: 'Selesai' },
                                        { value: 'cancelled', label: 'Dibatalkan' },
                                    ],
                                },
                            ]}
                            filterValues={{ status }}
                            onFilterChange={handleFilterChange}
                            onFilterSubmit={handleFilterSubmit}
                            onFilterReset={handleFilterReset}
                            searchValue={search}
                            searchPlaceholder="Cari nomor atau judul rapat..."
                            onSearchChange={setSearch}
                            pagination={meetings}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                            emptyMessage="Tidak ada data rapat"
                            emptyIcon={CalendarIcon}
                        />
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                        {renderCalendarView()}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, meeting: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus rapat <strong>{deleteDialog.meeting?.title}</strong>?
                            <br />
                            <span className="text-destructive">Tindakan ini tidak dapat dibatalkan.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, meeting: null, loading: false })} disabled={deleteDialog.loading}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading}>
                            {deleteDialog.loading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menghapus...</>
                            ) : (
                                <><Trash className="h-4 w-4 mr-2" />Hapus</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );

    function renderCalendarView() {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days: Date[] = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
        }

        const getMeetingsForDate = (date: Date) =>
            calendarMeetings.filter(m => isSameDay(new Date(m.meeting_date), date));

        const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Calendar nav */}
                <div className="px-3 py-2 flex items-center justify-between border-b bg-muted/30">
                    <div className="flex items-center gap-0 border rounded-md overflow-hidden">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} disabled={calendarLoading}>
                            
                        </Button>
                        <span className="border-x px-3 text-sm font-medium min-w-[140px] text-center">
                            {format(currentMonth, 'MMMM yyyy', { locale: id })}
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} disabled={calendarLoading}>
                            
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={fetchCalendarData} disabled={calendarLoading} title="Refresh">
                        <RefreshCw className={`h-3.5 w-3.5 ${calendarLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Grid */}
                <div className="bg-background">
                    <div className="grid grid-cols-7 border-b">
                        {weekDays.map((d, i) => (
                            <div key={i} className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
                                <span className="hidden sm:inline">{d}</span>
                                <span className="sm:hidden">{d.charAt(0)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {days.map((day, index) => {
                            const dayMeetings = getMeetingsForDate(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={index} className={`min-h-[120px] p-1.5 sm:p-2 border-r border-b last:border-r-0 ${!isCurrentMonth ? 'bg-muted/30' : ''} ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}>
                                    <div className={`text-xs sm:text-sm font-medium mb-1.5 ${!isCurrentMonth ? 'text-muted-foreground' : ''} ${isToday ? 'text-primary font-bold' : ''}`}>
                                        {format(day, 'd')}
                                        {isToday && <span className="ml-1 text-[10px] sm:text-xs">(Hari Ini)</span>}
                                    </div>
                                    <div className="space-y-1">
                                        {dayMeetings.length > 0 ? dayMeetings.map((meeting) => (
                                            <button key={meeting.id}
                                                onClick={() => router.visit(route('meetings.show', meeting.id))}
                                                className={`w-full text-left p-1.5 rounded text-[10px] sm:text-xs hover:opacity-80 hover:shadow-sm transition-all border ${getStatusBadgeColor(meeting.status)}`}
                                                title={`${meeting.title}\n${meeting.start_time} - ${meeting.end_time}\nRuangan: ${meeting.room?.name || '-'}\nStatus: ${getStatusLabel(meeting.status)}`}
                                            >
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                                    <span className="font-semibold truncate">{meeting.start_time}</span>
                                                    <span className="text-[8px] sm:text-[10px] opacity-70">- {meeting.end_time}</span>
                                                </div>
                                                <div className="truncate font-medium leading-tight mb-0.5">{meeting.title}</div>
                                                {meeting.room && (
                                                    <div className="flex items-center gap-1 opacity-70 text-[9px] sm:text-[10px]">
                                                        <MapPin className="h-2 w-2 flex-shrink-0" />
                                                        <span className="truncate">{meeting.room.name}</span>
                                                    </div>
                                                )}
                                            </button>
                                        )) : (
                                            <div className="text-[10px] text-muted-foreground/50 text-center py-2">-</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="p-3 bg-muted/30 border-t flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3 text-xs">
                        {[
                            { color: 'bg-gray-100 border-gray-200', label: 'Draft' },
                            { color: 'bg-blue-100 border-blue-200', label: 'Terjadwal' },
                            { color: 'bg-green-100 border-green-200', label: 'Berlangsung' },
                            { color: 'bg-purple-100 border-purple-200', label: 'Selesai' },
                            { color: 'bg-red-100 border-red-200', label: 'Dibatalkan' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded border ${color}`} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Total: <span className="font-medium text-foreground">{calendarMeetings.length}</span> rapat
                    </span>
                </div>
            </div>
        );
    }
}
