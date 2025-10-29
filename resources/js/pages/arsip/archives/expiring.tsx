import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AlertCircle, Archive as ArchiveIcon, ArrowLeft, Calendar, Clock, Download, Edit, Eye } from 'lucide-react';

interface Archive {
    id: number;
    type: 'letter' | 'document';
    document_number: string | null;
    title: string;
    description: string | null;
    category: string | null;
    document_date: string;
    document_type: string | null;
    classification: 'public' | 'internal' | 'confidential' | 'secret';
    retention_period: number | null;
    retention_until: string;
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
}

export default function Expiring({ archives }: Props) {
    const getTypeBadge = (type: Archive['type']) => {
        return type === 'letter' ? <Badge variant="default">Surat</Badge> : <Badge variant="secondary">Dokumen</Badge>;
    };

    const getClassificationBadge = (classification: Archive['classification']) => {
        const variants: Record<Archive['classification'], { variant: any; label: string }> = {
            public: { variant: 'secondary', label: 'Publik' },
            internal: { variant: 'default', label: 'Internal' },
            confidential: { variant: 'default', label: 'Rahasia' },
            secret: { variant: 'destructive', label: 'Sangat Rahasia' },
        };
        const config = variants[classification];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getDaysUntilExpiry = (retentionUntil: string) => {
        const now = new Date();
        const until = new Date(retentionUntil);
        const diffTime = until.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getExpiryBadge = (retentionUntil: string) => {
        const days = getDaysUntilExpiry(retentionUntil);
        if (days <= 0) {
            return <Badge variant="destructive">Sudah Kadaluarsa</Badge>;
        } else if (days <= 7) {
            return <Badge variant="destructive">{days} hari lagi</Badge>;
        } else if (days <= 14) {
            return <Badge className="bg-orange-500 hover:bg-orange-600">{days} hari lagi</Badge>;
        } else {
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">{days} hari lagi</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title="Arsip Akan Kadaluarsa" />

            <div className="my-6 space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center justify-between gap-4">
                        <div className='flex flex-col'>
                            <h2 className="text-xl font-semibold md:text-2xl">Arsip Akan Kadaluarsa</h2>
                            <p className="font-mono text-xs text-muted-foreground md:text-sm">
                                Arsip dengan masa retensi akan berakhir dalam 30 hari
                            </p>
                        </div>

                        <Link href={route('arsip.archives.index')}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4" /> Kembali
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Alert Info */}
                <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            <div>
                                <p className="font-medium text-yellow-700 dark:text-yellow-500">Perhatian: Masa Retensi Akan Berakhir</p>
                                <p className="text-sm text-muted-foreground">
                                    Arsip yang ditampilkan di bawah ini akan segera melewati masa retensinya. Silakan review dan tentukan tindakan
                                    yang diperlukan (perpanjang, arsipkan permanen, atau hapus).
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Archives List */}
                <Card>
                    <CardHeader>
                        <CardTitle>{archives.total} Arsip Akan Kadaluarsa</CardTitle>
                        <CardDescription>Diurutkan berdasarkan tanggal kadaluarsa (paling dekat)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {archives.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <ArchiveIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Tidak ada arsip yang akan kadaluarsa dalam 30 hari ke depan</p>
                                <Link href={route('arsip.archives.index')}>
                                    <Button variant="outline" className="mt-4">
                                        Kembali ke Daftar Arsip
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {archives.data.map((archive) => (
                                    <div
                                        key={archive.id}
                                        className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex flex-1 gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                                                    <Clock className="h-6 w-6 text-yellow-500" />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <Link
                                                            href={route('arsip.archives.show', archive.id)}
                                                            className="font-semibold hover:underline"
                                                        >
                                                            {archive.title}
                                                        </Link>
                                                        {archive.document_number && (
                                                            <p className="text-sm text-muted-foreground">{archive.document_number}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {getTypeBadge(archive.type)}
                                                        {getClassificationBadge(archive.classification)}
                                                        {getExpiryBadge(archive.retention_until)}
                                                    </div>
                                                </div>

                                                {archive.description && (
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">{archive.description}</p>
                                                )}

                                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Dokumen: {format(new Date(archive.document_date), 'dd MMM yyyy', { locale: idLocale })}
                                                    </span>
                                                    {archive.category && <span>Kategori: {archive.category}</span>}
                                                    {archive.document_type && <span>Jenis: {archive.document_type}</span>}
                                                    {archive.retention_period && <span>Retensi: {archive.retention_period} tahun</span>}
                                                    <span className="font-semibold text-yellow-700 dark:text-yellow-500">
                                                        Kadaluarsa: {format(new Date(archive.retention_until), 'dd MMM yyyy', { locale: idLocale })}
                                                    </span>
                                                </div>

                                                {archive.tags && archive.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {archive.tags.map((tag, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="ml-4 flex gap-1">
                                            <Link href={route('arsip.archives.show', archive.id)}>
                                                <Button variant="ghost" size="icon" title="Lihat Detail">
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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {archives.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {archives.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => router.get(route('arsip.archives.expiring', { page: archives.current_page - 1 }))}
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
                                        onClick={() => router.get(route('arsip.archives.expiring', { page: archives.current_page + 1 }))}
                                    >
                                        Selanjutnya
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
