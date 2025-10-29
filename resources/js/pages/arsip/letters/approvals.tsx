import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    AlertCircle,
} from 'lucide-react';
import type { BreadcrumbItem, SharedData } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LetterApproval {
    id: number;
    letter_id: number;
    position_name: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    letter: {
        id: number;
        letter_number: string;
        subject: string;
        letter_date: string;
        status: string;
        created_at: string;
        template: {
            id: number;
            name: string;
            code: string;
        };
        creator: {
            id: number;
            name: string;
        };
        approvals: Array<{
            status: string;
        }>;
    };
}

interface Props extends SharedData {
    approvals: {
        data: LetterApproval[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Persetujuan Saya', href: '/arsip/letters/approvals/pending' },
];

export default function PendingApprovals({ approvals }: Props) {
    const handleRowClick = (letterId: number) => {
        router.visit(`/arsip/letters/${letterId}`);
    };

    const getApprovalProgress = (letter: LetterApproval['letter']) => {
        const total = letter.approvals.length;
        const approved = letter.approvals.filter(a => a.status === 'approved').length;
        const rejected = letter.approvals.filter(a => a.status === 'rejected').length;
        const pending = letter.approvals.filter(a => a.status === 'pending').length;

        return { total, approved, rejected, pending };
    };

    const getProgressBadge = (letter: LetterApproval['letter']) => {
        const { total, approved, rejected, pending } = getApprovalProgress(letter);

        return (
            <div className="flex items-center gap-2">
                {approved > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {approved}/{total}
                    </Badge>
                )}
                {rejected > 0 && (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        {rejected}
                    </Badge>
                )}
                {pending > 0 && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {pending}
                    </Badge>
                )}
            </div>
        );
    };

    const renderPageNumbers = () => {
        const pages = [];
        const currentPage = approvals.current_page;
        const lastPage = approvals.last_page;

        for (let i = 1; i <= lastPage; i++) {
            if (
                i === 1 ||
                i === lastPage ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.push(
                    <Button
                        key={i}
                        variant={i === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.visit(`/arsip/letters/approvals/pending?page=${i}`)}
                    >
                        {i}
                    </Button>
                );
            } else if (
                (i === currentPage - 2 && currentPage > 3) ||
                (i === currentPage + 2 && currentPage < lastPage - 2)
            ) {
                pages.push(
                    <span key={i} className="px-2">
                        ...
                    </span>
                );
            }
        }

        return pages;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Persetujuan Saya" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Persetujuan Saya</h1>
                        <p className="text-muted-foreground mt-1">
                            Daftar surat yang menunggu persetujuan Anda
                        </p>
                    </div>
                    {approvals.total > 0 && (
                        <Badge className="bg-yellow-500 text-white">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {approvals.total} Surat Menunggu
                        </Badge>
                    )}
                </div>

                {/* Info Card */}
                {approvals.total === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Tidak Ada Surat Menunggu
                            </CardTitle>
                            <CardDescription>
                                Anda tidak memiliki surat yang menunggu persetujuan saat ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <FileText className="h-8 w-8" />
                                <div>
                                    <p>Ketika ada surat yang memerlukan persetujuan Anda, akan muncul di halaman ini.</p>
                                    <p className="text-sm mt-1">Anda juga akan menerima notifikasi.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Surat Menunggu Persetujuan</CardTitle>
                            <CardDescription>
                                Klik pada baris untuk melihat detail dan menyetujui/menolak
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor Surat</TableHead>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead>Posisi Saya</TableHead>
                                        <TableHead>Template</TableHead>
                                        <TableHead>Pembuat</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvals.data.map((approval) => (
                                        <TableRow
                                            key={approval.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(approval.letter.id)}
                                        >
                                            <TableCell className="font-medium">
                                                {approval.letter.letter_number}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {approval.letter.subject}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                    {approval.position_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="font-medium">{approval.letter.template.name}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {approval.letter.template.code}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {approval.letter.creator.name}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(approval.letter.created_at), 'dd MMM yyyy', { locale: id })}
                                            </TableCell>
                                            <TableCell>
                                                {getProgressBadge(approval.letter)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {approvals.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Menampilkan {approvals.from} sampai {approvals.to} dari {approvals.total} surat
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.visit(`/arsip/letters/approvals/pending?page=${approvals.current_page - 1}`)}
                                            disabled={approvals.current_page === 1}
                                        >
                                            Sebelumnya
                                        </Button>
                                        {renderPageNumbers()}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.visit(`/arsip/letters/approvals/pending?page=${approvals.current_page + 1}`)}
                                            disabled={approvals.current_page === approvals.last_page}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
