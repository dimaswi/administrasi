import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Employee, EmployeeFamily, relationLabels, formatDate } from './types';

interface Props {
    employee: Employee;
}

const relationOptions = [
    { value: 'spouse', label: 'Pasangan' },
    { value: 'child', label: 'Anak' },
    { value: 'parent', label: 'Orang Tua' },
    { value: 'sibling', label: 'Saudara Kandung' },
    { value: 'other', label: 'Lainnya' },
];

const genderOptions = [
    { value: 'male', label: 'Laki-laki' },
    { value: 'female', label: 'Perempuan' },
];

interface FormData {
    [key: string]: string | boolean;
    name: string;
    relation: string;
    nik: string;
    gender: string;
    place_of_birth: string;
    date_of_birth: string;
    occupation: string;
    phone: string;
    is_emergency_contact: boolean;
    is_dependent: boolean;
}

const initialFormData: FormData = {
    name: '',
    relation: '',
    nik: '',
    gender: '',
    place_of_birth: '',
    date_of_birth: '',
    occupation: '',
    phone: '',
    is_emergency_contact: false,
    is_dependent: false,
};

export function FamilyTab({ employee }: Props) {
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

    const handleEdit = (family: EmployeeFamily) => {
        setEditingId(family.id);
        setFormData({
            name: family.name,
            relation: family.relation,
            nik: family.nik || '',
            gender: family.gender || '',
            place_of_birth: family.place_of_birth || '',
            date_of_birth: family.date_of_birth || '',
            occupation: family.occupation || '',
            phone: family.phone || '',
            is_emergency_contact: family.is_emergency_contact,
            is_dependent: family.is_dependent,
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
            ? `/hr/employees/${employee.id}/families/${editingId}`
            : `/hr/employees/${employee.id}/families`;
        
        const method = editingId ? 'put' : 'post';
        
        router[method](url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setFormData(initialFormData);
                setEditingId(null);
            },
            onError: () => toast.error('Gagal menyimpan data keluarga'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingId) return;
        setProcessing(true);
        router.delete(`/hr/employees/${employee.id}/families/${deletingId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
            },
            onError: () => toast.error('Gagal menghapus data keluarga'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between p-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Anggota Keluarga
                        </CardTitle>
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {employee.families.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Belum ada data keluarga</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Hubungan</TableHead>
                                    <TableHead>Jenis Kelamin</TableHead>
                                    <TableHead>Tgl Lahir</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employee.families.map((family, index) => (
                                    <TableRow key={family.id}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell className="font-medium">{family.name}</TableCell>
                                        <TableCell>{relationLabels[family.relation] || family.relation}</TableCell>
                                        <TableCell>
                                            {family.gender === 'male' ? 'Laki-laki' : family.gender === 'female' ? 'Perempuan' : '-'}
                                        </TableCell>
                                        <TableCell>{formatDate(family.date_of_birth)}</TableCell>
                                        <TableCell>{family.phone || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {family.is_emergency_contact && (
                                                    <Badge variant="secondary" className="text-xs">Darurat</Badge>
                                                )}
                                                {family.is_dependent && (
                                                    <Badge variant="outline" className="text-xs">Tanggungan</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(family)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(family.id)}>
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
                            <Users className="h-5 w-5" />
                            {editingId ? 'Edit' : 'Tambah'} Anggota Keluarga
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan data anggota keluarga karyawan
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nama lengkap"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Hubungan *</Label>
                                <SearchableSelect
                                    options={relationOptions}
                                    value={formData.relation}
                                    onValueChange={(value) => setFormData({ ...formData, relation: value })}
                                    placeholder="Pilih hubungan"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>NIK</Label>
                                <Input
                                    value={formData.nik}
                                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                    placeholder="Nomor KTP"
                                    maxLength={16}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis Kelamin</Label>
                                <SearchableSelect
                                    options={genderOptions}
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                    placeholder="Pilih"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tempat Lahir</Label>
                                <Input
                                    value={formData.place_of_birth}
                                    onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                                    placeholder="Kota"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Lahir</Label>
                                <Input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pekerjaan</Label>
                                <Input
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                    placeholder="Pekerjaan"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>No. Telepon</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="08xxx"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_emergency_contact}
                                    onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm">Kontak Darurat</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_dependent}
                                    onChange={(e) => setFormData({ ...formData, is_dependent: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm">Tanggungan</span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={processing || !formData.name || !formData.relation}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Anggota Keluarga</DialogTitle>
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
