import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Employee, EmployeeWorkHistory, formatDateShort } from './types';

interface Props {
    employee: Employee;
}

interface FormData {
    [key: string]: string;
    company_name: string;
    position: string;
    start_date: string;
    end_date: string;
    job_description: string;
    leaving_reason: string;
    reference_contact: string;
    reference_phone: string;
}

const initialFormData: FormData = {
    company_name: '',
    position: '',
    start_date: '',
    end_date: '',
    job_description: '',
    leaving_reason: '',
    reference_contact: '',
    reference_phone: '',
};

export function WorkHistoryTab({ employee }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [processing, setProcessing] = useState(false);

    const handleAdd = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setDialogOpen(true);
    };

    const handleEdit = (work: EmployeeWorkHistory) => {
        setEditingId(work.id);
        setFormData({
            company_name: work.company_name,
            position: work.position,
            start_date: work.start_date,
            end_date: work.end_date || '',
            job_description: work.job_description || '',
            leaving_reason: work.leaving_reason || '',
            reference_contact: work.reference_contact || '',
            reference_phone: work.reference_phone || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleSubmit = () => {
        setProcessing(true);
        const url = editingId 
            ? `/hr/employees/${employee.id}/work-histories/${editingId}`
            : `/hr/employees/${employee.id}/work-histories`;
        
        const method = editingId ? 'put' : 'post';
        
        router[method](url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setFormData(initialFormData);
                setEditingId(null);
            },
            onError: () => toast.error('Gagal menyimpan riwayat kerja'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingId) return;
        setProcessing(true);
        router.delete(`/hr/employees/${employee.id}/work-histories/${deletingId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
            },
            onError: () => toast.error('Gagal menghapus riwayat kerja'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between p-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Riwayat Pekerjaan
                        </CardTitle>
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {employee.work_histories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Belum ada riwayat pekerjaan</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Perusahaan</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employee.work_histories.map((work, index) => (
                                    <TableRow key={work.id}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell className="font-medium">{work.company_name}</TableCell>
                                        <TableCell>{work.position}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="whitespace-nowrap">
                                                {formatDateShort(work.start_date)} - {work.end_date ? formatDateShort(work.end_date) : 'Sekarang'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {work.job_description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(work)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(work.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            {editingId ? 'Edit' : 'Tambah'} Riwayat Pekerjaan
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan data riwayat pekerjaan sebelumnya
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama Perusahaan *</Label>
                                <Input
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    placeholder="PT. Contoh"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jabatan *</Label>
                                <Input
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="Staff IT"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal Mulai *</Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Selesai</Label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi Pekerjaan</Label>
                            <Textarea
                                value={formData.job_description}
                                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                                placeholder="Uraian tugas dan tanggung jawab"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alasan Keluar</Label>
                            <Input
                                value={formData.leaving_reason}
                                onChange={(e) => setFormData({ ...formData, leaving_reason: e.target.value })}
                                placeholder="Resign, kontrak habis, dll"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama Referensi</Label>
                                <Input
                                    value={formData.reference_contact}
                                    onChange={(e) => setFormData({ ...formData, reference_contact: e.target.value })}
                                    placeholder="Nama atasan"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telepon Referensi</Label>
                                <Input
                                    value={formData.reference_phone}
                                    onChange={(e) => setFormData({ ...formData, reference_phone: e.target.value })}
                                    placeholder="08xxx"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={processing || !formData.company_name || !formData.position || !formData.start_date}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Riwayat Pekerjaan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={processing}>
                            {processing ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
