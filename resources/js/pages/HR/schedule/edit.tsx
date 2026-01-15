import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    organization_unit?: { name: string };
    job_category?: { name: string };
}

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
}

interface EmployeeSchedule {
    id: number;
    effective_date: string;
    end_date: string | null;
    monday_shift_id: number | null;
    tuesday_shift_id: number | null;
    wednesday_shift_id: number | null;
    thursday_shift_id: number | null;
    friday_shift_id: number | null;
    saturday_shift_id: number | null;
    sunday_shift_id: number | null;
    notes: string | null;
}

interface Props {
    employee: Employee;
    schedule: EmployeeSchedule;
    workSchedules: WorkSchedule[];
}

interface FormData {
    [key: string]: string | number | null;
    effective_date: string;
    end_date: string;
    monday_shift_id: number | null;
    tuesday_shift_id: number | null;
    wednesday_shift_id: number | null;
    thursday_shift_id: number | null;
    friday_shift_id: number | null;
    saturday_shift_id: number | null;
    sunday_shift_id: number | null;
    notes: string;
}

const daysOfWeek = [
    { key: 'monday', label: 'Senin' },
    { key: 'tuesday', label: 'Selasa' },
    { key: 'wednesday', label: 'Rabu' },
    { key: 'thursday', label: 'Kamis' },
    { key: 'friday', label: 'Jumat' },
    { key: 'saturday', label: 'Sabtu' },
    { key: 'sunday', label: 'Minggu' },
];

function formatTime(time: string | null): string {
    if (!time) return '';
    return time.substring(0, 5);
}

export default function Edit({ employee, schedule, workSchedules }: Props) {
    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Jadwal Karyawan', href: '/hr/schedules' },
        { title: `${employee.first_name} ${employee.last_name}`, href: `/hr/schedules/${employee.id}` },
        { title: 'Edit Jadwal', href: `/hr/schedules/${employee.id}/schedules/${schedule.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        effective_date: schedule.effective_date,
        end_date: schedule.end_date || '',
        monday_shift_id: schedule.monday_shift_id,
        tuesday_shift_id: schedule.tuesday_shift_id,
        wednesday_shift_id: schedule.wednesday_shift_id,
        thursday_shift_id: schedule.thursday_shift_id,
        friday_shift_id: schedule.friday_shift_id,
        saturday_shift_id: schedule.saturday_shift_id,
        sunday_shift_id: schedule.sunday_shift_id,
        notes: schedule.notes || '',
    });

    const handleShiftChange = (day: string, value: string) => {
        const shiftId = value === 'off' ? null : parseInt(value);
        setData(`${day}_shift_id` as keyof FormData, shiftId);
    };

    const getSelectedShift = (shiftId: number | null) => {
        if (!shiftId) return null;
        return workSchedules.find(s => s.id === shiftId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(`/hr/schedules/${employee.id}/schedules/${schedule.id}`, {
            onError: () => toast.error('Gagal memperbarui jadwal'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Edit Jadwal - ${employee.first_name} ${employee.last_name}`} />

            <FormPage
                title="Edit Jadwal Karyawan"
                description={`Edit jadwal shift per-hari untuk ${employee.first_name} ${employee.last_name}`}
                backUrl={`/hr/schedules/${employee.id}`}
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Perubahan"
            >
                {/* Employee Info */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Informasi Karyawan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">NIP</div>
                                <div className="font-medium">{employee.employee_id}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Nama</div>
                                <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Unit</div>
                                <div className="font-medium">{employee.organization_unit?.name || '-'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Jabatan</div>
                                <div className="font-medium">{employee.job_category?.name || '-'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Effective Date */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Periode Berlaku
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effective_date">Tanggal Mulai *</Label>
                                <Input
                                    id="effective_date"
                                    type="date"
                                    value={data.effective_date}
                                    onChange={(e) => setData('effective_date', e.target.value)}
                                    className={errors.effective_date ? 'border-red-500' : ''}
                                />
                                {errors.effective_date && <small className="text-red-500">{errors.effective_date}</small>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Tanggal Berakhir</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    className={errors.end_date ? 'border-red-500' : ''}
                                />
                                {errors.end_date && <small className="text-red-500">{errors.end_date}</small>}
                                <p className="text-xs text-muted-foreground">
                                    Kosongkan jika jadwal berlaku tanpa batas waktu
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shift per Day */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Shift Per Hari
                        </CardTitle>
                        <CardDescription>
                            Pilih shift untuk setiap hari dalam seminggu. Pilih "Libur" jika hari tersebut tidak masuk kerja.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {daysOfWeek.map((day) => {
                                const shiftKey = `${day.key}_shift_id` as keyof FormData;
                                const selectedShiftId = data[shiftKey] as number | null;
                                const selectedShift = getSelectedShift(selectedShiftId);

                                return (
                                    <div key={day.key} className="flex items-center gap-4 py-2 border-b last:border-0">
                                        <div className="w-24 font-medium">{day.label}</div>
                                        <div className="flex-1">
                                            <Select
                                                value={selectedShiftId?.toString() || 'off'}
                                                onValueChange={(value) => handleShiftChange(day.key, value)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih shift" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="off">
                                                        <span className="text-muted-foreground">🚫 Libur</span>
                                                    </SelectItem>
                                                    {workSchedules.map((shift) => (
                                                        <SelectItem key={shift.id} value={shift.id.toString()}>
                                                            {shift.name} ({formatTime(shift.clock_in_time)} - {formatTime(shift.clock_out_time)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-32 text-sm text-muted-foreground">
                                            {selectedShift ? (
                                                <span>{formatTime(selectedShift.clock_in_time)} - {formatTime(selectedShift.clock_out_time)}</span>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Catatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Catatan tambahan (opsional)..."
                            rows={3}
                        />
                    </CardContent>
                </Card>
            </FormPage>
        </HRLayout>
    );
}
