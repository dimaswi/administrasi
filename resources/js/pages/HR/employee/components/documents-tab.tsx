import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Edit, FileText, CreditCard, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { Employee } from './types';

interface Props {
    employee: Employee;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex justify-between py-3 border-b last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value || '-'}</span>
        </div>
    );
}

interface DocumentFormData {
    [key: string]: string;
    section: string;
    npwp_number: string;
    bpjs_kesehatan_number: string;
    bpjs_ketenagakerjaan_number: string;
}

interface BankFormData {
    [key: string]: string;
    section: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
}

interface NotesFormData {
    [key: string]: string;
    section: string;
    notes: string;
}

export function DocumentsTab({ employee }: Props) {
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
    const [bankDialogOpen, setBankDialogOpen] = useState(false);
    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [documentForm, setDocumentForm] = useState<DocumentFormData>({
        section: 'documents',
        npwp_number: employee.npwp_number || '',
        bpjs_kesehatan_number: employee.bpjs_kesehatan_number || '',
        bpjs_ketenagakerjaan_number: employee.bpjs_ketenagakerjaan_number || '',
    });

    const [bankForm, setBankForm] = useState<BankFormData>({
        section: 'bank',
        bank_name: employee.bank_name || '',
        bank_account_number: employee.bank_account_number || '',
        bank_account_name: employee.bank_account_name || '',
    });

    const [notesForm, setNotesForm] = useState<NotesFormData>({
        section: 'notes',
        notes: employee.notes || '',
    });

    const handleDocumentSubmit = () => {
        setProcessing(true);
        router.patch(`/hr/employees/${employee.id}/partial`, documentForm, {
            preserveScroll: true,
            onSuccess: () => {
                setDocumentDialogOpen(false);
            },
            onError: () => toast.error('Gagal memperbarui dokumen'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleBankSubmit = () => {
        setProcessing(true);
        router.patch(`/hr/employees/${employee.id}/partial`, bankForm, {
            preserveScroll: true,
            onSuccess: () => {
                setBankDialogOpen(false);
            },
            onError: () => toast.error('Gagal memperbarui informasi bank'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleNotesSubmit = () => {
        setProcessing(true);
        router.patch(`/hr/employees/${employee.id}/partial`, notesForm, {
            preserveScroll: true,
            onSuccess: () => {
                setNotesDialogOpen(false);
            },
            onError: () => toast.error('Gagal memperbarui catatan'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between p-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Nomor Dokumen
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setDocumentDialogOpen(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="NPWP" value={employee.npwp_number} />
                        <InfoRow label="BPJS Kesehatan" value={employee.bpjs_kesehatan_number} />
                        <InfoRow label="BPJS Ketenagakerjaan" value={employee.bpjs_ketenagakerjaan_number} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between p-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Informasi Bank
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setBankDialogOpen(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Nama Bank" value={employee.bank_name} />
                        <InfoRow label="No. Rekening" value={employee.bank_account_number} />
                        <InfoRow label="Nama Pemilik" value={employee.bank_account_name} />
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between p-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <StickyNote className="h-4 w-4" />
                                Catatan
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setNotesDialogOpen(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {employee.notes ? (
                            <p className="text-sm whitespace-pre-wrap">{employee.notes}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Belum ada catatan</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Document Dialog */}
            <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Edit Nomor Dokumen
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui informasi dokumen karyawan seperti NPWP dan BPJS
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="npwp">Nomor NPWP</Label>
                            <Input
                                id="npwp"
                                value={documentForm.npwp_number}
                                onChange={(e) => setDocumentForm({ ...documentForm, npwp_number: e.target.value })}
                                placeholder="XX.XXX.XXX.X-XXX.XXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bpjs_kesehatan">Nomor BPJS Kesehatan</Label>
                            <Input
                                id="bpjs_kesehatan"
                                value={documentForm.bpjs_kesehatan_number}
                                onChange={(e) => setDocumentForm({ ...documentForm, bpjs_kesehatan_number: e.target.value })}
                                placeholder="0001234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bpjs_tk">Nomor BPJS Ketenagakerjaan</Label>
                            <Input
                                id="bpjs_tk"
                                value={documentForm.bpjs_ketenagakerjaan_number}
                                onChange={(e) => setDocumentForm({ ...documentForm, bpjs_ketenagakerjaan_number: e.target.value })}
                                placeholder="0001234567890"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleDocumentSubmit} disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bank Dialog */}
            <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Edit Informasi Bank
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui informasi rekening bank untuk keperluan penggajian
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Nama Bank</Label>
                            <Input
                                id="bank_name"
                                value={bankForm.bank_name}
                                onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                placeholder="BCA, Mandiri, BNI, dll"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bank_account">Nomor Rekening</Label>
                            <Input
                                id="bank_account"
                                value={bankForm.bank_account_number}
                                onChange={(e) => setBankForm({ ...bankForm, bank_account_number: e.target.value })}
                                placeholder="1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account_name">Nama Pemilik Rekening</Label>
                            <Input
                                id="account_name"
                                value={bankForm.bank_account_name}
                                onChange={(e) => setBankForm({ ...bankForm, bank_account_name: e.target.value })}
                                placeholder="Sesuai buku tabungan"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleBankSubmit} disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Notes Dialog */}
            <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <StickyNote className="h-5 w-5" />
                            Edit Catatan
                        </DialogTitle>
                        <DialogDescription>
                            Tambahkan catatan khusus untuk karyawan ini
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={notesForm.notes}
                                onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                                placeholder="Catatan tambahan tentang karyawan..."
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleNotesSubmit} disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
