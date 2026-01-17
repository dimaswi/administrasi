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
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';
import HrLayout from '@/layouts/hr-layout';

interface OrganizationUnit {
    id: number;
    code: string;
    name: string;
    level: number;
    parent_id: number | null;
    parent?: OrganizationUnit;
    head_id: number | null;
    head?: {
        id: number;
        name: string;
    };
    is_active: boolean;
    children_count?: number;
    users_count?: number;
    created_at: string;
}

interface Props {
    organizationUnits: {
        data: OrganizationUnit[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    levels: number[];
    filters: {
        search: string;
        level: string;
        perPage: number;
    };
}

export default function Index({ organizationUnits, levels, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        level: filters.level || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<OrganizationUnit | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/organizations', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', level: '' });
        router.get('/hr/organizations', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/organizations', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/organizations', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (unit: OrganizationUnit) => {
        setUnitToDelete(unit);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (unitToDelete) {
            router.delete(`/hr/organizations/${unitToDelete.id}`, {
                onSuccess: () => {
                    toast.success(`Unit ${unitToDelete.name} berhasil dihapus`);
                    setDeleteDialogOpen(false);
                    setUnitToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus unit'),
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            render: (unit: OrganizationUnit) => (
                <span className="font-mono text-sm">{unit.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nama Unit',
            render: (unit: OrganizationUnit) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{unit.name}</span>
                </div>
            ),
        },
        {
            key: 'level',
            label: 'Level',
            render: (unit: OrganizationUnit) => (
                <Badge variant="outline">Level {unit.level}</Badge>
            ),
        },
        {
            key: 'parent',
            label: 'Induk',
            render: (unit: OrganizationUnit) => (
                <span className="text-muted-foreground text-sm">
                    {unit.parent?.name || '-'}
                </span>
            ),
        },
        {
            key: 'head',
            label: 'Kepala',
            render: (unit: OrganizationUnit) => (
                unit.head ? (
                    <div className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{unit.head.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (unit: OrganizationUnit) => (
                unit.is_active ? (
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
            render: (unit: OrganizationUnit) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/organizations/${unit.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/organizations/${unit.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => handleDeleteClick(unit)}
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

    const filterFields = [
        {
            key: 'level',
            label: 'Level',
            type: 'select' as const,
            placeholder: 'Semua Level',
            options: levels.map(lvl => ({ value: lvl.toString(), label: `Level ${lvl}` })),
        },
    ];

    return (
        <HrLayout>
            <Head title="Unit Organisasi" />

            <div className="p-6">
                <IndexPage
                    title="Unit Organisasi"
                    description="Kelola struktur organisasi"
                    actions={[
                        {
                            label: 'Tambah Unit',
                            href: '/hr/organizations/create',
                            icon: Plus,
                        },
                    ]}
                    data={organizationUnits.data}
                    columns={columns}
                    pagination={{
                        current_page: organizationUnits.current_page,
                        last_page: organizationUnits.last_page,
                        per_page: organizationUnits.per_page || 10,
                        total: organizationUnits.total,
                        from: organizationUnits.from,
                        to: organizationUnits.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={filterFields}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari kode, nama unit..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada unit organisasi"
                    emptyIcon={Building2}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Unit Organisasi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus unit organisasi ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {unitToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{unitToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">Kode: {unitToDelete.code}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setUnitToDelete(null);
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
        </HrLayout>
    );
}

