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
import { DetailPage } from '@/components/ui/form-page';
import { Separator } from '@/components/ui/separator';
import { Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AlertCircle, Building, Calendar, Clock, Download, Edit, Eye, FileText, Mail, Printer, Shield, Tag, Trash2, User } from 'lucide-react';
import { useState } from 'react';

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
    letter: {
        id: number;
        letter_number: string;
        subject: string;
    } | null;
    created_at: string;
}

interface Props {
    archive: Archive;
}

export default function Show({ archive }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        router.delete(route('arsip.archives.destroy', archive.id));
    };

    const getTypeBadge = (type: Archive['type']) => {
        const typeLabels = {
            letter: 'Surat',
            incoming_letter: 'Surat Masuk',
            outgoing_letter: 'Surat Keluar',
            document: 'Dokumen',
        };
        const typeVariants = {
            letter: 'default',
            incoming_letter: 'default',
            outgoing_letter: 'default',
            document: 'secondary',
        } as const;
        return <Badge variant={typeVariants[type]}>{typeLabels[type]}</Badge>;
    };

    const getClassificationBadge = (classification: Archive['classification']) => {
        const variants: Record<Archive['classification'], { variant: any; label: string; icon: any }> = {
            public: { variant: 'secondary', label: 'Publik', icon: Shield },
            internal: { variant: 'default', label: 'Internal', icon: Shield },
            confidential: { variant: 'default', label: 'Rahasia', icon: Shield },
            secret: { variant: 'destructive', label: 'Sangat Rahasia', icon: Shield },
        };
        const config = variants[classification];
        const Icon = config.icon;
        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getFileSizeHuman = (bytes: number | null) => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const isExpired = archive.retention_until && new Date(archive.retention_until) < new Date();
    const isExpiringSoon =
        archive.retention_until && !isExpired && new Date(archive.retention_until) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
        <DetailPage
            title="Detail Arsip"
            description={archive.document_number ?? undefined}
            backUrl={route('arsip.archives.index')}
            actions={
                <>
                    {archive.type === 'outgoing_letter' ? (
                        <Link href={route('arsip.archives.preview', archive.id)}>
                            <Button variant="outline" className="gap-2">
                                <Printer className="h-4 w-4" />
                                Preview & Cetak
                            </Button>
                        </Link>
                    ) : (
                        <a href={route('arsip.archives.download', archive.id)}>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        </a>
                    )}
                    <Link href={route('arsip.archives.edit', archive.id)}>
                        <Button variant="outline" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Hapus
                    </Button>
                </>
            }
        >
            {/* Retention Alert */}
            {(isExpired || isExpiringSoon) && (
                <Card className={isExpired ? 'border-destructive bg-destructive/5' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'}>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className={isExpired ? 'h-5 w-5 text-destructive' : 'h-5 w-5 text-yellow-500'} />
                            <div>
                                <p className={`font-medium ${isExpired ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-500'}`}>
                                    {isExpired ? 'Arsip Telah Kadaluarsa' : 'Arsip Akan Segera Kadaluarsa'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Masa retensi berakhir: {format(new Date(archive.retention_until!), 'dd MMMM yyyy', { locale: idLocale })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

                {/* Main Info */}
                <Card>
                    <CardHeader className='pt-4'>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    {getTypeBadge(archive.type)}
                                    {getClassificationBadge(archive.classification)}
                                </div>
                                <CardTitle className="text-2xl">{archive.title}</CardTitle>
                                {archive.description && <CardDescription className="text-base">{archive.description}</CardDescription>}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Document Number */}
                            {archive.document_number && (
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Nomor Dokumen</p>
                                        <p className="text-sm text-muted-foreground">{archive.document_number}</p>
                                    </div>
                                </div>
                            )}

                            {/* Document Date */}
                            <div className="flex items-start gap-3">
                                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Tanggal Dokumen</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(archive.document_date), 'dd MMMM yyyy', { locale: idLocale })}
                                    </p>
                                </div>
                            </div>

                            {/* Category */}
                            {archive.category && (
                                <div className="flex items-start gap-3">
                                    <Tag className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Kategori</p>
                                        <p className="text-sm text-muted-foreground">{archive.category}</p>
                                    </div>
                                </div>
                            )}

                            {/* Document Type */}
                            {archive.document_type && (
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Jenis Dokumen</p>
                                        <p className="text-sm text-muted-foreground">{archive.document_type}</p>
                                    </div>
                                </div>
                            )}

                            {/* Sender */}
                            {archive.sender && (
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Pengirim</p>
                                        <p className="text-sm text-muted-foreground">{archive.sender}</p>
                                    </div>
                                </div>
                            )}

                            {/* Recipient */}
                            {archive.recipient && (
                                <div className="flex items-start gap-3">
                                    <Building className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Penerima</p>
                                        <p className="text-sm text-muted-foreground">{archive.recipient}</p>
                                    </div>
                                </div>
                            )}

                            {/* Archiver */}
                            <div className="flex items-start gap-3">
                                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Diarsipkan Oleh</p>
                                    <p className="text-sm text-muted-foreground">{archive.archiver.name}</p>
                                </div>
                            </div>

                            {/* Created At */}
                            <div className="flex items-start gap-3">
                                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Tanggal Arsip</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(archive.created_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Retention Period */}
                        {archive.retention_period && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="mb-3 text-sm font-medium">Masa Retensi</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="flex items-start gap-3">
                                            <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Periode</p>
                                                <p className="text-sm text-muted-foreground">{archive.retention_period} Tahun</p>
                                            </div>
                                        </div>
                                        {archive.retention_until && (
                                            <div className="flex items-start gap-3">
                                                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Kadaluarsa Pada</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(archive.retention_until), 'dd MMMM yyyy', { locale: idLocale })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Tags */}
                        {archive.tags && archive.tags.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="mb-3 text-sm font-medium">Tag</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {archive.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* File Info */}
                        <Separator />
                        <div>
                            <h3 className="mb-3 text-sm font-medium">Informasi File</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tipe File</p>
                                    <p className="text-sm font-medium uppercase">{archive.file_type || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ukuran File</p>
                                    <p className="text-sm font-medium">{getFileSizeHuman(archive.file_size)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Aksi</p>
                                    <a href={route('arsip.archives.download', archive.id)}>
                                        <Button variant="link" className="h-auto p-0">
                                            Download File
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Related Letter */}
                        {archive.letter && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="mb-3 text-sm font-medium">Surat Terkait</h3>
                                    <div className="rounded-lg border p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{archive.letter.subject}</p>
                                                <p className="text-sm text-muted-foreground">{archive.letter.letter_number}</p>
                                            </div>
                                            <Link href={route('arsip.letters.show', archive.letter.id)}>
                                                <Button variant="outline" size="sm">
                                                    Lihat Surat
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Arsip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus arsip "{archive.title}" secara permanen dan tidak dapat dibatalkan. File dokumen yang terkait
                            juga akan dihapus dari sistem.
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
        </DetailPage>
    );
}
