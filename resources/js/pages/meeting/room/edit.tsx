import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Room, SharedData } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Loader2, Save } from "lucide-react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

interface Props extends SharedData {
    room: Room;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruangan', href: '/meeting/rooms' },
    { title: 'Edit Ruangan', href: '#' },
];

export default function RoomEdit({ room }: Props) {
    const { data, setData, put, processing, errors } = useForm<{
        code: string;
        name: string;
        building: string;
        floor: string;
        capacity: string;
        facilities: string;
        description: string;
        is_active: boolean;
    }>({
        code: room.code || '',
        name: room.name || '',
        building: room.building || '',
        floor: room.floor || '',
        capacity: room.capacity?.toString() || '',
        facilities: room.facilities || '',
        description: room.description || '',
        is_active: room.is_active ?? true,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/meeting/rooms/${room.id}`, {
            onSuccess: () => {
                toast.success('Ruangan berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui ruangan');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Ruangan" />
            <div className="p-4 max-w-7xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Edit Ruangan</h2>
                    <p className="text-sm text-muted-foreground">Perbarui informasi ruangan rapat</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Kode Ruangan <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Contoh: R101, A203"
                                    className={errors.code ? 'border-red-500' : ''}
                                />
                                {errors.code && (
                                    <p className="text-sm text-red-500">{errors.code}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacity">
                                    Kapasitas <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    placeholder="Jumlah orang"
                                    className={errors.capacity ? 'border-red-500' : ''}
                                />
                                {errors.capacity && (
                                    <p className="text-sm text-red-500">{errors.capacity}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nama Ruangan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Ruang Rapat Utama, Aula Serbaguna"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="building">Gedung (Opsional)</Label>
                                <Input
                                    id="building"
                                    value={data.building}
                                    onChange={(e) => setData('building', e.target.value)}
                                    placeholder="Contoh: Gedung A, Gedung Utama"
                                />
                                {errors.building && (
                                    <p className="text-sm text-red-500">{errors.building}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="floor">Lantai (Opsional)</Label>
                                <Input
                                    id="floor"
                                    value={data.floor}
                                    onChange={(e) => setData('floor', e.target.value)}
                                    placeholder="Contoh: 1, 2, Basement"
                                />
                                {errors.floor && (
                                    <p className="text-sm text-red-500">{errors.floor}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="facilities">Fasilitas (Opsional)</Label>
                            <Textarea
                                id="facilities"
                                value={data.facilities}
                                onChange={(e) => setData('facilities', e.target.value)}
                                placeholder="Contoh: Proyektor, Whiteboard, AC, Sound System, TV LED 55 inch"
                                rows={3}
                            />
                            {errors.facilities && (
                                <p className="text-sm text-red-500">{errors.facilities}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi (Opsional)</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Deskripsi singkat tentang ruangan ini"
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
                                Ruangan Aktif
                            </Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/meeting/rooms')}
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
