import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Meeting, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Calendar as CalendarIcon, Edit3, Eye, Loader2, List, MapPin, PlusCircle, Search, Trash, Users, X, Clock, RefreshCw } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { route } from "ziggy-js";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
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
    }>({
        open: false,
        meeting: null,
        loading: false,
    });

    // Fetch calendar data when month changes or view mode is calendar
    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchCalendarData();
        }
    }, [currentMonth, viewMode, status]);

    const fetchCalendarData = async () => {
        setCalendarLoading(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            // Extend range to include partial weeks
            const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

            const response = await axios.get(route('meetings.calendar-data'), {
                params: {
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    status: status,
                }
            });
            setCalendarMeetings(response.data.meetings);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        } finally {
            setCalendarLoading(false);
        }
    };

    const statusOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Terjadwal' },
        { value: 'ongoing', label: 'Berlangsung' },
        { value: 'completed', label: 'Selesai' },
        { value: 'cancelled', label: 'Dibatalkan' },
    ];

    const handleSearch = (value: string, statusValue: string) => {
        router.get('/meeting/meetings', {
            search: value,
            status: statusValue,
            perPage: initialFilters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/meeting/meetings', {
            search: initialFilters.search,
            status: initialFilters.status,
            perPage,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/meeting/meetings', {
            search: initialFilters.search,
            status: initialFilters.status,
            perPage: initialFilters.perPage,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search, status);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        handleSearch('', '');
    };

    const handleDeleteClick = (meeting: Meeting) => {
        setDeleteDialog({
            open: true,
            meeting: meeting,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.meeting) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        router.delete(route('meetings.destroy', deleteDialog.meeting.id), {
            onSuccess: () => {
                setDeleteDialog({ open: false, meeting: null, loading: false });
            },
            onError: () => {
                setDeleteDialog(prev => ({ ...prev, loading: false }));
            }
        });
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, meeting: null, loading: false });
    };

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

    return (
        <AppLayout>
            <Head title="Rapat" />
            <div className="p-4 max-w-7xl">
                <div className="mb-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xl md:text-2xl font-semibold">Daftar Rapat</h2>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2 hover:bg-green-50"
                            onClick={() => router.visit('/meeting/meetings/create')}
                        >
                            <PlusCircle className="h-4 w-4 text-green-600" />
                            <span className="hidden sm:inline">Tambah</span>
                        </Button>
                    </div>
                    
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari nomor atau judul rapat..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <SearchableSelect
                                options={statusOptions}
                                value={status}
                                onValueChange={setStatus}
                                placeholder="Semua Status"
                                searchPlaceholder="Cari status..."
                                className="flex-1 sm:w-[180px]"
                            />
                            <Button type="submit" variant="outline" size="sm" className="px-4">
                                Cari
                            </Button>
                            {(search || status) && (
                                <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* View Mode Tabs */}
                <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'list' | 'calendar')} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Calendar View</span>
                        </TabsTrigger>
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            <span className="hidden sm:inline">List View</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-0">{renderListView()}</TabsContent>
                    <TabsContent value="calendar" className="mt-0">{renderCalendarView()}</TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus rapat <strong>{deleteDialog.meeting?.title}</strong>?
                            <br />
                            <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                            disabled={deleteDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteDialog.loading}
                        >
                            {deleteDialog.loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash className="h-4 w-4 mr-2" />
                                    Hapus
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
    
    function renderListView() {
        return (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>No. Rapat</TableHead>
                                <TableHead>Judul</TableHead>
                                <TableHead>Tanggal & Waktu</TableHead>
                                <TableHead>Ruangan</TableHead>
                                <TableHead>Penyelenggara</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Peserta</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {meetings.data.length > 0 ? (
                                meetings.data.map((meeting, index) => (
                                    <TableRow key={meeting.id}>
                                        <TableCell>
                                            {(meetings.current_page - 1) * meetings.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {meeting.meeting_number}
                                        </TableCell>
                                        <TableCell className="font-medium max-w-xs">
                                            <div className="truncate">{meeting.title}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-1 font-medium">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {format(new Date(meeting.meeting_date), 'dd MMM yyyy', { locale: id })}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {meeting.start_time} - {meeting.end_time}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {meeting.room?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {meeting.organizer?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {meeting.organization_unit?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Users className="h-3 w-3" />
                                                <span>{meeting.participants_count || 0}</span>
                                                {meeting.attended_participants_count !== undefined && (
                                                    <span className="text-muted-foreground">
                                                        ({meeting.attended_participants_count} hadir)
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusBadgeColor(meeting.status)}>
                                                {getStatusLabel(meeting.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => router.visit(route('meetings.show', meeting.id))}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {(meeting.status === 'draft' || meeting.status === 'cancelled') ? (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => router.visit(route('meetings.edit', meeting.id))}
                                                        title={meeting.status === 'cancelled' ? 'Jadwalkan Ulang' : 'Edit'}
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(meeting)}
                                                    title="Hapus"
                                                >
                                                    <Trash className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
                                            <span>Tidak ada data rapat</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {meetings.data.length > 0 ? (
                        meetings.data.map((meeting) => (
                            <div key={meeting.id} className="border rounded-lg p-4 space-y-3 bg-card">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-xs text-muted-foreground mb-1">
                                            {meeting.meeting_number}
                                        </div>
                                        <h3 className="font-semibold text-sm line-clamp-2">{meeting.title}</h3>
                                    </div>
                                    <Badge variant="outline" className={getStatusBadgeColor(meeting.status)}>
                                        {getStatusLabel(meeting.status)}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="h-3 w-3" />
                                        <span>{format(new Date(meeting.meeting_date), 'dd MMM yyyy', { locale: id })}</span>
                                        <span className="text-xs">•</span>
                                        <span>{meeting.start_time} - {meeting.end_time}</span>
                                    </div>
                                    
                                    {meeting.room && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span>{meeting.room.name}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        <span>{meeting.participants_count || 0} peserta</span>
                                        {meeting.attended_participants_count !== undefined && (
                                            <span className="text-xs">({meeting.attended_participants_count} hadir)</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => router.visit(route('meetings.show', meeting.id))}
                                        className="flex-1"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Lihat
                                    </Button>
                                    {(meeting.status === 'draft' || meeting.status === 'cancelled') && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => router.visit(route('meetings.edit', meeting.id))}
                                            className="flex-1"
                                        >
                                            <Edit3 className="h-4 w-4 mr-1" />
                                            {meeting.status === 'cancelled' ? 'Jadwalkan Ulang' : 'Edit'}
                                        </Button>
                                    )}
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDeleteClick(meeting)}
                                        className="px-3"
                                    >
                                        <Trash className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg">
                            <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <span>Tidak ada data rapat</span>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {meetings.from} - {meetings.to} dari {meetings.total} data
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                            <span className="text-sm whitespace-nowrap">Baris per halaman:</span>
                            <select
                                className="rounded border px-2 py-1 text-sm"
                                value={meetings.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(meetings.current_page - 1)}
                                disabled={meetings.current_page <= 1}
                            >
                                <span className="hidden sm:inline">Previous</span>
                                <span className="sm:hidden">Prev</span>
                            </Button>
                            
                            <span className="text-sm whitespace-nowrap">
                                <span className="hidden sm:inline">Page {meetings.current_page} of {meetings.last_page}</span>
                                <span className="sm:hidden">{meetings.current_page}/{meetings.last_page}</span>
                            </span>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(meetings.current_page + 1)}
                                disabled={meetings.current_page >= meetings.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        );
    }
    
    function renderCalendarView() {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const dateFormat = "d";
        const days = [];
        let day = startDate;
        
        while (day <= endDate) {
            days.push(day);
            day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
        }
        
        const getMeetingsForDate = (date: Date) => {
            return calendarMeetings.filter(meeting => 
                isSameDay(new Date(meeting.meeting_date), date)
            );
        };
        
        const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        
        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Calendar Header */}
                <div className="bg-muted p-4 flex items-center justify-between border-b">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        disabled={calendarLoading}
                    >
                        &larr; Prev
                    </Button>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                            {format(currentMonth, 'MMMM yyyy', { locale: id })}
                        </h3>
                        {calendarLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchCalendarData}
                            disabled={calendarLoading}
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${calendarLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        disabled={calendarLoading}
                    >
                        Next &rarr;
                    </Button>
                </div>
                
                {/* Calendar Grid */}
                <div className="bg-background">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b">
                        {weekDays.map((day, index) => (
                            <div key={index} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
                                <span className="hidden sm:inline">{day}</span>
                                <span className="sm:hidden">{day.charAt(0)}</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {days.map((day, index) => {
                            const dayMeetings = getMeetingsForDate(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());
                            
                            return (
                                <div
                                    key={index}
                                    className={`min-h-[120px] p-1.5 sm:p-2 border-r border-b last:border-r-0 ${
                                        !isCurrentMonth ? 'bg-muted/30' : ''
                                    } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                                >
                                    <div className={`text-xs sm:text-sm font-medium mb-1.5 ${
                                        !isCurrentMonth ? 'text-muted-foreground' : ''
                                    } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                                        {format(day, dateFormat)}
                                        {isToday && <span className="ml-1 text-[10px] sm:text-xs">(Hari Ini)</span>}
                                    </div>
                                    <div className="space-y-1">
                                        {dayMeetings.length > 0 ? (
                                            dayMeetings.map((meeting) => (
                                                <button
                                                    key={meeting.id}
                                                    onClick={() => router.visit(route('meetings.show', meeting.id))}
                                                    className={`w-full text-left p-1.5 rounded text-[10px] sm:text-xs hover:opacity-80 hover:shadow-sm transition-all border ${
                                                        getStatusBadgeColor(meeting.status)
                                                    }`}
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
                                            ))
                                        ) : (
                                            <div className="text-[10px] text-muted-foreground/50 text-center py-2">-</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Legend */}
                <div className="p-3 bg-muted/30 border-t">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-gray-100 border-gray-200 border"></div>
                                <span>Draft</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-blue-100 border-blue-200 border"></div>
                                <span>Terjadwal</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-green-100 border-green-200 border"></div>
                                <span>Berlangsung</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-purple-100 border-purple-200 border"></div>
                                <span>Selesai</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-red-100 border-red-200 border"></div>
                                <span>Dibatalkan</span>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Total: <span className="font-medium text-foreground">{calendarMeetings.length}</span> rapat
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
