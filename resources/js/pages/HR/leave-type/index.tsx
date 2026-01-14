import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Edit, Plus, Settings, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface LeaveType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    default_quota: number;
    is_paid: boolean;
    requires_approval: boolean;
    allow_carry_over: boolean;
    max_carry_over_days: number;
    min_advance_days: number;
    max_consecutive_days: number | null;
    is_active: boolean;
    sort_order: number;
    color: string;
}

interface Props {
    leaveTypes: {
        data: LeaveType[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search: string | null;
        status: string | null;
        per_page: number;
    };
}

const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
    gray: 'bg-gray-500',
};

export default function Index({ leaveTypes, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
    });
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/leave-types', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '' });
        router.get('/hr/leave-types', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/leave-types', { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/leave-types', { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        router.delete(`/hr/leave-types/${id}`, {
            onSuccess: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            className: 'w-[100px]',
            render: (leaveType: LeaveType) => (
                <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${colorClasses[leaveType.color] || 'bg-gray-500'}`}></div>
                    <span className="font-mono text-sm">{leaveType.code}</span>
                </div>
            ),
        },
        {
            key: 'name',
            label: 'Nama',
            render: (leaveType: LeaveType) => (
                <div>
                    <div className="font-medium">{leaveType.name}</div>
                    {leaveType.description && <div className="max-w-[300px] truncate text-sm text-muted-foreground">{leaveType.description}</div>}
                </div>
            ),
        },
        {
            key: 'default_quota',
            label: 'Kuota Default',
            className: 'text-center',
            render: (leaveType: LeaveType) => (
                <div className="text-center">
                    <span className="font-medium">{leaveType.default_quota}</span>
                    <span className="text-sm text-muted-foreground"> hari</span>
                </div>
            ),
        },
        {
            key: 'settings',
            label: 'Pengaturan',
            render: (leaveType: LeaveType) => (
                <div className="flex flex-wrap gap-1">
                    {leaveType.is_paid ? (
                        <Badge variant="outline" className="text-xs text-green-600">
                            Berbayar
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs text-red-600">
                            Tidak Berbayar
                        </Badge>
                    )}
                    {leaveType.requires_approval && (
                        <Badge variant="outline" className="text-xs">
                            Perlu Approval
                        </Badge>
                    )}
                    {leaveType.allow_carry_over && (
                        <Badge variant="outline" className="text-xs">
                            Carry Over
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (leaveType: LeaveType) =>
                leaveType.is_active ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Aktif
                    </Badge>
                ) : (
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <XCircle className="mr-1 h-3 w-3" />
                        Nonaktif
                    </Badge>
                ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (leaveType: LeaveType) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/hr/leave-types/${leaveType.id}/edit`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                    <AlertDialog open={deletingId === leaveType.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingId(leaveType.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Jenis Cuti</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus "{leaveType.name}"? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(leaveType.id)} className="bg-red-600 hover:bg-red-700">
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Jenis Cuti" />
            <IndexPage
                title="Jenis Cuti"
                description="Kelola jenis cuti dan izin karyawan"
                actions={[
                    {
                        label: 'Tambah Jenis Cuti',
                        href: '/hr/leave-types/create',
                        icon: Plus,
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode atau nama..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={leaveTypes.data}
                pagination={{
                    current_page: leaveTypes.current_page,
                    last_page: leaveTypes.last_page,
                    per_page: leaveTypes.per_page,
                    total: leaveTypes.total,
                    from: leaveTypes.from,
                    to: leaveTypes.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={[
                    {
                        key: 'status',
                        type: 'select',
                        placeholder: 'Status',
                        options: [
                            { value: '1', label: 'Aktif' },
                            { value: '0', label: 'Nonaktif' },
                        ],
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                emptyMessage="Belum ada jenis cuti"
                emptyIcon={Settings}
            />
        </HRLayout>
    );
}
