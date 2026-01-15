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
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Employee, EmployeeEducation, EducationLevel } from './types';

interface Props {
    employee: Employee;
    educationLevels: EducationLevel[];
}

interface FormData {
    [key: string]: string | boolean;
    education_level_id: string;
    institution: string;
    major: string;
    start_year: string;
    end_year: string;
    gpa: string;
    certificate_number: string;
    is_highest: boolean;
}

const initialFormData: FormData = {
    education_level_id: '',
    institution: '',
    major: '',
    start_year: '',
    end_year: '',
    gpa: '',
    certificate_number: '',
    is_highest: false,
};

export function EducationTab({ employee, educationLevels }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [processing, setProcessing] = useState(false);

    const educationLevelOptions = educationLevels.map((level) => ({
        value: level.id.toString(),
        label: level.name,
    }));

    const handleAdd = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setDialogOpen(true);
    };

    const handleEdit = (edu: EmployeeEducation) => {
        setEditingId(edu.id);
        setFormData({
            education_level_id: edu.education_level?.id.toString() || '',
            institution: edu.institution,
            major: edu.major || '',
            start_year: edu.start_year?.toString() || '',
            end_year: edu.end_year?.toString() || '',
            gpa: edu.gpa?.toString() || '',
            certificate_number: edu.certificate_number || '',
            is_highest: edu.is_highest,
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
            ? `/hr/employees/${employee.id}/educations/${editingId}`
            : `/hr/employees/${employee.id}/educations`;
        
        const method = editingId ? 'put' : 'post';
        
        router[method](url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setFormData(initialFormData);
                setEditingId(null);
            },
            onError: () => toast.error('Gagal menyimpan data pendidikan'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingId) return;
        setProcessing(true);
        router.delete(`/hr/employees/${employee.id}/educations/${deletingId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
            },
            onError: () => toast.error('Gagal menghapus data pendidikan'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between p-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Riwayat Pendidikan
                        </CardTitle>
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {employee.educations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Belum ada data pendidikan</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Jenjang</TableHead>
                                    <TableHead>Institusi</TableHead>
                                    <TableHead>Jurusan</TableHead>
                                    <TableHead>Tahun</TableHead>
                                    <TableHead>IPK</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employee.educations.map((edu, index) => (
                                    <TableRow key={edu.id}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell className="font-medium">
                                            {edu.education_level?.name || '-'}
                                        </TableCell>
                                        <TableCell>{edu.institution}</TableCell>
                                        <TableCell>{edu.major || '-'}</TableCell>
                                        <TableCell>
                                            {edu.start_year && edu.end_year 
                                                ? `${edu.start_year} - ${edu.end_year}`
                                                : edu.end_year || '-'}
                                        </TableCell>
                                        <TableCell>{edu.gpa || '-'}</TableCell>
                                        <TableCell>
                                            {edu.is_highest && (
                                                <Badge className="text-xs">Tertinggi</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(edu)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(edu.id)}>
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
                            <GraduationCap className="h-5 w-5" />
                            {editingId ? 'Edit' : 'Tambah'} Riwayat Pendidikan
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan data pendidikan karyawan
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Jenjang Pendidikan *</Label>
                                <SearchableSelect
                                    options={educationLevelOptions}
                                    value={formData.education_level_id}
                                    onValueChange={(value) => setFormData({ ...formData, education_level_id: value })}
                                    placeholder="Pilih jenjang"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Institusi *</Label>
                                <Input
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    placeholder="Nama sekolah/universitas"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Jurusan</Label>
                            <Input
                                value={formData.major}
                                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                placeholder="Jurusan/Program studi"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Tahun Masuk</Label>
                                <Input
                                    type="number"
                                    value={formData.start_year}
                                    onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
                                    placeholder="2015"
                                    min={1950}
                                    max={new Date().getFullYear()}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tahun Lulus</Label>
                                <Input
                                    type="number"
                                    value={formData.end_year}
                                    onChange={(e) => setFormData({ ...formData, end_year: e.target.value })}
                                    placeholder="2019"
                                    min={1950}
                                    max={new Date().getFullYear() + 5}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>IPK</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.gpa}
                                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                                    placeholder="3.50"
                                    min={0}
                                    max={4}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>No. Ijazah</Label>
                            <Input
                                value={formData.certificate_number}
                                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                                placeholder="Nomor ijazah"
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_highest}
                                onChange={(e) => setFormData({ ...formData, is_highest: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Pendidikan Tertinggi</span>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={processing || !formData.education_level_id || !formData.institution}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Riwayat Pendidikan</DialogTitle>
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
