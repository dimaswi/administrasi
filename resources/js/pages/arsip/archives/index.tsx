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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Archive as ArchiveIcon, Calendar, Clock, Download, Edit, Eye, FileText, Filter, Grid3x3, List, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Archive {
    id: number;
    type: 'letter' | 'document';
    document_number: string | null;
    title: string;
    description: string | null;
    category: string | null;
    document_date: string;
    document_type: string | null;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
    sender: string | null;
    recipient: string | null;
    classification: 'public' | 'internal' | 'confidential' | 'secret';
    retention_period: number | null;
    retention_until: string | null;
    tags: string[];
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
    };
}

export default function Index({ archives, categories, documentTypes, filters }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [category, setCategory] = useState(filters.category || '');
    const [documentType, setDocumentType] = useState(filters.document_type || '');
    const [classification, setClassification] = useState(filters.classification || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Arsip Dokumen', href: '/arsip/archives' },
    ];

    const typeConfig = {
        letter: { label: 'Surat', icon: FileText, color: 'bg-blue-500' },
        document: { label: 'Dokumen', icon: FileText, color: 'bg-gray-500' },
    };

    const classificationConfig = {
        public: { label: 'Publik', color: 'bg-gray-500' },
        internal: { label: 'Internal', color: 'bg-blue-500' },
        confidential: { label: 'Rahasia', color: 'bg-orange-500' },
        secret: { label: 'Sangat Rahasia', color: 'bg-red-500' },
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route('arsip.archives.index'),
            {
                search,
                type,
                category,
                document_type: documentType,
                classification,
                date_from: dateFrom,
                date_to: dateTo,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setType('');
        setCategory('');
        setDocumentType('');
        setClassification('');
        setDateFrom('');
        setDateTo('');
        router.get(route('arsip.archives.index'));
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

    const activeFiltersCount = [type, category, documentType, classification, dateFrom, dateTo].filter(Boolean).length;

    // Prepare options for SearchableSelect
    const typeOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Tipe' },
        { value: 'letter', label: 'Surat' },
        { value: 'document', label: 'Dokumen' },
    ];

    const categoryOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Kategori' },
        ...categories.map((cat) => ({ value: cat, label: cat })),
    ];

    const documentTypeOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Jenis' },
        ...documentTypes.map((dt) => ({ value: dt, label: dt })),
    ];

    const classificationOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Klasifikasi' },
        { value: 'public', label: 'Publik' },
        { value: 'internal', label: 'Internal' },
        { value: 'confidential', label: 'Rahasia' },
        { value: 'secret', label: 'Sangat Rahasia' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Arsip Dokumen" />

            <div className="space-y-6 my-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold md:text-2xl">Arsip Dokumen</h2>
                        <p className="font-mono text-xs text-muted-foreground md:text-sm">Kelola dan cari arsip dokumen dan surat</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('arsip.archives.expiring')}>
                            <Button variant="outline" className="gap-2">
                                <Clock className="h-4 w-4" />
                                Arsip Akan Kadaluarsa
                            </Button>
                        </Link>
                        <Link href={route('arsip.archives.create')}>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Tambah Arsip
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search & Filter */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        placeholder="Cari judul, nomor dokumen, atau deskripsi..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Button type="submit" className="gap-2">
                                    <Search className="h-4 w-4" />
                                    Cari
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                    {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
                                </Button>
                                {activeFiltersCount > 0 && (
                                    <Button type="button" variant="ghost" onClick={clearFilters} className="gap-2">
                                        <X className="h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Tipe</Label>
                                        <SearchableSelect
                                            options={typeOptions}
                                            value={type}
                                            onValueChange={setType}
                                            placeholder="Pilih tipe"
                                            searchPlaceholder="Cari tipe..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Kategori</Label>
                                        <SearchableSelect
                                            options={categoryOptions}
                                            value={category}
                                            onValueChange={setCategory}
                                            placeholder="Pilih kategori"
                                            searchPlaceholder="Cari kategori..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Jenis Dokumen</Label>
                                        <SearchableSelect
                                            options={documentTypeOptions}
                                            value={documentType}
                                            onValueChange={setDocumentType}
                                            placeholder="Pilih jenis dokumen"
                                            searchPlaceholder="Cari jenis dokumen..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Klasifikasi</Label>
                                        <SearchableSelect
                                            options={classificationOptions}
                                            value={classification}
                                            onValueChange={setClassification}
                                            placeholder="Pilih klasifikasi"
                                            searchPlaceholder="Cari klasifikasi..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tanggal Dari</Label>
                                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tanggal Sampai</Label>
                                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Archives List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{archives.total} Arsip Ditemukan</CardTitle>
                                <CardDescription>
                                    Halaman {archives.current_page} dari {archives.last_page}
                                </CardDescription>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                    size="icon"
                                    onClick={() => setViewMode('list')}
                                    title="Tampilan List"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                    size="icon"
                                    onClick={() => setViewMode('grid')}
                                    title="Tampilan Grid"
                                >
                                    <Grid3x3 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {archives.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <ArchiveIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Tidak ada arsip ditemukan</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            // List View (Table)
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Judul</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Klasifikasi</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {archives.data.map((archive) => {
                                        const TypeIcon = typeConfig[archive.type]?.icon || FileText;
                                        const isExpiring = isExpiringSoon(archive.retention_until);

                                        return (
                                            <TableRow key={archive.id}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <Link href={route('arsip.archives.show', archive.id)} className="font-medium hover:underline">
                                                            {archive.title}
                                                        </Link>
                                                        {archive.document_number && (
                                                            <p className="text-xs text-muted-foreground">{archive.document_number}</p>
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
                                                    <div className="text-sm">{archive.category || '-'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {isExpiring ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Segera Kadaluarsa
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                            Aktif
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={route('arsip.archives.show', archive.id)}>
                                                            <Button variant="ghost" size="icon" title="Lihat">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <a href={route('arsip.archives.download', archive.id)}>
                                                            <Button variant="ghost" size="icon" title="Download">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                        <Link href={route('arsip.archives.edit', archive.id)}>
                                                            <Button variant="ghost" size="icon" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(archive)} title="Hapus">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            // Grid View
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {archives.data.map((archive) => {
                                    const TypeIcon = typeConfig[archive.type]?.icon || FileText;
                                    const isExpiring = isExpiringSoon(archive.retention_until);

                                    return (
                                        <Card key={archive.id} className="transition-shadow hover:shadow-lg">
                                            <CardHeader className="pb-3">
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
                                                    <p className="text-xs text-muted-foreground">{archive.document_number}</p>
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

                                                {isExpiring && (
                                                    <Badge variant="destructive" className="w-full justify-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Segera Kadaluarsa
                                                    </Badge>
                                                )}

                                                {!isExpiring && (
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
                                                    <a href={route('arsip.archives.download', archive.id)}>
                                                        <Button variant="outline" size="sm">
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    </a>
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
                        )}

                        {/* Pagination */}
                        {archives.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {archives.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => router.get(route('arsip.archives.index', { ...filters, page: archives.current_page - 1 }))}
                                    >
                                        Sebelumnya
                                    </Button>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Halaman {archives.current_page} dari {archives.last_page}
                                </span>
                                {archives.current_page < archives.last_page && (
                                    <Button
                                        variant="outline"
                                        onClick={() => router.get(route('arsip.archives.index', { ...filters, page: archives.current_page + 1 }))}
                                    >
                                        Selanjutnya
                                    </Button>
                                )}
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
                                Tindakan ini akan menghapus arsip "{selectedArchive?.title}" secara permanen dan tidak dapat dibatalkan. File dokumen
                                yang terkait juga akan dihapus dari sistem.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
