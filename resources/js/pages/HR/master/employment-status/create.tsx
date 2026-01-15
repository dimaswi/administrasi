import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
    [key: string]: string | boolean;
    code: string;
    name: string;
    description: string;
    is_permanent: boolean;
    is_active: boolean;
}

export default function Create() {
    const breadcrumbs = [
        { title: <FileText className="h-4 w-4" />, href: '/hr/employment-statuses' },
        { title: 'Tambah Status', href: '/hr/employment-statuses/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        code: '',
        name: '',
        description: '',
        is_permanent: false,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hr/employment-statuses', {
            onError: () => toast.error('Gagal menambahkan status'),
        });
    };

    return (
        <HRLayout>
            <Head title="Tambah Status Kepegawaian" />

            <FormPage
                title="Tambah Status Kepegawaian"
                description="Tambahkan status kepegawaian baru untuk karyawan"
                backUrl="/hr/employment-statuses"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Status"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Kode Status *</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="PNS"
                            maxLength={20}
                            className={errors.code ? 'border-red-500' : ''}
                        />
                        {errors.code && <small className="text-red-500">{errors.code}</small>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Status *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Pegawai Negeri Sipil"
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
                        placeholder="Deskripsi status kepegawaian..."
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label>Pegawai Tetap</Label>
                        <Select
                            value={data.is_permanent ? 'true' : 'false'}
                            onValueChange={(value) => setData('is_permanent', value === 'true')}
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
                            Status ini adalah pegawai tetap (bukan kontrak)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Status Aktif</Label>
                        <Select
                            value={data.is_active ? 'true' : 'false'}
                            onValueChange={(value) => setData('is_active', value === 'true')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Aktif</SelectItem>
                                <SelectItem value="false">Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Status dapat digunakan untuk karyawan baru
                        </p>
                    </div>
                </div>
            </FormPage>
        </HRLayout>
    );
}
