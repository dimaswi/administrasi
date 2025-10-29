import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, OrganizationUnit, SharedData, User } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Loader2, Save } from "lucide-react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

interface Props extends SharedData {
    organization: OrganizationUnit;
    parentUnits: OrganizationUnit[];
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Unit Organisasi', href: '/meeting/organizations' },
    { title: 'Edit Unit Organisasi', href: '#' },
];

export default function OrganizationEdit({ organization, parentUnits, users }: Props) {
    const { data, setData, put, processing, errors } = useForm<{
        code: string;
        name: string;
        description: string;
        parent_id: string;
        level: string;
        head_id: string;
        is_active: boolean;
    }>({
        code: organization.code || '',
        name: organization.name || '',
        description: organization.description || '',
        parent_id: organization.parent_id?.toString() || '',
        level: organization.level?.toString() || '1',
        head_id: organization.head_id?.toString() || '',
        is_active: organization.is_active ?? true,
    });

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

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/meeting/organizations/${organization.id}`, {
            onSuccess: () => {
                toast.success('Unit organisasi berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui unit organisasi');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Unit Organisasi" />
            <div className="p-4 max-w-7xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Edit Unit Organisasi</h2>
                    <p className="text-sm text-muted-foreground">Perbarui informasi unit organisasi</p>
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
                            onClick={() => router.visit('/meeting/organizations')}
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
                                    Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
