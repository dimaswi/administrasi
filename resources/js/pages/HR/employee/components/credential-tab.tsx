import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
    Plus, 
    Edit, 
    Trash2, 
    CreditCard,
    CheckCircle,
    XCircle,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Employee } from './types';

interface Credential {
    id: number;
    type: string;
    type_label: string;
    name: string;
    number: string;
    issued_by: string | null;
    issued_date: string | null;
    issued_date_formatted: string | null;
    expiry_date: string | null;
    expiry_date_formatted: string | null;
    is_expired: boolean;
    is_expiring_soon: boolean;
    days_until_expiry: number | null;
    is_verified: boolean;
    document_url: string | null;
}

interface Props {
    employee: Employee & { credentials?: Credential[] };
}

const typeLabels: Record<string, string> = {
    str: 'STR',
    sip: 'SIP',
    certificate: 'Sertifikat',
    license: 'Lisensi',
    training: 'Pelatihan',
    other: 'Lainnya',
};

export function CredentialTab({ employee }: Props) {
    const credentials = employee.credentials || [];

    const handleDelete = (credentialId: number, credentialName: string) => {
        router.delete(`/hr/credentials/${credentialId}`, {
            onSuccess: () => {
                toast.success(`Kredensial "${credentialName}" berhasil dihapus`);
            },
            onError: () => {
                toast.error('Gagal menghapus kredensial');
            },
        });
    };

    const getStatusBadge = (credential: Credential) => {
        if (credential.is_expired) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Kedaluwarsa
                </Badge>
            );
        }
        if (credential.is_expiring_soon) {
            return (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {credential.days_until_expiry} hari lagi
                </Badge>
            );
        }
        if (!credential.expiry_date) {
            return <Badge variant="secondary">Tidak ada masa berlaku</Badge>;
        }
        return <Badge variant="outline">{credential.expiry_date_formatted}</Badge>;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Kredensial
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Dokumen dan sertifikasi profesi karyawan
                    </p>
                </div>
                <Button asChild size="sm">
                    <Link href={`/hr/employees/${employee.id}/credentials/create`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah
                    </Link>
                </Button>
            </div>

            {/* Content */}
            {credentials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada kredensial untuk karyawan ini</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href={`/hr/employees/${employee.id}/credentials/create`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Kredensial
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Nomor</TableHead>
                                <TableHead>Masa Berlaku</TableHead>
                                <TableHead className="text-center">Verifikasi</TableHead>
                                <TableHead className="w-[120px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credentials.map((credential) => (
                                <TableRow key={credential.id}>
                                    <TableCell>
                                        <Badge variant="outline">{credential.type_label}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{credential.name}</div>
                                        {credential.issued_by && (
                                            <div className="text-sm text-muted-foreground">
                                                Penerbit: {credential.issued_by}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {credential.number}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(credential)}</TableCell>
                                    <TableCell className="text-center">
                                        {credential.is_verified ? (
                                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            {credential.document_url && (
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={credential.document_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/hr/credentials/${credential.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Hapus Kredensial</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Apakah Anda yakin ingin menghapus kredensial "{credential.name}"? 
                                                            Tindakan ini tidak dapat dibatalkan.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(credential.id, credential.name)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            Hapus
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
