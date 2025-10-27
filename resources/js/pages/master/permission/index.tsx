import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData, Permission, PaginatedData } from "@/types";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Key, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface Props {
    permissions: PaginatedData<Permission>;
    modules: string[];
    filters: {
        search: string;
        module: string;
        perPage: number;
    };
}

export default function PermissionIndex({ permissions, modules, filters }: Props) {
    const { props } = usePage<SharedData>();
    const [search, setSearch] = useState(filters.search);
    const [module, setModule] = useState(filters.module);
    const [perPage, setPerPage] = useState(filters.perPage.toString());
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [newModuleName, setNewModuleName] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Permissions',
            href: '/master/permissions',
        },
    ];

    const handleSearch = (value: string) => {
        router.get(route("permissions.index"), {
            search: value,
            module: filters.module,
            perPage: filters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleModuleChange = (value: string) => {
        router.get(route("permissions.index"), {
            search: filters.search,
            module: value,
            perPage: filters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route("permissions.index"), {
            search: filters.search,
            module: filters.module,
            perPage,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search);
    };

    const handleClearSearch = () => {
        setSearch('');
        handleSearch('');
    };

    const handleDeleteClick = (permission: Permission) => {
        setPermissionToDelete(permission);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!permissionToDelete) return;

        setDeleteLoading(true);
        router.delete(route("permissions.destroy", permissionToDelete.id), {
            onSuccess: () => {
                toast.success("Permission berhasil dihapus");
                setDeleteModalOpen(false);
                setPermissionToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(", ");
                toast.error(errorMessage);
            },
            onFinish: () => {
                setDeleteLoading(false);
            },
        });
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setPermissionToDelete(null);
    };

    const handleCreateModule = () => {
        if (!newModuleName.trim()) return;
        
        // Navigate to create permission page with the new module name
        router.visit(route("permissions.create", { module: newModuleName }));
    };

    const getModuleColor = (module: string) => {
        const colors = [
            "bg-blue-100 text-blue-800",
            "bg-green-100 text-green-800",
            "bg-yellow-100 text-yellow-800",
            "bg-purple-100 text-purple-800",
            "bg-pink-100 text-pink-800",
            "bg-indigo-100 text-indigo-800",
        ];
        const hash = module.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari nama atau display name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10 w-64"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="outline" size="sm">
                            Cari
                        </Button>
                    </form>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 hover:bg-green-200"
                        onClick={() => router.visit(route("permissions.create"))}
                    >
                        <PlusCircle className="h-4 w-4 text-green-500" />
                        Tambah Permission
                    </Button>
                </div>

                {/* Secondary Filters */}
                {(modules.length > 0 || filters.search || filters.module) && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Module Filter */}
                                {modules.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Filter Module:</label>
                                        <select
                                            value={module}
                                            onChange={(e) => {
                                                setModule(e.target.value);
                                                handleModuleChange(e.target.value);
                                            }}
                                            className="rounded border px-2 py-1 text-sm bg-white"
                                        >
                                            <option value="">Semua Module</option>
                                            {modules.map((mod) => (
                                                <option key={mod} value={mod}>
                                                    {mod}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Add Module Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setModuleModalOpen(true)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <Plus className="h-3 w-3" />
                                    Tambah Module
                                </Button>

                                {/* Active filters */}
                                <div className="flex items-center gap-2">
                                    {filters.search && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-white">
                                            Search: {filters.search}
                                            <button
                                                onClick={handleClearSearch}
                                                className="ml-1 h-3 w-3 rounded-full hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    {filters.module && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-white">
                                            Module: {filters.module}
                                            <button
                                                onClick={() => handleModuleChange('')}
                                                className="ml-1 h-3 w-3 rounded-full hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Clear all filters */}
                            {(filters.search || filters.module) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setModule('');
                                        router.get(route("permissions.index"));
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Display Name</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead className="w-[150px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {permissions.data.length > 0 ? (
                                permissions.data.map((permission: Permission, index: number) => (
                                    <TableRow key={permission.id}>
                                        <TableCell>
                                            {(permissions.current_page - 1) * permissions.per_page + index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-blue-500" />
                                                <span className="font-mono text-sm">{permission.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{permission.display_name}</TableCell>
                                        <TableCell>
                                            <Badge className={getModuleColor(permission.module)}>
                                                {permission.module}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{permission.description || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {permission.roles && permission.roles.length > 0 ? (
                                                    permission.roles.map((role: any) => (
                                                        <Badge key={role.id} variant="outline" className="text-xs">
                                                            {role.display_name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">Tidak ada role</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="flex justify-end space-x-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="hover:bg-gray-200"
                                                onClick={() => router.visit(route('permissions.edit', permission.id))}
                                            >
                                                <Edit3 className="h-4 w-4 text-yellow-500" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="hover:bg-gray-200"
                                                onClick={() => handleDeleteClick(permission)}
                                            >
                                                <Trash className="h-4 w-4 text-red-500" />
                                                Hapus
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Key className="h-8 w-8 text-muted-foreground/50" />
                                            <span>Tidak ada data permission yang ditemukan</span>
                                            {(filters.search || filters.module) && (
                                                <span className="text-sm">
                                                    Coba ubah kata kunci pencarian atau hapus filter
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {permissions.from} - {permissions.to} dari {permissions.total} data
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Baris per halaman:</span>
                            <select
                                className="rounded border px-2 py-1 text-sm"
                                value={permissions.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(route("permissions.index"), {
                                    search: filters.search,
                                    module: filters.module,
                                    perPage: filters.perPage,
                                    page: permissions.current_page - 1
                                })}
                                disabled={permissions.current_page <= 1}
                            >
                                Previous
                            </Button>
                            
                            <span className="text-sm">
                                Page {permissions.current_page} of {permissions.last_page}
                            </span>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(route("permissions.index"), {
                                    search: filters.search,
                                    module: filters.module,
                                    perPage: filters.perPage,
                                    page: permissions.current_page + 1
                                })}
                                disabled={permissions.current_page >= permissions.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && handleDeleteCancel()}>
                <DialogContent className="sm:max-w-2xl top-1/8">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Permission</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus permission <strong>{permissionToDelete?.display_name}</strong>?
                            <br />
                            <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                            disabled={deleteLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash className="h-4 w-4 mr-2" />
                                    Hapus Permission
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Module Modal */}
            <Dialog open={moduleModalOpen} onOpenChange={setModuleModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Module Baru</DialogTitle>
                        <DialogDescription>
                            Buat module baru untuk mengelompokkan permission.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="moduleName" className="text-sm font-medium">
                            Nama Module
                        </Label>
                        <Input
                            id="moduleName"
                            placeholder="Contoh: users, products, orders"
                            value={newModuleName}
                            onChange={(e) => setNewModuleName(e.target.value)}
                            className="mt-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateModule();
                                }
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Anda akan diarahkan ke halaman create permission dengan module ini.
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setModuleModalOpen(false);
                                setNewModuleName('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleCreateModule}
                            disabled={!newModuleName.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Module
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
