import { Badge } from "@/components/ui/badge";
import { FormPage } from "@/components/ui/form-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Permission } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface Props {
    permission: Permission;
    modules: string[];
}

export default function PermissionEdit({ permission, modules }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name || "",
        display_name: permission.display_name || "",
        description: permission.description || "",
        module: permission.module || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("permissions.update", permission.id), {
            onSuccess: () => {
                toast.success("Permission berhasil diperbarui");
            },
            onError: () => {
                toast.error("Gagal memperbarui permission");
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Edit Permission" />

            <FormPage
                title="Edit Permission"
                backUrl={route("permissions.index")}
                onSubmit={handleSubmit}
                submitLabel="Simpan Perubahan"
                isLoading={processing}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Permission Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Contoh: users.create"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                        <p className="text-xs text-gray-500">
                            Gunakan format: module.action (contoh: users.create, posts.edit)
                        </p>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="display_name">
                            Display Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="display_name"
                            type="text"
                            placeholder="Contoh: Buat User"
                            value={data.display_name}
                            onChange={(e) => setData("display_name", e.target.value)}
                            className={errors.display_name ? "border-red-500" : ""}
                        />
                        {errors.display_name && (
                            <p className="text-sm text-red-500">{errors.display_name}</p>
                        )}
                        <p className="text-xs text-gray-500">
                            Nama yang akan ditampilkan di interface
                        </p>
                    </div>

                    {/* Module */}
                    <div className="space-y-2">
                        <Label htmlFor="module">
                            Module <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex space-x-2">
                            <Input
                                id="module"
                                type="text"
                                placeholder="Masukkan module baru..."
                                value={data.module}
                                onChange={(e) => setData("module", e.target.value)}
                                className={errors.module ? "border-red-500" : ""}
                            />
                        </div>
                        {errors.module && (
                            <p className="text-sm text-red-500">{errors.module}</p>
                        )}
                        {modules.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Module yang tersedia:</p>
                                <div className="flex flex-wrap gap-1">
                                    {modules.map((module) => (
                                        <Badge
                                            key={module}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-gray-100"
                                            onClick={() => setData("module", module)}
                                        >
                                            {module}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            placeholder="Deskripsi permission (opsional)"
                            value={data.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData("description", e.target.value)}
                            rows={4}
                            className={`w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.description ? "border-red-500" : "border-gray-300"}`}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description}</p>
                        )}
                    </div>
                </div>

                {/* Permission Info */}
                {permission.roles && permission.roles.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">
                            Permission ini digunakan oleh role:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {permission.roles.map((role: any) => (
                                <Badge key={role.id} className="bg-blue-100 text-blue-800">
                                    {role.display_name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </FormPage>
        </AppLayout>
    );
}
