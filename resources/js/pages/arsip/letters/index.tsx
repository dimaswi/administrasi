import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Archive, CheckCircle2, Clock, FileText, Plus, Search, Send, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Letter {
    id: number;
    letter_number: string;
    subject: string;
    letter_date: string;
    recipient: string | null;
    status: string;
    created_at: string;
    template: {
        id: number;
        name: string;
        code: string;
    } | null;
    creator: {
        id: number;
        name: string;
    };
    approval_progress: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        percentage: number;
    };
}

interface Template {
    id: number;
    name: string;
}

interface PaginatedLetters {
    data: Letter[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Filters {
    status?: string;
    template_id?: string;
    search?: string;
}

interface Props extends SharedData {
    letters: PaginatedLetters;
    templates: Template[];
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Surat Keluar', href: '/arsip/letters' },
];

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
    pending_approval: { label: 'Menunggu Persetujuan', color: 'bg-yellow-500', icon: Clock },
    partially_signed: { label: 'Sebagian Disetujui', color: 'bg-blue-500', icon: Clock },
    fully_signed: { label: 'Semua Disetujui', color: 'bg-green-500', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', color: 'bg-red-500', icon: XCircle },
    sent: { label: 'Terkirim', color: 'bg-purple-500', icon: Send },
    archived: { label: 'Diarsipkan', color: 'bg-gray-600', icon: Archive },
};

export default function LettersIndex({ letters, templates, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedTemplate, setSelectedTemplate] = useState(filters.template_id || '');

    const handleSearch = () => {
        router.get(
            '/arsip/letters',
            {
                search,
                status: selectedStatus || undefined,
                template_id: selectedTemplate || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedStatus('');
        setSelectedTemplate('');
        router.get('/arsip/letters');
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        if (!config) return null;

        const Icon = config.icon;
        return (
            <Badge className={`${config.color} text-white`}>
                <Icon className="mr-1 h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getApprovalBadge = (progress: Letter['approval_progress']) => {
        if (progress.total === 0) return null;

        return (
            <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>
                        {progress.approved}/{progress.total}
                    </span>
                </div>
                {progress.rejected > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-3 w-3" />
                        <span>{progress.rejected}</span>
                    </div>
                )}
                {progress.pending > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-3 w-3" />
                        <span>{progress.pending}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surat Keluar" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between my-6">
                    {/* Filters */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSearch();
                        }}
                        className="flex items-center gap-2"
                    >
                        <div className="relative max-w-xs flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Cari nomor/perihal/penerima..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <SearchableSelect
                            options={[
                                { value: '', label: 'Semua Status' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'pending_approval', label: 'Menunggu Persetujuan' },
                                { value: 'partially_signed', label: 'Sebagian Disetujui' },
                                { value: 'fully_signed', label: 'Semua Disetujui' },
                                { value: 'rejected', label: 'Ditolak' },
                                { value: 'sent', label: 'Terkirim' },
                            ]}
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                            placeholder="Semua Status"
                            searchPlaceholder="Cari status..."
                            className="w-48"
                        />

                        <SearchableSelect
                            options={[
                                { value: '', label: 'Semua Template' },
                                ...templates.map((t) => ({
                                    value: t.id.toString(),
                                    label: t.name,
                                })),
                            ]}
                            value={selectedTemplate}
                            onValueChange={setSelectedTemplate}
                            placeholder="Semua Template"
                            searchPlaceholder="Cari template..."
                            className="w-48"
                        />

                        <Button type="submit" variant="outline" size="sm">
                            Cari
                        </Button>
                    </form>

                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-green-200"
                        onClick={() => router.visit('/arsip/letters/create')}
                    >
                        <Plus className="h-4 w-4 text-green-500" />
                        Tambah
                    </Button>
                </div>

                {/* Letters Table */}
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Nomor Surat</TableHead>
                                <TableHead>Perihal</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Persetujuan</TableHead>
                                <TableHead>Pembuat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {letters.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                        Tidak ada surat ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                letters.data.map((letter, index) => (
                                    <TableRow
                                        key={letter.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.visit(`/arsip/letters/${letter.id}`)}
                                    >
                                        <TableCell>{(letters.current_page - 1) * letters.per_page + index + 1}</TableCell>
                                        <TableCell className="font-medium">{letter.letter_number}</TableCell>
                                        <TableCell>
                                            <div className="max-w-md truncate">{letter.subject}</div>
                                            {letter.recipient && <div className="text-xs text-muted-foreground">Kepada: {letter.recipient}</div>}
                                        </TableCell>
                                        <TableCell>
                                            {letter.template ? (
                                                <div>
                                                    <div className="text-sm">{letter.template.name}</div>
                                                    <div className="text-xs text-muted-foreground">{letter.template.code}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{format(new Date(letter.letter_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                                        <TableCell>{getStatusBadge(letter.status)}</TableCell>
                                        <TableCell>{getApprovalBadge(letter.approval_progress)}</TableCell>
                                        <TableCell>{letter.creator.name}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {letters.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {(letters.current_page - 1) * letters.per_page + 1} -{' '}
                            {Math.min(letters.current_page * letters.per_page, letters.total)} dari {letters.total} surat
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: letters.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === letters.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => router.get(`/arsip/letters?page=${page}`)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
