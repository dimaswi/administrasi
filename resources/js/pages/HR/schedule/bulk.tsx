import { Head, useForm, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    organization_unit_id: number | null;
    organization_unit?: { name: string };
}

interface OrganizationUnit {
    id: number;
    name: string;
    code: string;
}

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
}

interface Props {
    employees: Employee[];
    units: OrganizationUnit[];
    workSchedules: WorkSchedule[];
}

interface FormData {
    [key: string]: string | number | number[] | null;
    employee_ids: number[];
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

export default function Bulk({ employees, units, workSchedules }: Props) {
    const [filterUnitId, setFilterUnitId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Jadwal Karyawan', href: '/hr/schedules' },
        { title: 'Atur Jadwal Massal', href: '/hr/schedules/bulk' },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        employee_ids: [],
        effective_date: '',
        monday_shift_id: null,
        tuesday_shift_id: null,
        wednesday_shift_id: null,
        thursday_shift_id: null,
        friday_shift_id: null,
        saturday_shift_id: null,
        sunday_shift_id: null,
        notes: '',
    });

    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const matchUnit = filterUnitId === 'all' || String(emp.organization_unit_id) === filterUnitId;
            const matchSearch =
                searchTerm === '' ||
                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchUnit && matchSearch;
        });
    }, [employees, filterUnitId, searchTerm]);

    const handleEmployeeToggle = (employeeId: number) => {
        const newIds = data.employee_ids.includes(employeeId)
            ? data.employee_ids.filter((id) => id !== employeeId)
            : [...data.employee_ids, employeeId];
        setData('employee_ids', newIds);
    };

    const handleSelectAll = () => {
        const allFilteredIds = filteredEmployees.map((emp) => emp.id);
        const allSelected = allFilteredIds.every((id) => data.employee_ids.includes(id));
        if (allSelected) {
            // Deselect all filtered
            setData('employee_ids', data.employee_ids.filter((id) => !allFilteredIds.includes(id)));
        } else {
            // Select all filtered
            const newIds = [...new Set([...data.employee_ids, ...allFilteredIds])];
            setData('employee_ids', newIds);
        }
    };

    const handleShiftChange = (day: string, value: string) => {
        const shiftId = value === 'off' ? null : parseInt(value);
        setData(`${day}_shift_id` as keyof FormData, shiftId);
    };

    const getSelectedShift = (shiftId: number | null) => {
        if (!shiftId) return null;
        return workSchedules.find((s) => s.id === shiftId);
    };

    // Quick preset: standard weekday
    const applyPresetWeekday = (shiftId: number | null) => {
        setData((prev) => ({
            ...prev,
            monday_shift_id: shiftId,
            tuesday_shift_id: shiftId,
            wednesday_shift_id: shiftId,
            thursday_shift_id: shiftId,
            friday_shift_id: shiftId,
            saturday_shift_id: null,
            sunday_shift_id: null,
        }));
    };

    // Quick preset: all same
    const applyPresetAllSame = (shiftId: number | null) => {
        setData((prev) => ({
            ...prev,
            monday_shift_id: shiftId,
            tuesday_shift_id: shiftId,
            wednesday_shift_id: shiftId,
            thursday_shift_id: shiftId,
            friday_shift_id: shiftId,
            saturday_shift_id: shiftId,
            sunday_shift_id: shiftId,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.employee_ids.length === 0) {
            toast.error('Pilih minimal 1 karyawan');
            return;
        }

        post('/hr/schedules/bulk', {
            onError: () => toast.error('Gagal mengatur jadwal'),
        });
    };

    const allFilteredSelected =
        filteredEmployees.length > 0 && filteredEmployees.every((emp) => data.employee_ids.includes(emp.id));

    return (
        <HRLayout>
            <Head title="Atur Jadwal Massal" />

            <FormPage
                title="Atur Jadwal Massal"
                description="Terapkan jadwal shift yang sama ke beberapa karyawan sekaligus"
                backUrl="/hr/schedules"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel={`Terapkan ke ${data.employee_ids.length} Karyawan`}
            >
                {/* Employee Selection */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Pilih Karyawan
                        </CardTitle>
                        <CardDescription>
                            {data.employee_ids.length} karyawan dipilih dari {filteredEmployees.length} karyawan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Cari nama atau NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-[200px]">
                                <Select value={filterUnitId} onValueChange={setFilterUnitId}>
                                    <SelectTrigger>
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Unit</SelectItem>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id.toString()}>
                                                {unit.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Select All */}
                        <div className="flex items-center gap-2 py-2 border-b">
                            <Checkbox
                                id="select-all"
                                checked={allFilteredSelected}
                                onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor="select-all" className="cursor-pointer font-medium">
                                Pilih Semua ({filteredEmployees.length})
                            </Label>
                        </div>

                        {/* Employee List */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {filteredEmployees.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada karyawan ditemukan
                                </div>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            id={`emp-${emp.id}`}
                                            checked={data.employee_ids.includes(emp.id)}
                                            onCheckedChange={() => handleEmployeeToggle(emp.id)}
                                        />
                                        <Label htmlFor={`emp-${emp.id}`} className="cursor-pointer flex-1">
                                            <div className="font-medium">
                                                {emp.first_name} {emp.last_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {emp.employee_id} • {emp.organization_unit?.name || '-'}
                                            </div>
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>

                        {errors.employee_ids && (
                            <small className="text-red-500">{errors.employee_ids}</small>
                        )}
                    </CardContent>
                </Card>

                {/* Effective Date */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Tanggal Berlaku
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
                        </div>
                    </CardContent>
                </Card>

                {/* Shift per Day */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Shift Per Hari
                        </CardTitle>
                        <CardDescription>
                            Pilih shift untuk setiap hari. Gunakan preset untuk mempercepat pengisian.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm text-muted-foreground mr-2">Preset Cepat:</span>
                            {workSchedules.map((shift) => (
                                <div key={shift.id} className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => applyPresetWeekday(shift.id)}
                                        className="text-xs px-2 py-1 bg-background border rounded hover:bg-muted"
                                    >
                                        {shift.code} (Sen-Jum)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPresetAllSame(shift.id)}
                                        className="text-xs px-2 py-1 bg-background border rounded hover:bg-muted"
                                    >
                                        {shift.code} (Semua)
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Day-by-Day Selection */}
                        <div className="space-y-3">
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
                                                            {shift.name} ({formatTime(shift.clock_in_time)} -{' '}
                                                            {formatTime(shift.clock_out_time)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-32 text-sm text-muted-foreground">
                                            {selectedShift ? (
                                                <span>
                                                    {formatTime(selectedShift.clock_in_time)} -{' '}
                                                    {formatTime(selectedShift.clock_out_time)}
                                                </span>
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
                    <CardHeader className="py-4">
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
