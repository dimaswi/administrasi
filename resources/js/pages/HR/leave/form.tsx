import { Head, useForm, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, FileText, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface LeaveType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    default_quota: number;
    is_paid: boolean;
    requires_approval: boolean;
    min_advance_days: number;
    max_consecutive_days: number | null;
    color: string;
}

interface EmployeeOption {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string | null;
}

interface Balance {
    leave_type_id: number;
    leave_type_name: string;
    total_balance: number;
    used: number;
    pending: number;
    available: number;
}

interface LeaveData {
    id: number;
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    is_half_day: boolean;
    half_day_type: string | null;
    reason: string;
    emergency_contact: string | null;
    emergency_phone: string | null;
    delegation_to: string | null;
}

interface Props {
    leave: LeaveData | null;
    employee: Employee | null;
    balances: Balance[];
    employees: EmployeeOption[];
    leaveTypes: LeaveType[];
    halfDayTypes: Record<string, string>;
}

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

export default function Form({ leave, employee, balances, employees, leaveTypes, halfDayTypes }: Props) {
    const isEdit = !!leave;
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(employee);
    const [employeeBalances, setEmployeeBalances] = useState<Balance[]>(balances);
    
    const { data, setData, post, put, processing, errors, transform } = useForm({
        employee_id: leave?.employee_id?.toString() || employee?.id?.toString() || '',
        leave_type_id: leave?.leave_type_id || '',
        start_date: leave?.start_date || '',
        end_date: leave?.end_date || '',
        is_half_day: leave?.is_half_day || false,
        half_day_type: leave?.half_day_type || '',
        reason: leave?.reason || '',
        emergency_contact: leave?.emergency_contact || '',
        emergency_phone: leave?.emergency_phone || '',
        delegation_to: leave?.delegation_to || '',
    });

    const employeeOptions: SearchableSelectOption[] = employees.map(emp => ({
        value: emp.id.toString(),
        label: `${emp.first_name} ${emp.last_name || ''}`,
        description: emp.employee_id,
    }));

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Cuti & Izin', href: '/hr/leaves' },
        { title: isEdit ? 'Edit Pengajuan' : 'Ajukan Cuti Baru', href: '#' },
    ];

    // Fetch employee balances when employee changes
    useEffect(() => {
        if (data.employee_id && !isEdit) {
            router.get('/hr/leaves/create', { employee_id: data.employee_id }, {
                preserveState: true,
                preserveScroll: true,
                only: ['employee', 'balances'],
                onSuccess: (page: any) => {
                    setSelectedEmployee(page.props.employee);
                    setEmployeeBalances(page.props.balances);
                }
            });
        }
    }, [data.employee_id]);

    const selectedLeaveType = leaveTypes.find(t => t.id === Number(data.leave_type_id));
    const selectedBalance = employeeBalances.find(b => b.leave_type_id === Number(data.leave_type_id));

    // Calculate days
    const calculateDays = () => {
        if (!data.start_date || !data.end_date) return 0;
        
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        let days = 0;
        
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
                days++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return data.is_half_day && days > 0 ? 0.5 : days;
    };

    const totalDays = calculateDays();

    const handleSubmit = (shouldSubmit: boolean = false) => {
        transform((formData) => ({
            ...formData,
            submit: shouldSubmit,
        }));
        
        if (isEdit) {
            put(`/hr/leaves/${leave.id}`);
        } else {
            post('/hr/leaves');
        }
    };

    return (
        <HRLayout>
            <Head title={isEdit ? 'Edit Pengajuan Cuti' : 'Ajukan Cuti Baru'} />

            <FormPage
                title={isEdit ? 'Edit Pengajuan Cuti' : 'Ajukan Cuti Baru'}
                description="Lengkapi informasi pengajuan cuti karyawan"
                backUrl="/hr/leaves"
                onSubmit={(e: React.FormEvent) => {
                    e.preventDefault();
                    handleSubmit(false);
                }}
                isLoading={processing}
                submitLabel={isEdit ? 'Simpan Draft' : 'Simpan Draft'}
                actions={
                    <button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Simpan & Ajukan
                    </button>
                }
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Employee Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Data Karyawan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">Karyawan *</Label>
                                    <SearchableSelect
                                        options={employeeOptions}
                                        value={data.employee_id}
                                        onValueChange={(val) => setData('employee_id', val)}
                                        placeholder="Cari dan pilih karyawan..."
                                        searchPlaceholder="Ketik nama atau NIP..."
                                        emptyText="Karyawan tidak ditemukan"
                                        disabled={isEdit}
                                    />
                                    {errors.employee_id && (
                                        <p className="text-sm text-red-500">{errors.employee_id}</p>
                                    )}
                                </div>
                                
                                {selectedEmployee && (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="font-medium">{selectedEmployee.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {selectedEmployee.employee_id}
                                            {selectedEmployee.organization_unit && ` • ${selectedEmployee.organization_unit}`}
                                        </div>
                                    </div>
                                )}
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
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leave_type_id">Jenis Cuti *</Label>
                                    <Select
                                        value={String(data.leave_type_id)}
                                        onValueChange={(val) => setData('leave_type_id', Number(val))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis cuti" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaveTypes.map((type) => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${leaveTypeColors[type.color]}`}></div>
                                                        {type.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.leave_type_id && (
                                        <p className="text-sm text-red-500">{errors.leave_type_id}</p>
                                    )}
                                </div>

                                {selectedLeaveType && (
                                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${leaveTypeColors[selectedLeaveType.color]}`}></div>
                                            <span className="font-medium">{selectedLeaveType.name}</span>
                                            {selectedLeaveType.is_paid ? (
                                                <Badge variant="outline" className="text-green-600">Berbayar</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-red-600">Tidak Berbayar</Badge>
                                            )}
                                        </div>
                                        {selectedLeaveType.description && (
                                            <p className="text-sm text-muted-foreground">{selectedLeaveType.description}</p>
                                        )}
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            {selectedLeaveType.min_advance_days > 0 && (
                                                <span>Min. {selectedLeaveType.min_advance_days} hari sebelumnya</span>
                                            )}
                                            {selectedLeaveType.max_consecutive_days && (
                                                <span>Maks. {selectedLeaveType.max_consecutive_days} hari berturut</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Tanggal Mulai *</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                        />
                                        {errors.start_date && (
                                            <p className="text-sm text-red-500">{errors.start_date}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_date">Tanggal Selesai *</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={data.end_date}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                            min={data.start_date}
                                        />
                                        {errors.end_date && (
                                            <p className="text-sm text-red-500">{errors.end_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="is_half_day">Setengah Hari</Label>
                                        <p className="text-sm text-muted-foreground">Cuti hanya setengah hari kerja</p>
                                    </div>
                                    <Switch
                                        id="is_half_day"
                                        checked={data.is_half_day}
                                        onCheckedChange={(checked) => setData('is_half_day', checked)}
                                    />
                                </div>

                                {data.is_half_day && (
                                    <div className="space-y-2">
                                        <Label htmlFor="half_day_type">Waktu Setengah Hari *</Label>
                                        <Select
                                            value={data.half_day_type}
                                            onValueChange={(val) => setData('half_day_type', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih waktu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(halfDayTypes).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.half_day_type && (
                                            <p className="text-sm text-red-500">{errors.half_day_type}</p>
                                        )}
                                    </div>
                                )}

                                {totalDays > 0 && (
                                    <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                                        <span className="font-medium">Total Hari Cuti</span>
                                        <span className="text-xl font-bold text-primary">{totalDays} hari</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reason and Additional Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Alasan & Informasi Tambahan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Alasan Cuti *</Label>
                                    <Textarea
                                        id="reason"
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        placeholder="Jelaskan alasan pengajuan cuti..."
                                        rows={4}
                                    />
                                    {errors.reason && (
                                        <p className="text-sm text-red-500">{errors.reason}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact">Kontak Darurat</Label>
                                        <Input
                                            id="emergency_contact"
                                            value={data.emergency_contact}
                                            onChange={(e) => setData('emergency_contact', e.target.value)}
                                            placeholder="Nama kontak darurat"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_phone">No. Telp Darurat</Label>
                                        <Input
                                            id="emergency_phone"
                                            value={data.emergency_phone}
                                            onChange={(e) => setData('emergency_phone', e.target.value)}
                                            placeholder="08xx-xxxx-xxxx"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="delegation_to">Delegasi Pekerjaan</Label>
                                    <Input
                                        id="delegation_to"
                                        value={data.delegation_to}
                                        onChange={(e) => setData('delegation_to', e.target.value)}
                                        placeholder="Nama rekan kerja yang akan menggantikan"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Leave Balance */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Saldo Cuti</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {employeeBalances.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Pilih karyawan untuk melihat saldo cuti</p>
                                    </div>
                                ) : (
                                    employeeBalances.map((balance) => (
                                        <div 
                                            key={balance.leave_type_id}
                                            className={`p-3 rounded-lg border ${
                                                Number(data.leave_type_id) === balance.leave_type_id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-transparent bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-sm">{balance.leave_type_name}</span>
                                                <Badge variant="outline">{balance.available} hari</Badge>
                                            </div>
                                            <div className="flex gap-4 text-xs text-muted-foreground">
                                                <span>Total: {balance.total_balance}</span>
                                                <span>Terpakai: {balance.used}</span>
                                                <span>Pending: {balance.pending}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {selectedBalance && totalDays > 0 && (
                            <Card className={totalDays > selectedBalance.available ? 'border-red-500' : 'border-green-500'}>
                                <CardContent className="pt-4">
                                    {totalDays > selectedBalance.available ? (
                                        <div className="text-red-600">
                                            <AlertCircle className="h-5 w-5 mb-2" />
                                            <p className="font-medium">Saldo Tidak Cukup</p>
                                            <p className="text-sm">
                                                Dibutuhkan {totalDays} hari, tersedia {selectedBalance.available} hari
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-green-600">
                                            <p className="font-medium">Saldo Mencukupi</p>
                                            <p className="text-sm">
                                                Sisa setelah pengajuan: {selectedBalance.available - totalDays} hari
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </FormPage>
        </HRLayout>
    );
}
