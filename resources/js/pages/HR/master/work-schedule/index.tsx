import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    description: string | null;
    clock_in_time: string;
    clock_out_time: string;
    break_start: string | null;
    break_end: string | null;
    late_tolerance: number;
    early_leave_tolerance: number;
    is_flexible: boolean;
    flexible_minutes: number | null;
    work_hours_per_day: number;
    is_active: boolean;
    created_at: string;
}

interface Props {
    schedules: {
        data: WorkSchedule[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search: string;
        perPage: number;
    };
}

function formatTime(time: string | null): string {
    if (!time) return '-';
    return time.substring(0, 5);
}

function formatWorkHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins > 0) return `${hours}j ${mins}m`;
    return `${hours}j`;
}

export default function Index({ schedules, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<WorkSchedule | null>(null);

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Jadwal Kerja (Shift)', href: '/hr/work-schedules' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/work-schedules', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/hr/work-schedules', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/work-schedules', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/work-schedules', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (item: WorkSchedule) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            router.delete(`/hr/work-schedules/${itemToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Gagal menghapus shift');
                },
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            render: (item: WorkSchedule) => <span className="font-mono text-sm font-medium">{item.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Shift',
            render: (item: WorkSchedule) => (
                <div>
                    <div className="flex items-center gap-2 font-medium">
                        {item.name}
                        {item.is_flexible && (
                            <Badge variant="outline" className="text-xs">
                                Fleksibel
                            </Badge>
                        )}
                    </div>
                    {item.description && <div className="max-w-[300px] truncate text-sm text-muted-foreground">{item.description}</div>}
                </div>
            ),
        },
        {
            key: 'time',
            label: 'Jam Kerja',
            render: (item: WorkSchedule) => (
                <div className="text-sm">
                    <div className="font-medium">
                        {formatTime(item.clock_in_time)} - {formatTime(item.clock_out_time)}
                    </div>
                    {item.break_start && item.break_end && (
                        <div className="text-xs text-muted-foreground">
                            Istirahat: {formatTime(item.break_start)} - {formatTime(item.break_end)}
                        </div>
                    )}
                    <div className="text-xs text-muted-foreground">Total: {formatWorkHours(item.work_hours_per_day)}</div>
                </div>
            ),
        },
        {
            key: 'tolerance',
            label: 'Toleransi',
            render: (item: WorkSchedule) => (
                <div className="text-sm text-muted-foreground">
                    <div>Telat: {item.late_tolerance}m</div>
                    <div>Pulang Awal: {item.early_leave_tolerance}m</div>
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (item: WorkSchedule) => <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Aktif' : 'Nonaktif'}</Badge>,
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (item: WorkSchedule) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/work-schedules/${item.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Master Jadwal Kerja (Shift)" />

            <IndexPage
                title="Jadwal Kerja (Shift)"
                description="Kelola template shift kerja seperti Pagi, Siang, Malam. Shift akan dipilih per-hari saat mengatur jadwal karyawan."
                actions={[
                    {
                        label: 'Tambah Shift',
                        href: '/hr/work-schedules/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode atau nama shift..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                data={schedules.data}
                columns={columns}
                pagination={{
                    current_page: schedules.current_page,
                    last_page: schedules.last_page,
                    per_page: schedules.per_page,
                    total: schedules.total,
                    from: schedules.from,
                    to: schedules.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                emptyMessage="Belum ada shift. Mulai dengan menambahkan shift baru seperti Pagi, Siang, Malam."
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Shift</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus shift "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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
