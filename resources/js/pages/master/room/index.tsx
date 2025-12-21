import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
    id: number;
    code: string;
    name: string;
    building: string | null;
    floor: string | null;
    capacity: number;
    facilities: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    rooms: {
        data: Room[];
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

export default function Index({ rooms, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/master/rooms', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/master/rooms', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/master/rooms', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/master/rooms', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (room: Room) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (roomToDelete) {
            router.delete(`/master/rooms/${roomToDelete.id}`, {
                onSuccess: () => {
                    toast.success(`Ruangan ${roomToDelete.name} berhasil dihapus`);
                    setDeleteDialogOpen(false);
                    setRoomToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus ruangan'),
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            render: (room: Room) => (
                <span className="font-mono text-sm">{room.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nama Ruangan',
            render: (room: Room) => (
                <div className="font-medium">{room.name}</div>
            ),
        },
        {
            key: 'location',
            label: 'Lokasi',
            render: (room: Room) => (
                <span className="text-muted-foreground text-sm">
                    {room.building && room.floor 
                        ? `${room.building}, Lantai ${room.floor}` 
                        : room.building || '-'}
                </span>
            ),
        },
        {
            key: 'capacity',
            label: 'Kapasitas',
            render: (room: Room) => (
                <Badge variant="secondary">{room.capacity} orang</Badge>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (room: Room) => (
                room.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Nonaktif
                    </Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (room: Room) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/master/rooms/${room.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/master/rooms/${room.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => handleDeleteClick(room)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Ruangan" />

            <div className="p-6">
                <IndexPage
                    title="Ruangan"
                    description="Kelola data ruangan untuk rapat"
                    actions={[
                        {
                            label: 'Tambah Ruangan',
                            href: '/master/rooms/create',
                            icon: Plus,
                        },
                    ]}
                    data={rooms.data}
                    columns={columns}
                    pagination={{
                        current_page: rooms.current_page,
                        last_page: rooms.last_page,
                        per_page: rooms.per_page || 10,
                        total: rooms.total,
                        from: rooms.from,
                        to: rooms.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari kode, nama, gedung..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada ruangan"
                    emptyIcon={DoorOpen}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Ruangan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus ruangan ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {roomToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{roomToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">Kode: {roomToDelete.code}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setRoomToDelete(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

