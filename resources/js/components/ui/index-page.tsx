import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Link } from "@inertiajs/react";
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight,
    Plus,
    Filter,
    ChevronDown,
    RotateCcw,
    LucideIcon
} from "lucide-react";

// ============ Types ============

interface Column<T> {
    key: string;
    label: string;
    className?: string;
    render?: (item: T) => React.ReactNode;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
}

interface FilterOption {
    value: string;
    label: string;
}

interface FilterField {
    key: string;
    label?: string;
    type: "text" | "select";
    placeholder?: string;
    options?: FilterOption[];
    className?: string;
}

interface PageAction {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
}

interface IndexPageProps<T> {
    // Header
    title: string;
    description?: string;
    actions?: PageAction[];
    
    // Data
    data: T[];
    columns: Column<T>[];
    
    // Pagination
    pagination?: Pagination;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    
    // Filter
    filterFields?: FilterField[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;
    onFilterSubmit?: () => void;
    onFilterReset?: () => void;
    
    // Search (separate from filter)
    searchValue?: string;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    
    // States
    emptyMessage?: string;
    emptyIcon?: LucideIcon;
    isLoading?: boolean;
}

// ============ Component ============

export function IndexPage<T extends { id: number | string }>({
    title,
    description,
    actions,
    data,
    columns,
    pagination,
    onPageChange,
    onPerPageChange,
    filterFields,
    filterValues = {},
    onFilterChange,
    onFilterSubmit,
    onFilterReset,
    searchValue,
    searchPlaceholder = "Cari...",
    onSearchChange,
    emptyMessage = "Tidak ada data",
    emptyIcon: EmptyIcon,
    isLoading = false,
}: IndexPageProps<T>) {
    const [filterOpen, setFilterOpen] = React.useState(false);
    
    const hasActiveFilters = Object.entries(filterValues).some(
        ([key, v]) => key !== 'search' && v && v !== "" && v !== "all"
    );

    const activeFilterCount = Object.entries(filterValues).filter(
        ([key, v]) => key !== 'search' && v && v !== "" && v !== "all"
    ).length;

    return (
        <Card>
            {/* Card Header */}
            <CardHeader className="bg-muted/40 border-b py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{title}</CardTitle>
                        {description && (
                            <CardDescription>{description}</CardDescription>
                        )}
                    </div>
                    
                    {/* Actions + Filter Button */}
                    <div className="flex items-center gap-2">
                        {filterFields && filterFields.length > 0 && (
                            <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filter
                                        {activeFilterCount > 0 && (
                                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                        <ChevronDown className={cn(
                                            "h-4 w-4 transition-transform",
                                            filterOpen && "rotate-180"
                                        )} />
                                    </Button>
                                </CollapsibleTrigger>
                            </Collapsible>
                        )}
                        {actions && actions.map((action, index) => {
                            const Icon = action.icon || Plus;
                            if (action.href) {
                                return (
                                    <Button key={index} variant={action.variant || "default"} size="sm" asChild>
                                        <Link href={action.href}>
                                            <Icon className="h-4 w-4 mr-2" />
                                            {action.label}
                                        </Link>
                                    </Button>
                                );
                            }
                            return (
                                <Button 
                                    key={index} 
                                    variant={action.variant || "default"}
                                    size="sm"
                                    onClick={action.onClick}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                {/* Search Bar */}
                {onSearchChange && (
                    <div className="mb-4">
                        <Input
                            value={searchValue || ""}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onFilterSubmit?.()}
                            placeholder={searchPlaceholder}
                            className="h-9 max-w-sm"
                        />
                    </div>
                )}

                {/* Collapsible Filter */}
                {filterFields && filterFields.length > 0 && (
                    <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                        <CollapsibleContent>
                            <div className="mb-4 p-4 rounded-lg border bg-muted/20">
                                <div className="flex flex-wrap items-end gap-3">
                                        {filterFields.map((field) => (
                                            <div key={field.key} className="space-y-1.5">
                                                {field.label && (
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        {field.label}
                                                    </label>
                                                )}
                                                {field.type === "select" && field.options && (
                                                    <Select 
                                                        value={filterValues[field.key] || "all"} 
                                                        onValueChange={(val) => onFilterChange?.(field.key, val === "all" ? "" : val)}
                                                    >
                                                        <SelectTrigger className={cn("h-9 w-[180px]", field.className)}>
                                                            <SelectValue placeholder={field.placeholder || "Pilih..."} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">{field.placeholder || "Semua"}</SelectItem>
                                                            {field.options.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                {field.type === "text" && (
                                                    <Input
                                                        value={filterValues[field.key] || ""}
                                                        onChange={(e) => onFilterChange?.(field.key, e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && onFilterSubmit?.()}
                                                        placeholder={field.placeholder}
                                                        className={cn("h-9 w-[180px]", field.className)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Button onClick={onFilterSubmit} size="sm" className="h-9">
                                                Terapkan
                                            </Button>
                                            {hasActiveFilters && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={onFilterReset}
                                                    className="h-9"
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1.5" />
                                                    Reset
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                {columns.map((column) => (
                                    <TableHead key={column.key} className={cn("font-medium text-muted-foreground", column.className)}>
                                        {column.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            Memuat data...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            {EmptyIcon && <EmptyIcon className="h-10 w-10 opacity-40" />}
                                            <span>{emptyMessage}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50">
                                        {columns.map((column) => (
                                            <TableCell key={column.key} className={column.className}>
                                                {column.render 
                                                    ? column.render(item) 
                                                    : (item as any)[column.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {pagination && pagination.total > 0 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                        <span>
                            Menampilkan {pagination.from || 1} - {pagination.to || data.length} dari {pagination.total}
                        </span>
                        <div className="flex items-center gap-2">
                            {onPerPageChange && (
                                <Select 
                                    value={pagination.per_page.toString()} 
                                    onValueChange={(val) => onPerPageChange(parseInt(val))}
                                >
                                    <SelectTrigger className="w-[70px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            {pagination.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onPageChange?.(1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onPageChange?.(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="px-3 text-sm">
                                        Halaman {pagination.current_page} dari {pagination.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onPageChange?.(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onPageChange?.(pagination.last_page)}
                                        disabled={pagination.current_page === pagination.last_page}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
