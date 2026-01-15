import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Scale, Filter, Info } from 'lucide-react';
import { useState } from 'react';

interface Period {
    id: number;
    name: string;
    status: string;
}

interface Facilitator {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    periods: Period[];
    facilitators: Facilitator[];
    units: Unit[];
    grades: Record<string, string>;
    session: null;
}

export default function Form({ periods, facilitators, units, grades }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        period_id: '',
        description: '',
        scheduled_date: '',
        facilitator_id: '',
    });
    
    const [unitIds, setUnitIds] = useState<number[]>([]);
    const [includeGrades, setIncludeGrades] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        
        router.post(route('hr.calibration.store'), {
            ...formData,
            period_id: Number(formData.period_id),
            facilitator_id: formData.facilitator_id ? Number(formData.facilitator_id) : null,
            unit_ids: unitIds,
            include_grades: includeGrades,
        }, {
            onFinish: () => setProcessing(false),
            onError: (err) => setErrors(err),
        });
    };

    const toggleUnit = (unitId: number) => {
        setUnitIds(prev => 
            prev.includes(unitId)
                ? prev.filter(id => id !== unitId)
                : [...prev, unitId]
        );
    };

    const toggleGrade = (grade: string) => {
        setIncludeGrades(prev => 
            prev.includes(grade)
                ? prev.filter(g => g !== grade)
                : [...prev, grade]
        );
    };

    return (
        <HRLayout>
            <Head title="Buat Sesi Kalibrasi" />

            <div className="pt-6">
                <FormPage
                    title="Buat Sesi Kalibrasi"
                    description="Buat sesi kalibrasi baru untuk menyelaraskan penilaian kinerja"
                    backUrl={route('hr.calibration.index')}
                    onSubmit={handleSubmit}
                    isLoading={processing}
                    submitLabel="Buat Sesi"
                >
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>Data dasar sesi kalibrasi</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Sesi *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: Kalibrasi Q4 2024 - Engineering"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="period_id">Periode Penilaian *</Label>
                                    <SearchableSelect
                                        value={formData.period_id}
                                        onValueChange={(value) => setFormData({ ...formData, period_id: value })}
                                        placeholder="Pilih Periode"
                                        options={periods.map(p => ({ value: String(p.id), label: p.name }))}
                                    />
                                    {errors.period_id && <p className="text-sm text-red-500">{errors.period_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi atau tujuan sesi kalibrasi..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_date">Tanggal Pelaksanaan</Label>
                                    <Input
                                        id="scheduled_date"
                                        type="date"
                                        value={formData.scheduled_date}
                                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="facilitator_id">Fasilitator</Label>
                                    <SearchableSelect
                                        value={formData.facilitator_id}
                                        onValueChange={(value) => setFormData({ ...formData, facilitator_id: value })}
                                        placeholder="Pilih Fasilitator"
                                        options={[
                                            { value: '', label: 'Tidak ada' },
                                            ...facilitators.map(f => ({ value: String(f.id), label: f.name })),
                                        ]}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filter Review */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filter Review yang Akan Dikalibrasi
                            </CardTitle>
                            <CardDescription>
                                Pilih kriteria untuk menentukan review mana yang akan dimasukkan dalam sesi kalibrasi
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Units Filter */}
                            <div className="space-y-3">
                                <Label>Unit Kerja (Kosongkan untuk semua unit)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {units.map((unit) => (
                                        <Badge
                                            key={unit.id}
                                            variant={unitIds.includes(unit.id) ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => toggleUnit(unit.id)}
                                        >
                                            {unit.name}
                                        </Badge>
                                    ))}
                                </div>
                                {unitIds.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Semua unit kerja akan dimasukkan</p>
                                )}
                            </div>

                            {/* Grades Filter */}
                            <div className="space-y-3">
                                <Label>Grade yang Disertakan</Label>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(grades).map(([grade, label]) => (
                                        <label key={grade} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={includeGrades.includes(grade)}
                                                onCheckedChange={() => toggleGrade(grade)}
                                            />
                                            <span className="text-sm">{label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.include_grades && <p className="text-sm text-red-500">{errors.include_grades}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info */}
                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-medium mb-1">Catatan:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Hanya review dengan status "Review Atasan", "Kalibrasi", atau "Selesai" yang akan dimasukkan</li>
                                        <li>Review harus memiliki nilai akhir (final_score) untuk bisa dikalibrasi</li>
                                        <li>Setelah sesi dibuat, Anda dapat memulai proses kalibrasi</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </FormPage>
            </div>
        </HRLayout>
    );
}
