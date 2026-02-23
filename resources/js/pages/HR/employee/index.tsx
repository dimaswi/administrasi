import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IndexPage } from '@/components/ui/index-page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, MoreHorizontal, Plus, Stethoscope, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface JobCategory {
    id: number;
    name: string;
    is_medical: boolean;
}

interface OrganizationUnit {
    id: number;
    name: string;
}

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string | null;
    full_name: string;
    gender: 'male' | 'female';
    phone: string | null;
    position: string | null;
    status: 'active' | 'inactive' | 'resigned' | 'terminated';
    join_date: string;
    job_category: JobCategory | null;
    employment_status: { name: string } | null;
    organization_unit: OrganizationUnit | null;
    education_level: { name: string } | null;
}

interface Props {
    employees: {
        data: Employee[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search: string;
        status: string;
        job_category_id: string;
        organization_unit_id: string;
        perPage: number;
    };
    jobCategories: JobCategory[];
    organizationUnits: OrganizationUnit[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Aktif', variant: 'default' },
    inactive: { label: 'Nonaktif', variant: 'secondary' },
    resigned: { label: 'Resign', variant: 'outline' },
    terminated: { label: 'PHK', variant: 'destructive' },
};

export default function Index({ employees, filters, jobCategories, organizationUnits }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        job_category_id: filters.job_category_id || '',
        organization_unit_id: filters.organization_unit_id || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Employee | null>(null);

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Data Karyawan', href: '/hr/employees' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/employees', Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== '')), { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', job_category_id: '', organization_unit_id: '' });
        router.get('/hr/employees', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/employees', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/employees', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (item: Employee) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            router.delete(`/hr/employees/${itemToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus karyawan'),
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
            key: 'employee_id',
            label: 'NIK',
            render: (item: Employee) => <span className="font-mono text-sm font-medium">{item.employee_id}</span>,
        },
        {
            key: 'name',
            label: 'Nama Karyawan',
            render: (item: Employee) => (
                <div>
                    <div className="flex items-center gap-2 font-medium">
                        {item.full_name}
                        {item.job_category?.is_medical && <Stethoscope className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {item.position || '-'} • {item.organization_unit?.name || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'job_category',
            label: 'Kategori',
            render: (item: Employee) => <Badge variant="outline">{item.job_category?.name || '-'}</Badge>,
        },
        {
            key: 'employment_status',
            label: 'Status Kepegawaian',
            render: (item: Employee) => <span className="text-sm">{item.employment_status?.name || '-'}</span>,
        },
        {
            key: 'join_date',
            label: 'Tanggal Masuk',
            render: (item: Employee) => <span className="text-sm text-muted-foreground">{formatDate(item.join_date)}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: Employee) => {
                const status = statusLabels[item.status] || { label: item.status, variant: 'secondary' as const };
                return <Badge variant={status.variant}>{status.label}</Badge>;
            },
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (item: Employee) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/employees/${item.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/hr/employees/${item.id}/edit`}>
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

    const filterFields = (
        <div className="flex flex-wrap gap-2">
            <Select value={filterValues.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                    <SelectItem value="resigned">Resign</SelectItem>
                    <SelectItem value="terminated">PHK</SelectItem>
                </SelectContent>
            </Select>

            <Select value={filterValues.job_category_id} onValueChange={(value) => handleFilterChange('job_category_id', value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategori Pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Semua Kategori</SelectItem>
                    {jobCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={filterValues.organization_unit_id} onValueChange={(value) => handleFilterChange('organization_unit_id', value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Unit Organisasi" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Semua Unit</SelectItem>
                    {organizationUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <HRLayout>
            <Head title="Data Karyawan" />

            <IndexPage
                title="Data Karyawan"
                description="Kelola data karyawan klinik"
                actions={[
                    {
                        label: 'Tambah Karyawan',
                        href: '/hr/employees/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari NIK, nama..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={employees.data}
                pagination={{
                    current_page: employees.current_page,
                    last_page: employees.last_page,
                    per_page: employees.per_page,
                    total: employees.total,
                    from: employees.from,
                    to: employees.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                emptyMessage="Belum ada karyawan"
                emptyIcon={Users}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Karyawan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus karyawan "{itemToDelete?.full_name}"? Tindakan ini tidak dapat dibatalkan.
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
