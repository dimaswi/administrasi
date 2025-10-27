import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Users, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Props extends SharedData {
    roles: Role[];
}

export default function CreateUser() {
    const { roles } = usePage<Props>().props;
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        nip: '',
        password: '',
        password_confirmation: '',
        role_id: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.store'), {
            onSuccess: () => {
                setData({
                    name: '',
                    nip: '',
                    password: '',
                    password_confirmation: '',
                    role_id: '0',
                });
                toast.success('User berhasil dibuat!');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                
                // Show specific error messages if available
                if (Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal membuat user. Periksa kembali data yang dimasukkan.');
                } else {
                    toast.error('Terjadi kesalahan saat membuat user.');
                }
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: <Users />,
            href: '/master/users',
        },
        {
            title: 'Create User',
            href: '/master/users/create',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Tambah User Baru</h1>
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/master/users')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Form Tambah User</CardTitle>
                        <CardDescription>
                            Isi data user baru dengan lengkap dan benar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.nip}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan password"
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
                                <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Masukkan ulang password"
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

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/master/users')}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan User'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}