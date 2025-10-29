import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    MoreVertical,
    Eye,
    Edit,
    Copy,
    Trash2,
    Power,
    FileText,
    X,
    Loader2,
    PlusCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import type { BreadcrumbItem, SharedData } from '@/types';

interface Template {
    id: number;
    name: string;
    code: string;
    category: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    creator: {
        name: string;
    };
}

interface Props extends SharedData {
    templates: {
        data: Template[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    categories: string[];
    filters: {
        category?: string;
        is_active?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Template Surat', href: '/arsip/templates' },
];

export default function TemplatesIndex({ templates, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.is_active || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        template: Template | null;
        loading: boolean;
    }>({
        open: false,
        template: null,
        loading: false,
    });

    const categoryOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Kategori' },
        ...categories.map(cat => ({ value: cat, label: cat })),
    ];

    const statusOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Status' },
        { value: '1', label: 'Aktif' },
        { value: '0', label: 'Nonaktif' },
    ];

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/arsip/templates',
            { search, category, is_active: status },
            { preserveState: true, replace: true }
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        router.get('/arsip/templates', {}, { replace: true });
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/arsip/templates',
            { search, category, is_active: status, page },
            { preserveState: true, replace: true }
        );
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/arsip/templates',
            { search, category, is_active: status, perPage, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const handleToggleActive = (template: Template) => {
        router.post(`/arsip/templates/${template.id}/toggle-active`, {}, {
            preserveScroll: true,
            onSuccess: () => {
            },
        });
    };

    const handleDuplicate = (template: Template) => {
        router.post(`/arsip/templates/${template.id}/duplicate`, {}, {
            onSuccess: () => {
            },
        });
    };

    const handleDeleteClick = (template: Template) => {
        setDeleteDialog({
            open: true,
            template: template,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.template) return;

        setDeleteDialog(prev => ({ ...prev, loading: true }));

        try {
            await router.delete(`/arsip/templates/${deleteDialog.template.id}`, {
                onSuccess: () => {
                    setDeleteDialog({ open: false, template: null, loading: false });
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, template: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Template Surat" />
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari nama atau kode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10 w-64"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <SearchableSelect
                            options={categoryOptions}
                            value={category}
                            onValueChange={setCategory}
                            placeholder="Semua Kategori"
                            searchPlaceholder="Cari kategori..."
                            className="w-48"
                        />
                        <SearchableSelect
                            options={statusOptions}
                            value={status}
                            onValueChange={setStatus}
                            placeholder="Semua Status"
                            searchPlaceholder="Cari status..."
                            className="w-40"
                        />
                        <Button type="submit" variant="outline" size="sm">
                            Cari
                        </Button>
                    </form>

                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-green-200"
                        onClick={() => router.visit('/arsip/templates/create')}
                    >
                        <PlusCircle className="h-4 w-4 text-green-500" />
                        Tambah
                    </Button>
                </div>

                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Nama Template</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pembuat</TableHead>
                                <TableHead>Dibuat</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.data.length > 0 ? (
                                templates.data.map((template, index) => (
                                    <TableRow key={template.id}>
                                        <TableCell>
                                            {(templates.current_page - 1) * templates.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {template.name}
                                            {template.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {template.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{template.code}</Badge>
                                        </TableCell>
                                        <TableCell>{template.category || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                                {template.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{template.creator.name}</TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(template.created_at), {
                                                addSuffix: true,
                                                locale: id,
                                            })}
                                        </TableCell>
                                        <TableCell className="flex justify-end space-x-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/arsip/templates/${template.id}`}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Lihat Detail
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/arsip/templates/${template.id}/edit`}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplikasi
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                                                        <Power className="h-4 w-4 mr-2" />
                                                        {template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(template)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                                            <span>Tidak ada data template yang ditemukan</span>
                                            {(filters.search || filters.category || filters.is_active) && (
                                                <span className="text-sm">
                                                    Coba ubah kata kunci pencarian atau hapus filter
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {templates.from || 0} - {templates.to || 0} dari {templates.total} data
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Baris per halaman:</span>
                            <select
                                className="rounded border px-2 py-1 text-sm"
                                value={templates.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(templates.current_page - 1)}
                                disabled={templates.current_page <= 1}
                            >
                                Previous
                            </Button>

                            <span className="text-sm">
                                Page {templates.current_page} of {templates.last_page}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(templates.current_page + 1)}
                                disabled={templates.current_page >= templates.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                <DialogContent className="sm:max-w-2xl top-1/8">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Template</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus template <strong>{deleteDialog.template?.name}</strong>?
                            <br />
                            <span className="text-red-600">Template yang sudah digunakan tidak dapat dihapus.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                            disabled={deleteDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteDialog.loading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteDialog.loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus Template
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
