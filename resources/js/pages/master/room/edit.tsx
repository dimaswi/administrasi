import { FormPage } from "@/components/ui/form-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import { Room, SharedData } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

interface Props extends SharedData {
    room: Room;
}

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
        put(`/master/rooms/${room.id}`, {
            onSuccess: () => {
                toast.success('Ruangan berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui ruangan');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Edit Ruangan" />
            <FormPage
                title="Edit Ruangan"
                description="Perbarui informasi ruangan rapat"
                backUrl="/master/rooms"
                onSubmit={handleSubmit}
                submitLabel="Simpan Perubahan"
                isLoading={processing}
            >
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

                <div className="space-y-2">
                    <Label htmlFor="is_active">Status</Label>
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
                </div>
            </FormPage>
        </AppLayout>
    );
}

