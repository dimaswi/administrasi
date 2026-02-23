import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    FileText, 
    Search, 
    Trash2, 
    AlertCircle,
    AlertTriangle,
    Info,
    Bug,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
    datetime: string;
    environment: string;
    level: string;
    message: string;
    full_message: string;
}

interface Props {
    logs: LogEntry[];
    availableDates: string[];
    filters: {
        date: string;
        level: string;
        search: string;
    };
}

const levelConfig: Record<string, { icon: any; color: string; bg: string }> = {
    emergency: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
    alert: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    notice: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    debug: { icon: Bug, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
};

const levelOptions = [
    { value: '_all', label: 'Semua Level' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'alert', label: 'Alert' },
    { value: 'critical', label: 'Critical' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
    { value: 'notice', label: 'Notice' },
    { value: 'info', label: 'Info' },
    { value: 'debug', label: 'Debug' },
];

export default function SystemLogs({ logs, availableDates, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        date: filters.date,
        level: filters.level || '_all',
        search: filters.search,
    });
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        
        router.get('/settings/system-logs', {
            date: newFilters.date,
            level: newFilters.level === '_all' ? '' : newFilters.level,
            search: newFilters.search,
        }, { preserveState: true });
    };

    const handleClearLogs = () => {
        if (confirm('Apakah Anda yakin ingin menghapus log ini?')) {
            router.post('/settings/system-logs/clear', { date: filterValues.date }, {
                onSuccess: () => toast.success('Log berhasil dihapus'),
            });
        }
    };

    const dateOptions = availableDates.map(date => ({
        value: date,
        label: new Date(date).toLocaleDateString('id-ID', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        }),
    }));

    return (
        <AppLayout>
            <Head title="System Logs" />
            
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="System Logs" 
                        description="Monitor log aplikasi dan debug errors" 
                    />
                    
                    <Card>
                        <CardHeader className="border-b py-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-base">Log Entries</CardTitle>
                                    <Badge variant="secondary">{logs.length}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => router.reload()}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={handleClearLogs}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear Log
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="w-[200px]">
                                    <SearchableSelect
                                        options={dateOptions}
                                        value={filterValues.date}
                                        onValueChange={(v) => handleFilterChange('date', v)}
                                        placeholder="Pilih Tanggal"
                                        searchPlaceholder="Cari tanggal..."
                                    />
                                </div>
                                <div className="w-[160px]">
                                    <SearchableSelect
                                        options={levelOptions}
                                        value={filterValues.level}
                                        onValueChange={(v) => handleFilterChange('level', v)}
                                        placeholder="Level"
                                        searchPlaceholder="Cari level..."
                                    />
                                </div>
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={filterValues.search}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, search: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilterChange('search', filterValues.search);
                                            }
                                        }}
                                        placeholder="Cari pesan..."
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Logs Table */}
                            <div className="h-[500px] border rounded-lg overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead className="w-[180px]">Waktu</TableHead>
                                            <TableHead className="w-[100px]">Level</TableHead>
                                            <TableHead>Pesan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                    Tidak ada log ditemukan
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log, index) => {
                                                const config = levelConfig[log.level] || levelConfig.info;
                                                const Icon = config.icon;
                                                return (
                                                    <TableRow 
                                                        key={index} 
                                                        className={`cursor-pointer hover:bg-muted/50 ${config.bg}`}
                                                        onClick={() => setSelectedLog(log)}
                                                    >
                                                        <TableCell className="font-mono text-xs">
                                                            {log.datetime}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`gap-1 ${config.color}`}>
                                                                <Icon className="h-3 w-3" />
                                                                {log.level}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs truncate max-w-[500px]">
                                                            {log.message}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>

            {/* Log Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedLog && (
                                <>
                                    <Badge variant="outline" className={levelConfig[selectedLog.level]?.color}>
                                        {selectedLog.level}
                                    </Badge>
                                    <span className="font-mono text-sm">{selectedLog.datetime}</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>Detail log entry</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-lg">
                            {selectedLog?.full_message}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
