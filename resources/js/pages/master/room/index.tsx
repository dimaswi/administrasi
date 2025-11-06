import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Room, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { DoorOpen, Edit3, Eye, Loader2, PlusCircle, Search, Trash, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface PaginatedRooms {
    data: Room[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    rooms: PaginatedRooms;
    filters: {
        search: string;
        perPage: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruangan', href: '/master/rooms' },
];

export default function RoomIndex() {
    const { rooms, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters.search);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        room: Room | null;
        loading: boolean;
    }>({
        open: false,
        room: null,
        loading: false,
    });

    const handleSearch = (value: string) => {
        router.get('/master/rooms', {
            search: value,
            perPage: initialFilters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/master/rooms', {
            search: initialFilters.search,
            perPage,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/master/rooms', {
            search: initialFilters.search,
            perPage: initialFilters.perPage,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (room: Room) => {
        setDeleteDialog({
            open: true,
            room: room,
            loading: false,
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteDialog.room) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        router.delete(route('rooms.destroy', deleteDialog.room.id), {
            onSuccess: () => {
                toast.success(`Ruangan ${deleteDialog.room?.name} berhasil dihapus`);
                setDeleteDialog({ open: false, room: null, loading: false });
            },
            onError: () => {
                toast.error('Gagal menghapus ruangan');
                setDeleteDialog(prev => ({ ...prev, loading: false }));
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ruangan" />
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(search); }} className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari kode, nama, atau gedung..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {search && (
                                <button type="button" onClick={() => { setSearch(''); handleSearch(''); }} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="outline" size="sm">Cari</Button>
                    </form>
                    
                    <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-green-50" onClick={() => router.visit('/master/rooms/create')}>
                        <PlusCircle className="h-4 w-4 text-green-600" />
                        Tambah
                    </Button>
                </div>
                
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Ruangan</TableHead>
                                <TableHead>Lokasi</TableHead>
                                <TableHead>Kapasitas</TableHead>
                                <TableHead>Fasilitas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.data.length > 0 ? (
                                rooms.data.map((room, index) => (
                                    <TableRow key={room.id}>
                                        <TableCell>{(rooms.current_page - 1) * rooms.per_page + index + 1}</TableCell>
                                        <TableCell className="font-mono text-sm">{room.code}</TableCell>
                                        <TableCell className="font-medium">{room.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {room.building && room.floor ? `${room.building}, Lantai ${room.floor}` : room.building || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{room.capacity} orang</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-xs truncate">{room.facilities || '-'}</TableCell>
                                        <TableCell>
                                            {room.is_active ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => router.visit(route('rooms.show', room.id))}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => router.visit(route('rooms.edit', room.id))}
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteClick(room)}
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
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <DoorOpen className="h-8 w-8 text-muted-foreground/50" />
                                            <span>Tidak ada data ruangan</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {rooms.from} - {rooms.to} dari {rooms.total} data
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Baris per halaman:</span>
                            <select className="rounded border px-2 py-1 text-sm" value={rooms.per_page} onChange={(e) => handlePerPageChange(Number(e.target.value))}>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(rooms.current_page - 1)} disabled={rooms.current_page <= 1}>Previous</Button>
                            <span className="text-sm">Page {rooms.current_page} of {rooms.last_page}</span>
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(rooms.current_page + 1)} disabled={rooms.current_page >= rooms.last_page}>Next</Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, room: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Ruangan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus ruangan <strong>{deleteDialog.room?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, room: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading}>
                            {deleteDialog.loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menghapus...</> : <><Trash className="h-4 w-4 mr-2" />Hapus</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

