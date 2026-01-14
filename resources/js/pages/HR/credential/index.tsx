import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    CreditCard,
    CheckCircle,
    XCircle,
    Download,
    Plus,
} from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface CredentialItem {
    id: number;
    employee: Employee;
    type: string;
    type_label: string;
    name: string;
    number: string;
    expiry_date: string | null;
    expiry_date_formatted: string | null;
    is_expired: boolean;
    is_expiring_soon: boolean;
    days_until_expiry: number | null;
    is_verified: boolean;
    has_document: boolean;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    credentials: {
        data: CredentialItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    types: Record<string, string>;
    units: Unit[];
    filters: {
        search: string | null;
        type: string | null;
        status: string | null;
        unit_id: string | null;
        per_page: number;
    };
}

export default function Index({ credentials, types, units, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        type: filters.type || '',
        status: filters.status || '',
        unit_id: filters.unit_id || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/hr/credentials', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', type: '', status: '', unit_id: '' });
        router.get('/hr/credentials', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/credentials', { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/credentials', { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const getStatusBadge = (credential: CredentialItem) => {
        if (credential.is_expired) {
            return <Badge variant="destructive">Kedaluwarsa</Badge>;
        }
        if (credential.is_expiring_soon) {
            return (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                    {credential.days_until_expiry} hari lagi
                </Badge>
            );
        }
        if (!credential.expiry_date) {
            return <Badge variant="secondary">Tidak ada masa berlaku</Badge>;
        }
        return <Badge variant="outline">{credential.expiry_date_formatted}</Badge>;
    };

    const columns = [
        {
            key: 'employee',
            label: 'Karyawan',
            render: (item: CredentialItem) => (
                <div>
                    <Link 
                        href={`/hr/employees/${item.employee.id}`}
                        className="font-medium hover:underline"
                    >
                        {item.employee.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                        {item.employee.employee_id} • {item.employee.organization_unit || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Jenis',
            render: (item: CredentialItem) => (
                <Badge variant="outline">{item.type_label}</Badge>
            ),
        },
        {
            key: 'name',
            label: 'Nama Kredensial',
            render: (item: CredentialItem) => (
                <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.number}</div>
                </div>
            ),
        },
        {
            key: 'expiry',
            label: 'Masa Berlaku',
            render: (item: CredentialItem) => getStatusBadge(item),
        },
        {
            key: 'verified',
            label: 'Verifikasi',
            className: 'text-center',
            render: (item: CredentialItem) => (
                <div className="flex justify-center">
                    {item.is_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (item: CredentialItem) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/hr/credentials/${item.id}`}>Detail</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Kredensial Karyawan" />
                <IndexPage
                    title="Kredensial Karyawan"
                    description="Kelola dokumen dan kredensial karyawan"
                    actions={[
                        {
                            label: 'Export CSV',
                            href: `/hr/credentials/export?type=${filterValues.type || ''}&status=${filterValues.status || ''}&unit_id=${filterValues.unit_id || ''}`,
                            icon: Download,
                            variant: 'outline',
                        },
                    ]}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari karyawan atau nomor..."
                    onSearchChange={(value) => handleFilterChange('search', value)}
                    columns={columns}
                    data={credentials.data}
                    pagination={{
                        current_page: credentials.current_page,
                        last_page: credentials.last_page,
                        per_page: credentials.per_page,
                        total: credentials.total,
                        from: credentials.from,
                        to: credentials.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={[
                        {
                            key: 'type',
                            type: 'select',
                            placeholder: 'Jenis',
                            options: Object.entries(types).map(([value, label]) => ({ value, label })),
                        },
                        {
                            key: 'status',
                            type: 'select',
                            placeholder: 'Status',
                            options: [
                                { value: 'expired', label: 'Kedaluwarsa' },
                                { value: 'expiring_soon', label: 'Segera Kedaluwarsa' },
                                { value: 'verified', label: 'Terverifikasi' },
                                { value: 'unverified', label: 'Belum Verifikasi' },
                            ],
                        },
                        {
                            key: 'unit_id',
                            type: 'select',
                            placeholder: 'Unit',
                            options: units.map((u) => ({ value: String(u.id), label: u.name })),
                        },
                    ]}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    emptyMessage="Tidak ada kredensial"
                    emptyIcon={CreditCard}
                />
        </HRLayout>
    );
}
