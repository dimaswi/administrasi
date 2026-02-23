import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Building2, MapPin, Clock, Shield, Save, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
    company_name: string;
    company_short_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    company_npwp: string;
    company_logo: string | null;
    office_latitude: number;
    office_longitude: number;
    office_radius: number;
    work_start_time: string;
    work_end_time: string;
    late_tolerance_minutes: number;
    leave_approval_levels: number;
    overtime_approval_required: boolean;
}

interface Props {
    settings: Settings;
}

export default function CompanySettings({ settings }: Props) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        company_name: settings.company_name,
        company_short_name: settings.company_short_name,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        company_website: settings.company_website,
        company_npwp: settings.company_npwp,
        office_latitude: settings.office_latitude,
        office_longitude: settings.office_longitude,
        office_radius: settings.office_radius,
        work_start_time: settings.work_start_time,
        work_end_time: settings.work_end_time,
        late_tolerance_minutes: settings.late_tolerance_minutes,
        leave_approval_levels: settings.leave_approval_levels,
        overtime_approval_required: settings.overtime_approval_required,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch('/settings/company', {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan berhasil disimpan'),
        });
    };

    return (
        <AppLayout>
            <Head title="Pengaturan Perusahaan" />
            
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="Pengaturan Perusahaan" 
                        description="Kelola informasi dan konfigurasi perusahaan" 
                    />
                    
                    <form onSubmit={submit}>
                        <Tabs defaultValue="company" className="space-y-6">
                            <TabsList className="h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b w-full">
                                <TabsTrigger value="company" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Perusahaan</span>
                                </TabsTrigger>
                                <TabsTrigger value="location" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="hidden sm:inline">Lokasi</span>
                                </TabsTrigger>
                                <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="hidden sm:inline">Jadwal</span>
                                </TabsTrigger>
                                <TabsTrigger value="workflow" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                                    <Shield className="h-4 w-4" />
                                    <span className="hidden sm:inline">Workflow</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Company Info Tab */}
                            <TabsContent value="company">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Informasi Perusahaan</CardTitle>
                                        <CardDescription>Data identitas perusahaan</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="company_name">Nama Perusahaan *</Label>
                                                <Input
                                                    id="company_name"
                                                    value={data.company_name}
                                                    onChange={(e) => setData('company_name', e.target.value)}
                                                    placeholder="PT. Nama Perusahaan"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="company_short_name">Nama Singkat</Label>
                                                <Input
                                                    id="company_short_name"
                                                    value={data.company_short_name}
                                                    onChange={(e) => setData('company_short_name', e.target.value)}
                                                    placeholder="PT. NP"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="company_address">Alamat</Label>
                                            <Textarea
                                                id="company_address"
                                                value={data.company_address}
                                                onChange={(e) => setData('company_address', e.target.value)}
                                                placeholder="Alamat lengkap perusahaan"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="company_phone">Telepon</Label>
                                                <Input
                                                    id="company_phone"
                                                    value={data.company_phone}
                                                    onChange={(e) => setData('company_phone', e.target.value)}
                                                    placeholder="021-1234567"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="company_email">Email</Label>
                                                <Input
                                                    id="company_email"
                                                    type="email"
                                                    value={data.company_email}
                                                    onChange={(e) => setData('company_email', e.target.value)}
                                                    placeholder="info@perusahaan.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="company_website">Website</Label>
                                                <Input
                                                    id="company_website"
                                                    value={data.company_website}
                                                    onChange={(e) => setData('company_website', e.target.value)}
                                                    placeholder="https://www.perusahaan.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="company_npwp">NPWP</Label>
                                                <Input
                                                    id="company_npwp"
                                                    value={data.company_npwp}
                                                    onChange={(e) => setData('company_npwp', e.target.value)}
                                                    placeholder="00.000.000.0-000.000"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Location Tab */}
                            <TabsContent value="location">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Lokasi Kantor</CardTitle>
                                        <CardDescription>Koordinat untuk validasi absensi GPS</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="office_latitude">Latitude</Label>
                                                <Input
                                                    id="office_latitude"
                                                    type="number"
                                                    step="any"
                                                    value={data.office_latitude}
                                                    onChange={(e) => setData('office_latitude', parseFloat(e.target.value))}
                                                    placeholder="-6.2088"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="office_longitude">Longitude</Label>
                                                <Input
                                                    id="office_longitude"
                                                    type="number"
                                                    step="any"
                                                    value={data.office_longitude}
                                                    onChange={(e) => setData('office_longitude', parseFloat(e.target.value))}
                                                    placeholder="106.8456"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="office_radius">Radius (meter)</Label>
                                                <Input
                                                    id="office_radius"
                                                    type="number"
                                                    min={50}
                                                    max={1000}
                                                    value={data.office_radius}
                                                    onChange={(e) => setData('office_radius', parseInt(e.target.value))}
                                                    placeholder="100"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Radius adalah jarak maksimum dari koordinat kantor dimana karyawan diizinkan melakukan check-in/out.
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Schedule Tab */}
                            <TabsContent value="schedule">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Jam Kerja Default</CardTitle>
                                        <CardDescription>Pengaturan jam kerja standar perusahaan</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="work_start_time">Jam Masuk</Label>
                                                <Input
                                                    id="work_start_time"
                                                    type="time"
                                                    value={data.work_start_time}
                                                    onChange={(e) => setData('work_start_time', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="work_end_time">Jam Pulang</Label>
                                                <Input
                                                    id="work_end_time"
                                                    type="time"
                                                    value={data.work_end_time}
                                                    onChange={(e) => setData('work_end_time', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="late_tolerance_minutes">Toleransi Terlambat (menit)</Label>
                                                <Input
                                                    id="late_tolerance_minutes"
                                                    type="number"
                                                    min={0}
                                                    max={60}
                                                    value={data.late_tolerance_minutes}
                                                    onChange={(e) => setData('late_tolerance_minutes', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Workflow Tab */}
                            <TabsContent value="workflow">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pengaturan Workflow</CardTitle>
                                        <CardDescription>Konfigurasi proses approval</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="leave_approval_levels">Level Approval Cuti</Label>
                                            <Input
                                                id="leave_approval_levels"
                                                type="number"
                                                min={1}
                                                max={3}
                                                value={data.leave_approval_levels}
                                                onChange={(e) => setData('leave_approval_levels', parseInt(e.target.value))}
                                                className="w-32"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Jumlah level approval yang dibutuhkan untuk menyetujui pengajuan cuti (1-3 level)
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <Label>Approval Lembur</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Aktifkan jika pengajuan lembur memerlukan persetujuan atasan
                                                </p>
                                            </div>
                                            <Switch
                                                checked={data.overtime_approval_required}
                                                onCheckedChange={(checked) => setData('overtime_approval_required', checked)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-6">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Simpan Pengaturan
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
