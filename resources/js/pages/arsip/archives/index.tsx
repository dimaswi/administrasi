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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { IndexPage } from '@/components/ui/index-page';
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
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    Grid3x3,
    List,
    MoreHorizontal,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
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
    archiver: { id: number; name: string };
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
    letter: { label: 'Surat', icon: FileText },
    incoming_letter: { label: 'Surat Masuk', icon: FileText },
    outgoing_letter: { label: 'Surat Keluar', icon: FileText },
    document: { label: 'Dokumen', icon: FileText },
};

const classificationConfig: Record<string, { label: string; color: string }> = {
    public: { label: 'Publik', color: 'bg-gray-500' },
    internal: { label: 'Internal', color: 'bg-blue-500' },
    confidential: { label: 'Rahasia', color: 'bg-orange-500' },
    secret: { label: 'Sangat Rahasia', color: 'bg-red-500' },
};

export default function Index({ archives, categories, documentTypes, filters }: Props) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);

    const [filterValues, setFilterValues] = useState<Record<string, string>>({
        search: filters.search || '',
        type: filters.type || '',
        category: filters.category || '',
        document_type: filters.document_type || '',
        classification: filters.classification || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const navigateWithFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('arsip.archives.index'),
            {
                search: overrides.search ?? filterValues.search,
                type: overrides.type ?? filterValues.type,
                category: overrides.category ?? filterValues.category,
                document_type: overrides.document_type ?? filterValues.document_type,
                classification: overrides.classification ?? filterValues.classification,
                date_from: overrides.date_from ?? filterValues.date_from,
                date_to: overrides.date_to ?? filterValues.date_to,
                per_page: overrides.per_page ?? archives.per_page,
                page: overrides.page ?? 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => navigateWithFilters({ page: 1 });

    const handleFilterReset = () => {
        const empty = { search: '', type: '', category: '', document_type: '', classification: '', date_from: '', date_to: '' };
        setFilterValues(empty);
        router.get(route('arsip.archives.index'), { per_page: archives.per_page });
    };

    const handlePageChange = (page: number) => navigateWithFilters({ page });
    const handlePerPageChange = (perPage: number) => navigateWithFilters({ per_page: perPage, page: 1 });

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

    const columns = [
        {
            key: 'title',
            label: 'Judul',
            sortable: false,
            render: (archive: Archive) => (
                <div className="space-y-0.5">
                    <Link href={route('arsip.archives.show', archive.id)} className="font-medium hover:underline line-clamp-1">
                        {archive.title}
                    </Link>
                    {archive.document_number && (
                        <p className="text-xs text-muted-foreground font-mono">{archive.document_number}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Tipe',
            render: (archive: Archive) => {
                const cfg = typeConfig[archive.type];
                return (
                    <Badge variant="outline" className="gap-1 whitespace-nowrap">
                        <FileText className="h-3 w-3" />
                        {cfg?.label || archive.type}
                    </Badge>
                );
            },
        },
        {
            key: 'classification',
            label: 'Klasifikasi',
            render: (archive: Archive) => {
                const cfg = classificationConfig[archive.classification];
                return (
                    <Badge className={cn(cfg?.color || 'bg-gray-500', 'text-white whitespace-nowrap')}>
                        {cfg?.label || archive.classification}
                    </Badge>
                );
            },
        },
        {
            key: 'document_date',
            label: 'Tanggal',
            render: (archive: Archive) => (
                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    {format(new Date(archive.document_date), 'dd MMM yyyy', { locale: idLocale })}
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Kategori',
            render: (archive: Archive) => (
                <span className="text-sm text-muted-foreground">{archive.category || '-'}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: false,
            render: (archive: Archive) => {
                const expiring = isExpiringSoon(archive.retention_until);
                return expiring ? (
                    <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        Kadaluarsa
                    </Badge>
                ) : (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 whitespace-nowrap">
                        Aktif
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            className: 'w-[46px]',
            render: (archive: Archive) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
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
                                    Preview &amp; Cetak
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
            ),
        },
    ];

    const filterFields = [
        {
            key: 'type',
            label: 'Tipe',
            type: 'select' as const,
            placeholder: 'Semua Tipe',
            options: [
                { value: 'letter', label: 'Surat' },
                { value: 'incoming_letter', label: 'Surat Masuk' },
                { value: 'outgoing_letter', label: 'Surat Keluar' },
                { value: 'document', label: 'Dokumen' },
            ],
        },
        {
            key: 'category',
            label: 'Kategori',
            type: 'select' as const,
            placeholder: 'Semua Kategori',
            options: categories.map((c) => ({ value: c, label: c })),
        },
        {
            key: 'document_type',
            label: 'Jenis Dok.',
            type: 'select' as const,
            placeholder: 'Semua Jenis',
            options: documentTypes.map((d) => ({ value: d, label: d })),
        },
        {
            key: 'classification',
            label: 'Klasifikasi',
            type: 'select' as const,
            placeholder: 'Semua Klasifikasi',
            options: [
                { value: 'public', label: 'Publik' },
                { value: 'internal', label: 'Internal' },
                { value: 'confidential', label: 'Rahasia' },
                { value: 'secret', label: 'Sangat Rahasia' },
            ],
        },
        { key: 'date_from', label: 'Tgl. Dari', type: 'date' as const },
        { key: 'date_to', label: 'Tgl. Sampai', type: 'date' as const },
    ];

    const gridContent = (
        <div>
            {archives.data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <ArchiveIcon className="h-8 w-8 opacity-30" />
                    <span className="text-sm">Tidak ada arsip ditemukan</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {archives.data.map((archive) => {
                        const expiring = isExpiringSoon(archive.retention_until);
                        return (
                            <Card key={archive.id} className="transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-1">
                                            <Badge variant="outline" className="text-xs">
                                                {typeConfig[archive.type]?.label || archive.type}
                                            </Badge>
                                            <Badge className={cn(classificationConfig[archive.classification]?.color || 'bg-gray-500', 'text-white text-xs')}>
                                                {classificationConfig[archive.classification]?.label || archive.classification}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('arsip.archives.show', archive.id)}
                                        className="mt-2 line-clamp-2 text-sm font-semibold hover:underline"
                                    >
                                        {archive.title}
                                    </Link>
                                    {archive.document_number && (
                                        <p className="text-xs text-muted-foreground font-mono">{archive.document_number}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-3">
                                    {archive.description && (
                                        <p className="line-clamp-2 text-xs text-muted-foreground">{archive.description}</p>
                                    )}
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(archive.document_date), 'dd MMM yyyy', { locale: idLocale })}
                                        </div>
                                        {archive.category && <div>Kategori: {archive.category}</div>}
                                        {archive.document_type && <div>Jenis: {archive.document_type}</div>}
                                    </div>
                                    {expiring ? (
                                        <Badge variant="destructive" className="w-full justify-center gap-1 text-xs">
                                            <Clock className="h-3 w-3" />Segera Kadaluarsa
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="w-full justify-center border-green-200 bg-green-50 text-green-700 text-xs">
                                            Aktif
                                        </Badge>
                                    )}
                                    <div className="flex gap-1 pt-1">
                                        <Link href={route('arsip.archives.show', archive.id)} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full gap-1 h-7 text-xs">
                                                <Eye className="h-3 w-3" />Lihat
                                            </Button>
                                        </Link>
                                        {archive.type === 'outgoing_letter' ? (
                                            <Link href={route('arsip.archives.preview', archive.id)}>
                                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="Preview & Cetak">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <a href={route('arsip.archives.download', archive.id)}>
                                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="Download">
                                                    <Download className="h-3 w-3" />
                                                </Button>
                                            </a>
                                        )}
                                        <Link href={route('arsip.archives.edit', archive.id)}>
                                            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handleDelete(archive)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const viewToggle = (
        <div className="flex items-center gap-0 border-b border-border pb-0">
            <button
                onClick={() => setViewMode('list')}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all border-b-2 -mb-px',
                    viewMode === 'list'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
            >
                <List className="h-3.5 w-3.5" />
                List
            </button>
            <button
                onClick={() => setViewMode('grid')}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all border-b-2 -mb-px',
                    viewMode === 'grid'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
            >
                <Grid3x3 className="h-3.5 w-3.5" />
                Grid
            </button>
        </div>
    );

    return (
        <AppLayout>
            <Head title="Arsip Dokumen" />

            <IndexPage
                title="Arsip Dokumen"
                description="Kelola dan cari arsip dokumen dan surat"
                actions={[
                    {
                        label: 'Akan Kadaluarsa',
                        href: route('arsip.archives.expiring'),
                        icon: Clock,
                        variant: 'outline',
                    },
                    {
                        label: 'Tambah Arsip',
                        href: route('arsip.archives.create'),
                        icon: Plus,
                    },
                ]}
                headerExtra={viewToggle}
                data={archives.data}
                columns={columns}
                pagination={archives}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={filterFields}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                searchValue={filterValues.search}
                searchPlaceholder="Cari judul, nomor dokumen..."
                onSearchChange={(v) => setFilterValues((prev) => ({ ...prev, search: v }))}
                emptyMessage="Tidak ada arsip ditemukan"
                emptyIcon={ArchiveIcon}
                tableContent={viewMode === 'grid' ? gridContent : undefined}
            />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Arsip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus arsip &quot;{selectedArchive?.title}&quot; secara permanen dan tidak dapat
                            dibatalkan. File dokumen yang terkait juga akan dihapus dari sistem.
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
        </AppLayout>
    );
}
