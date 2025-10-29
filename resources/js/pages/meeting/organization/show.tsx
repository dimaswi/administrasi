import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, OrganizationUnit, SharedData, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import { Building2, Edit3, Mail, Phone, Users } from "lucide-react";

interface Props extends SharedData {
    organization: OrganizationUnit & {
        users?: User[];
        children?: OrganizationUnit[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Unit Organisasi', href: '/meeting/organizations' },
    { title: 'Detail Unit Organisasi', href: '#' },
];

export default function OrganizationShow({ organization }: Props) {
    const getLevelBadgeColor = (level: number) => {
        switch (level) {
            case 1:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 2:
                return 'bg-green-100 text-green-800 border-green-200';
            case 3:
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Unit Organisasi - ${organization.name}`} />
            <div className="p-4 max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">{organization.name}</h2>
                        <p className="text-sm text-muted-foreground">Detail informasi unit organisasi</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(`/meeting/organizations/${organization.id}/edit`)}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>

                <div className="grid gap-6">
                    {/* Informasi Umum */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informasi Umum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kode Unit</label>
                                    <p className="mt-1 font-mono text-lg">{organization.code}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Unit</label>
                                    <p className="mt-1 text-lg">{organization.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Level</label>
                                    <div className="mt-1">
                                        <Badge variant="outline" className={getLevelBadgeColor(organization.level)}>
                                            Level {organization.level}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        {organization.is_active ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Aktif
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                Nonaktif
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {organization.parent && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Parent Unit</label>
                                    <p className="mt-1">{organization.parent.name} ({organization.parent.code})</p>
                                </div>
                            )}

                            {organization.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                                    <p className="mt-1 text-sm">{organization.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Kepala Unit */}
                    {organization.head && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Kepala Unit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{organization.head.name}</p>
                                        <p className="text-sm text-muted-foreground">NIP: {organization.head.nip}</p>
                                        {organization.head.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4" />
                                                <span>{organization.head.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sub Unit */}
                    {organization.children && organization.children.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sub Unit ({organization.children.length})</CardTitle>
                                <CardDescription>Unit organisasi di bawah unit ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama Unit</TableHead>
                                                <TableHead>Level</TableHead>
                                                <TableHead>Kepala Unit</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {organization.children.map((child) => (
                                                <TableRow key={child.id}>
                                                    <TableCell className="font-mono">{child.code}</TableCell>
                                                    <TableCell className="font-medium">{child.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getLevelBadgeColor(child.level)}>
                                                            Level {child.level}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {child.head?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {child.is_active ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Daftar Pegawai */}
                    {organization.users && organization.users.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Daftar Pegawai ({organization.users.length})</CardTitle>
                                <CardDescription>Pegawai yang tergabung dalam unit ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>NIP</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Jabatan</TableHead>
                                                <TableHead>Telepon</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {organization.users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-mono">{user.nip}</TableCell>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell className="text-sm">{user.position || '-'}</TableCell>
                                                    <TableCell className="text-sm">{user.phone || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
