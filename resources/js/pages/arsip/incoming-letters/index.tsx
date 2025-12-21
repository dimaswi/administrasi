import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
    Plus, Download, Mail, CheckCircle2, Clock, Archive, FileText, AlertCircle
} from 'lucide-react';
import type { BreadcrumbItem, SharedData } from '@/types';

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    original_date: string;
    received_date: string;
    sender: string;
    subject: string;
    category: string | null;
    classification: string;
    status: string;
    has_file: boolean;
    organization_unit: {
        name: string;
    };
    registrar: {
        name: string;
    };
    disposition_count: number;
    disposition_progress: {
        total: number;
        pending: number;
        completed: number;
        percentage: number;
    };
}

interface PaginatedLetters {
    data: IncomingLetter[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    status?: string;
    category?: string;
    classification?: string;
    search?: string;
}

interface Props extends SharedData {
    letters: PaginatedLetters;
    filters: Filters;
    categories: string[];
    statuses: { value: string; label: string }[];
    classifications: { value: string; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Surat Masuk', href: '/arsip/incoming-letters' },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: 'Baru', color: 'bg-blue-500', icon: FileText },
    disposed: { label: 'Sudah Disposisi', color: 'bg-yellow-500', icon: Clock },
    in_progress: { label: 'Dalam Proses', color: 'bg-orange-500', icon: Clock },
    completed: { label: 'Selesai', color: 'bg-green-500', icon: CheckCircle2 },
    archived: { label: 'Diarsipkan', color: 'bg-gray-600', icon: Archive },
};

const classificationConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    biasa: { label: 'Biasa', variant: 'secondary' },
    penting: { label: 'Penting', variant: 'default' },
    segera: { label: 'Segera', variant: 'outline' },
    rahasia: { label: 'Rahasia', variant: 'destructive' },
};

export default function IncomingLettersIndex({ letters, filters, statuses, categories, classifications }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        category: filters.category || '',
        classification: filters.classification || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/arsip/incoming-letters', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', category: '', classification: '' });
        router.get('/arsip/incoming-letters', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/arsip/incoming-letters', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/arsip/incoming-letters', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleRowClick = (letter: IncomingLetter) => {
        router.visit(`/arsip/incoming-letters/${letter.id}`);
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status];
        if (!config) return <Badge variant="secondary">{status}</Badge>;
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} text-white gap-1`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getClassificationBadge = (classification: string) => {
        const config = classificationConfig[classification];
        if (!config) return <Badge variant="outline">{classification}</Badge>;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const columns = [
        {
            key: 'incoming_number',
            label: 'No. Agenda',
            render: (letter: IncomingLetter) => (
                <div 
                    className="font-medium cursor-pointer hover:text-primary flex items-center gap-2"
                    onClick={() => handleRowClick(letter)}
                >
                    {letter.incoming_number}
                </div>
            ),
        },
        {
            key: 'original_number',
            label: 'Nomor Surat',
            render: (letter: IncomingLetter) => (
                <span className="text-sm">{letter.original_number}</span>
            ),
        },
        {
            key: 'received_date',
            label: 'Tgl Terima',
            render: (letter: IncomingLetter) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(letter.received_date), 'dd MMM yyyy', { locale: id })}
                </span>
            ),
        },
        {
            key: 'sender',
            label: 'Pengirim',
            className: 'max-w-[180px]',
            render: (letter: IncomingLetter) => (
                <span className="truncate block text-sm" title={letter.sender}>
                    {letter.sender}
                </span>
            ),
        },
        {
            key: 'subject',
            label: 'Perihal',
            className: 'max-w-[220px]',
            render: (letter: IncomingLetter) => (
                <span className="truncate block text-sm" title={letter.subject}>
                    {letter.subject}
                </span>
            ),
        },
        {
            key: 'classification',
            label: 'Sifat',
            render: (letter: IncomingLetter) => getClassificationBadge(letter.classification),
        },
        {
            key: 'status',
            label: 'Status',
            render: (letter: IncomingLetter) => getStatusBadge(letter.status),
        },
        {
            key: 'disposition',
            label: 'Disposisi',
            render: (letter: IncomingLetter) => (
                <div className="text-sm">
                    <span className="font-medium">{letter.disposition_count}</span>
                    {letter.disposition_count > 0 && (
                        <span className="text-muted-foreground ml-1">
                            ({letter.disposition_progress.completed}/{letter.disposition_progress.total})
                        </span>
                    )}
                </div>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            placeholder: 'Semua Status',
            options: statuses.map(s => ({ value: s.value, label: s.label })),
        },
        {
            key: 'classification',
            label: 'Sifat',
            type: 'select' as const,
            placeholder: 'Semua Sifat',
            options: classifications.map(c => ({ value: c.value, label: c.label })),
        },
        {
            key: 'category',
            label: 'Kategori',
            type: 'select' as const,
            placeholder: 'Semua Kategori',
            options: categories.map(c => ({ value: c, label: c })),
        },
    ];

    return (
        <AppLayout>
            <Head title="Surat Masuk" />

            <div className="p-6">
                <IndexPage
                    title="Surat Masuk"
                    description="Kelola dan registrasi surat masuk"
                    actions={[
                        {
                            label: 'Registrasi Surat',
                            href: '/arsip/incoming-letters/create',
                            icon: Plus,
                        },
                    ]}
                    data={letters.data}
                    columns={columns}
                    pagination={{
                        current_page: letters.current_page,
                        last_page: letters.last_page,
                        per_page: letters.per_page,
                        total: letters.total,
                        from: letters.from,
                        to: letters.to,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={filterFields}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari nomor, pengirim, perihal..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada surat masuk"
                    emptyIcon={Mail}
                />
            </div>
        </AppLayout>
    );
}
