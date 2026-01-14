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
    monday_shift_id: number | null;
    tuesday_shift_id: number | null;
    wednesday_shift_id: number | null;
    thursday_shift_id: number | null;
    friday_shift_id: number | null;
    saturday_shift_id: number | null;
    sunday_shift_id: number | null;
}

interface Props {
    employee: Employee;
    currentSchedule: EmployeeSchedule | null;
    workSchedules: WorkSchedule[];
}

interface FormData {
    [key: string]: string | number | null;
    effective_date: string;
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

export default function Create({ employee, currentSchedule, workSchedules }: Props) {
    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Jadwal Karyawan', href: '/hr/schedules' },
        { title: `${employee.first_name} ${employee.last_name}`, href: `/hr/schedules/${employee.id}` },
        { title: 'Tambah Jadwal', href: `/hr/schedules/${employee.id}/create` },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        effective_date: '',
        monday_shift_id: currentSchedule?.monday_shift_id ?? null,
        tuesday_shift_id: currentSchedule?.tuesday_shift_id ?? null,
        wednesday_shift_id: currentSchedule?.wednesday_shift_id ?? null,
        thursday_shift_id: currentSchedule?.thursday_shift_id ?? null,
        friday_shift_id: currentSchedule?.friday_shift_id ?? null,
        saturday_shift_id: currentSchedule?.saturday_shift_id ?? null,
        sunday_shift_id: currentSchedule?.sunday_shift_id ?? null,
        notes: '',
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
        
        post(`/hr/schedules/${employee.id}`, {
            onError: () => toast.error('Gagal menambahkan jadwal'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Tambah Jadwal - ${employee.first_name} ${employee.last_name}`} />

            <FormPage
                title="Tambah Jadwal Karyawan"
                description={`Atur jadwal shift per-hari untuk ${employee.first_name} ${employee.last_name}`}
                backUrl={`/hr/schedules/${employee.id}`}
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Jadwal"
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
                        <div className="space-y-2">
                            <Label htmlFor="effective_date">Tanggal Mulai Berlaku *</Label>
                            <Input
                                id="effective_date"
                                type="date"
                                value={data.effective_date}
                                onChange={(e) => setData('effective_date', e.target.value)}
                                className={errors.effective_date ? 'border-red-500' : ''}
                            />
                            {errors.effective_date && <small className="text-red-500">{errors.effective_date}</small>}
                            <p className="text-xs text-muted-foreground">
                                Jadwal akan berlaku mulai tanggal ini. Jadwal sebelumnya akan otomatis berakhir.
                            </p>
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
