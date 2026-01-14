import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Clock, User, Calendar, Building2, Briefcase, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
    job_category: string | null;
}

interface WorkSchedule {
    id: number;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
}

interface Attendance {
    id: number;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    notes: string | null;
}

interface Props {
    employee: Employee | null;
    employees: Employee[];
    date: string;
    attendance: Attendance | null;
    workSchedule: WorkSchedule | null;
    statusOptions: Record<string, string>;
}

const statusConfig: Record<string, { color: string; bgColor: string }> = {
    present: { color: 'text-green-700', bgColor: 'bg-green-50 border-green-200 hover:bg-green-100' },
    late: { color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
    early_leave: { color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
    late_early_leave: { color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
    absent: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200 hover:bg-red-100' },
    leave: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
    sick: { color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
    permit: { color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100' },
    holiday: { color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100' },
};

export default function Form({ employee, employees, date, attendance, workSchedule, statusOptions }: Props) {
    const isEdit = !!attendance;

    const { data, setData, post, processing, errors } = useForm({
        employee_id: employee?.id?.toString() || '',
        date: date,
        clock_in: attendance?.clock_in?.substring(0, 5) || workSchedule?.clock_in_time || '',
        clock_out: attendance?.clock_out?.substring(0, 5) || workSchedule?.clock_out_time || '',
        status: attendance?.status || 'present',
        notes: attendance?.notes || '',
    });

    const selectedEmployee = employees.find(e => e.id.toString() === data.employee_id) || employee;

    const employeeOptions: SearchableSelectOption[] = employees.map(emp => ({
        value: emp.id.toString(),
        label: emp.name,
        description: `${emp.employee_id} - ${emp.organization_unit || 'Tanpa Unit'}`,
    }));

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const employeeId = data.employee_id || employee?.id;
        if (!employeeId) {
            toast.error('Pilih karyawan terlebih dahulu');
            return;
        }
        
        post(`/hr/attendances/${employeeId}`, {
            onSuccess: () => toast.success('Data kehadiran berhasil disimpan'),
            onError: () => toast.error('Gagal menyimpan data'),
        });
    };

    // Status that requires clock time
    const statusWithTime = ['present', 'late', 'early_leave', 'late_early_leave'];
    const showClockTime = statusWithTime.includes(data.status);

    return (
        <HRLayout>
            <Head title={`${isEdit ? 'Edit' : 'Input'} Kehadiran${selectedEmployee ? ` - ${selectedEmployee.name}` : ''}`} />

            <FormPage
                title={`${isEdit ? 'Edit' : 'Input'} Kehadiran`}
                description={formatDate(date)}
                backUrl={`/hr/attendances?date=${date}`}
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan"
            >
                <div className="space-y-6">
                    {/* Employee Selection or Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4" />
                            Karyawan
                        </div>
                        
                        {!isEdit ? (
                            <div className="space-y-2">
                                <SearchableSelect
                                    options={employeeOptions}
                                    value={data.employee_id}
                                    onValueChange={(value) => setData('employee_id', value)}
                                    placeholder="Cari dan pilih karyawan..."
                                    searchPlaceholder="Ketik nama atau NIP..."
                                    emptyText="Karyawan tidak ditemukan"
                                />
                                {errors.employee_id && <small className="text-red-500">{errors.employee_id}</small>}
                            </div>
                        ) : null}

                        {selectedEmployee && (
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border rounded-lg p-4 bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">NIP:</span>
                                    <span className="font-medium">{selectedEmployee.employee_id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Nama:</span>
                                    <span className="font-medium">{selectedEmployee.name}</span>
                                </div>
                                {selectedEmployee.organization_unit && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{selectedEmployee.organization_unit}</span>
                                    </div>
                                )}
                                {selectedEmployee.job_category && (
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{selectedEmployee.job_category}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Schedule Info */}
                    {workSchedule && (
                        <div className="flex flex-wrap items-center gap-4 text-sm border rounded-lg p-4 bg-blue-50/50 border-blue-100">
                            <div className="flex items-center gap-2 text-blue-700">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{workSchedule.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Masuk: <strong className="text-foreground">{workSchedule.clock_in_time}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Keluar: <strong className="text-foreground">{workSchedule.clock_out_time}</strong></span>
                            </div>
                        </div>
                    )}

                    {/* Status Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Status Kehadiran *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {Object.entries(statusOptions).map(([value, label]) => {
                                const config = statusConfig[value] || statusConfig.present;
                                const isSelected = data.status === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setData('status', value)}
                                        className={cn(
                                            "px-3 py-2 text-sm rounded-lg border transition-all text-center",
                                            isSelected 
                                                ? `${config.bgColor} ${config.color} border-2 font-medium ring-2 ring-offset-1 ring-current/20` 
                                                : "bg-background border-border hover:bg-muted"
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.status && <small className="text-red-500">{errors.status}</small>}
                    </div>

                    {/* Clock Time - Only show for present-type status */}
                    {showClockTime && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Waktu Kehadiran
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clock_in" className="text-xs text-muted-foreground">Jam Masuk</Label>
                                    <Input
                                        id="clock_in"
                                        type="time"
                                        value={data.clock_in}
                                        onChange={(e) => setData('clock_in', e.target.value)}
                                        className={cn("text-center text-lg font-mono", errors.clock_in && 'border-red-500')}
                                    />
                                    {errors.clock_in && <small className="text-red-500">{errors.clock_in}</small>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clock_out" className="text-xs text-muted-foreground">Jam Keluar</Label>
                                    <Input
                                        id="clock_out"
                                        type="time"
                                        value={data.clock_out}
                                        onChange={(e) => setData('clock_out', e.target.value)}
                                        className={cn("text-center text-lg font-mono", errors.clock_out && 'border-red-500')}
                                    />
                                    {errors.clock_out && <small className="text-red-500">{errors.clock_out}</small>}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Status akan otomatis disesuaikan berdasarkan jam masuk/keluar dan jadwal kerja
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Catatan tambahan (opsional)..."
                            rows={2}
                            className="resize-none"
                        />
                    </div>
                </div>
            </FormPage>
        </HRLayout>
    );
}
