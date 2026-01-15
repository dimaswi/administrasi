import { Head, useForm, router, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Checkbox } from '@/components/ui/checkbox';

interface PeriodData {
    id: number;
    name: string;
    type: string;
    start_date: string;
    end_date: string;
    description: string | null;
    status: string;
    is_current: boolean;
}

interface Props {
    types: Record<string, string>;
    period: PeriodData | null;
}

export default function Form({ types, period }: Props) {
    const isEdit = !!period;

    const { data, setData, post, put, processing, errors } = useForm({
        name: period?.name || '',
        type: period?.type || 'yearly',
        start_date: period?.start_date || '',
        end_date: period?.end_date || '',
        description: period?.description || '',
        status: period?.status || 'draft',
        is_current: period?.is_current || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route('hr.performance-periods.update', period.id));
        } else {
            post(route('hr.performance-periods.store'));
        }
    };

    const typeOptions = Object.entries(types).map(([value, label]) => ({ value, label }));
    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Aktif' },
        { value: 'closed', label: 'Selesai' },
    ];

    return (
        <HRLayout>
            <Head title={isEdit ? 'Edit Periode Penilaian' : 'Tambah Periode Penilaian'} />

            <div className="pt-6">
                <FormPage
                    title={isEdit ? 'Edit Periode Penilaian' : 'Tambah Periode Penilaian'}
                    description={isEdit ? 'Perbarui data periode penilaian' : 'Tambah periode penilaian kinerja baru'}
                    backUrl={route('hr.performance-periods.index')}
                    onSubmit={handleSubmit}
                    isLoading={processing}
                    submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan'}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Label htmlFor="name">Nama Periode</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Penilaian Q1 2026"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="type">Tipe Periode</Label>
                            <SearchableSelect
                                options={typeOptions}
                                value={data.type}
                                onValueChange={(value) => setData('type', value)}
                                placeholder="Pilih tipe periode"
                            />
                            {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
                        </div>

                        {isEdit && (
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <SearchableSelect
                                    options={statusOptions}
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                    placeholder="Pilih status"
                                />
                                {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="start_date">Tanggal Mulai</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className={errors.start_date ? 'border-red-500' : ''}
                            />
                            {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
                        </div>

                        <div>
                            <Label htmlFor="end_date">Tanggal Selesai</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className={errors.end_date ? 'border-red-500' : ''}
                            />
                            {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Deskripsi periode penilaian (opsional)"
                                rows={3}
                            />
                            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_current"
                                    checked={data.is_current}
                                    onCheckedChange={(checked) => setData('is_current', !!checked)}
                                />
                                <Label htmlFor="is_current" className="cursor-pointer">
                                    Jadikan sebagai periode aktif saat ini
                                </Label>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Periode aktif akan digunakan sebagai default saat membuat penilaian baru
                            </p>
                        </div>
                    </div>
                </FormPage>
            </div>
        </HRLayout>
    );
}
