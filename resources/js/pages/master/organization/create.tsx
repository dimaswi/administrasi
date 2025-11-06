import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, OrganizationUnit, SharedData, User } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Loader2, Save, Upload, X } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";

interface Props extends SharedData {
    parentUnits: OrganizationUnit[];
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Unit Organisasi', href: '/master/organizations' },
    { title: 'Tambah Unit Organisasi', href: '/master/organizations/create' },
];

export default function OrganizationCreate({ parentUnits, users }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        name: string;
        description: string;
        letterhead_image?: File | null;
        parent_id: string;
        level: string;
        head_id: string;
        is_active: boolean;
    }>({
        code: '',
        name: '',
        description: '',
        letterhead_image: null,
        parent_id: '',
        level: '1',
        head_id: '',
        is_active: true,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const levelOptions: SearchableSelectOption[] = [
        { value: '1', label: 'Level 1 - Top Level' },
        { value: '2', label: 'Level 2 - Division' },
        { value: '3', label: 'Level 3 - Sub Division' },
        { value: '4', label: 'Level 4 - Section' },
    ];

    const parentUnitOptions: SearchableSelectOption[] = [
        { value: '', label: 'Tidak Ada Parent' },
        ...parentUnits.map((unit) => ({
            value: unit.id.toString(),
            label: `[${unit.code}] ${unit.name}`,
            description: `Level ${unit.level}`,
        })),
    ];

    const userOptions: SearchableSelectOption[] = [
        { value: '', label: 'Belum Ada Kepala Unit' },
        ...users.map((user) => ({
            value: user.id.toString(),
            label: user.name,
            description: user.nip,
        })),
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('letterhead_image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData('letterhead_image', null);
        setPreviewUrl(null);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/master/organizations', {
            onSuccess: () => {
                toast.success('Unit organisasi berhasil ditambahkan');
            },
            onError: () => {
                toast.error('Gagal menambahkan unit organisasi');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Unit Organisasi" />
            <div className="p-4 max-w-7xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Tambah Unit Organisasi</h2>
                    <p className="text-sm text-muted-foreground">Tambahkan unit organisasi baru ke dalam sistem</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Kode Unit <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Contoh: IT, SDM, KEU"
                                    className={errors.code ? 'border-red-500' : ''}
                                />
                                {errors.code && (
                                    <p className="text-sm text-red-500">{errors.code}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="level">
                                    Level <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={levelOptions}
                                    value={data.level}
                                    onValueChange={(value) => setData('level', value)}
                                    placeholder="Pilih level"
                                    searchPlaceholder="Cari level..."
                                    className={errors.level ? 'border-red-500' : ''}
                                />
                                {errors.level && (
                                    <p className="text-sm text-red-500">{errors.level}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nama Unit <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Divisi Teknologi Informasi"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parent_id">Parent Unit (Opsional)</Label>
                            <SearchableSelect
                                options={parentUnitOptions}
                                value={data.parent_id}
                                onValueChange={(value) => setData('parent_id', value)}
                                placeholder="Pilih parent unit (jika ada)"
                                searchPlaceholder="Cari unit..."
                            />
                            {errors.parent_id && (
                                <p className="text-sm text-red-500">{errors.parent_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="head_id">Kepala Unit (Opsional)</Label>
                            <SearchableSelect
                                options={userOptions}
                                value={data.head_id}
                                onValueChange={(value) => setData('head_id', value)}
                                placeholder="Pilih kepala unit (jika ada)"
                                searchPlaceholder="Cari pegawai..."
                            />
                            {errors.head_id && (
                                <p className="text-sm text-red-500">{errors.head_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi (Opsional)</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Deskripsi singkat tentang unit organisasi ini"
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="letterhead_image">Kop Surat (Opsional)</Label>
                            <p className="text-sm text-muted-foreground">
                                Upload gambar kop surat yang akan digunakan pada undangan rapat. Format: JPG, PNG. Maksimal 2MB.
                            </p>
                            <div className="mt-2">
                                {previewUrl ? (
                                    <div className="relative inline-block">
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview kop surat" 
                                            className="max-w-full h-auto border rounded-lg max-h-48"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={handleRemoveImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="letterhead_image"
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg"
                                            onChange={handleFileChange}
                                            className={errors.letterhead_image ? 'border-red-500' : ''}
                                        />
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {errors.letterhead_image && (
                                <p className="text-sm text-red-500">{errors.letterhead_image}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">
                                Unit Aktif
                            </Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/master/organizations')}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

