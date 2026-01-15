import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
    id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        organization_unit: string | null;
    };
    status: string;
    status_label: string;
    start_date: string | null;
    end_date: string | null;
    score: number | null;
    grade: string | null;
}

interface TrainingData {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: string;
    type_label: string;
    category: string;
    category_label: string;
    provider: string | null;
    duration_hours: number | null;
    formatted_duration: string | null;
    cost: number | null;
    formatted_cost: string | null;
    is_mandatory: boolean;
    is_active: boolean;
    participants_count: number;
    completed_count: number;
    objectives: string | null;
    prerequisites: string | null;
}

interface Props {
    training: TrainingData;
    participants: Participant[];
}

export default function Show({ training, participants }: Props) {
    const handleDelete = () => {
        if (confirm('Hapus training ini? Tindakan ini tidak dapat dibatalkan.')) {
            router.delete(route('hr.trainings.destroy', training.id), {
                onError: () => toast.error('Gagal menghapus training'),
            });
        }
    };

    const getStatusBadge = (status: string, statusLabel: string) => {
        const variants: Record<string, string> = {
            'registered': 'bg-blue-50 text-blue-700 border-blue-200',
            'in_progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'completed': 'bg-green-50 text-green-700 border-green-200',
            'failed': 'bg-red-50 text-red-700 border-red-200',
            'cancelled': 'bg-gray-50 text-gray-700 border-gray-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {statusLabel}
            </Badge>
        );
    };

    const actions = (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href={route('hr.trainings.edit', training.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
            </Button>
        </div>
    );

    return (
        <HRLayout>
            <Head title={`Training - ${training.name}`} />

            <DetailPage
                title={training.name}
                description={training.code}
                backUrl={route('hr.trainings.index')}
                actions={actions}
            >
                <div className="space-y-8">
                    {/* Info Dasar */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Informasi Training</h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Tipe</dt>
                                    <dd><Badge variant="outline">{training.type_label}</Badge></dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Kategori</dt>
                                    <dd><Badge variant="secondary">{training.category_label}</Badge></dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Wajib</dt>
                                    <dd>
                                        {training.is_mandatory ? (
                                            <Badge variant="destructive">Ya</Badge>
                                        ) : (
                                            <Badge variant="outline">Tidak</Badge>
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Status</dt>
                                    <dd>
                                        {training.is_active ? (
                                            <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                                        ) : (
                                            <Badge variant="outline">Nonaktif</Badge>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Provider & Biaya</h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Provider</dt>
                                    <dd className="font-medium text-right">{training.provider || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Durasi</dt>
                                    <dd>{training.formatted_duration || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Biaya</dt>
                                    <dd className="font-medium">{training.formatted_cost || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Peserta</dt>
                                    <dd className="font-medium">{training.participants_count} orang</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Deskripsi & Tujuan */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Deskripsi</h3>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {training.description || 'Tidak ada deskripsi'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Tujuan & Prasyarat</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium">Tujuan</span>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {training.objectives || 'Tidak ada tujuan'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">Prasyarat</span>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {training.prerequisites || 'Tidak ada prasyarat'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Peserta */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Peserta Training ({training.participants_count})
                            </h3>
                            <Button size="sm" asChild>
                                <Link href={route('hr.employee-trainings.create', { training_id: training.id })}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Peserta
                                </Link>
                            </Button>
                        </div>

                        {participants && participants.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>NIP</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Nilai</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((participant) => (
                                        <TableRow key={participant.id}>
                                            <TableCell className="font-mono text-sm">
                                                {participant.employee.employee_id}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={route('hr.employees.show', participant.employee.id)}
                                                    className="text-primary hover:underline"
                                                >
                                                    {participant.employee.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{participant.employee.organization_unit || '-'}</TableCell>
                                            <TableCell>{getStatusBadge(participant.status, participant.status_label)}</TableCell>
                                            <TableCell>
                                                {participant.start_date && participant.end_date
                                                    ? `${participant.start_date} - ${participant.end_date}`
                                                    : participant.start_date || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {participant.score !== null ? (
                                                    <span>
                                                        {participant.score}
                                                        {participant.grade && ` (${participant.grade})`}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('hr.employee-trainings.show', participant.id)}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Belum ada peserta untuk training ini</p>
                            </div>
                        )}
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
