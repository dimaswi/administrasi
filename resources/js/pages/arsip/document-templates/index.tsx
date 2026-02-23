import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Copy, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import { useState } from 'react';
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
import { toast } from 'sonner';

interface Template {
    id: number;
    name: string;
    code: string;
    category: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    creator: {
        id: number;
        name: string;
    };
}

interface Props {
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
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Template Surat', href: '/arsip/document-templates' },
];

export default function Index({ templates, categories, filters }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        category: filters.category || '',
        is_active: filters.is_active || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/arsip/document-templates', Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== '')), { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', category: '', is_active: '' });
        router.get('/arsip/document-templates', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/arsip/document-templates', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/arsip/document-templates', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/arsip/document-templates/${deleteId}`, {
                onSuccess: () => {
                    toast.success('Template berhasil dihapus');
                    setDeleteId(null);
                },
                onError: () => {
                    toast.error('Gagal menghapus template');
                },
            });
        }
    };

    const handleToggleActive = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/arsip/document-templates/${id}/toggle-active`, {}, {
            onSuccess: () => toast.success('Status template berhasil diubah'),
        });
    };

    const handleDuplicate = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/arsip/document-templates/${id}/duplicate`, {}, {
            onSuccess: () => toast.success('Template berhasil diduplikasi'),
        });
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Template',
            render: (template: Template) => (
                <div>
                    <Link 
                        href={`/arsip/document-templates/${template.id}`}
                        className="font-medium hover:text-primary hover:underline"
                    >
                        {template.name}
                    </Link>
                    {template.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                            {template.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'code',
            label: 'Kode',
            render: (template: Template) => (
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
                    {template.code}
                </code>
            ),
        },
        {
            key: 'category',
            label: 'Kategori',
            render: (template: Template) => (
                template.category ? (
                    <Badge variant="outline">{template.category}</Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (template: Template) => (
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Aktif' : 'Non-aktif'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (template: Template) => (
                <div>
                    <div className="text-sm">
                        {new Date(template.created_at).toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {template.creator.name}
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[180px]',
            render: (template: Template) => (
                <div className="flex justify-end gap-1">
                    <Link href={`/arsip/document-templates/${template.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Lihat">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/arsip/document-templates/${template.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        onClick={(e) => handleToggleActive(template.id, e)}
                    >
                        {template.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                            <ToggleLeft className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Hapus"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(template.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'category',
            label: 'Kategori',
            type: 'select' as const,
            placeholder: 'Semua Kategori',
            options: categories.map(cat => ({ value: cat, label: cat })),
        },
        {
            key: 'is_active',
            label: 'Status',
            type: 'select' as const,
            placeholder: 'Semua Status',
            options: [
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Non-aktif' },
            ],
        },
    ];

    return (
        <AppLayout>
            <Head title="Template Surat" />

                <IndexPage
                    title="Template Surat"
                    description="Kelola template untuk surat keluar"
                    actions={[
                        {
                            label: 'Buat Template',
                            href: '/arsip/document-templates/create',
                            icon: Plus,
                        },
                    ]}
                    data={templates.data}
                    columns={columns}
                    pagination={{
                        current_page: templates.current_page || 1,
                        last_page: templates.last_page || 1,
                        per_page: templates.per_page || 10,
                        total: templates.total || 0,
                        from: templates.from || 0,
                        to: templates.to || 0,
                    }}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    filterFields={filterFields}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari nama, kode template..."
                    onSearchChange={(val) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada template"
                    emptyIcon={FileText}
                />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Template yang sudah digunakan tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
