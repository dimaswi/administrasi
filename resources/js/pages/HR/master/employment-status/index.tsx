import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, ClipboardList, Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EmploymentStatus {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_permanent: boolean;
    is_active: boolean;
    created_at: string;
}

interface Props {
    statuses: {
        data: EmploymentStatus[];
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

export default function Index({ statuses, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<EmploymentStatus | null>(null);

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Status Kepegawaian', href: '/hr/employment-statuses' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/employment-statuses', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/hr/employment-statuses', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/employment-statuses', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/employment-statuses', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (item: EmploymentStatus) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            router.delete(`/hr/employment-statuses/${itemToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus status'),
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            render: (item: EmploymentStatus) => <span className="font-mono text-sm font-medium">{item.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Status',
            render: (item: EmploymentStatus) => (
                <div>
                    <div className="flex items-center gap-2 font-medium">
                        {item.name}
                        {item.is_permanent && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    {item.description && <div className="max-w-[300px] truncate text-sm text-muted-foreground">{item.description}</div>}
                </div>
            ),
        },
        {
            key: 'is_permanent',
            label: 'Tipe',
            render: (item: EmploymentStatus) => (
                <Badge variant={item.is_permanent ? 'default' : 'outline'}>{item.is_permanent ? 'Tetap' : 'Non-Tetap'}</Badge>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (item: EmploymentStatus) => (
                <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (item: EmploymentStatus) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/employment-statuses/${item.id}/edit`}>
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
            <Head title="Status Kepegawaian" />

            <IndexPage
                title="Status Kepegawaian"
                description="Kelola status kepegawaian (Tetap, Kontrak, Part-time, dll)"
                actions={[
                    {
                        label: 'Tambah Status',
                        href: '/hr/employment-statuses/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode atau nama..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={statuses.data}
                pagination={{
                    current_page: statuses.current_page,
                    last_page: statuses.last_page,
                    per_page: statuses.per_page,
                    total: statuses.total,
                    from: statuses.from,
                    to: statuses.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                emptyMessage="Belum ada status kepegawaian"
                emptyIcon={ClipboardList}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Status Kepegawaian</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus status "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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
