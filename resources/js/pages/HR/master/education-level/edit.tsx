import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface EducationLevel {
    id: number;
    code: string;
    name: string;
    level: number;
    is_active: boolean;
}

interface Props {
    educationLevel: EducationLevel;
}

interface FormData {
    [key: string]: string | number | boolean;
    code: string;
    name: string;
    level: number;
    is_active: boolean;
}

export default function Edit({ educationLevel }: Props) {
    const breadcrumbs = [
        { title: <GraduationCap className="h-4 w-4" />, href: '/hr/education-levels' },
        { title: educationLevel.name, href: `/hr/education-levels/${educationLevel.id}` },
        { title: 'Edit', href: `/hr/education-levels/${educationLevel.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        code: educationLevel.code,
        name: educationLevel.name,
        level: educationLevel.level,
        is_active: educationLevel.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/hr/education-levels/${educationLevel.id}`, {
            onError: () => toast.error('Gagal memperbarui jenjang'),
        });
    };

    return (
        <HRLayout>
            <Head title={`Edit ${educationLevel.name}`} />

            <FormPage
                title={`Edit ${educationLevel.name}`}
                description="Ubah informasi jenjang pendidikan"
                backUrl="/hr/education-levels"
                onSubmit={handleSubmit}
                isLoading={processing}
                submitLabel="Simpan Perubahan"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Kode Jenjang *</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="S1"
                            maxLength={10}
                            className={errors.code ? 'border-red-500' : ''}
                        />
                        {errors.code && <small className="text-red-500">{errors.code}</small>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Jenjang *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Sarjana (S1)"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <small className="text-red-500">{errors.name}</small>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="level">Tingkat *</Label>
                        <Input
                            id="level"
                            type="number"
                            min="1"
                            max="20"
                            value={data.level}
                            onChange={(e) => setData('level', parseInt(e.target.value) || 1)}
                            className={errors.level ? 'border-red-500' : ''}
                        />
                        {errors.level && <small className="text-red-500">{errors.level}</small>}
                        <p className="text-xs text-muted-foreground">
                            Urutan tingkat pendidikan (1 = terendah)
                        </p>
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
                        Jenjang dapat dipilih untuk data karyawan
                    </p>
                </div>
            </FormPage>
        </HRLayout>
    );
}
