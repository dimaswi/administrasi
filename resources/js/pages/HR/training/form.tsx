import { Head, Link, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { GraduationCap } from 'lucide-react';

interface TrainingData {
    id?: number;
    code: string;
    name: string;
    description: string;
    type: string;
    category: string;
    provider: string;
    duration_hours: number | null;
    cost: number | null;
    is_mandatory: boolean;
    is_active: boolean;
}

interface Props {
    types: Record<string, string>;
    categories: Record<string, string>;
    training: TrainingData | null;
}

export default function Form({ types, categories, training }: Props) {
    const isEditing = !!training?.id;

    const { data, setData, post, put, processing, errors } = useForm({
        code: training?.code || '',
        name: training?.name || '',
        description: training?.description || '',
        type: training?.type || 'internal',
        category: training?.category || 'technical',
        provider: training?.provider || '',
        duration_hours: training?.duration_hours?.toString() || '',
        cost: training?.cost?.toString() || '',
        is_mandatory: training?.is_mandatory || false,
        is_active: training?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditing) {
            put(route('hr.trainings.update', training.id));
        } else {
            post(route('hr.trainings.store'));
        }
    };

    return (
        <HRLayout>
            <Head title={isEditing ? 'Edit Training' : 'Tambah Training'} />

            <div className="pt-6">
                <FormPage
                    title={isEditing ? 'Edit Training' : 'Tambah Training'}
                    description="Isi informasi program training"
                    backUrl={isEditing ? route('hr.trainings.show', training?.id) : route('hr.trainings.index')}
                    onSubmit={handleSubmit}
                    isLoading={processing}
                    submitLabel={isEditing ? 'Simpan Perubahan' : 'Simpan Training'}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Informasi Training
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Training <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="TRN-001"
                                        className="font-mono"
                                    />
                                    {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Training <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nama program training"
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipe Training <span className="text-red-500">*</span></Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(types).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
                                    <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(categories).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provider/Penyelenggara</Label>
                                    <Input
                                        id="provider"
                                        value={data.provider}
                                        onChange={(e) => setData('provider', e.target.value)}
                                        placeholder="Nama lembaga atau penyelenggara"
                                    />
                                    {errors.provider && <p className="text-sm text-destructive">{errors.provider}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_hours">Durasi (Jam)</Label>
                                    <Input
                                        id="duration_hours"
                                        type="number"
                                        min="0"
                                        value={data.duration_hours}
                                        onChange={(e) => setData('duration_hours', e.target.value)}
                                        placeholder="0"
                                    />
                                    {errors.duration_hours && <p className="text-sm text-destructive">{errors.duration_hours}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost">Biaya (Rp)</Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        min="0"
                                        value={data.cost}
                                        onChange={(e) => setData('cost', e.target.value)}
                                        placeholder="0"
                                    />
                                    {errors.cost && <p className="text-sm text-destructive">{errors.cost}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Deskripsi dan tujuan training"
                                        rows={4}
                                    />
                                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                </div>

                                <div className="flex items-center gap-8 md:col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_mandatory"
                                            checked={data.is_mandatory}
                                            onCheckedChange={(checked) => setData('is_mandatory', checked)}
                                        />
                                        <Label htmlFor="is_mandatory">Training Wajib</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <Label htmlFor="is_active">Training Aktif</Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </FormPage>
            </div>
        </HRLayout>
    );
}
