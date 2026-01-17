import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
    [key: string]: string | boolean;
    code: string;
    name: string;
    description: string;
    is_medical: boolean;
    requires_str: boolean;
    requires_sip: boolean;
    is_active: boolean;
}

export default function Create() {
    const breadcrumbs = [
        { title: <Briefcase className="h-4 w-4" />, href: '/hr/job-categories' },
        { title: 'Tambah Kategori', href: '/hr/job-categories/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        code: '',
        name: '',
        description: '',
        is_medical: false,
        requires_str: false,
        requires_sip: false,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hr/job-categories', {
            onError: () => toast.error('Gagal menambahkan kategori'),
        });
    };

    return (
        <HRLayout>
            <Head title="Tambah Kategori Pekerjaan" />

            <FormPage
                title="Tambah Kategori Pekerjaan"
                description="Kode kategori akan digunakan untuk format NIK karyawan (contoh: 2026-[KODE]-001)"
                backUrl="/hr/job-categories"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Kategori"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Kode Kategori *</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="1"
                            maxLength={10}
                            className={errors.code ? 'border-red-500' : ''}
                        />
                        {errors.code && <small className="text-red-500">{errors.code}</small>}
                        <p className="text-xs text-muted-foreground">
                            Kode unik untuk NIK (contoh: 1 untuk Perawat)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Kategori *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Perawat"
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
                        placeholder="Deskripsi kategori pekerjaan..."
                        rows={3}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Pengaturan Tenaga Medis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Tenaga Medis</Label>
                            <Select
                                value={data.is_medical ? 'true' : 'false'}
                                onValueChange={(value) => setData('is_medical', value === 'true')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Ya</SelectItem>
                                    <SelectItem value="false">Tidak</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Kategori ini adalah tenaga medis/kesehatan
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Wajib STR</Label>
                            <Select
                                value={data.requires_str ? 'true' : 'false'}
                                onValueChange={(value) => setData('requires_str', value === 'true')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Ya</SelectItem>
                                    <SelectItem value="false">Tidak</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Memerlukan Surat Tanda Registrasi
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Wajib SIP</Label>
                            <Select
                                value={data.requires_sip ? 'true' : 'false'}
                                onValueChange={(value) => setData('requires_sip', value === 'true')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Ya</SelectItem>
                                    <SelectItem value="false">Tidak</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Memerlukan Surat Izin Praktek
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                    <Label>Status Aktif</Label>
                    <Select
                        value={data.is_active ? 'true' : 'false'}
                        onValueChange={(value) => setData('is_active', value === 'true')}
                    >
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Aktif</SelectItem>
                            <SelectItem value="false">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Kategori dapat digunakan untuk karyawan baru
                    </p>
                </div>
            </FormPage>
        </HRLayout>
    );
}
