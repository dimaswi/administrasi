import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Palette, Clock, Calendar } from 'lucide-react';

interface LeaveType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    default_quota: number;
    is_paid: boolean;
    requires_approval: boolean;
    allow_carry_over: boolean;
    max_carry_over_days: number;
    min_advance_days: number;
    max_consecutive_days: number | null;
    is_active: boolean;
    sort_order: number;
    color: string;
}

interface Props {
    leaveType: LeaveType | null;
    colors: Record<string, string>;
}

const colorClasses: Record<string, string> = {
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

export default function Form({ leaveType, colors }: Props) {
    const isEdit = !!leaveType;
    
    const { data, setData, post, put, processing, errors } = useForm({
        code: leaveType?.code || '',
        name: leaveType?.name || '',
        description: leaveType?.description || '',
        default_quota: leaveType?.default_quota || 0,
        is_paid: leaveType?.is_paid ?? true,
        requires_approval: leaveType?.requires_approval ?? true,
        allow_carry_over: leaveType?.allow_carry_over ?? false,
        max_carry_over_days: leaveType?.max_carry_over_days || 0,
        min_advance_days: leaveType?.min_advance_days || 0,
        max_consecutive_days: leaveType?.max_consecutive_days || '',
        is_active: leaveType?.is_active ?? true,
        sort_order: leaveType?.sort_order || 0,
        color: leaveType?.color || 'blue',
    });

    const breadcrumbs = [
        { title: 'HR', href: '/hr' },
        { title: 'Master Data', href: '#' },
        { title: 'Jenis Cuti', href: '/hr/leave-types' },
        { title: isEdit ? 'Edit' : 'Tambah Baru', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEdit) {
            put(`/hr/leave-types/${leaveType.id}`);
        } else {
            post('/hr/leave-types');
        }
    };

    return (
        <HRLayout>
            <Head title={isEdit ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti'} />

            <FormPage
                title={isEdit ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti Baru'}
                description="Konfigurasi jenis cuti dan pengaturannya"
                backUrl="/hr/leave-types"
                onSubmit={handleSubmit}
                isLoading={processing}
            >
                <div className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Informasi Dasar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="CUTI-01"
                                        maxLength={20}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-500">{errors.code}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Cuti Tahunan"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi jenis cuti..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="default_quota">Kuota Default (hari/tahun) *</Label>
                                    <Input
                                        id="default_quota"
                                        type="number"
                                        min={0}
                                        value={data.default_quota}
                                        onChange={(e) => setData('default_quota', parseInt(e.target.value) || 0)}
                                    />
                                    {errors.default_quota && (
                                        <p className="text-sm text-red-500">{errors.default_quota}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sort_order">Urutan Tampilan *</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Color Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Warna Label
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(colors).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setData('color', key)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                            data.color === key 
                                                ? 'border-primary bg-primary/10' 
                                                : 'border-transparent bg-muted/50 hover:bg-muted'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${colorClasses[key]}`}></div>
                                        <span className="text-sm">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rules and Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Aturan & Pengaturan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min_advance_days">Min. Hari Pengajuan Sebelumnya</Label>
                                    <Input
                                        id="min_advance_days"
                                        type="number"
                                        min={0}
                                        value={data.min_advance_days}
                                        onChange={(e) => setData('min_advance_days', parseInt(e.target.value) || 0)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Berapa hari sebelumnya cuti harus diajukan (0 = tanpa batas)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_consecutive_days">Maks. Hari Berturut-turut</Label>
                                    <Input
                                        id="max_consecutive_days"
                                        type="number"
                                        min={1}
                                        value={data.max_consecutive_days}
                                        onChange={(e) => setData('max_consecutive_days', e.target.value ? parseInt(e.target.value) : '')}
                                        placeholder="Tanpa batas"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Kosongkan jika tidak ada batasan
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Cuti Berbayar</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Karyawan tetap menerima gaji selama cuti
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_paid}
                                        onCheckedChange={(checked) => setData('is_paid', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Memerlukan Persetujuan</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Pengajuan cuti harus disetujui atasan
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.requires_approval}
                                        onCheckedChange={(checked) => setData('requires_approval', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Izinkan Carry Over</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Sisa cuti dapat dibawa ke tahun berikutnya
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.allow_carry_over}
                                        onCheckedChange={(checked) => setData('allow_carry_over', checked)}
                                    />
                                </div>

                                {data.allow_carry_over && (
                                    <div className="space-y-2 pl-4">
                                        <Label htmlFor="max_carry_over_days">Maks. Hari Carry Over</Label>
                                        <Input
                                            id="max_carry_over_days"
                                            type="number"
                                            min={0}
                                            value={data.max_carry_over_days}
                                            onChange={(e) => setData('max_carry_over_days', parseInt(e.target.value) || 0)}
                                            className="w-[200px]"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Maksimal hari yang dapat dibawa ke tahun berikutnya
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Status Aktif</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Jenis cuti dapat digunakan untuk pengajuan
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </FormPage>
        </HRLayout>
    );
}
