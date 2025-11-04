import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { 
    Archive, 
    CheckCircle2, 
    Clock, 
    Download, 
    Eye, 
    FileText, 
    Plus, 
    Search,
    AlertCircle,
    Mail,
    Calendar,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

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
    links: any[];
}

interface Filters {
    status?: string;
    category?: string;
    classification?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
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

const statusConfig = {
    new: { label: 'Baru', color: 'bg-blue-500', icon: FileText },
    disposed: { label: 'Sudah Disposisi', color: 'bg-yellow-500', icon: Clock },
    in_progress: { label: 'Dalam Proses', color: 'bg-orange-500', icon: Clock },
    completed: { label: 'Selesai', color: 'bg-green-500', icon: CheckCircle2 },
    archived: { label: 'Diarsipkan', color: 'bg-gray-600', icon: Archive },
};

const classificationConfig = {
    biasa: { label: 'Biasa', color: 'bg-gray-500' },
    penting: { label: 'Penting', color: 'bg-blue-500' },
    segera: { label: 'Segera', color: 'bg-orange-500' },
    rahasia: { label: 'Rahasia', color: 'bg-red-500' },
};

export default function IncomingLettersIndex({ auth, letters, filters, statuses, categories, classifications }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedClassification, setSelectedClassification] = useState(filters.classification || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleSearch = () => {
        router.get(
            '/arsip/incoming-letters',
            {
                search,
                status: selectedStatus || undefined,
                category: selectedCategory || undefined,
                classification: selectedClassification || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
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
        setSelectedCategory('');
        setSelectedClassification('');
        setDateFrom('');
        setDateTo('');
        router.get('/arsip/incoming-letters');
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        if (!config) return null;
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} text-white gap-1.5`}>
                <Icon className="h-3.5 w-3.5" />
                {config.label}
            </Badge>
        );
    };

    const getClassificationBadge = (classification: string) => {
        const config = classificationConfig[classification as keyof typeof classificationConfig];
        if (!config) return null;
        return (
            <Badge className={`${config.color} text-white`}>
                {config.label}
            </Badge>
        );
    };

    const handlePageChange = (url: string) => {
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surat Masuk" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center my-6">
                    <div>
                        <h2 className="text-xl font-semibold md:text-2xl">Surat Masuk</h2>
                        <p className="font-mono text-xs text-muted-foreground md:text-sm">Kelola dan cari surat masuk</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button onClick={() => router.visit('/arsip/incoming-letters/create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Registrasi Surat Masuk
                        </Button>
                    </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nomor surat, pengirim, atau perihal..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-9"
                    />
                </div>

                {/* Filters */}
                {showFilters && (
                    <Card>
                    <CardHeader>
                        <CardTitle>Filter</CardTitle>
                        <CardDescription>Filter surat masuk</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'Semua Status' },
                                        ...statuses.map((s) => ({ value: s.value, label: s.label })),
                                    ]}
                                    value={selectedStatus}
                                    onValueChange={setSelectedStatus}
                                    placeholder="Semua Status"
                                    searchPlaceholder="Cari status..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kategori</label>
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'Semua Kategori' },
                                        ...categories.map((cat) => ({ value: cat, label: cat })),
                                    ]}
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                    placeholder="Semua Kategori"
                                    searchPlaceholder="Cari kategori..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sifat</label>
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'Semua Sifat' },
                                        ...classifications.map((c) => ({ value: c.value, label: c.label })),
                                    ]}
                                    value={selectedClassification}
                                    onValueChange={setSelectedClassification}
                                    placeholder="Semua Sifat"
                                    searchPlaceholder="Cari sifat..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Dari</label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Sampai</label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-3 flex gap-2">
                                <Button onClick={handleSearch}>Cari</Button>
                                <Button variant="outline" onClick={handleReset}>Reset</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Letters Table */}
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Nomor Agenda</TableHead>
                                <TableHead>Nomor Surat</TableHead>
                                <TableHead>Tanggal Terima</TableHead>
                                <TableHead>Pengirim</TableHead>
                                <TableHead>Perihal</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Sifat</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Disposisi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {letters.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                                        Tidak ada surat masuk ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                letters.data.map((letter, index) => (
                                    <TableRow
                                        key={letter.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.visit(`/arsip/incoming-letters/${letter.id}`)}
                                    >
                                        <TableCell>{(letters.current_page - 1) * letters.per_page + index + 1}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {letter.has_file && <Download className="h-4 w-4 text-blue-500" />}
                                                {letter.incoming_number}
                                            </div>
                                        </TableCell>
                                        <TableCell>{letter.original_number}</TableCell>
                                        <TableCell>{format(new Date(letter.received_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate" title={letter.sender}>
                                                {letter.sender}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[250px] truncate" title={letter.subject}>
                                                {letter.subject}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {letter.category && <Badge variant="outline">{letter.category}</Badge>}
                                        </TableCell>
                                        <TableCell>{getClassificationBadge(letter.classification)}</TableCell>
                                        <TableCell>{getStatusBadge(letter.status)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="font-medium">{letter.disposition_count} disposisi</div>
                                                {letter.disposition_count > 0 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {letter.disposition_progress.completed}/{letter.disposition_progress.total} selesai
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
