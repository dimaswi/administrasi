import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import HRLayout from '@/layouts/hr-layout';
import { Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Period {
    id: number;
    name: string;
    type: string;
    status: string;
}

interface Employee {
    id: number;
    employee_id: string;
    name: string;
}

interface KpiTemplate {
    id: number;
    name: string;
    code: string;
    description: string | null;
    measurement_type: string;
    unit: string | null;
    target_min: number | null;
    target_max: number | null;
    weight: number;
}

interface KpiCategory {
    id: number;
    name: string;
    code: string;
    weight: number;
    templates: KpiTemplate[];
}

interface KpiItem {
    category_id: number;
    template_id: number | null;
    name: string;
    description: string;
    measurement_type: string;
    unit: string;
    target: string;
    weight: number;
}

interface Props {
    periods: Period[];
    employees: Employee[];
    categories: KpiCategory[];
    measurementTypes: Record<string, string>;
    review: null;
    preselectedPeriodId: string | null;
    preselectedEmployeeId: string | null;
}

export default function Form({ periods, employees, categories, measurementTypes, preselectedPeriodId, preselectedEmployeeId }: Props) {
    const [items, setItems] = useState<KpiItem[]>([]);
    const [periodId, setPeriodId] = useState(preselectedPeriodId || '');
    const [employeeId, setEmployeeId] = useState(preselectedEmployeeId || '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addFromTemplate = (template: KpiTemplate, categoryId: number) => {
        const newItem: KpiItem = {
            category_id: categoryId,
            template_id: template.id,
            name: template.name,
            description: template.description || '',
            measurement_type: template.measurement_type,
            unit: template.unit || '',
            target: template.target_min ? String(template.target_min) : '',
            weight: template.weight,
        };
        setItems([...items, newItem]);
    };

    const addCustomItem = (categoryId: number) => {
        const newItem: KpiItem = {
            category_id: categoryId,
            template_id: null,
            name: '',
            description: '',
            measurement_type: 'numeric',
            unit: '',
            target: '',
            weight: 1,
        };
        setItems([...items, newItem]);
    };

    const updateItem = (index: number, field: keyof KpiItem, value: string | number | null) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Build form data with items as indexed array
        const formData: Record<string, string | number | null> = {
            period_id: periodId,
            employee_id: employeeId,
        };

        items.forEach((item, index) => {
            formData[`items[${index}][category_id]`] = item.category_id;
            formData[`items[${index}][template_id]`] = item.template_id;
            formData[`items[${index}][name]`] = item.name;
            formData[`items[${index}][description]`] = item.description;
            formData[`items[${index}][measurement_type]`] = item.measurement_type;
            formData[`items[${index}][unit]`] = item.unit;
            formData[`items[${index}][target]`] = item.target;
            formData[`items[${index}][weight]`] = item.weight;
        });

        router.post(route('hr.performance-reviews.store'), formData, {
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
            },
            onFinish: () => {
                setIsProcessing(false);
            },
        });
    };

    const periodOptions = periods.map((p) => ({ value: String(p.id), label: p.name }));
    const employeeOptions = employees.map((e) => ({ value: String(e.id), label: `${e.employee_id} - ${e.name}` }));
    const measurementTypeOptions = Object.entries(measurementTypes).map(([value, label]) => ({ value, label }));

    const getItemsByCategory = (categoryId: number) => {
        return items.filter((item) => item.category_id === categoryId);
    };

    return (
        <HRLayout>
            <Head title="Buat Penilaian Kinerja" />

            <FormPage
                title="Buat Penilaian Kinerja"
                description="Buat penilaian kinerja baru untuk karyawan"
                backUrl={route('hr.performance-reviews.index')}
                onSubmit={handleSubmit}
                isLoading={isProcessing}
                submitLabel="Simpan Penilaian"
            >
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <Label htmlFor="period_id">Periode Penilaian</Label>
                            <SearchableSelect
                                options={periodOptions}
                                value={periodId}
                                onValueChange={(value) => setPeriodId(value)}
                                placeholder="Pilih periode"
                            />
                            {errors.period_id && <p className="mt-1 text-sm text-red-500">{errors.period_id}</p>}
                        </div>
                        <div>
                            <Label htmlFor="employee_id">Karyawan</Label>
                            <SearchableSelect
                                options={employeeOptions}
                                value={employeeId}
                                onValueChange={(value) => setEmployeeId(value)}
                                placeholder="Pilih karyawan"
                            />
                            {errors.employee_id && <p className="mt-1 text-sm text-red-500">{errors.employee_id}</p>}
                        </div>
                    </div>

                    {/* KPI Items by Category */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Indikator Kinerja (KPI)</h3>
                        {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}

                        {categories.map((category) => (
                            <Card key={category.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                {category.name}
                                                <Badge variant="outline">{category.code}</Badge>
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">Bobot: {category.weight}%</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {category.templates.length > 0 && (
                                                <div className="flex gap-1">
                                                    {category.templates.map((template) => (
                                                        <Button
                                                            key={template.id}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => addFromTemplate(template, category.id)}
                                                            disabled={items.some((i) => i.template_id === template.id)}
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            {template.code}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                            <Button type="button" variant="outline" size="sm" onClick={() => addCustomItem(category.id)}>
                                                <Plus className="mr-1 h-3 w-3" />
                                                Custom
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {getItemsByCategory(category.id).length === 0 ? (
                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                Klik tombol di atas untuk menambahkan KPI
                                            </p>
                                        ) : (
                                            getItemsByCategory(category.id).map((item, idx) => {
                                                const globalIndex = items.indexOf(item);
                                                return (
                                                    <div key={globalIndex} className="space-y-3 rounded-lg border p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
                                                                <div className="md:col-span-2">
                                                                    <Label className="text-xs">Nama KPI</Label>
                                                                    <Input
                                                                        value={item.name}
                                                                        onChange={(e) => updateItem(globalIndex, 'name', e.target.value)}
                                                                        placeholder="Nama indikator"
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Tipe</Label>
                                                                    <SearchableSelect
                                                                        options={measurementTypeOptions}
                                                                        value={item.measurement_type}
                                                                        onValueChange={(value) => updateItem(globalIndex, 'measurement_type', value)}
                                                                        placeholder="Tipe"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Target</Label>
                                                                    <div className="flex gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            value={item.target}
                                                                            onChange={(e) => updateItem(globalIndex, 'target', e.target.value)}
                                                                            placeholder="0"
                                                                            className="h-8"
                                                                        />
                                                                        <Input
                                                                            value={item.unit}
                                                                            onChange={(e) => updateItem(globalIndex, 'unit', e.target.value)}
                                                                            placeholder="unit"
                                                                            className="h-8 w-16"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="ml-2"
                                                                onClick={() => removeItem(globalIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                                            <div className="md:col-span-3">
                                                                <Label className="text-xs">Deskripsi</Label>
                                                                <Input
                                                                    value={item.description}
                                                                    onChange={(e) => updateItem(globalIndex, 'description', e.target.value)}
                                                                    placeholder="Deskripsi atau cara pengukuran"
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Bobot</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.weight}
                                                                    onChange={(e) => updateItem(globalIndex, 'weight', parseInt(e.target.value) || 1)}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {categories.length === 0 && (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    Belum ada kategori KPI. Silakan buat kategori KPI terlebih dahulu di menu{' '}
                                    <a href={route('hr.kpi.index')} className="text-blue-600 hover:underline">
                                        Pengaturan KPI
                                    </a>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Summary */}
                    {items.length > 0 && (
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm">
                                <strong>Total KPI:</strong> {items.length} indikator •<strong> Total Bobot:</strong>{' '}
                                {items.reduce((sum, item) => sum + item.weight, 0)}
                            </p>
                        </div>
                    )}
                </div>
            </FormPage>
        </HRLayout>
    );
}
