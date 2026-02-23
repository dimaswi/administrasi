import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MoreHorizontal, Eye, Mail, Clock, CheckCircle2, FileSignature, AlertCircle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface IncomingLetter {
    id: number;
    incoming_number: string;
    sender: string;
    subject: string;
}

interface Disposition {
    id: number;
    incoming_letter: IncomingLetter;
    parent_disposition_id: number | null;
    instruction: string;
    priority: 'normal' | 'high' | 'urgent';
    deadline: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    notes: string | null;
    read_at: string | null;
    completed_at: string | null;
    from_user: User;
    to_user: User;
    follow_ups_count: number;
    created_at: string;
}

interface Props {
    dispositions: {
        data: Disposition[];
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
        priority: string;
    };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'Menunggu', variant: 'secondary', icon: Clock },
    in_progress: { label: 'Dikerjakan', variant: 'default', icon: Clock },
    completed: { label: 'Selesai', variant: 'outline', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    normal: { label: 'Biasa', variant: 'secondary' },
    high: { label: 'Penting', variant: 'default' },
    urgent: { label: 'Segera', variant: 'destructive' },
};

export default function Index({ dispositions, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        priority: filters.priority || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/arsip/dispositions', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', priority: '' });
        router.get('/arsip/dispositions', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/arsip/dispositions', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/arsip/dispositions', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const isOverdue = (deadline: string | null, status: string) => {
        if (!deadline || status === 'completed') return false;
        return new Date(deadline) < new Date();
    };

    const columns = [
        {
            key: 'incoming_number',
            label: 'Nomor Surat',
            render: (disposition: Disposition) => (
                <div>
                    <div className="flex items-center gap-2">
                        {!disposition.read_at && (
                            <Mail className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="font-mono text-sm font-medium">{disposition.incoming_letter.incoming_number}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{disposition.incoming_letter.sender}</div>
                </div>
            ),
        },
        {
            key: 'subject',
            label: 'Perihal',
            className: 'max-w-[200px]',
            render: (disposition: Disposition) => (
                <span className="truncate block" title={disposition.incoming_letter.subject}>
                    {disposition.incoming_letter.subject}
                </span>
            ),
        },
        {
            key: 'from_user',
            label: 'Dari',
            render: (disposition: Disposition) => (
                <span className="text-sm">{disposition.from_user.name}</span>
            ),
        },
        {
            key: 'instruction',
            label: 'Instruksi',
            className: 'max-w-[200px]',
            render: (disposition: Disposition) => (
                <span className="truncate block text-muted-foreground text-sm" title={disposition.instruction}>
                    {disposition.instruction}
                </span>
            ),
        },
        {
            key: 'priority',
            label: 'Prioritas',
            render: (disposition: Disposition) => {
                const config = priorityConfig[disposition.priority] || priorityConfig.normal;
                return <Badge variant={config.variant}>{config.label}</Badge>;
            },
        },
        {
            key: 'deadline',
            label: 'Deadline',
            render: (disposition: Disposition) => (
                disposition.deadline ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            {format(new Date(disposition.deadline), 'dd MMM yyyy', { locale: idLocale })}
                        </span>
                        {isOverdue(disposition.deadline, disposition.status) && (
                            <Badge variant="destructive" className="text-xs gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Terlambat
                            </Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (disposition: Disposition) => {
                if (disposition.status === 'pending' && !disposition.read_at) {
                    return (
                        <Badge variant="secondary" className="gap-1">
                            <Mail className="h-3 w-3" />
                            Belum Dibaca
                        </Badge>
                    );
                }
                const config = statusConfig[disposition.status] || statusConfig.pending;
                const Icon = config.icon;
                return (
                    <Badge variant={config.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (disposition: Disposition) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/arsip/dispositions/${disposition.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            placeholder: 'Semua Status',
            options: [
                { value: 'pending', label: 'Menunggu' },
                { value: 'in_progress', label: 'Dikerjakan' },
                { value: 'completed', label: 'Selesai' },
            ],
        },
        {
            key: 'priority',
            label: 'Prioritas',
            type: 'select' as const,
            placeholder: 'Semua Prioritas',
            options: [
                { value: 'normal', label: 'Biasa' },
                { value: 'high', label: 'Penting' },
                { value: 'urgent', label: 'Segera' },
            ],
        },
    ];

    return (
        <AppLayout>
            <Head title="Disposisi" />

                <IndexPage
                    title="Disposisi"
                    description="Kelola disposisi surat yang ditujukan kepada Anda"
                    data={dispositions.data}
                    columns={columns}
                    pagination={{
                        current_page: dispositions.current_page,
                        last_page: dispositions.last_page,
                        per_page: dispositions.per_page || 10,
                        total: dispositions.total,
                        from: dispositions.from,
                        to: dispositions.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={filterFields}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari nomor surat, perihal..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Tidak ada disposisi"
                    emptyIcon={FileSignature}
                />
        </AppLayout>
    );
}
