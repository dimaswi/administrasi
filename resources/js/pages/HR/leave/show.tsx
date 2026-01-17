import { Head, Link, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Dialog,
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { 
    CalendarDays, 
    User, 
    FileText, 
    CheckCircle, 
    XCircle, 
    Clock,
    Edit,
    Ban,
    AlertCircle,
<<<<<<< HEAD
    PenLine,
    Users,
    Building,
    UserCheck,
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
} from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface LeaveType {
    id: number;
    name: string;
    color: string;
}

<<<<<<< HEAD
interface ApprovalInfo {
    name: string | null;
    approved_at: string | null;
    notes: string | null;
}

=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
interface LeaveData {
    id: number;
    employee: Employee;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    date_range: string;
    total_days: number;
    is_half_day: boolean;
    half_day_type: string | null;
    half_day_label: string | null;
    status: string;
    status_label: string;
    reason: string;
    emergency_contact: string | null;
    emergency_phone: string | null;
    delegation_to: string | null;
<<<<<<< HEAD
    delegation_employee: ApprovalInfo | null;
    supervisor: ApprovalInfo | null;
    director: ApprovalInfo | null;
    response_letter_number: string | null;
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    attachment: string | null;
    approved_by: string | null;
    approved_at: string | null;
    approval_notes: string | null;
    created_by: string | null;
    created_at: string;
    submitted_at: string | null;
    can_approve: boolean;
<<<<<<< HEAD
    can_sign_director: boolean;
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    can_cancel: boolean;
    can_edit: boolean;
}

interface Balance {
    id: number;
    leave_type_id: number;
    year: number;
    initial_balance: number;
    carry_over: number;
    adjustment: number;
    used: number;
    pending: number;
    leaveType: {
        id: number;
        name: string;
        color: string;
    };
}

interface Props {
    leave: LeaveData;
    balances: Balance[];
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
<<<<<<< HEAD
    pending_delegation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending_supervisor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    pending_hr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    pending_director_sign: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const leaveTypeColors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
    gray: 'bg-gray-500',
};

export default function Show({ leave, balances }: Props) {
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
<<<<<<< HEAD
    const [showSignDialog, setShowSignDialog] = useState(false);
    const [showSignRejectDialog, setShowSignRejectDialog] = useState(false);
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    
    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ notes: '' });
    const cancelForm = useForm({ reason: '' });
<<<<<<< HEAD
    const signForm = useForm({ notes: '' });
    const signRejectForm = useForm({ notes: '' });
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Cuti & Izin', href: '/hr/leaves' },
        { title: 'Detail Pengajuan', href: '#' },
    ];

    const handleApprove = () => {
        approveForm.post(`/hr/leaves/${leave.id}/approve`, {
            onSuccess: () => setShowApproveDialog(false),
        });
    };

    const handleReject = () => {
        rejectForm.post(`/hr/leaves/${leave.id}/reject`, {
            onSuccess: () => setShowRejectDialog(false),
        });
    };

    const handleCancel = () => {
        cancelForm.post(`/hr/leaves/${leave.id}/cancel`, {
            onSuccess: () => setShowCancelDialog(false),
        });
    };

<<<<<<< HEAD
    const handleDirectorSign = () => {
        signForm.post(`/hr/leaves/${leave.id}/director-sign`, {
            onSuccess: () => setShowSignDialog(false),
        });
    };

    const handleDirectorReject = () => {
        signRejectForm.post(`/hr/leaves/${leave.id}/director-reject`, {
            onSuccess: () => setShowSignRejectDialog(false),
        });
    };

    // Determine status icon color for new statuses
    const getStatusIconBg = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100';
            case 'rejected': return 'bg-red-100';
            case 'pending': 
            case 'pending_delegation':
            case 'pending_supervisor':
            case 'pending_hr':
            case 'pending_director_sign':
                return 'bg-yellow-100';
            default: return 'bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="h-6 w-6 text-green-600" />;
            case 'rejected': return <XCircle className="h-6 w-6 text-red-600" />;
            case 'pending':
            case 'pending_delegation':
            case 'pending_supervisor':
            case 'pending_hr':
            case 'pending_director_sign':
                return <Clock className="h-6 w-6 text-yellow-600" />;
            default: return <AlertCircle className="h-6 w-6 text-gray-600" />;
        }
    };

=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    const actions = (
        <div className="flex gap-2">
            {leave.can_edit && (
                <Button variant="outline" asChild>
                    <Link href={`/hr/leaves/${leave.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Link>
                </Button>
            )}
            {leave.can_approve && (
                <>
                    <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Setujui
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Setujui Pengajuan Cuti</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menyetujui pengajuan cuti ini?
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
                                <DialogTitle>Tolak Pengajuan Cuti</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menolak pengajuan cuti ini?
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label>Alasan Penolakan *</Label>
                                <Textarea
                                    value={rejectForm.data.notes}
                                    onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                    placeholder="Jelaskan alasan penolakan..."
                                    required
                                />
                                {rejectForm.errors.notes && (
                                    <p className="text-sm text-red-500">{rejectForm.errors.notes}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                    Batal
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleReject} 
                                    disabled={rejectForm.processing || !rejectForm.data.notes}
                                >
                                    Tolak
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
            {leave.can_cancel && (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="text-red-600 hover:text-red-700">
                            <Ban className="h-4 w-4 mr-2" />
                            Batalkan
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Batalkan Pengajuan</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin membatalkan pengajuan cuti ini?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label>Alasan Pembatalan (Opsional)</Label>
                            <Textarea
                                value={cancelForm.data.reason}
                                onChange={(e) => cancelForm.setData('reason', e.target.value)}
                                placeholder="Jelaskan alasan pembatalan..."
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                Kembali
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleCancel} 
                                disabled={cancelForm.processing}
                            >
                                Batalkan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
<<<<<<< HEAD
            {leave.can_sign_director && (
                <>
                    <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                <PenLine className="h-4 w-4 mr-2" />
                                Tanda Tangani
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tanda Tangani Surat Cuti</DialogTitle>
                                <DialogDescription>
                                    Anda akan menandatangani surat balasan cuti ini. Setelah ditandatangani, cuti akan disetujui.
                                </DialogDescription>
                            </DialogHeader>
                            {leave.response_letter_number && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <Label className="text-muted-foreground text-xs">Nomor Surat</Label>
                                    <p className="font-medium">{leave.response_letter_number}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Catatan (Opsional)</Label>
                                <Textarea
                                    value={signForm.data.notes}
                                    onChange={(e) => signForm.setData('notes', e.target.value)}
                                    placeholder="Tambahkan catatan..."
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                                    Batal
                                </Button>
                                <Button 
                                    onClick={handleDirectorSign} 
                                    disabled={signForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <PenLine className="h-4 w-4 mr-2" />
                                    Tanda Tangani
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showSignRejectDialog} onOpenChange={setShowSignRejectDialog}>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Tolak
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tolak Pengajuan Cuti</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menolak pengajuan cuti ini?
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label>Alasan Penolakan *</Label>
                                <Textarea
                                    value={signRejectForm.data.notes}
                                    onChange={(e) => signRejectForm.setData('notes', e.target.value)}
                                    placeholder="Jelaskan alasan penolakan..."
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSignRejectDialog(false)}>
                                    Batal
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDirectorReject} 
                                    disabled={signRejectForm.processing || !signRejectForm.data.notes}
                                >
                                    Tolak
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
        </div>
    );

    return (
        <HRLayout>
            <Head title="Detail Pengajuan Cuti" />

            <DetailPage
                title="Detail Pengajuan Cuti"
                backUrl="/hr/leaves"
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
<<<<<<< HEAD
                                        <div className={`p-3 rounded-full ${getStatusIconBg(leave.status)}`}>
                                            {getStatusIcon(leave.status)}
=======
                                        <div className={`p-3 rounded-full ${
                                            leave.status === 'approved' ? 'bg-green-100' :
                                            leave.status === 'rejected' ? 'bg-red-100' :
                                            leave.status === 'pending' ? 'bg-yellow-100' :
                                            'bg-gray-100'
                                        }`}>
                                            {leave.status === 'approved' ? (
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            ) : leave.status === 'rejected' ? (
                                                <XCircle className="h-6 w-6 text-red-600" />
                                            ) : leave.status === 'pending' ? (
                                                <Clock className="h-6 w-6 text-yellow-600" />
                                            ) : (
                                                <AlertCircle className="h-6 w-6 text-gray-600" />
                                            )}
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                        </div>
                                        <div>
                                            <Badge className={`${statusColors[leave.status]} text-sm`}>
                                                {leave.status_label}
                                            </Badge>
                                            {leave.approved_by && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    oleh {leave.approved_by} pada {leave.approved_at}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold">{leave.total_days}</div>
                                        <div className="text-sm text-muted-foreground">hari</div>
                                    </div>
                                </div>
                                {leave.approval_notes && (
                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium">Catatan:</p>
                                        <p className="text-sm text-muted-foreground">{leave.approval_notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

<<<<<<< HEAD
                        {/* Approval Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Alur Persetujuan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                    
                                    <div className="space-y-4">
                                        {/* Step 1: Pengajuan */}
                                        <div className="flex items-start gap-4 relative">
                                            <div className="z-10 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="font-medium text-sm">Pengajuan Disubmit</p>
                                                <p className="text-xs text-muted-foreground">{leave.submitted_at || leave.created_at}</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Delegasi */}
                                        <div className="flex items-start gap-4 relative">
                                            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                                leave.delegation_employee?.approved_at ? 'bg-green-500' :
                                                leave.status === 'pending_delegation' ? 'bg-yellow-500' :
                                                leave.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                                            }`}>
                                                <UserCheck className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="font-medium text-sm">Konfirmasi Delegasi</p>
                                                {leave.delegation_employee?.name ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {leave.delegation_employee.name}
                                                        {leave.delegation_employee.approved_at && ` • ${leave.delegation_employee.approved_at}`}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">{leave.delegation_to || 'Belum ditentukan'}</p>
                                                )}
                                                {leave.delegation_employee?.notes && (
                                                    <p className="text-xs text-muted-foreground italic mt-1">"{leave.delegation_employee.notes}"</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 3: Supervisor */}
                                        <div className="flex items-start gap-4 relative">
                                            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                                leave.supervisor?.approved_at ? 'bg-green-500' :
                                                leave.status === 'pending_supervisor' ? 'bg-yellow-500' :
                                                ['pending_hr', 'pending_director_sign', 'approved'].includes(leave.status) ? 'bg-green-500' :
                                                leave.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                                            }`}>
                                                <Building className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="font-medium text-sm">Persetujuan Atasan</p>
                                                {leave.supervisor?.name ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {leave.supervisor.name}
                                                        {leave.supervisor.approved_at && ` • ${leave.supervisor.approved_at}`}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Kepala Unit</p>
                                                )}
                                                {leave.supervisor?.notes && (
                                                    <p className="text-xs text-muted-foreground italic mt-1">"{leave.supervisor.notes}"</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 4: HR */}
                                        <div className="flex items-start gap-4 relative">
                                            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                                ['pending_director_sign', 'approved'].includes(leave.status) ? 'bg-green-500' :
                                                leave.status === 'pending_hr' ? 'bg-yellow-500' :
                                                leave.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                                            }`}>
                                                <FileText className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="font-medium text-sm">Proses Admin HR</p>
                                                <p className="text-xs text-muted-foreground">Membuat surat balasan</p>
                                                {leave.response_letter_number && (
                                                    <p className="text-xs font-medium text-primary mt-1">No: {leave.response_letter_number}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 5: Director Sign */}
                                        <div className="flex items-start gap-4 relative">
                                            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                                leave.status === 'approved' ? 'bg-green-500' :
                                                leave.status === 'pending_director_sign' ? 'bg-yellow-500' :
                                                leave.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                                            }`}>
                                                <PenLine className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="font-medium text-sm">Tanda Tangan Direktur</p>
                                                {leave.director?.name ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {leave.director.name}
                                                        {leave.director.approved_at && ` • ${leave.director.approved_at}`}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Direktur</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
                                        <p className="font-medium">{leave.employee.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">NIP</Label>
                                        <p className="font-medium">{leave.employee.employee_id}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Unit Organisasi</Label>
                                        <p className="font-medium">{leave.employee.organization_unit || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Leave Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Detail Cuti
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Jenis Cuti</Label>
                                        <div className="flex items-center gap-2 mt-1">
<<<<<<< HEAD
                                            <div className={`w-3 h-3 rounded-full ${leaveTypeColors[leave.leave_type?.color ?? 'gray'] ?? 'bg-gray-500'}`}></div>
                                            <span className="font-medium">{leave.leave_type?.name ?? 'Unknown'}</span>
=======
                                            <div className={`w-3 h-3 rounded-full ${leaveTypeColors[leave.leave_type.color]}`}></div>
                                            <span className="font-medium">{leave.leave_type.name}</span>
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Periode</Label>
                                        <p className="font-medium">{leave.date_range}</p>
                                        {leave.is_half_day && (
                                            <p className="text-sm text-muted-foreground">({leave.half_day_label})</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">Alasan</Label>
                                        <p className="font-medium">{leave.reason}</p>
                                    </div>
                                    {leave.delegation_to && (
                                        <div className="col-span-2">
                                            <Label className="text-muted-foreground">Delegasi Pekerjaan</Label>
                                            <p className="font-medium">{leave.delegation_to}</p>
                                        </div>
                                    )}
                                    {(leave.emergency_contact || leave.emergency_phone) && (
                                        <div className="col-span-2">
                                            <Label className="text-muted-foreground">Kontak Darurat</Label>
                                            <p className="font-medium">
                                                {leave.emergency_contact}
                                                {leave.emergency_phone && ` (${leave.emergency_phone})`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Informasi Pengajuan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground">Dibuat Oleh</Label>
                                        <p>{leave.created_by || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Tanggal Dibuat</Label>
                                        <p>{leave.created_at}</p>
                                    </div>
                                    {leave.submitted_at && (
                                        <div>
                                            <Label className="text-muted-foreground">Tanggal Diajukan</Label>
                                            <p>{leave.submitted_at}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Leave Balance */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Saldo Cuti Karyawan</CardTitle>
                                <CardDescription>Tahun {new Date(leave.start_date).getFullYear()}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {balances.map((balance) => {
                                    const total = Number(balance.initial_balance) + Number(balance.carry_over) + Number(balance.adjustment);
                                    const available = total - Number(balance.used) - Number(balance.pending);
<<<<<<< HEAD
                                    const leaveTypeName = balance.leaveType?.name ?? 'Unknown';
                                    const leaveTypeColor = balance.leaveType?.color ?? 'gray';
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                    
                                    return (
                                        <div 
                                            key={balance.id}
                                            className={`p-3 rounded-lg ${
<<<<<<< HEAD
                                                balance.leave_type_id === leave.leave_type?.id
=======
                                                balance.leave_type_id === leave.leave_type.id
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                                    ? 'border-2 border-primary bg-primary/5'
                                                    : 'bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
<<<<<<< HEAD
                                                    <div className={`w-3 h-3 rounded-full ${leaveTypeColors[leaveTypeColor] ?? 'bg-gray-500'}`}></div>
                                                    <span className="font-medium text-sm">{leaveTypeName}</span>
=======
                                                    <div className={`w-3 h-3 rounded-full ${leaveTypeColors[balance.leaveType.color]}`}></div>
                                                    <span className="font-medium text-sm">{balance.leaveType.name}</span>
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                                </div>
                                                <Badge variant="outline">{available} hari</Badge>
                                            </div>
                                            <div className="flex gap-3 text-xs text-muted-foreground">
                                                <span>Total: {total}</span>
                                                <span>Terpakai: {balance.used}</span>
                                                <span>Pending: {balance.pending}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DetailPage>
        </HRLayout>
    );
}
