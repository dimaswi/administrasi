import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Share2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BreadcrumbItem } from '@/types';

interface OrganizationUnit {
    id: number;
    code: string;
    name: string;
    description: string | null;
    level: number;
    parent_id: number | null;
    is_active: boolean;
    full_path?: string;
}

interface Template {
    id: number;
    name: string;
    code: string;
    category: string | null;
    description: string | null;
}

interface Props {
    template: Template;
    organizationUnits: OrganizationUnit[];
}

export default function ShareTemplate({ template, organizationUnits }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        organization_unit_ids: number[];
        keep_original_name: boolean;
    }>({
        organization_unit_ids: [],
        keep_original_name: false,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Template', href: '/arsip/templates' },
        { title: template.name, href: `/arsip/templates/${template.id}` },
        { title: 'Bagikan', href: `/arsip/templates/${template.id}/share` },
    ];

    const handleToggleOrganization = (orgId: number) => {
        setData('organization_unit_ids', 
            data.organization_unit_ids.includes(orgId)
                ? data.organization_unit_ids.filter(id => id !== orgId)
                : [...data.organization_unit_ids, orgId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.organization_unit_ids.length === 0) {
            toast.error('Pilih minimal 1 organization unit');
            return;
        }

        post(`/arsip/templates/${template.id}/share`, {
            onSuccess: () => {
            },
            onError: (errors) => {
                toast.error('Gagal membagikan template');
            },
        });
    };

    // Group by level
    const groupedOrganizations = organizationUnits.reduce((acc, org) => {
        if (!acc[org.level]) {
            acc[org.level] = [];
        }
        acc[org.level].push(org);
        return acc;
    }, {} as Record<number, OrganizationUnit[]>);

    const getLevelLabel = (level: number) => {
        switch (level) {
            case 1: return 'Level 1 (Kantor/Dinas)';
            case 2: return 'Level 2 (Bidang/Bagian)';
            case 3: return 'Level 3 (Seksi/Sub-Bagian)';
            default: return `Level ${level}`;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Bagikan Template: ${template.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bagikan Template</h1>
                        <p className="text-muted-foreground mt-2">
                            Bagikan template "{template.name}" ke organization unit lain
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(`/arsip/templates/${template.id}`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                <Separator />

                {/* Template Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Template</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nama Template</p>
                                <p className="font-medium">{template.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Kode</p>
                                <p className="font-medium">{template.code}</p>
                            </div>
                            {template.category && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Kategori</p>
                                    <p className="font-medium">{template.category}</p>
                                </div>
                            )}
                        </div>
                        {template.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">Deskripsi</p>
                                <p className="text-sm">{template.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Share Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pilih Organization Unit Tujuan</CardTitle>
                            <CardDescription>
                                Template akan diduplikasi ke organization unit yang dipilih. 
                                Setiap organization akan memiliki copy independen dari template ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Keep Original Name Option */}
                            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                                <Checkbox 
                                    id="keep_original_name"
                                    checked={data.keep_original_name}
                                    onCheckedChange={(checked) => setData('keep_original_name', !!checked)}
                                />
                                <Label htmlFor="keep_original_name" className="cursor-pointer">
                                    Gunakan nama template asli (tanpa sufiks "dari [unit]")
                                </Label>
                            </div>

                            {/* Organization Units List */}
                            {Object.keys(groupedOrganizations).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Tidak ada organization unit lain yang tersedia</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.keys(groupedOrganizations).sort().map(levelKey => {
                                        const level = parseInt(levelKey);
                                        const organizations = groupedOrganizations[level];

                                        return (
                                            <div key={level} className="space-y-3">
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {getLevelLabel(level)}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {organizations.map(org => (
                                                        <div
                                                            key={org.id}
                                                            className={`
                                                                flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors
                                                                ${data.organization_unit_ids.includes(org.id)
                                                                    ? 'bg-primary/5 border-primary'
                                                                    : 'hover:bg-muted/50'
                                                                }
                                                            `}
                                                        >
                                                            <Checkbox
                                                                checked={data.organization_unit_ids.includes(org.id)}
                                                                onCheckedChange={() => handleToggleOrganization(org.id)}
                                                            />
                                                            <div 
                                                                className="flex-1 min-w-0 cursor-pointer"
                                                                onClick={() => handleToggleOrganization(org.id)}
                                                            >
                                                                <p className="font-medium">{org.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {org.code}
                                                                </p>
                                                                {org.description && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {org.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {errors.organization_unit_ids && (
                                <p className="text-sm text-destructive">{errors.organization_unit_ids}</p>
                            )}

                            {/* Selected Count */}
                            {data.organization_unit_ids.length > 0 && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>{data.organization_unit_ids.length}</strong> organization unit dipilih
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/arsip/templates/${template.id}`)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.organization_unit_ids.length === 0}
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            {processing ? 'Membagikan...' : 'Bagikan Template'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
