import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
    [key: string]: string | number | boolean | null;
    code: string;
    name: string;
    description: string;
    clock_in_time: string;
    clock_out_time: string;
    break_start: string;
    break_end: string;
    late_tolerance: number;
    early_leave_tolerance: number;
    is_flexible: boolean;
    flexible_minutes: number;
    work_hours_per_day: number;
    is_active: boolean;
}

export default function Create() {
    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Jadwal Kerja (Shift)', href: '/hr/work-schedules' },
        { title: 'Tambah Shift', href: '/hr/work-schedules/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        code: '',
        name: '',
        description: '',
        clock_in_time: '08:00',
        clock_out_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        late_tolerance: 15,
        early_leave_tolerance: 0,
        is_flexible: false,
        flexible_minutes: 0,
        work_hours_per_day: 480,
        is_active: true,
    });

    const calculateWorkHours = () => {
        if (!data.clock_in_time || !data.clock_out_time) return 0;
        
        const [inHour, inMin] = data.clock_in_time.split(':').map(Number);
        const [outHour, outMin] = data.clock_out_time.split(':').map(Number);
        
        let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
        
        // Handle overnight shift (e.g., 22:00 - 06:00)
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        if (data.break_start && data.break_end) {
            const [breakStartHour, breakStartMin] = data.break_start.split(':').map(Number);
            const [breakEndHour, breakEndMin] = data.break_end.split(':').map(Number);
            const breakMinutes = (breakEndHour * 60 + breakEndMin) - (breakStartHour * 60 + breakStartMin);
            if (breakMinutes > 0) totalMinutes -= breakMinutes;
        }
        
        return totalMinutes > 0 ? totalMinutes : 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const workHours = calculateWorkHours();
        
        setData('work_hours_per_day', workHours);
        
        post('/hr/work-schedules', {
            onError: () => toast.error('Gagal menambahkan shift'),
        });
    };

    const formatWorkHours = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins > 0) return `${hours} jam ${mins} menit`;
        return `${hours} jam`;
    };

    return (
        <HRLayout>
            <Head title="Tambah Shift Kerja" />

            <FormPage
                title="Tambah Shift Kerja"
                description="Buat template shift baru seperti Pagi, Siang, Malam. Shift akan dipilih per-hari saat mengatur jadwal karyawan."
                backUrl="/hr/work-schedules"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Shift"
            >
                {/* Basic Info */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings2 className="h-4 w-4" />
                            Informasi Dasar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Shift *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Contoh: PAGI, SIANG, MALAM"
                                    className={errors.code ? 'border-red-500' : ''}
                                />
                                {errors.code && <small className="text-red-500">{errors.code}</small>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Shift *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Shift Pagi"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <small className="text-red-500">{errors.name}</small>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Deskripsi singkat tentang shift ini..."
                                rows={2}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active">Status Aktif</Label>
                                <p className="text-sm text-muted-foreground">
                                    Shift yang nonaktif tidak akan muncul saat memilih jadwal karyawan
                                </p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Work Hours */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Jam Kerja
                        </CardTitle>
                        <CardDescription>
                            Tentukan jam masuk dan pulang untuk shift ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clock_in_time">Jam Masuk *</Label>
                                <Input
                                    id="clock_in_time"
                                    type="time"
                                    value={data.clock_in_time}
                                    onChange={(e) => setData('clock_in_time', e.target.value)}
                                    className={errors.clock_in_time ? 'border-red-500' : ''}
                                />
                                {errors.clock_in_time && <small className="text-red-500">{errors.clock_in_time}</small>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="clock_out_time">Jam Pulang *</Label>
                                <Input
                                    id="clock_out_time"
                                    type="time"
                                    value={data.clock_out_time}
                                    onChange={(e) => setData('clock_out_time', e.target.value)}
                                    className={errors.clock_out_time ? 'border-red-500' : ''}
                                />
                                {errors.clock_out_time && <small className="text-red-500">{errors.clock_out_time}</small>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="break_start">Istirahat Mulai</Label>
                                <Input
                                    id="break_start"
                                    type="time"
                                    value={data.break_start}
                                    onChange={(e) => setData('break_start', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="break_end">Istirahat Selesai</Label>
                                <Input
                                    id="break_end"
                                    type="time"
                                    value={data.break_end}
                                    onChange={(e) => setData('break_end', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Total Jam Kerja: </span>
                                <span className="font-medium">{formatWorkHours(calculateWorkHours())}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Flexibility */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Fleksibilitas
                        </CardTitle>
                        <CardDescription>
                            Aktifkan jika jam masuk/pulang fleksibel
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_flexible">Jadwal Fleksibel</Label>
                                <p className="text-sm text-muted-foreground">
                                    Karyawan dapat masuk/pulang dalam rentang waktu tertentu
                                </p>
                            </div>
                            <Switch
                                id="is_flexible"
                                checked={data.is_flexible}
                                onCheckedChange={(checked) => setData('is_flexible', checked)}
                            />
                        </div>

                        {data.is_flexible && (
                            <div className="space-y-2">
                                <Label htmlFor="flexible_minutes">Rentang Fleksibel (menit)</Label>
                                <Input
                                    id="flexible_minutes"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={data.flexible_minutes}
                                    onChange={(e) => setData('flexible_minutes', parseInt(e.target.value) || 0)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Contoh: 30 menit = boleh masuk 07:30-08:30 jika jam masuk 08:00
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tolerance */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Toleransi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="late_tolerance">Toleransi Terlambat (menit)</Label>
                                <Input
                                    id="late_tolerance"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={data.late_tolerance}
                                    onChange={(e) => setData('late_tolerance', parseInt(e.target.value) || 0)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Masih dianggap tepat waktu jika terlambat dalam toleransi ini
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="early_leave_tolerance">Toleransi Pulang Awal (menit)</Label>
                                <Input
                                    id="early_leave_tolerance"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={data.early_leave_tolerance}
                                    onChange={(e) => setData('early_leave_tolerance', parseInt(e.target.value) || 0)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Masih dianggap tepat waktu jika pulang lebih awal dalam toleransi ini
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </FormPage>
        </HRLayout>
    );
}
