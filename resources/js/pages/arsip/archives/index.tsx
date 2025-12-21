import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Archive as ArchiveIcon,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    Filter,
    Grid3x3,
    List,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { cn } from '@/lib/utils';

interface Archive {
    id: number;
    type: 'letter' | 'incoming_letter' | 'outgoing_letter' | 'document';
    document_number: string | null;
    title: string;
    description: string | null;
    category: string | null;
    document_date: string;
    document_type: string | null;
    file_path: string | null;
    file_type: string | null;
    file_size: number | null;
    sender: string | null;
    recipient: string | null;
    classification: 'public' | 'internal' | 'confidential' | 'secret';
    retention_period: number | null;
    retention_until: string | null;
    tags: string[];
    incoming_letter_id: number | null;
    outgoing_letter_id: number | null;
    archiver: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface PaginatedArchives {
    data: Archive[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    archives: PaginatedArchives;
    categories: string[];
    documentTypes: string[];
    filters: {
        type?: string;
        category?: string;
        document_type?: string;
        classification?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
        per_page?: number;
    };
}

const typeConfig = {
    letter: { label: 'Surat', icon: FileText, color: 'bg-blue-500' },
    incoming_letter: { label: 'Surat Masuk', icon: FileText, color: 'bg-green-500' },
    outgoing_letter: { label: 'Surat Keluar', icon: FileText, color: 'bg-purple-500' },
    document: { label: 'Dokumen', icon: FileText, color: 'bg-gray-500' },
};

const classificationConfig = {
    public: { label: 'Publik', color: 'bg-gray-500' },
    internal: { label: 'Internal', color: 'bg-blue-500' },
    confidential: { label: 'Rahasia', color: 'bg-orange-500' },
    secret: { label: 'Sangat Rahasia', color: 'bg-red-500' },
};

export default function Index({ archives, categories, documentTypes, filters }: Props) {
    const [filterOpen, setFilterOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [category, setCategory] = useState(filters.category || '');
    const [documentType, setDocumentType] = useState(filters.document_type || '');
    const [classification, setClassification] = useState(filters.classification || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const navigateWithFilters = (params: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('arsip.archives.index'),
            {
                search: params.search ?? search,
                type: params.type ?? type,
                category: params.category ?? category,
                document_type: params.document_type ?? documentType,
                classification: params.classification ?? classification,
                date_from: params.date_from ?? dateFrom,
                date_to: params.date_to ?? dateTo,
                per_page: params.per_page ?? archives.per_page,
                page: params.page ?? 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        navigateWithFilters({ page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        navigateWithFilters({ per_page: parseInt(value), page: 1 });
    };

    const handlePageChange = (page: number) => {
        navigateWithFilters({ page });
    };

    const handleFilterReset = () => {
        setSearch('');
        setType('');
        setCategory('');
        setDocumentType('');
        setClassification('');
        setDateFrom('');
        setDateTo('');
        router.get(route('arsip.archives.index'), { per_page: archives.per_page });
    };

    const handleDelete = (archive: Archive) => {
        setSelectedArchive(archive);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedArchive) {
            router.delete(route('arsip.archives.destroy', selectedArchive.id), {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedArchive(null);
                },
            });
        }
    };

    const isExpiringSoon = (retentionUntil: string | null) => {
        if (!retentionUntil) return false;
        const until = new Date(retentionUntil);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return until <= thirtyDaysFromNow && until >= new Date();
    };

    const hasActiveFilters = [type, category, documentType, classification, dateFrom, dateTo].some(Boolean);
    const activeFilterCount = [type, category, documentType, classification, dateFrom, dateTo].filter(Boolean).length;

    return (
        <AppLayout>
            <Head title="Arsip Dokumen" />

            <div className="p-6">
                <Card>
                    {/* Card Header */}
                    <CardHeader className="bg-muted/40 border-b py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">Arsip Dokumen</CardTitle>
                                <CardDescription>Kelola dan cari arsip dokumen dan surat</CardDescription>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Filter className="h-4 w-4" />
                                            Filter
                                            {activeFilterCount > 0 && (
                                                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                                                    {activeFilterCount}
                                                </span>
                                            )}
                                            <ChevronDown className={cn(
                                                "h-4 w-4 transition-transform",
                                                filterOpen && "rotate-180"
                                            )} />
                                        </Button>
                                    </CollapsibleTrigger>
                                </Collapsible>
                                <Link href={route('arsip.archives.expiring')}>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span className="hidden sm:inline">Akan Kadaluarsa</span>
                                    </Button>
                                </Link>
                                <Link href={route('arsip.archives.create')}>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline">Tambah Arsip</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul, nomor dokumen..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="outline" className="h-9">
                                Cari
                            </Button>
                        </form>

                        {/* Collapsible Filter */}
                        <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                            <CollapsibleContent>
                                <div className="mb-4 p-4 rounded-lg border bg-muted/20">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Tipe</label>
                                            <Select value={type || 'all'} onValueChange={(val) => setType(val === 'all' ? '' : val)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Semua Tipe" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                                    <SelectItem value="letter">Surat</SelectItem>
                                                    <SelectItem value="document">Dokumen</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Kategori</label>
                                            <Select value={category || 'all'} onValueChange={(val) => setCategory(val === 'all' ? '' : val)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Semua Kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Jenis Dokumen</label>
                                            <Select value={documentType || 'all'} onValueChange={(val) => setDocumentType(val === 'all' ? '' : val)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Semua Jenis" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                                    {documentTypes.map((dt) => (
                                                        <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Klasifikasi</label>
                                            <Select value={classification || 'all'} onValueChange={(val) => setClassification(val === 'all' ? '' : val)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Semua Klasifikasi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Klasifikasi</SelectItem>
                                                    <SelectItem value="public">Publik</SelectItem>
                                                    <SelectItem value="internal">Internal</SelectItem>
                                                    <SelectItem value="confidential">Rahasia</SelectItem>
                                                    <SelectItem value="secret">Sangat Rahasia</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Tanggal Dari</label>
                                            <Input 
                                                type="date" 
                                                value={dateFrom} 
                                                onChange={(e) => setDateFrom(e.target.value)} 
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Tanggal Sampai</label>
                                            <Input 
                                                type="date" 
                                                value={dateTo} 
                                                onChange={(e) => setDateTo(e.target.value)} 
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button onClick={() => navigateWithFilters({ page: 1 })} size="sm" className="h-9">
                                            Terapkan
                                        </Button>
                                        {hasActiveFilters && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={handleFilterReset}
                                                className="h-9"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-1.5" />
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {/* View Mode Tabs */}
                        <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'list' | 'grid')} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList>
                                    <TabsTrigger value="list" className="flex items-center gap-2">
                                        <List className="h-4 w-4" />
                                        <span className="hidden sm:inline">List</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="grid" className="flex items-center gap-2">
                                        <Grid3x3 className="h-4 w-4" />
                                        <span className="hidden sm:inline">Grid</span>
                                    </TabsTrigger>
                                </TabsList>
                                <div className="text-sm text-muted-foreground">
                                    {archives.total} arsip ditemukan
                                </div>
                            </div>

                            <TabsContent value="list" className="mt-0">
                                {renderListView()}
                            </TabsContent>
                            <TabsContent value="grid" className="mt-0">
                                {renderGridView()}
                            </TabsContent>
                        </Tabs>

                        {/* Pagination */}
                        {archives.total > 0 && (
                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                <span>
                                    Menampilkan {archives.from || 1} - {archives.to || archives.data.length} dari {archives.total}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Select 
                                        value={archives.per_page.toString()} 
                                        onValueChange={handlePerPageChange}
                                    >
                                        <SelectTrigger className="w-[70px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {archives.last_page > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handlePageChange(1)}
                                                disabled={archives.current_page === 1}
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handlePageChange(archives.current_page - 1)}
                                                disabled={archives.current_page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="px-3 text-sm">
                                                Halaman {archives.current_page} dari {archives.last_page}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handlePageChange(archives.current_page + 1)}
                                                disabled={archives.current_page === archives.last_page}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handlePageChange(archives.last_page)}
                                                disabled={archives.current_page === archives.last_page}
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Arsip?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini akan menghapus arsip "{selectedArchive?.title}" secara permanen dan tidak dapat dibatalkan. 
                                File dokumen yang terkait juga akan dihapus dari sistem.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmDelete} 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );

    function renderListView() {
        if (archives.data.length === 0) {
            return (
                <div className="rounded-lg border">
                    <div className="py-12 text-center">
                        <ArchiveIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground opacity-40" />
                        <p className="text-muted-foreground">Tidak ada arsip ditemukan</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-medium text-muted-foreground">Judul</TableHead>
                            <TableHead className="font-medium text-muted-foreground">Tipe</TableHead>
                            <TableHead className="font-medium text-muted-foreground">Klasifikasi</TableHead>
                            <TableHead className="font-medium text-muted-foreground">Tanggal</TableHead>
                            <TableHead className="font-medium text-muted-foreground">Kategori</TableHead>
                            <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                            <TableHead className="font-medium text-muted-foreground w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {archives.data.map((archive) => {
                            const TypeIcon = typeConfig[archive.type]?.icon || FileText;
                            const isExpiring = isExpiringSoon(archive.retention_until);

                            return (
                                <TableRow key={archive.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Link 
                                                href={route('arsip.archives.show', archive.id)} 
                                                className="font-medium hover:underline"
                                            >
                                                {archive.title}
                                            </Link>
                                            {archive.document_number && (
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {archive.document_number}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1">
                                            <TypeIcon className="h-3 w-3" />
                                            {typeConfig[archive.type]?.label || archive.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${classificationConfig[archive.classification]?.color || 'bg-gray-500'} text-white`}
                                        >
                                            {classificationConfig[archive.classification]?.label || archive.classification}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {format(new Date(archive.document_date), 'dd MMM yyyy', { locale: idLocale })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">{archive.category || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {isExpiring ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <Clock className="h-3 w-3" />
                                                Kadaluarsa
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                Aktif
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('arsip.archives.show', archive.id)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Lihat
                                                    </Link>
                                                </DropdownMenuItem>
                                                {archive.type === 'outgoing_letter' ? (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('arsip.archives.preview', archive.id)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Preview & Cetak
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem asChild>
                                                        <a href={route('arsip.archives.download', archive.id)}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('arsip.archives.edit', archive.id)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(archive)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    }

    function renderGridView() {
        if (archives.data.length === 0) {
            return (
                <div className="rounded-lg border">
                    <div className="py-12 text-center">
                        <ArchiveIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground opacity-40" />
                        <p className="text-muted-foreground">Tidak ada arsip ditemukan</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archives.data.map((archive) => {
                    const TypeIcon = typeConfig[archive.type]?.icon || FileText;
                    const isExpiring = isExpiringSoon(archive.retention_until);

                    return (
                        <Card key={archive.id} className="transition-shadow hover:shadow-lg">
                            <CardHeader className="py-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <TypeIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-1">
                                        <Badge variant="outline" className="gap-1">
                                            <TypeIcon className="h-3 w-3" />
                                            {typeConfig[archive.type]?.label || archive.type}
                                        </Badge>
                                        <Badge
                                            className={`${classificationConfig[archive.classification]?.color || 'bg-gray-500'} text-white`}
                                        >
                                            {classificationConfig[archive.classification]?.label || archive.classification}
                                        </Badge>
                                    </div>
                                </div>
                                <Link
                                    href={route('arsip.archives.show', archive.id)}
                                    className="mt-2 line-clamp-2 font-semibold hover:underline"
                                >
                                    {archive.title}
                                </Link>
                                {archive.document_number && (
                                    <p className="text-xs text-muted-foreground font-mono">{archive.document_number}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {archive.description && (
                                    <p className="line-clamp-2 text-sm text-muted-foreground">{archive.description}</p>
                                )}

                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(archive.document_date), 'dd MMM yyyy', { locale: idLocale })}
                                    </div>
                                    {archive.category && <div>Kategori: {archive.category}</div>}
                                    {archive.document_type && <div>Jenis: {archive.document_type}</div>}
                                </div>

                                {isExpiring ? (
                                    <Badge variant="destructive" className="w-full justify-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Segera Kadaluarsa
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="w-full justify-center border-green-200 bg-green-50 text-green-700"
                                    >
                                        Aktif
                                    </Badge>
                                )}

                                <div className="flex gap-1 pt-2">
                                    <Link href={route('arsip.archives.show', archive.id)} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full gap-2">
                                            <Eye className="h-3 w-3" />
                                            Lihat
                                        </Button>
                                    </Link>
                                    {archive.type === 'outgoing_letter' ? (
                                        <Link href={route('arsip.archives.preview', archive.id)}>
                                            <Button variant="outline" size="sm" title="Preview & Cetak">
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <a href={route('arsip.archives.download', archive.id)}>
                                            <Button variant="outline" size="sm" title="Download">
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        </a>
                                    )}
                                    <Link href={route('arsip.archives.edit', archive.id)}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(archive)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    }
}
