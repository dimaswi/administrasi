import AppLayout from "@/layouts/app-layout";
import { SharedData } from "@/types";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { FormPage } from "@/components/ui/form-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
    role_id: number | null;
    role?: Role;
    created_at: string;
    updated_at: string;
}

interface Props extends SharedData {
    user: User;
    roles: Role[];
}

export default function EditUser() {
    const { user, roles } = usePage<Props>().props;
    
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name || '',
        nip: user.nip || '',
        password: '',
        password_confirmation: '',
        role_id: user.role_id ? user.role_id.toString() : '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id), {
            onSuccess: () => {
                reset('password', 'password_confirmation');
                toast.success('User ' + user.name + ' berhasil diperbarui!');
                router.visit('/master/users');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                
                // Show specific error messages if available
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
        <AppLayout>
            <Head title="Edit User" />
            <FormPage
                title={`Edit User: ${user.name}`}
                description="Perbarui data user. Kosongkan password jika tidak ingin mengubah password."
                backUrl="/master/users"
                onSubmit={handleSubmit}
                submitLabel="Perbarui User"
                isLoading={processing}
            >
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
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
                                <Label htmlFor="nip">NIP (Nomor Induk Pegawai)</Label>
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
                                    <Alert variant="destructive">
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
                                    <Alert variant="destructive">
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
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.role_id}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
            </FormPage>
        </AppLayout>
    );
}