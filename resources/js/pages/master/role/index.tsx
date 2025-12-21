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
import { Plus, MoreHorizontal, Edit, Trash2, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
}

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    created_at: string;
    users_count: number;
    permissions: Permission[];
}

interface Props {
    roles: {
        data: Role[];
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

export default function Index({ roles, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/master/roles', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/master/roles', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/master/roles', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/master/roles', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (roleToDelete) {
            router.delete(`/master/roles/${roleToDelete.id}`, {
                onSuccess: () => {
                    toast.success(`Role ${roleToDelete.display_name || roleToDelete.name} berhasil dihapus`);
                    setDeleteDialogOpen(false);
                    setRoleToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus role'),
            });
        }
    };

    const columns = [
        {
            key: 'display_name',
            label: 'Nama Role',
            render: (role: Role) => (
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{role.display_name || role.name}</span>
                </div>
            ),
        },
        {
            key: 'name',
            label: 'Kode',
            render: (role: Role) => (
                <span className="font-mono text-sm text-muted-foreground">{role.name}</span>
            ),
        },
        {
            key: 'description',
            label: 'Deskripsi',
            className: 'max-w-[250px]',
            render: (role: Role) => (
                <span className="text-muted-foreground text-sm truncate block">
                    {role.description || '-'}
                </span>
            ),
        },
        {
            key: 'users_count',
            label: 'Pengguna',
            render: (role: Role) => (
                <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{role.users_count}</span>
                </div>
            ),
        },
        {
            key: 'permissions',
            label: 'Permission',
            render: (role: Role) => (
                <Badge variant="secondary">
                    {role.permissions?.length || 0} izin
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (role: Role) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/master/roles/${role.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => handleDeleteClick(role)}
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
            <Head title="Role" />

            <div className="p-6">
                <IndexPage
                    title="Role"
                    description="Kelola role dan hak akses pengguna"
                    actions={[
                        {
                            label: 'Tambah Role',
                            href: '/master/roles/create',
                            icon: Plus,
                        },
                    ]}
                    data={roles.data}
                    columns={columns}
                    pagination={{
                        current_page: roles.current_page,
                        last_page: roles.last_page,
                        per_page: roles.per_page || 10,
                        total: roles.total,
                        from: roles.from,
                        to: roles.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari nama role..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada role"
                    emptyIcon={Shield}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Role</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {roleToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{roleToDelete.display_name || roleToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">{roleToDelete.users_count} pengguna menggunakan role ini</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setRoleToDelete(null);
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
