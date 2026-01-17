import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, Timer, User, XCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    position: string;
    organization_unit: string | null;
}

interface Attendance {
    id: number;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
}

interface ApprovalInfo {
    id: number;
    name: string;
    position?: string;
    approved_at?: string;
}

interface EarlyLeaveRequest {
    id: number;
    employee: Employee;
    date: string;
    date_formatted: string;
    requested_leave_time: string;
    scheduled_leave_time: string;
    early_minutes: number;
    reason: string;
    status: string;
    status_label: string;
    approved_by: string | null;
    approved_at: string | null;
    approval_notes: string | null;
    auto_checkout: boolean;
    attendance: Attendance | null;
    created_at: string;
    delegation_employee?: ApprovalInfo | null;
    delegation_approved_at?: string | null;
    supervisor?: ApprovalInfo | null;
    supervisor_approved_at?: string | null;
    director?: ApprovalInfo | null;
    director_signed_at?: string | null;
    response_letter_number?: string | null;
    can_sign_director?: boolean;
}

interface Props {
    request: EarlyLeaveRequest;
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    pending_delegation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending_supervisor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    pending_hr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    pending_director_sign: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function Show({ request }: Props) {
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showDirectorSignDialog, setShowDirectorSignDialog] = useState(false);
    const [showDirectorRejectDialog, setShowDirectorRejectDialog] = useState(false);
    
    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ notes: '' });
    const directorSignForm = useForm({ notes: '' });
    const directorRejectForm = useForm({ notes: '' });

    const formatMinutes = (minutes: number) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
        }
        return `${minutes} menit`;
    };

    const handleApprove = () => {
        approveForm.post(`/hr/early-leave-requests/${request.id}/approve`, {
            onSuccess: () => setShowApproveDialog(false),
        });
    };

    const handleReject = () => {
        rejectForm.post(`/hr/early-leave-requests/${request.id}/reject`, {
            onSuccess: () => setShowRejectDialog(false),
        });
    };

    const handleDirectorSign = () => {
        directorSignForm.post(`/hr/early-leave-requests/${request.id}/director-sign`, {
            onSuccess: () => setShowDirectorSignDialog(false),
        });
    };

    const handleDirectorReject = () => {
        directorRejectForm.post(`/hr/early-leave-requests/${request.id}/director-reject`, {
            onSuccess: () => setShowDirectorRejectDialog(false),
        });
    };

    // HR Approval Actions
    const hrApprovalActions = (request.status === 'pending' || request.status === 'pending_hr') ? (
        <div className="flex gap-2">
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogTrigger asChild>
                    <Button variant="default" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Setujui
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Izin Pulang Cepat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyetujui pengajuan izin pulang cepat ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Catatan (Opsional)</Label>
                        <Textarea
                            value={approveForm.data.notes}
                            onChange={(e) => approveForm.setData('notes', e.target.value)}
                            placeholder="Tambahkan catatan..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                            Batal
                        </Button>
                        <Button 
                            onClick={handleApprove} 
                            disabled={approveForm.processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Setujui
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                    <Button variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Tolak
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Izin Pulang Cepat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menolak pengajuan izin pulang cepat ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Catatan (Opsional)</Label>
                        <Textarea
                            value={rejectForm.data.notes}
                            onChange={(e) => rejectForm.setData('notes', e.target.value)}
                            placeholder="Tambahkan catatan..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={rejectForm.processing}
                        >
                            Tolak
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    ) : null;

    // Director Sign Actions
    const directorSignActions = request.status === 'pending_director_sign' && request.can_sign_director ? (
        <div className="flex gap-2">
            <Dialog open={showDirectorSignDialog} onOpenChange={setShowDirectorSignDialog}>
                <DialogTrigger asChild>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tanda Tangan
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tanda Tangan Surat Balasan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menandatangani surat balasan izin pulang cepat ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Catatan (Opsional)</Label>
                        <Textarea
                            value={directorSignForm.data.notes}
                            onChange={(e) => directorSignForm.setData('notes', e.target.value)}
                            placeholder="Tambahkan catatan..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDirectorSignDialog(false)}>
                            Batal
                        </Button>
                        <Button 
                            onClick={handleDirectorSign} 
                            disabled={directorSignForm.processing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Tanda Tangan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDirectorRejectDialog} onOpenChange={setShowDirectorRejectDialog}>
                <DialogTrigger asChild>
                    <Button variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Tolak
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Tanda Tangan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menolak untuk menandatangani surat ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Alasan Penolakan</Label>
                        <Textarea
                            value={directorRejectForm.data.notes}
                            onChange={(e) => directorRejectForm.setData('notes', e.target.value)}
                            placeholder="Masukkan alasan penolakan..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDirectorRejectDialog(false)}>
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDirectorReject} 
                            disabled={directorRejectForm.processing}
                        >
                            Tolak
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    ) : null;

    const actions = hrApprovalActions || directorSignActions;

    return (
        <HRLayout>
            <Head title={`Detail Izin Pulang Cepat - ${request.employee.name}`} />

            <DetailPage
                title="Detail Izin Pulang Cepat"
                backUrl="/hr/early-leave-requests"
                actions={actions}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${
                                            request.status === 'approved' ? 'bg-green-100' :
                                            request.status === 'rejected' ? 'bg-red-100' :
                                            'bg-yellow-100'
                                        }`}>
                                            {request.status === 'approved' ? (
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            ) : request.status === 'rejected' ? (
                                                <XCircle className="h-6 w-6 text-red-600" />
                                            ) : (
                                                <Clock className="h-6 w-6 text-yellow-600" />
                                            )}
                                        </div>
                                        <div>
                                            <Badge className={`${statusColors[request.status]} text-sm`}>
                                                {request.status_label}
                                            </Badge>
                                            {request.approved_by && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    oleh {request.approved_by} pada {request.approved_at}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-orange-600">{formatMinutes(request.early_minutes)}</div>
                                        <div className="text-sm text-muted-foreground">lebih cepat</div>
                                    </div>
                                </div>
                                {request.approval_notes && (
                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium">Catatan:</p>
                                        <p className="text-sm text-muted-foreground">{request.approval_notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Employee Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Informasi Karyawan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Nama</Label>
                                        <p className="font-medium">{request.employee.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">NIP</Label>
                                        <p className="font-medium">{request.employee.employee_id}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Jabatan</Label>
                                        <p className="font-medium">{request.employee.position}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Unit Organisasi</Label>
                                        <p className="font-medium">{request.employee.organization_unit || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Request Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Timer className="h-4 w-4" />
                                    Detail Pengajuan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Tanggal</Label>
                                        <p className="font-medium">{request.date_formatted}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Jam Pulang Terjadwal</Label>
                                        <p className="font-medium">{request.scheduled_leave_time}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Jam Pulang Diminta</Label>
                                        <p className="font-medium text-orange-600">{request.requested_leave_time}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Selisih Waktu</Label>
                                        <p className="font-medium">{formatMinutes(request.early_minutes)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">Alasan</Label>
                                        <p className="font-medium">{request.reason}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Diajukan Pada</Label>
                                        <p className="font-medium">{request.created_at}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Auto Checkout</Label>
                                        <p className="font-medium">{request.auto_checkout ? 'Ya' : 'Tidak'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendance Info */}
                        {request.attendance && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Informasi Kehadiran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-muted-foreground">Clock In</Label>
                                            <p className="font-medium">{request.attendance.clock_in || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Clock Out</Label>
                                            <p className="font-medium">{request.attendance.clock_out || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Status</Label>
                                            <p className="font-medium">{request.attendance.status}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Ringkasan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge className={statusColors[request.status]}>
                                        {request.status_label}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tanggal</span>
                                    <span className="font-medium">{request.date_formatted}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Lebih Cepat</span>
                                    <span className="font-medium text-orange-600">{formatMinutes(request.early_minutes)}</span>
                                </div>
                                {request.response_letter_number && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">No. Surat</span>
                                        <span className="font-medium">{request.response_letter_number}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Approval Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Alur Persetujuan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Step 1: Pengajuan */}
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                        </div>
                                        <div className="pb-4">
                                            <p className="font-medium text-sm">Pengajuan</p>
                                            <p className="text-xs text-muted-foreground">{request.employee.name}</p>
                                            <p className="text-xs text-muted-foreground">{request.created_at}</p>
                                        </div>
                                    </div>

                                    {/* Step 2: Delegasi */}
                                    {request.delegation_employee && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    request.delegation_approved_at 
                                                        ? 'bg-green-100' 
                                                        : request.status === 'pending_delegation'
                                                            ? 'bg-yellow-100'
                                                            : 'bg-gray-100'
                                                }`}>
                                                    {request.delegation_approved_at ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : request.status === 'pending_delegation' ? (
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                            </div>
                                            <div className="pb-4">
                                                <p className="font-medium text-sm">Persetujuan Delegasi</p>
                                                <p className="text-xs text-muted-foreground">{request.delegation_employee.name}</p>
                                                {request.delegation_approved_at && (
                                                    <p className="text-xs text-muted-foreground">{request.delegation_approved_at}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Atasan */}
                                    {request.supervisor && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    request.supervisor_approved_at 
                                                        ? 'bg-green-100' 
                                                        : request.status === 'pending_supervisor'
                                                            ? 'bg-yellow-100'
                                                            : 'bg-gray-100'
                                                }`}>
                                                    {request.supervisor_approved_at ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : request.status === 'pending_supervisor' ? (
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                            </div>
                                            <div className="pb-4">
                                                <p className="font-medium text-sm">Persetujuan Atasan</p>
                                                <p className="text-xs text-muted-foreground">{request.supervisor.name}</p>
                                                {request.supervisor_approved_at && (
                                                    <p className="text-xs text-muted-foreground">{request.supervisor_approved_at}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4: HR */}
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                request.approved_at && request.status !== 'rejected'
                                                    ? 'bg-green-100' 
                                                    : request.status === 'pending_hr' || request.status === 'pending'
                                                        ? 'bg-yellow-100'
                                                        : request.status === 'rejected'
                                                            ? 'bg-red-100'
                                                            : 'bg-gray-100'
                                            }`}>
                                                {request.approved_at && request.status !== 'rejected' ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : request.status === 'pending_hr' || request.status === 'pending' ? (
                                                    <Clock className="h-4 w-4 text-yellow-600" />
                                                ) : request.status === 'rejected' ? (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                ) : (
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                        </div>
                                        <div className="pb-4">
                                            <p className="font-medium text-sm">Persetujuan HR</p>
                                            {request.approved_by && (
                                                <p className="text-xs text-muted-foreground">{request.approved_by}</p>
                                            )}
                                            {request.approved_at && (
                                                <p className="text-xs text-muted-foreground">{request.approved_at}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 5: Tanda Tangan Direktur */}
                                    {request.director && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    request.director_signed_at 
                                                        ? 'bg-green-100' 
                                                        : request.status === 'pending_director_sign'
                                                            ? 'bg-yellow-100'
                                                            : 'bg-gray-100'
                                                }`}>
                                                    {request.director_signed_at ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : request.status === 'pending_director_sign' ? (
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Tanda Tangan Direktur</p>
                                                <p className="text-xs text-muted-foreground">{request.director.name}</p>
                                                {request.director_signed_at && (
                                                    <p className="text-xs text-muted-foreground">{request.director_signed_at}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
