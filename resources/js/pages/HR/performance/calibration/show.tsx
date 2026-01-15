import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Scale,
    Play,
    CheckCircle,
    Trash2,
    Edit,
    RotateCcw,
    ArrowUp,
    ArrowDown,
    Minus,
    BarChart3,
} from 'lucide-react';
import { useState } from 'react';

interface Session {
    id: number;
    name: string;
    description: string | null;
    period: { id: number; name: string } | null;
    status: string;
    status_label: string;
    scheduled_date: string | null;
    facilitator_name: string | null;
    progress: {
        total: number;
        calibrated: number;
        percentage: number;
    };
    grade_distribution: Record<string, { label: string; original: number; calibrated: number }>;
}

interface CalibrationReview {
    id: number;
    review_id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        organization_unit: string | null;
    };
    original_score: number | null;
    original_grade: string | null;
    calibrated_score: number | null;
    calibrated_grade: string | null;
    score_change: number | null;
    grade_changed: boolean;
    calibration_notes: string | null;
    calibrated_by: string | null;
    calibrated_at: string | null;
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    session: Session;
    calibrationReviews: CalibrationReview[];
    units: Unit[];
    grades: Record<string, string>;
    filters: {
        unit_id: string;
        original_grade: string;
    };
}

export default function Show({ session, calibrationReviews, units, grades, filters }: Props) {
    const [selectedReview, setSelectedReview] = useState<CalibrationReview | null>(null);
    const [calibrateOpen, setCalibrateOpen] = useState(false);
    const [calibratedScore, setCalibratedScore] = useState('');
    const [calibrationNotes, setCalibrationNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFilterChange = (key: string, value: string) => {
        router.get(route('hr.calibration.show', session.id), {
            [key]: value === '_all' ? '' : value,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getStatusBadge = (status: string, label: string) => {
        const variants: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-700 border-gray-200',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
            'completed': 'bg-green-100 text-green-700 border-green-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {label}
            </Badge>
        );
    };

    const getGradeBadge = (grade: string | null, isCalibrated = false) => {
        if (!grade) return <span className="text-muted-foreground">-</span>;
        const colors: Record<string, string> = {
            'A': isCalibrated ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800',
            'B': isCalibrated ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800',
            'C': isCalibrated ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800',
            'D': isCalibrated ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800',
            'E': isCalibrated ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800',
        };
        return <Badge className={colors[grade] || ''}>{grade}</Badge>;
    };

    const getChangeIcon = (change: number | null) => {
        if (change === null) return null;
        if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
        if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const handleStart = () => {
        router.post(route('hr.calibration.start', session.id));
    };

    const handleComplete = () => {
        router.post(route('hr.calibration.complete', session.id));
    };

    const handleDelete = () => {
        router.delete(route('hr.calibration.destroy', session.id));
    };

    const openCalibrateDialog = (review: CalibrationReview) => {
        setSelectedReview(review);
        setCalibratedScore(review.calibrated_score?.toString() || review.original_score?.toString() || '');
        setCalibrationNotes(review.calibration_notes || '');
        setCalibrateOpen(true);
    };

    const handleCalibrate = () => {
        if (selectedReview) {
            setProcessing(true);
            router.post(route('hr.calibration.calibrate-review', selectedReview.id), {
                calibrated_score: calibratedScore,
                calibration_notes: calibrationNotes,
            }, {
                onSuccess: () => {
                    setCalibrateOpen(false);
                    setCalibratedScore('');
                    setCalibrationNotes('');
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    const handleResetCalibration = (reviewId: number) => {
        router.post(route('hr.calibration.reset-calibration', reviewId));
    };

    return (
        <HRLayout>
            <Head title={`Kalibrasi: ${session.name}`} />

            <div className="pt-6">
                <DetailPage
                    title={session.name}
                    description={`Sesi Kalibrasi • ${session.period?.name || 'Tanpa Periode'}`}
                    backUrl={route('hr.calibration.index')}
                    actions={
                        <div className="flex gap-2">
                            {session.status === 'draft' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button>
                                            <Play className="h-4 w-4 mr-2" />
                                            Mulai Kalibrasi
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Mulai Sesi Kalibrasi?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Status review akan diubah menjadi "Kalibrasi" dan tim dapat mulai melakukan penyesuaian nilai.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleStart}>Mulai</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {session.status === 'in_progress' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Selesaikan
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Selesaikan Sesi?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Nilai hasil kalibrasi akan diterapkan ke review asli dan status review akan menjadi "Selesai".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleComplete}>Selesaikan</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {session.status !== 'completed' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Hapus
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Sesi?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Sesi kalibrasi akan dihapus. Review akan dikembalikan ke status sebelumnya.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                                Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    }
                >
                    {/* Session Info & Progress */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Informasi Sesi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground">Status</dt>
                                        <dd className="mt-1">{getStatusBadge(session.status, session.status_label)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Periode</dt>
                                        <dd className="mt-1 font-medium">{session.period?.name || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Tanggal</dt>
                                        <dd className="mt-1 font-medium">{session.scheduled_date || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Fasilitator</dt>
                                        <dd className="mt-1 font-medium">{session.facilitator_name || '-'}</dd>
                                    </div>
                                </dl>
                                {session.description && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-muted-foreground">{session.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-4">
                                    <p className="text-4xl font-bold">{session.progress.percentage}%</p>
                                    <p className="text-sm text-muted-foreground">
                                        {session.progress.calibrated} dari {session.progress.total} dikalibrasi
                                    </p>
                                </div>
                                <Progress value={session.progress.percentage} className="h-3" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Grade Distribution Chart */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Distribusi Grade
                            </CardTitle>
                            <CardDescription>Perbandingan distribusi grade sebelum dan sesudah kalibrasi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4">
                                {Object.entries(session.grade_distribution).map(([grade, data]) => (
                                    <div key={grade} className="text-center">
                                        <div className="mb-2">
                                            {getGradeBadge(grade)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xs text-muted-foreground">Awal:</span>
                                                <span className="font-medium">{data.original}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xs text-muted-foreground">Kalibrasi:</span>
                                                <span className="font-medium text-blue-600">{data.calibrated}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-4">
                                <div className="min-w-[180px]">
                                    <label className="text-sm font-medium mb-2 block">Unit Kerja</label>
                                    <SearchableSelect
                                        value={filters.unit_id || '_all'}
                                        onValueChange={(value) => handleFilterChange('unit_id', value)}
                                        placeholder="Semua Unit"
                                        options={[
                                            { value: '_all', label: 'Semua Unit' },
                                            ...units.map((u) => ({ value: String(u.id), label: u.name })),
                                        ]}
                                    />
                                </div>
                                <div className="min-w-[180px]">
                                    <label className="text-sm font-medium mb-2 block">Grade Awal</label>
                                    <SearchableSelect
                                        value={filters.original_grade || '_all'}
                                        onValueChange={(value) => handleFilterChange('original_grade', value)}
                                        placeholder="Semua Grade"
                                        options={[
                                            { value: '_all', label: 'Semua Grade' },
                                            ...Object.entries(grades).map(([v, l]) => ({ value: v, label: l })),
                                        ]}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reviews Table */}
                    <Card>
                        <CardContent className="pt-6">
                            {calibrationReviews.length === 0 ? (
                                <div className="text-center py-8">
                                    <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Tidak ada review untuk ditampilkan</p>
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Karyawan</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead className="text-center">Nilai Awal</TableHead>
                                                <TableHead className="text-center">Nilai Kalibrasi</TableHead>
                                                <TableHead className="text-center">Perubahan</TableHead>
                                                <TableHead>Dikalibrasi Oleh</TableHead>
                                                <TableHead className="w-[120px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {calibrationReviews.map((review) => (
                                                <TableRow key={review.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{review.employee.name}</p>
                                                            <p className="text-sm text-muted-foreground">{review.employee.employee_id}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {review.employee.organization_unit || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-medium">{review.original_score?.toFixed(1) || '-'}</span>
                                                            {getGradeBadge(review.original_grade)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {review.calibrated_score !== null ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="font-medium text-blue-600">{review.calibrated_score?.toFixed(1)}</span>
                                                                {getGradeBadge(review.calibrated_grade, true)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {getChangeIcon(review.score_change)}
                                                            {review.score_change !== null && (
                                                                <span className={review.score_change > 0 ? 'text-green-600' : review.score_change < 0 ? 'text-red-600' : ''}>
                                                                    {review.score_change > 0 ? '+' : ''}{review.score_change?.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {review.calibrated_by ? (
                                                            <div>
                                                                <p>{review.calibrated_by}</p>
                                                                <p className="text-xs text-muted-foreground">{review.calibrated_at}</p>
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {session.status === 'in_progress' && (
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant={review.calibrated_score !== null ? 'outline' : 'default'}
                                                                    onClick={() => openCalibrateDialog(review)}
                                                                >
                                                                    {review.calibrated_score !== null ? (
                                                                        <><Edit className="h-3 w-3 mr-1" /> Edit</>
                                                                    ) : (
                                                                        <><Scale className="h-3 w-3 mr-1" /> Kalibrasi</>
                                                                    )}
                                                                </Button>
                                                                {review.calibrated_score !== null && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleResetCalibration(review.id)}
                                                                    >
                                                                        <RotateCcw className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Calibrate Dialog */}
                    <Dialog open={calibrateOpen} onOpenChange={setCalibrateOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Kalibrasi Review</DialogTitle>
                                <DialogDescription>
                                    {selectedReview && `Kalibrasi nilai untuk ${selectedReview.employee.name}`}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {selectedReview && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nilai Awal:</span>
                                            <span className="font-medium">
                                                {selectedReview.original_score?.toFixed(1)} ({selectedReview.original_grade})
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="calibrated_score">Nilai Hasil Kalibrasi</Label>
                                    <Input
                                        id="calibrated_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={calibratedScore}
                                        onChange={(e) => setCalibratedScore(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="calibration_notes">Catatan Kalibrasi</Label>
                                    <Textarea
                                        id="calibration_notes"
                                        value={calibrationNotes}
                                        onChange={(e) => setCalibrationNotes(e.target.value)}
                                        placeholder="Alasan atau catatan untuk perubahan nilai..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCalibrateOpen(false)}>Batal</Button>
                                <Button onClick={handleCalibrate} disabled={processing}>
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </DetailPage>
            </div>
        </HRLayout>
    );
}
