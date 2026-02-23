import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    Plus, MoreHorizontal, Eye, Edit, Trash2, 
    FileText, PenTool, Mail
} from 'lucide-react';

interface OutgoingLetter {
    id: number;
    letter_number: string | null;
    template: {
        id: number;
        name: string;
        code: string;
    };
    subject: string;
    letter_date: string;
    status: 'pending_approval' | 'partially_signed' | 'fully_signed' | 'rejected' | 'revision_requested';
    creator: {
        id: number;
        name: string;
    };
    created_at: string;
    approval_progress: {
        total: number;
        signed: number;
        pending: number;
        rejected: number;
    };
    // Signatory info
    is_signatory: boolean;
    signatory_status: 'pending' | 'approved' | 'rejected' | null;
    can_sign: boolean;
}

interface Props {
    letters: {
        data: OutgoingLetter[];
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
        template_id: string;
    };
    templates: { id: number; name: string }[];
}

const breadcrumbs = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Surat Keluar', href: '/arsip/outgoing-letters' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_approval: { label: 'Menunggu TTD', variant: 'default' },
    partially_signed: { label: 'TTD Sebagian', variant: 'outline' },
    fully_signed: { label: 'Selesai', variant: 'default' },
    rejected: { label: 'Ditolak', variant: 'destructive' },
    revision_requested: { label: 'Perlu Revisi', variant: 'destructive' },
};

export default function Index({ letters, filters, templates }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        template_id: filters.template_id || '',
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [letterToDelete, setLetterToDelete] = useState<OutgoingLetter | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        router.get('/arsip/outgoing-letters', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', status: '', template_id: '' });
        router.get('/arsip/outgoing-letters', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/arsip/outgoing-letters', { ...filters, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/arsip/outgoing-letters', { ...filters, perPage, page: 1 }, { preserveState: true });
    };

    const handleDeleteClick = (letter: OutgoingLetter) => {
        setLetterToDelete(letter);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (letterToDelete) {
            router.delete(`/arsip/outgoing-letters/${letterToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setLetterToDelete(null);
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const columns = [
        {
            key: 'letter_number',
            label: 'Nomor Surat',
            render: (letter: OutgoingLetter) => (
                <div>
                    <div className="font-mono text-sm font-medium">
                        {letter.letter_number || (
                            <span className="text-muted-foreground italic">Belum dinomori</span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[160px]" title={letter.subject}>{letter.subject}</div>
                </div>
            ),
        },
        {
            key: 'template',
            label: 'Template',
            render: (letter: OutgoingLetter) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[150px]">{letter.template.name}</span>
                </div>
            ),
        },
        {
            key: 'subject',
            label: 'Perihal',
            className: 'max-w-[250px]',
            render: (letter: OutgoingLetter) => (
                <span className="truncate block">{letter.subject}</span>
            ),
        },
        {
            key: 'letter_date',
            label: 'Tanggal',
            render: (letter: OutgoingLetter) => (
                <span className="text-muted-foreground text-sm">
                    {formatDate(letter.letter_date)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (letter: OutgoingLetter) => {
                const config = statusConfig[letter.status] || statusConfig.pending_approval;
                return (
                    <div className="flex flex-row flex-wrap items-center gap-1">
                        <Badge variant={config.variant}>
                            {config.label}
                        </Badge>
                        {letter.is_signatory && (
                            <Badge 
                                variant={letter.signatory_status === 'approved' ? 'default' : letter.signatory_status === 'rejected' ? 'destructive' : 'outline'}
                                className="text-xs"
                            >
                                {letter.signatory_status === 'approved' ? 'Sudah TTD' : letter.signatory_status === 'rejected' ? 'Ditolak' : 'Perlu TTD'}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'signatories',
            label: 'TTD',
            render: (letter: OutgoingLetter) => (
                letter.approval_progress.total > 0 ? (
                    <div className="flex items-center gap-1.5 text-sm">
                        <PenTool className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={letter.approval_progress.signed === letter.approval_progress.total ? 'text-green-600 font-medium' : ''}>
                            {letter.approval_progress.signed}/{letter.approval_progress.total}
                        </span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (letter: OutgoingLetter) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/arsip/outgoing-letters/${letter.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                            </Link>
                        </DropdownMenuItem>
                        
                        {/* Option to sign if user is a signatory and can sign */}
                        {letter.can_sign && (
                            <DropdownMenuItem asChild>
                                <Link href={`/arsip/outgoing-letters/${letter.id}`}>
                                    <PenTool className="h-4 w-4 mr-2" />
                                    Tanda Tangan
                                </Link>
                            </DropdownMenuItem>
                        )}
                        
                        {!['fully_signed', 'rejected'].includes(letter.status) && (
                            <DropdownMenuItem asChild>
                                <Link href={`/arsip/outgoing-letters/${letter.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                        )}

                        {!['fully_signed', 'rejected'].includes(letter.status) && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(letter)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                </DropdownMenuItem>
                            </>
                        )}
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
                { value: 'pending_approval', label: 'Menunggu TTD' },
                { value: 'partially_signed', label: 'TTD Sebagian' },
                { value: 'fully_signed', label: 'Selesai' },
                { value: 'rejected', label: 'Ditolak' },
                { value: 'revision_requested', label: 'Perlu Revisi' },
            ],
        },
        {
            key: 'template_id',
            label: 'Template',
            type: 'select' as const,
            placeholder: 'Semua Template',
            options: templates.map(t => ({ value: t.id.toString(), label: t.name })),
        },
    ];

    return (
        <AppLayout>
            <Head title="Surat Keluar" />

                <IndexPage
                    title="Surat Keluar"
                    description="Kelola surat keluar dan pengajuan tanda tangan digital"
                    actions={[
                        {
                            label: 'Buat Surat',
                            href: '/arsip/outgoing-letters/create',
                            icon: Plus,
                        },
                    ]}
                    data={letters.data}
                    columns={columns}
                    pagination={{
                        current_page: letters.current_page,
                        last_page: letters.last_page,
                        per_page: letters.per_page || 10,
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
                    searchPlaceholder="Cari nomor surat, perihal..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    emptyMessage="Belum ada surat keluar"
                    emptyIcon={Mail}
                />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Surat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {letterToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{letterToDelete.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                    No: {letterToDelete.letter_number || 'Belum dinomori'}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setLetterToDelete(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
