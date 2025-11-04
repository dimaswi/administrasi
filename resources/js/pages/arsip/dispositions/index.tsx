import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock, Eye, FileSignature, Filter, Mail, Search, User } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface IncomingLetter {
    id: number;
    incoming_number: string;
    sender: string;
    subject: string;
}

interface Disposition {
    id: number;
    incoming_letter: IncomingLetter;
    parent_disposition_id: number | null;
    instruction: string;
    priority: 'normal' | 'high' | 'urgent';
    deadline: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    notes: string | null;
    read_at: string | null;
    completed_at: string | null;
    from_user: User;
    to_user: User;
    follow_ups_count: number;
    created_at: string;
}

interface Filters {
    search: string;
    status: string;
    priority: string;
}

interface Props {
    dispositions: {
        data: Disposition[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: Filters;
}

export default function Index({ dispositions, filters }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || '');

    const handleSearch = () => {
        router.get(
            route('arsip.dispositions.index'),
            {
                search,
                status: selectedStatus || undefined,
                priority: selectedPriority || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedStatus('');
        setSelectedPriority('');
        router.get(route('arsip.dispositions.index'));
    };

    const getStatusBadge = (status: Disposition['status'], readAt: string | null) => {
        if (status === 'pending' && !readAt) {
            return (
                <Badge variant="secondary" className="gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Belum Dibaca
                </Badge>
            );
        }

        const variants: Record<Disposition['status'], { variant: any; icon: any; label: string }> = {
            pending: { variant: 'secondary', icon: Clock, label: 'Menunggu' },
            in_progress: { variant: 'default', icon: Clock, label: 'Dikerjakan' },
            completed: { variant: 'success', icon: CheckCircle2, label: 'Selesai' },
        };
        const config = variants[status] || variants.pending; // Fallback to pending if status not found
        const Icon = config.icon;
        return (
            <Badge variant={config.variant as any} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {config.label}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: Disposition['priority']) => {
        const variants: Record<Disposition['priority'], { variant: any; label: string }> = {
            normal: { variant: 'secondary', label: 'Biasa' },
            high: { variant: 'default', label: 'Penting' },
            urgent: { variant: 'destructive', label: 'Segera' },
        };
        const config = variants[priority] || variants.normal; // Fallback to normal if priority not found
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const isOverdue = (deadline: string | null, status: Disposition['status']) => {
        if (!deadline || status === 'completed') return false;
        return new Date(deadline) < new Date();
    };

    return (
        <AppLayout>
            <Head title="Disposisi Saya" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center my-6">
                    <div>
                        <h2 className="text-xl font-semibold md:text-2xl">Disposisi</h2>
                        <p className="font-mono text-xs text-muted-foreground md:text-sm">Kelola dan cari disposisi surat</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filter
                        {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle>Filter</CardTitle>
                        <CardDescription>Cari dan filter disposisi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cari</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nomor surat, pengirim, perihal..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'Semua Status' },
                                        { value: 'pending', label: 'Menunggu' },
                                        { value: 'in_progress', label: 'Dikerjakan' },
                                        { value: 'completed', label: 'Selesai' },
                                    ]}
                                    value={selectedStatus}
                                    onValueChange={setSelectedStatus}
                                    placeholder="Semua Status"
                                    searchPlaceholder="Cari status..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prioritas</label>
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'Semua Prioritas' },
                                        { value: 'normal', label: 'Biasa' },
                                        { value: 'high', label: 'Penting' },
                                        { value: 'urgent', label: 'Segera' },
                                    ]}
                                    value={selectedPriority}
                                    onValueChange={setSelectedPriority}
                                    placeholder="Semua Prioritas"
                                    searchPlaceholder="Cari prioritas..."
                                />
                            </div>

                            <div className="md:col-span-3 flex gap-2">
                                <Button onClick={handleSearch}>Cari</Button>
                                <Button variant="outline" onClick={handleReset}>Reset</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Dispositions Table */}
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Nomor Surat</TableHead>
                                <TableHead>Perihal</TableHead>
                                <TableHead>Dari</TableHead>
                                <TableHead>Instruksi</TableHead>
                                <TableHead>Prioritas</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dispositions.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                        Tidak ada disposisi ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dispositions.data.map((disposition, index) => (
                                    <TableRow
                                        key={disposition.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.visit(route('arsip.dispositions.show', disposition.id))}
                                    >
                                        <TableCell>{(dispositions.current_page - 1) * dispositions.per_page + index + 1}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {!disposition.read_at && (
                                                    <Mail className="h-4 w-4 text-blue-500" />
                                                )}
                                                {disposition.incoming_letter.incoming_number}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[250px] truncate" title={disposition.incoming_letter.subject}>
                                                {disposition.incoming_letter.subject}
                                            </div>
                                        </TableCell>
                                        <TableCell>{disposition.from_user.name}</TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate" title={disposition.instruction}>
                                                {disposition.instruction}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getPriorityBadge(disposition.priority)}</TableCell>
                                        <TableCell>
                                            {disposition.deadline ? (
                                                <div className="flex items-center gap-2">
                                                    <span>{format(new Date(disposition.deadline), 'dd MMM yyyy', { locale: idLocale })}</span>
                                                    {isOverdue(disposition.deadline, disposition.status) && (
                                                        <Badge variant="destructive" className="text-xs">Terlambat</Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(disposition.status, disposition.read_at)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
