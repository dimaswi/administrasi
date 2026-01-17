import HRLayout from "@/layouts/hr-layout";
import { SharedData } from "@/types";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { FormPage } from "@/components/ui/form-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

interface OrganizationUnit {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
    email: string | null;
    role_id: number | null;
    organization_unit_id: number | null;
    position: string | null;
    phone: string | null;
    is_active: boolean;
    role?: Role;
    organization_unit?: OrganizationUnit;
}

interface Props extends SharedData {
    user: User;
    roles: Role[];
    organizationUnits: OrganizationUnit[];
}

export default function EditUser() {
    const { user, roles, organizationUnits } = usePage<Props>().props;

    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name || '',
        nip: user.nip || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        role_id: user.role_id ? user.role_id.toString() : '0',
        organization_unit_id: user.organization_unit_id ? user.organization_unit_id.toString() : '',
        position: user.position || '',
        phone: user.phone || '',
        is_active: user.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/hr/access/users/${user.id}`, {
            onSuccess: () => {
                reset('password', 'password_confirmation');
                toast.success('User ' + user.name + ' berhasil diperbarui!');
            },
            onError: (errors) => {
                if (Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal memperbarui user. Periksa kembali data yang dimasukkan.');
                } else {
                    toast.error('Terjadi kesalahan saat memperbarui user.');
                }
            },
        });
    };

    return (
        <HRLayout>
            <Head title="Edit User" />
            <FormPage
                title={`Edit User: ${user.name}`}
                description="Perbarui data user. Kosongkan password jika tidak ingin mengubah password."
                backUrl="/hr/access/users"
                onSubmit={handleSubmit}
                submitLabel="Perbarui User"
                isLoading={processing}
            >
                {/* Name Field */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                    <Input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                        <small className="text-red-500">{errors.name}</small>
                    )}
                </div>

                {/* NIP Field */}
                <div className="space-y-2">
                    <Label htmlFor="nip">NIP (Nomor Induk Pegawai) <span className="text-red-500">*</span></Label>
                    <Input
                        id="nip"
                        type="text"
                        value={data.nip}
                        onChange={(e) => setData('nip', e.target.value)}
                        placeholder="Masukkan NIP"
                        className={errors.nip ? 'border-red-500' : ''}
                    />
                    {errors.nip && (
                        <small className="text-red-500">{errors.nip}</small>
                    )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Masukkan email"
                        className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                        <small className="text-red-500">{errors.email}</small>
                    )}
                </div>

                {/* Organization Unit Field */}
                <div className="space-y-2">
                    <Label htmlFor="organization_unit_id">Unit Organisasi</Label>
                    <Select value={data.organization_unit_id || ''} onValueChange={(value) => setData('organization_unit_id', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih unit organisasi" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizationUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                    {unit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Position Field */}
                <div className="space-y-2">
                    <Label htmlFor="position">Jabatan</Label>
                    <Input
                        id="position"
                        type="text"
                        value={data.position}
                        onChange={(e) => setData('position', e.target.value)}
                        placeholder="Masukkan jabatan"
                    />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                        id="phone"
                        type="text"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="Masukkan nomor telepon"
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <Label htmlFor="password">Password Baru (Opsional)</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Kosongkan jika tidak ingin mengubah password"
                        className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{errors.password}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Konfirmasi Password Baru</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Masukkan ulang password baru"
                        className={errors.password_confirmation ? 'border-red-500' : ''}
                    />
                    {errors.password_confirmation && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{errors.password_confirmation}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                    <Label htmlFor="role_id">Role</Label>
                    <Select value={data.role_id || '0'} onValueChange={(value) => setData('role_id', value)}>
                        <SelectTrigger className={errors.role_id ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Tidak ada role</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.display_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.role_id && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{errors.role_id}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Is Active Field */}
                <div className="flex items-center space-x-2">
                    <Switch
                        id="is_active"
                        checked={data.is_active}
                        onCheckedChange={(checked) => setData('is_active', checked)}
                    />
                    <Label htmlFor="is_active">User Aktif</Label>
                </div>
            </FormPage>
        </HRLayout>
    );
}
