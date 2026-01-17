import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Key } from 'lucide-react';
import HrLayout from '@/layouts/hr-layout';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
    created_at: string;
}

interface Props {
    permissions: {
        data: Permission[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    modules: string[];
    filters: {
        search: string;
        module: string;
        perPage: number;
    };
}

export default function Index({ permissions, modules, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        module: filters.module || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/access/permissions', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', module: '' });
        router.get('/hr/access/permissions', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/access/permissions', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/access/permissions', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const columns = [
        {
            key: 'name',
            label: 'Kode Permission',
            render: (permission: Permission) => (
                <span className="font-mono text-sm">{permission.name}</span>
            ),
        },
        {
            key: 'display_name',
            label: 'Nama',
            render: (permission: Permission) => (
                <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{permission.display_name}</span>
                </div>
            ),
        },
        {
            key: 'module',
            label: 'Modul',
            render: (permission: Permission) => (
                <Badge variant="secondary">{permission.module}</Badge>
            ),
        },
        {
            key: 'description',
            label: 'Deskripsi',
            className: 'max-w-[300px]',
            render: (permission: Permission) => (
                <span className="text-muted-foreground text-sm truncate block">
                    {permission.description || '-'}
                </span>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'module',
            label: 'Modul',
            type: 'select' as const,
            placeholder: 'Semua Modul',
            options: modules.map(m => ({ value: m, label: m })),
        },
    ];

    return (
        <HrLayout>
            <Head title="Permission" />

            <div className="p-6">
                <IndexPage
                    title="Permission"
                    description="Daftar hak akses yang tersedia dalam sistem"
                    data={permissions.data}
                    columns={columns}
                    pagination={{
                        current_page: permissions.current_page,
                        last_page: permissions.last_page,
                        per_page: permissions.per_page || 10,
                        total: permissions.total,
                        from: permissions.from,
                        to: permissions.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={filterFields}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari permission..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada permission"
                    emptyIcon={Key}
                />
            </div>
        </HrLayout>
    );
}
