import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { router } from '@inertiajs/react';
import { Briefcase, Calendar, Edit, UserCog, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Employee, User, formatDate } from './types';

interface Props {
    employee: Employee;
    availableUsers: User[];
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex justify-between border-b py-3 last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value || '-'}</span>
        </div>
    );
}

export function EmploymentTab({ employee, availableUsers }: Props) {
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>(employee.user_id?.toString() || '');

    const userOptions = availableUsers.map((user) => ({
        value: user.id.toString(),
        label: `${user.name}${user.nip ? ` (${user.nip})` : ''}`,
    }));

    const handleAssignUser = () => {
        setProcessing(true);
        router.patch(
            `/hr/employees/${employee.id}/partial`,
            {
                section: 'user',
                user_id: selectedUserId ? parseInt(selectedUserId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setUserDialogOpen(false);
                },
                onError: () => toast.error('Gagal mengubah akun pengguna'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleUnlinkUser = () => {
        setProcessing(true);
        router.patch(
            `/hr/employees/${employee.id}/partial`,
            {
                section: 'user',
                user_id: null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUserId('');
                },
                onError: () => toast.error('Gagal melepas akun pengguna'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="py-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Briefcase className="h-4 w-4" />
                                Data Kepegawaian
                            </CardTitle>
                            <CardDescription>Informasi terkait status kepegawaian karyawan</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="ID Karyawan" value={employee.employee_id} />
                        <InfoRow label="Kategori Pekerjaan" value={employee.job_category?.name} />
                        <InfoRow label="Status Kepegawaian" value={employee.employment_status?.name} />
                        <InfoRow label="Unit Organisasi" value={employee.organization_unit?.name} />
                        <InfoRow label="Jabatan" value={employee.position} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="py-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4" />
                                Masa Kerja
                            </CardTitle>
                            <CardDescription>Informasi terkait tanggal penting kepegawaian</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Tanggal Masuk" value={formatDate(employee.join_date)} />
                        <InfoRow label="Mulai Kontrak" value={formatDate(employee.contract_start_date)} />
                        <InfoRow label="Akhir Kontrak" value={formatDate(employee.contract_end_date)} />
                        {employee.permanent_date && <InfoRow label="Tanggal Tetap" value={formatDate(employee.permanent_date)} />}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserCog className="h-4 w-4" />
                                    Akun Pengguna Sistem
                                </CardTitle>
                                <CardDescription>Informasi terkait akun pengguna sistem yang terhubung dengan karyawan</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setUserDialogOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {employee.user ? 'Ubah' : 'Hubungkan'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {employee.user ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{employee.user.name}</p>
                                    {employee.user.nip && <p className="text-sm text-muted-foreground">NIP: {employee.user.nip}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="default">Terhubung</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleUnlinkUser}
                                        disabled={processing}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <UserX className="mr-1 h-4 w-4" />
                                        Lepas
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Karyawan ini belum memiliki akun pengguna sistem</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assign User Dialog */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5" />
                            Hubungkan Akun Pengguna
                        </DialogTitle>
                        <DialogDescription>Hubungkan karyawan ini dengan akun pengguna sistem untuk memberikan akses login</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label>Pilih Akun Pengguna</Label>
                            <SearchableSelect
                                options={userOptions}
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                                placeholder="Pilih akun pengguna..."
                                emptyText="Tidak ada akun tersedia"
                            />
                            <p className="text-xs text-muted-foreground">Hanya menampilkan akun yang belum terhubung dengan karyawan lain</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleAssignUser} disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
