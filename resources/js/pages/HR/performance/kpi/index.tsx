import { Head, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Plus,
    Edit,
    Trash2,
    Target,
    Layers,
} from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: number;
    name: string;
    code: string;
    description: string | null;
    weight: number;
    sort_order: number;
    is_active: boolean;
    templates_count: number;
}

interface Template {
    id: number;
    category_id: number;
    category_name: string;
    name: string;
    code: string;
    description: string | null;
    measurement_type: string;
    measurement_type_label: string;
    unit: string | null;
    target_min: number | null;
    target_max: number | null;
    target_range: string | null;
    weight: number;
    is_active: boolean;
}

interface Props {
    categories: Category[];
    templates: Template[];
    measurementTypes: Record<string, string>;
}

export default function Index({ categories, templates, measurementTypes }: Props) {
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    // Category Form
    const categoryForm = useForm({
        name: '',
        code: '',
        description: '',
        weight: 100,
        sort_order: 0,
        is_active: true as boolean,
    });

    // Template Form
    const templateForm = useForm({
        category_id: '',
        name: '',
        code: '',
        description: '',
        measurement_type: 'numeric',
        unit: '',
        target_min: '',
        target_max: '',
        weight: 1,
        is_active: true as boolean,
    });

    const openCategoryDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            categoryForm.setData({
                name: category.name,
                code: category.code,
                description: category.description || '',
                weight: category.weight,
                sort_order: category.sort_order,
                is_active: category.is_active,
            });
        } else {
            setEditingCategory(null);
            categoryForm.reset();
        }
        setCategoryDialogOpen(true);
    };

    const openTemplateDialog = (template?: Template) => {
        if (template) {
            setEditingTemplate(template);
            templateForm.setData({
                category_id: String(template.category_id),
                name: template.name,
                code: template.code,
                description: template.description || '',
                measurement_type: template.measurement_type,
                unit: template.unit || '',
                target_min: template.target_min ? String(template.target_min) : '',
                target_max: template.target_max ? String(template.target_max) : '',
                weight: template.weight,
                is_active: template.is_active,
            });
        } else {
            setEditingTemplate(null);
            templateForm.reset();
        }
        setTemplateDialogOpen(true);
    };

    const submitCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            categoryForm.put(route('hr.kpi.categories.update', editingCategory.id), {
                onSuccess: () => setCategoryDialogOpen(false),
            });
        } else {
            categoryForm.post(route('hr.kpi.categories.store'), {
                onSuccess: () => setCategoryDialogOpen(false),
            });
        }
    };

    const submitTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            templateForm.put(route('hr.kpi.templates.update', editingTemplate.id), {
                onSuccess: () => setTemplateDialogOpen(false),
            });
        } else {
            templateForm.post(route('hr.kpi.templates.store'), {
                onSuccess: () => setTemplateDialogOpen(false),
            });
        }
    };

    const deleteCategory = (category: Category) => {
        if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
            router.delete(route('hr.kpi.categories.destroy', category.id));
        }
    };

    const deleteTemplate = (template: Template) => {
        if (confirm(`Apakah Anda yakin ingin menghapus template "${template.name}"?`)) {
            router.delete(route('hr.kpi.templates.destroy', template.id));
        }
    };

    const categoryOptions = categories.map(c => ({ value: String(c.id), label: c.name }));
    const measurementTypeOptions = Object.entries(measurementTypes).map(([value, label]) => ({ value, label }));

    const categoryColumns = [
        {
            key: 'name',
            label: 'Nama Kategori',
            render: (item: Category) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs">{item.code}</Badge>
                    </div>
                    {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'weight',
            label: 'Bobot',
            className: 'text-center w-[100px]',
            render: (item: Category) => (
                <span className="font-medium">{item.weight}%</span>
            ),
        },
        {
            key: 'templates_count',
            label: 'Template',
            className: 'text-center w-[100px]',
            render: (item: Category) => (
                <span>{item.templates_count}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[100px]',
            render: (item: Category) => (
                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (item: Category) => (
                <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openCategoryDialog(item)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteCategory(item)} 
                        disabled={item.templates_count > 0}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const templateColumns = [
        {
            key: 'name',
            label: 'Nama KPI',
            render: (item: Template) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs">{item.code}</Badge>
                    </div>
                    {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Kategori',
            render: (item: Template) => (
                <span>{item.category_name}</span>
            ),
        },
        {
            key: 'measurement',
            label: 'Pengukuran',
            render: (item: Template) => (
                <div className="text-sm">
                    <div>{item.measurement_type_label}</div>
                    {item.target_range && (
                        <span className="text-muted-foreground">
                            Target: {item.target_range} {item.unit}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'weight',
            label: 'Bobot',
            className: 'text-center w-[80px]',
            render: (item: Template) => (
                <span>{item.weight}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[100px]',
            render: (item: Template) => (
                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (item: Template) => (
                <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openTemplateDialog(item)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteTemplate(item)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const [activeTab, setActiveTab] = useState('categories');

    return (
        <HRLayout>
            <Head title="Pengaturan KPI" />

            <div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <TabsList>
                            <TabsTrigger value="categories" className="gap-2">
                                <Layers className="w-4 h-4" />
                                Kategori ({categories.length})
                            </TabsTrigger>
                            <TabsTrigger value="templates" className="gap-2">
                                <Target className="w-4 h-4" />
                                Template ({templates.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="categories" className="mt-0">
                        <IndexPage
                            title="Kategori KPI"
                            description="Kategori untuk mengelompokkan indikator kinerja"
                            actions={[
                                {
                                    label: 'Tambah Kategori',
                                    onClick: () => openCategoryDialog(),
                                    icon: Plus,
                                },
                            ]}
                            columns={categoryColumns}
                            data={categories}
                            emptyMessage="Belum ada kategori KPI"
                            emptyIcon={Layers}
                        />
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0">
                        <IndexPage
                            title="Template KPI"
                            description="Template indikator kinerja yang dapat digunakan dalam penilaian"
                            actions={categories.length > 0 ? [
                                {
                                    label: 'Tambah Template',
                                    onClick: () => openTemplateDialog(),
                                    icon: Plus,
                                },
                            ] : undefined}
                            columns={templateColumns}
                            data={templates}
                            emptyMessage={categories.length === 0 ? 'Buat kategori terlebih dahulu' : 'Belum ada template KPI'}
                            emptyIcon={Target}
                        />
                    </TabsContent>
                </Tabs>

                {/* Category Dialog */}
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Kategori KPI' : 'Tambah Kategori KPI'}</DialogTitle>
                            <DialogDescription>
                                Kategori digunakan untuk mengelompokkan KPI berdasarkan jenis penilaian
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitCategory} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label htmlFor="cat_name">Nama Kategori</Label>
                                    <Input
                                        id="cat_name"
                                        value={categoryForm.data.name}
                                        onChange={(e) => categoryForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Kinerja Utama"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cat_code">Kode</Label>
                                    <Input
                                        id="cat_code"
                                        value={categoryForm.data.code}
                                        onChange={(e) => categoryForm.setData('code', e.target.value)}
                                        placeholder="Contoh: KPI-MAIN"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cat_weight">Bobot (%)</Label>
                                    <Input
                                        id="cat_weight"
                                        type="number"
                                        value={categoryForm.data.weight}
                                        onChange={(e) => categoryForm.setData('weight', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label htmlFor="cat_desc">Deskripsi</Label>
                                    <Textarea
                                        id="cat_desc"
                                        value={categoryForm.data.description}
                                        onChange={(e) => categoryForm.setData('description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="cat_active"
                                            checked={categoryForm.data.is_active}
                                            onCheckedChange={(checked) => categoryForm.setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="cat_active">Aktif</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={categoryForm.processing}>
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Template Dialog */}
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? 'Edit Template KPI' : 'Tambah Template KPI'}</DialogTitle>
                            <DialogDescription>
                                Template KPI akan digunakan saat membuat penilaian kinerja
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitTemplate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label htmlFor="tpl_category">Kategori</Label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        value={templateForm.data.category_id}
                                        onValueChange={(value) => templateForm.setData('category_id', value)}
                                        placeholder="Pilih kategori"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label htmlFor="tpl_name">Nama KPI</Label>
                                    <Input
                                        id="tpl_name"
                                        value={templateForm.data.name}
                                        onChange={(e) => templateForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Pencapaian Target Penjualan"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tpl_code">Kode</Label>
                                    <Input
                                        id="tpl_code"
                                        value={templateForm.data.code}
                                        onChange={(e) => templateForm.setData('code', e.target.value)}
                                        placeholder="Contoh: KPI-001"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tpl_type">Tipe Pengukuran</Label>
                                    <SearchableSelect
                                        options={measurementTypeOptions}
                                        value={templateForm.data.measurement_type}
                                        onValueChange={(value) => templateForm.setData('measurement_type', value)}
                                        placeholder="Pilih tipe"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tpl_unit">Satuan</Label>
                                    <Input
                                        id="tpl_unit"
                                        value={templateForm.data.unit}
                                        onChange={(e) => templateForm.setData('unit', e.target.value)}
                                        placeholder="Contoh: %, pcs, hari"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tpl_weight">Bobot</Label>
                                    <Input
                                        id="tpl_weight"
                                        type="number"
                                        value={templateForm.data.weight}
                                        onChange={(e) => templateForm.setData('weight', parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tpl_target_min">Target Min</Label>
                                    <Input
                                        id="tpl_target_min"
                                        type="number"
                                        step="0.01"
                                        value={templateForm.data.target_min}
                                        onChange={(e) => templateForm.setData('target_min', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tpl_target_max">Target Max</Label>
                                    <Input
                                        id="tpl_target_max"
                                        type="number"
                                        step="0.01"
                                        value={templateForm.data.target_max}
                                        onChange={(e) => templateForm.setData('target_max', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label htmlFor="tpl_desc">Deskripsi</Label>
                                    <Textarea
                                        id="tpl_desc"
                                        value={templateForm.data.description}
                                        onChange={(e) => templateForm.setData('description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="tpl_active"
                                            checked={templateForm.data.is_active}
                                            onCheckedChange={(checked) => templateForm.setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="tpl_active">Aktif</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={templateForm.processing}>
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </HRLayout>
    );
}
