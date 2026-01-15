import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface JobCategory {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_medical: boolean;
    requires_str: boolean;
    requires_sip: boolean;
    is_active: boolean;
}

interface Props {
    jobCategory: JobCategory;
}

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

export default function Edit({ jobCategory }: Props) {
    const breadcrumbs = [
        { title: <Briefcase className="h-4 w-4" />, href: '/hr/job-categories' },
        { title: jobCategory.name, href: `/hr/job-categories/${jobCategory.id}` },
        { title: 'Edit', href: `/hr/job-categories/${jobCategory.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        code: jobCategory.code,
        name: jobCategory.name,
        description: jobCategory.description || '',
        is_medical: jobCategory.is_medical,
        requires_str: jobCategory.requires_str,
        requires_sip: jobCategory.requires_sip,
        is_active: jobCategory.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/hr/job-categories/${jobCategory.id}`, {
            onError: () => toast.error('Gagal memperbarui kategori'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Edit ${jobCategory.name}`} />

            <FormPage
                title={`Edit ${jobCategory.name}`}
                description="Kode kategori akan digunakan untuk format NIK karyawan"
                backUrl="/hr/job-categories"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Perubahan"
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
