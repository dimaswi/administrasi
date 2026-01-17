import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Users, Filter, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit_id: number | null;
    organization_unit: string | null;
    is_scheduled: boolean;
}

interface Unit {
    id: number;
    name: string;
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
    units: Unit[];
    workSchedules: WorkSchedule[];
    date: string;
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

export default function Bulk({ employees, units, workSchedules, date, statusOptions }: Props) {
    const [filterUnitId, setFilterUnitId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyScheduled, setOnlyScheduled] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        date: date,
        employee_ids: [] as number[],
        clock_in: '',
        clock_out: '',
        status: 'present',
        notes: '',
    });

    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const matchUnit = filterUnitId === 'all' || String(emp.organization_unit_id) === filterUnitId;
            const matchSearch =
                searchTerm === '' ||
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchScheduled = !onlyScheduled || emp.is_scheduled;
            return matchUnit && matchSearch && matchScheduled;
        });
    }, [employees, filterUnitId, searchTerm, onlyScheduled]);

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
            setData('employee_ids', data.employee_ids.filter((id) => !allFilteredIds.includes(id)));
        } else {
            const newIds = [...new Set([...data.employee_ids, ...allFilteredIds])];
            setData('employee_ids', newIds);
        }
    };

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

        if (data.employee_ids.length === 0) {
            toast.error('Pilih minimal 1 karyawan');
            return;
        }

        post('/hr/attendances/bulk', {
            onError: () => toast.error('Gagal menyimpan data'),
        });
    };

    const allFilteredSelected =
        filteredEmployees.length > 0 && filteredEmployees.every((emp) => data.employee_ids.includes(emp.id));

    // Apply schedule time preset
    const applySchedulePreset = (schedule: WorkSchedule) => {
        setData((prev) => ({
            ...prev,
            clock_in: schedule.clock_in_time.substring(0, 5),
            clock_out: schedule.clock_out_time.substring(0, 5),
        }));
    };

    // Status that requires clock time
    const statusWithTime = ['present', 'late', 'early_leave', 'late_early_leave'];
    const showClockTime = statusWithTime.includes(data.status);

    return (
        <HRLayout>
            <Head title="Input Kehadiran Massal" />

            <FormPage
                title="Input Kehadiran Massal"
                description={formatDate(date)}
                backUrl={`/hr/attendances?date=${date}`}
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel={`Simpan (${data.employee_ids.length} Karyawan)`}
            >
                <div className="space-y-6">
                    {/* Employee Selection Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Users className="h-4 w-4" />
                                Pilih Karyawan
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{data.employee_ids.length}</span>
                                <span className="text-muted-foreground">dari {filteredEmployees.length} dipilih</span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={filterUnitId} onValueChange={setFilterUnitId}>
                                <SelectTrigger className="w-full sm:w-[200px]">
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

                        {/* Filter scheduled checkbox */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="only-scheduled"
                                checked={onlyScheduled}
                                onCheckedChange={(checked) => setOnlyScheduled(checked as boolean)}
                            />
                            <Label htmlFor="only-scheduled" className="cursor-pointer text-sm">
                                Hanya tampilkan karyawan yang terjadwal hari ini
                            </Label>
                        </div>

                        {/* Select All & Employee List */}
                        <div className="border rounded-lg">
                            <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
                                <Checkbox
                                    id="select-all"
                                    checked={allFilteredSelected}
                                    onCheckedChange={handleSelectAll}
                                />
                                <Label htmlFor="select-all" className="cursor-pointer font-medium text-sm">
                                    Pilih Semua ({filteredEmployees.length})
                                </Label>
                            </div>

                            <ScrollArea className="h-[250px]">
                                {filteredEmployees.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Tidak ada karyawan ditemukan
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredEmployees.map((emp) => (
                                            <label
                                                key={emp.id}
                                                htmlFor={`emp-check-${emp.id}`}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer",
                                                    data.employee_ids.includes(emp.id) && "bg-green-50/50"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`emp-check-${emp.id}`}
                                                    checked={data.employee_ids.includes(emp.id)}
                                                    onCheckedChange={() => handleEmployeeToggle(emp.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{emp.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {emp.employee_id} • {emp.organization_unit || 'Tanpa Unit'}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {errors.employee_ids && (
                            <small className="text-red-500">{errors.employee_ids}</small>
                        )}
                    </div>

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

                            {/* Quick Presets */}
                            {workSchedules.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-muted-foreground py-1">Preset jadwal:</span>
                                    {workSchedules.map((schedule) => (
                                        <button
                                            key={schedule.id}
                                            type="button"
                                            onClick={() => applySchedulePreset(schedule)}
                                            className="text-xs px-2.5 py-1.5 bg-muted border rounded-md hover:bg-muted/80 transition-colors"
                                        >
                                            {schedule.code} ({schedule.clock_in_time.substring(0, 5)} - {schedule.clock_out_time.substring(0, 5)})
                                        </button>
                                    ))}
                                </div>
                            )}

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
                                Status akan otomatis disesuaikan berdasarkan jam masuk/keluar dan jadwal kerja masing-masing karyawan
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
