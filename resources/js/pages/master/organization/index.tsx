import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, OrganizationUnit, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Building2, Edit3, Eye, Loader2, PlusCircle, Search, Trash, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface PaginatedOrganizationUnits {
    data: OrganizationUnit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    organizationUnits: PaginatedOrganizationUnits;
    levels: number[];
    filters: {
        search: string;
        level: string;
        perPage: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Unit Organisasi', href: '/master/organizations' },
];

export default function OrganizationIndex() {
    const { organizationUnits, levels, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters.search);
    const [level, setLevel] = useState(initialFilters.level);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        organization: OrganizationUnit | null;
        loading: boolean;
    }>({
        open: false,
        organization: null,
        loading: false,
    });

    const levelOptions: SearchableSelectOption[] = [
        { value: '', label: 'Semua Level' },
        ...levels.map((lvl) => ({
            value: lvl.toString(),
            label: `Level ${lvl}`,
        })),
    ];

    const handleSearch = (value: string, levelValue: string) => {
        router.get('/master/organizations', {
            search: value,
            level: levelValue,
            perPage: initialFilters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/master/organizations', {
            search: initialFilters.search,
            level: initialFilters.level,
            perPage,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/master/organizations', {
            search: initialFilters.search,
            level: initialFilters.level,
            perPage: initialFilters.perPage,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search, level);
    };

    const handleClearFilters = () => {
        setSearch('');
        setLevel('');
        handleSearch('', '');
    };

    const handleDeleteClick = (organization: OrganizationUnit) => {
        setDeleteDialog({
            open: true,
            organization: organization,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.organization) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        router.delete(route('organizations.destroy', deleteDialog.organization.id), {
            onSuccess: () => {
                toast.success(`Unit organisasi ${deleteDialog.organization?.name} berhasil dihapus`);
                setDeleteDialog({ open: false, organization: null, loading: false });
            },
            onError: () => {
                toast.error('Gagal menghapus unit organisasi');
                setDeleteDialog(prev => ({ ...prev, loading: false }));
            }
        });
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, organization: null, loading: false });
    };

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
            <Head title="Unit Organisasi" />
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari kode atau nama unit..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>
                        <SearchableSelect
                            options={levelOptions}
                            value={level}
                            onValueChange={setLevel}
                            placeholder="Semua Level"
                            searchPlaceholder="Cari level..."
                            className="w-[150px]"
                        />
                        <Button type="submit" variant="outline" size="sm">
                            Cari
                        </Button>
                        {(search || level) && (
                            <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                                Reset
                            </Button>
                        )}
                    </form>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 hover:bg-green-50"
                        onClick={() => router.visit('/master/organizations/create')}
                    >
                        <PlusCircle className="h-4 w-4 text-green-600" />
                        Tambah
                    </Button>
                </div>
                
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Unit</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Parent Unit</TableHead>
                                <TableHead>Kepala Unit</TableHead>
                                <TableHead>Jumlah User</TableHead>
                                <TableHead>Sub Unit</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizationUnits.data.length > 0 ? (
                                organizationUnits.data.map((org, index) => (
                                    <TableRow key={org.id}>
                                        <TableCell>
                                            {(organizationUnits.current_page - 1) * organizationUnits.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{org.code}</TableCell>
                                        <TableCell className="font-medium">{org.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getLevelBadgeColor(org.level)}>
                                                Level {org.level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {org.parent?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {org.head?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{org.users_count || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{org.children_count || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {org.is_active ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                    Nonaktif
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => router.visit(route('organizations.show', org.id))}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => router.visit(route('organizations.edit', org.id))}
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(org)}
                                                    title="Hapus"
                                                >
                                                    <Trash className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 className="h-8 w-8 text-muted-foreground/50" />
                                            <span>Tidak ada data unit organisasi</span>
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
                        Menampilkan {organizationUnits.from} - {organizationUnits.to} dari {organizationUnits.total} data
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Baris per halaman:</span>
                            <select
                                className="rounded border px-2 py-1 text-sm"
                                value={organizationUnits.per_page}
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
                                onClick={() => handlePageChange(organizationUnits.current_page - 1)}
                                disabled={organizationUnits.current_page <= 1}
                            >
                                Previous
                            </Button>
                            
                            <span className="text-sm">
                                Page {organizationUnits.current_page} of {organizationUnits.last_page}
                            </span>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(organizationUnits.current_page + 1)}
                                disabled={organizationUnits.current_page >= organizationUnits.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Unit Organisasi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus unit <strong>{deleteDialog.organization?.name}</strong>?
                            <br />
                            <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                            disabled={deleteDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteDialog.loading}
                        >
                            {deleteDialog.loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash className="h-4 w-4 mr-2" />
                                    Hapus
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

