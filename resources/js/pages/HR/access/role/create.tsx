import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormPage } from "@/components/ui/form-page";
import { SharedData } from "@/types";
import { router, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { toast } from "sonner";
import HrLayout from "@/layouts/hr-layout";

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
}

interface Props extends SharedData {
    permissions: Permission[];
}

export default function CreateRole() {
    const { permissions } = usePage<Props>().props;
    const { data, setData, post, processing, errors } = useForm({
        display_name: '',
        description: '',
        permission_ids: [] as number[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/hr/access/roles', {
            onSuccess: () => {
                router.visit('/hr/access/roles');
            },
            onError: () => {
                toast.error('Gagal membuat role');
            }
        });
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permission_ids', [...data.permission_ids, permissionId]);
        } else {
            setData('permission_ids', data.permission_ids.filter(id => id !== permissionId));
        }
    };

    const toggleModule = (module: string) => {
        const modulePermissions = permissions.filter(p => p.module === module);
        const modulePermissionIds = modulePermissions.map(p => p.id);
        const allSelected = modulePermissionIds.every(id => data.permission_ids.includes(id));
        
        if (allSelected) {
            // Deselect all permissions in this module
            setData('permission_ids', data.permission_ids.filter(id => !modulePermissionIds.includes(id)));
        } else {
            // Select all permissions in this module
            const newPermissionIds = [...data.permission_ids];
            modulePermissionIds.forEach(id => {
                if (!newPermissionIds.includes(id)) {
                    newPermissionIds.push(id);
                }
            });
            setData('permission_ids', newPermissionIds);
        }
    };

    const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
            acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <HrLayout>
            <FormPage
            title="Tambah Role"
            description="Buat role baru dengan permissions yang sesuai"
            backUrl="/hr/access/roles"
            onSubmit={submit}
            submitLabel="Simpan"
            isLoading={processing}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Role Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            type="text"
                            value={data.display_name}
                            onChange={(e) => setData('display_name', e.target.value)}
                            placeholder="Enter role display name"
                            className={errors.display_name ? 'border-red-500' : ''}
                        />
                        {errors.display_name && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.display_name}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                            placeholder="Enter role description"
                            rows={3}
                            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? 'border-red-500' : ''}`}
                        />
                        {errors.description && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.description}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Permissions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Select the permissions that this role should have
                    </p>
                </CardHeader>
                <CardContent>
                    {errors.permission_ids && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{errors.permission_ids}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="space-y-6">
                        {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                            const modulePermissionIds = modulePermissions.map(p => p.id);
                            const allSelected = modulePermissionIds.every(id => data.permission_ids.includes(id));
                            const someSelected = modulePermissionIds.some(id => data.permission_ids.includes(id));
                            
                            return (
                                <div key={module} className="space-y-3">
                                    <div className="flex items-center space-x-2 border-b pb-2">
                                        <Checkbox
                                            id={`module-${module}`}
                                            checked={allSelected}
                                            onCheckedChange={() => toggleModule(module)}
                                        />
                                        <label
                                            htmlFor={`module-${module}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                        >
                                            {module.replace('_', ' ')}
                                        </label>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                                        {modulePermissions.map((permission) => (
                                            <div key={permission.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={data.permission_ids.includes(permission.id)}
                                                    onCheckedChange={(checked) => 
                                                        handlePermissionChange(permission.id, checked as boolean)
                                                    }
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={`permission-${permission.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {permission.display_name}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </FormPage>
        </HrLayout>
    );
}
