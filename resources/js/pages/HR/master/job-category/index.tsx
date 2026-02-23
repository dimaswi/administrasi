import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Briefcase, Edit, MoreHorizontal, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface JobCategory {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_medical: boolean;
    requires_str: boolean;
    requires_sip: boolean;
    is_active: boolean;
    created_at: string;
}

interface Props {
    categories: {
        data: JobCategory[];
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

export default function Index({ categories, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<JobCategory | null>(null);

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Kategori Pekerjaan', href: '/hr/job-categories' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/job-categories', Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== '')), { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/hr/job-categories', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/job-categories', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/job-categories', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (item: JobCategory) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            router.delete(`/hr/job-categories/${itemToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus kategori'),
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            render: (item: JobCategory) => <span className="font-mono text-sm font-medium">{item.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Kategori',
            render: (item: JobCategory) => (
                <div>
                    <div className="flex items-center gap-2 font-medium">
                        {item.name}
                        {item.is_medical && <Stethoscope className="h-4 w-4 text-blue-500" />}
                    </div>
                    {item.description && <div className="max-w-[300px] truncate text-sm text-muted-foreground">{item.description}</div>}
                </div>
            ),
        },
        {
            key: 'requirements',
            label: 'Persyaratan',
            render: (item: JobCategory) => (
                <div className="flex flex-wrap gap-1">
                    {item.requires_str && <Badge variant="outline">STR</Badge>}
                    {item.requires_sip && <Badge variant="outline">SIP</Badge>}
                    {!item.requires_str && !item.requires_sip && <span className="text-sm text-muted-foreground">-</span>}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (item: JobCategory) => <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Aktif' : 'Nonaktif'}</Badge>,
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (item: JobCategory) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/job-categories/${item.id}/edit`}>
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
            <Head title="Kategori Pekerjaan" />

            <IndexPage
                title="Kategori Pekerjaan"
                description="Kelola kategori pekerjaan untuk penomoran NIK karyawan"
                actions={[
                    {
                        label: 'Tambah Kategori',
                        href: '/hr/job-categories/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode atau nama..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={categories.data}
                pagination={{
                    current_page: categories.current_page,
                    last_page: categories.last_page,
                    per_page: categories.per_page,
                    total: categories.total,
                    from: categories.from,
                    to: categories.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                emptyMessage="Belum ada kategori pekerjaan"
                emptyIcon={Briefcase}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori Pekerjaan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kategori "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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
