import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, GraduationCap, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EducationLevel {
    id: number;
    code: string;
    name: string;
    level: number;
    is_active: boolean;
    created_at: string;
}

interface Props {
    levels: {
        data: EducationLevel[];
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

export default function Index({ levels, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<EducationLevel | null>(null);

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Tingkat Pendidikan', href: '/hr/education-levels' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/education-levels', Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== '')), { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/hr/education-levels', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/education-levels', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/education-levels', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (item: EducationLevel) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            router.delete(`/hr/education-levels/${itemToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus tingkat pendidikan'),
            });
        }
    };

    const columns = [
        {
            key: 'level',
            label: 'Urutan',
            className: 'w-[80px]',
            render: (item: EducationLevel) => <Badge variant="outline">{item.level}</Badge>,
        },
        {
            key: 'code',
            label: 'Kode',
            render: (item: EducationLevel) => <span className="font-mono text-sm font-medium">{item.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Tingkat',
            render: (item: EducationLevel) => <div className="font-medium">{item.name}</div>,
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (item: EducationLevel) => (
                <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (item: EducationLevel) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/education-levels/${item.id}/edit`}>
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
            <Head title="Tingkat Pendidikan" />

            <IndexPage
                title="Tingkat Pendidikan"
                description="Kelola tingkat pendidikan (SD, SMP, SMA, D3, S1, S2, S3)"
                actions={[
                    {
                        label: 'Tambah Tingkat',
                        href: '/hr/education-levels/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode atau nama..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={levels.data}
                pagination={{
                    current_page: levels.current_page,
                    last_page: levels.last_page,
                    per_page: levels.per_page,
                    total: levels.total,
                    from: levels.from,
                    to: levels.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                emptyMessage="Belum ada tingkat pendidikan"
                emptyIcon={GraduationCap}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Tingkat Pendidikan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus tingkat "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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
