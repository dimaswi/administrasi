import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Edit, MoreHorizontal, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
}

interface EmployeeSchedule {
    id: number;
    effective_date: string;
    end_date: string | null;
    monday_shift_id: number | null;
    tuesday_shift_id: number | null;
    wednesday_shift_id: number | null;
    thursday_shift_id: number | null;
    friday_shift_id: number | null;
    saturday_shift_id: number | null;
    sunday_shift_id: number | null;
    monday_shift: WorkSchedule | null;
    tuesday_shift: WorkSchedule | null;
    wednesday_shift: WorkSchedule | null;
    thursday_shift: WorkSchedule | null;
    friday_shift: WorkSchedule | null;
    saturday_shift: WorkSchedule | null;
    sunday_shift: WorkSchedule | null;
    notes: string | null;
    creator?: { name: string };
    created_at: string;
}

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    organization_unit?: { name: string };
    job_category?: { name: string };
    schedules: EmployeeSchedule[];
}

interface Props {
    employee: Employee;
}

const daysOfWeek = [
    { key: 'monday', label: 'Sen' },
    { key: 'tuesday', label: 'Sel' },
    { key: 'wednesday', label: 'Rab' },
    { key: 'thursday', label: 'Kam' },
    { key: 'friday', label: 'Jum' },
    { key: 'saturday', label: 'Sab' },
    { key: 'sunday', label: 'Min' },
];

function formatTime(time: string | null): string {
    if (!time) return '';
    return time.substring(0, 5);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function isCurrentSchedule(schedule: EmployeeSchedule): boolean {
    const today = new Date().toISOString().split('T')[0];
    return schedule.effective_date <= today && (!schedule.end_date || schedule.end_date >= today);
}

export default function Show({ employee }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<EmployeeSchedule | null>(null);

    const breadcrumbs = [
        { title: <Calendar className="h-4 w-4" />, href: '/hr/schedules' },
        { title: `${employee.first_name} ${employee.last_name}`, href: `/hr/schedules/${employee.id}` },
    ];

    const currentSchedule = employee.schedules.find(isCurrentSchedule);

    const handleDeleteClick = (schedule: EmployeeSchedule) => {
        setScheduleToDelete(schedule);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (scheduleToDelete) {
            router.delete(`/hr/schedules/${employee.id}/schedules/${scheduleToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setScheduleToDelete(null);
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Gagal menghapus jadwal');
                },
            });
        }
    };

    const getShiftForDay = (schedule: EmployeeSchedule, day: string): WorkSchedule | null => {
        const shiftKey = `${day}_shift` as keyof EmployeeSchedule;
        return schedule[shiftKey] as WorkSchedule | null;
    };

    return (
        <HRLayout>
            <Head title={`Jadwal - ${employee.first_name} ${employee.last_name}`} />

            <DetailPage
                title={`${employee.first_name} ${employee.last_name}`}
                description={`${employee.employee_id} • ${employee.organization_unit?.name || '-'} • ${employee.job_category?.name || '-'}`}
                backUrl="/hr/schedules"
                actions={
                    <Button asChild>
                        <Link href={`/hr/schedules/${employee.id}/create`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Jadwal
                        </Link>
                    </Button>
                }
            >
                {/* Current Schedule */}
                {currentSchedule && (
                    <div className='pb-4'>
                        <Card className="border-primary">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Jadwal Aktif Saat Ini
                                </CardTitle>
                                <Badge variant="default">Aktif</Badge>
                            </div>
                            <CardDescription>
                                Berlaku sejak {formatDate(currentSchedule.effective_date)}
                                {currentSchedule.end_date && ` sampai ${formatDate(currentSchedule.end_date)}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-2">
                                {daysOfWeek.map((day) => {
                                    const shift = getShiftForDay(currentSchedule, day.key);
                                    return (
                                        <div key={day.key} className="text-center p-3 rounded-lg bg-muted/50">
                                            <div className="font-medium text-sm mb-1">{day.label}</div>
                                            {shift ? (
                                                <>
                                                    <div className="text-xs font-medium text-primary">{shift.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatTime(shift.clock_in_time)}-{formatTime(shift.clock_out_time)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-xs text-muted-foreground">Libur</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                    </div>
                )}

                {/* Schedule History */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Riwayat Jadwal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employee.schedules.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Belum ada jadwal</p>
                                <Button variant="link" asChild className="mt-2">
                                    <Link href={`/hr/schedules/${employee.id}/create`}>Tambah jadwal pertama</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {employee.schedules.map((schedule) => {
                                    const isCurrent = isCurrentSchedule(schedule);
                                    const isFuture = schedule.effective_date > new Date().toISOString().split('T')[0];
                                    const isPast = schedule.end_date && schedule.end_date < new Date().toISOString().split('T')[0];

                                    return (
                                        <div
                                            key={schedule.id}
                                            className={`border rounded-lg p-4 ${isCurrent ? 'border-primary bg-primary/5' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {formatDate(schedule.effective_date)}
                                                            {schedule.end_date && ` - ${formatDate(schedule.end_date)}`}
                                                        </span>
                                                        {isCurrent && <Badge variant="default">Aktif</Badge>}
                                                        {isFuture && <Badge variant="secondary">Akan Datang</Badge>}
                                                        {isPast && <Badge variant="outline">Berakhir</Badge>}
                                                    </div>
                                                    {schedule.creator && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Dibuat oleh {schedule.creator.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/hr/schedules/${employee.id}/schedules/${schedule.id}/edit`}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(schedule)}
                                                            className="text-destructive"
                                                            disabled={!isFuture}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            
                                            {/* Schedule Grid */}
                                            <div className="grid grid-cols-7 gap-1 text-xs">
                                                {daysOfWeek.map((day) => {
                                                    const shift = getShiftForDay(schedule, day.key);
                                                    return (
                                                        <div
                                                            key={day.key}
                                                            className={`text-center p-2 rounded ${shift ? 'bg-muted' : 'bg-muted/30'}`}
                                                        >
                                                            <div className="font-medium">{day.label}</div>
                                                            {shift ? (
                                                                <div className="text-muted-foreground truncate" title={shift.name}>
                                                                    {shift.code}
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted-foreground">-</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {schedule.notes && (
                                                <div className="mt-3 text-sm text-muted-foreground">
                                                    <span className="font-medium">Catatan:</span> {schedule.notes}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </DetailPage>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Jadwal</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HRLayout>
    );
}
DetailPage