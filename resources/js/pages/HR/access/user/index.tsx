import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import HRLayout from '@/layouts/hr-layout';
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
import { Plus, MoreHorizontal, Edit, Trash2, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    display_name: string;
}

interface OrganizationUnit {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
    email: string | null;
    role: Role | null;
    organization_unit: OrganizationUnit | null;
    position: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    users: {
        data: User[];
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

export default function Index({ users, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/access/users', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        router.get('/hr/access/users', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/access/users', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/access/users', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            router.delete(`/hr/access/users/${userToDelete.id}`, {
                onSuccess: () => {
                    toast.success(`User ${userToDelete.name} berhasil dihapus`);
                    setDeleteDialogOpen(false);
                    setUserToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus user'),
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama',
            render: (user: User) => (
                <div>
                    <div className="font-medium">{user.name}</div>
                    {user.position && (
                        <div className="text-sm text-muted-foreground">{user.position}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'nip',
            label: 'NIP',
            render: (user: User) => (
                <span className="font-mono text-sm text-muted-foreground">
                    {user.nip}
                </span>
            ),
        },
        {
            key: 'organization',
            label: 'Unit Organisasi',
            render: (user: User) => (
                user.organization_unit ? (
                    <span className="text-sm">{user.organization_unit.name}</span>
                ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                )
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (user: User) => (
                user.role ? (
                    <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {user.role.display_name || user.role.name}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                )
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (user: User) => (
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (user: User) => (
                <span className="text-muted-foreground text-sm">
                    {formatDate(user.created_at)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (user: User) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/access/users/${user.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleDeleteClick(user)}
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
        <HRLayout>
            <Head title="User" />

            <div className="p-6">
                <IndexPage
                    title="User"
                    description="Kelola data pengguna sistem"
                    actions={[
                        {
                            label: 'Tambah User',
                            href: '/hr/access/users/create',
                            icon: Plus,
                        },
                    ]}
                    data={users.data}
                    columns={columns}
                    pagination={{
                        current_page: users.current_page,
                        last_page: users.last_page,
                        per_page: users.per_page || 10,
                        total: users.total,
                        from: users.from,
                        to: users.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari nama, NIP, email..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada user"
                    emptyIcon={Users}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus User</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {userToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{userToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">NIP: {userToDelete.nip}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setUserToDelete(null);
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
        </HRLayout>
    );
}
