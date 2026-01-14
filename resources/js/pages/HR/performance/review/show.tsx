import { Head, Link, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
    Trash2,
    CheckCircle,
    User,
    Calendar,
    Target,
} from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface Period {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

interface ReviewItem {
    id: number;
    name: string;
    description: string | null;
    measurement_type: string;
    measurement_type_label: string;
    unit: string | null;
    target: number | null;
    actual: number | null;
    weight: number;
    self_score: number | null;
    manager_score: number | null;
    final_score: number | null;
    self_comment: string | null;
    manager_comment: string | null;
    achievement_percentage: number | null;
}

interface CategoryWithItems {
    category: {
        id: number;
        name: string;
        code: string;
    };
    items: ReviewItem[];
}

interface Goal {
    id: number;
    title: string;
    description: string | null;
    status: string;
    status_label: string;
    progress: number;
    due_date: string | null;
    is_overdue: boolean;
}

interface ReviewData {
    id: number;
    employee: Employee;
    period: Period;
    reviewer_name: string | null;
    status: string;
    status_label: string;
    self_score: number | null;
    manager_score: number | null;
    final_score: number | null;
    final_grade: string | null;
    grade_label: string | null;
    employee_notes: string | null;
    manager_notes: string | null;
    strengths: string | null;
    improvements: string | null;
    development_plan: string | null;
    self_reviewed_at: string | null;
    manager_reviewed_at: string | null;
    completed_at: string | null;
    can_self_review: boolean;
    can_manager_review: boolean;
}

interface Props {
    review: ReviewData;
    itemsByCategory: CategoryWithItems[];
    goals: Goal[];
}

export default function Show({ review, itemsByCategory, goals }: Props) {
    const [showSelfReview, setShowSelfReview] = useState(false);
    const [showManagerReview, setShowManagerReview] = useState(false);

    const selfReviewForm = useForm({
        items: itemsByCategory.flatMap(cat => cat.items.map(item => ({
            id: item.id,
            actual: item.actual ?? '',
            self_score: item.self_score ?? '',
            self_comment: item.self_comment ?? '',
        }))),
        employee_notes: review.employee_notes ?? '',
    });

    const managerReviewForm = useForm({
        items: itemsByCategory.flatMap(cat => cat.items.map(item => ({
            id: item.id,
            manager_score: item.manager_score ?? '',
            manager_comment: item.manager_comment ?? '',
        }))),
        manager_notes: review.manager_notes ?? '',
        strengths: review.strengths ?? '',
        improvements: review.improvements ?? '',
        development_plan: review.development_plan ?? '',
    });

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus penilaian ini?')) {
            router.delete(route('hr.performance-reviews.destroy', review.id));
        }
    };

    const handleComplete = () => {
        if (confirm('Apakah Anda yakin ingin menyelesaikan penilaian ini?')) {
            router.post(route('hr.performance-reviews.complete', review.id));
        }
    };

    const submitSelfReview = (e: React.FormEvent) => {
        e.preventDefault();
        selfReviewForm.post(route('hr.performance-reviews.self-review', review.id), {
            onSuccess: () => setShowSelfReview(false),
        });
    };

    const submitManagerReview = (e: React.FormEvent) => {
        e.preventDefault();
        managerReviewForm.post(route('hr.performance-reviews.manager-review', review.id), {
            onSuccess: () => setShowManagerReview(false),
        });
    };

    const getStatusBadge = () => {
        const variants: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-700',
            'self_review': 'bg-blue-100 text-blue-700',
            'manager_review': 'bg-yellow-100 text-yellow-700',
            'calibration': 'bg-purple-100 text-purple-700',
            'completed': 'bg-green-100 text-green-700',
        };
        return (
            <Badge className={variants[review.status] || ''}>
                {review.status_label}
            </Badge>
        );
    };

    const getGradeBadge = (grade: string | null) => {
        if (!grade) return null;
        const colors: Record<string, string> = {
            'A': 'bg-green-100 text-green-800',
            'B': 'bg-blue-100 text-blue-800',
            'C': 'bg-yellow-100 text-yellow-800',
            'D': 'bg-orange-100 text-orange-800',
            'E': 'bg-red-100 text-red-800',
        };
        return <Badge className={colors[grade] || ''} title={review.grade_label || ''}>{grade}</Badge>;
    };

    const updateSelfItem = (itemId: number, field: string, value: string | number) => {
        const items = selfReviewForm.data.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
        );
        selfReviewForm.setData('items', items);
    };

    const updateManagerItem = (itemId: number, field: string, value: string | number) => {
        const items = managerReviewForm.data.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
        );
        managerReviewForm.setData('items', items);
    };

    const getSelfItemData = (itemId: number) => {
        return selfReviewForm.data.items.find(i => i.id === itemId);
    };

    const getManagerItemData = (itemId: number) => {
        return managerReviewForm.data.items.find(i => i.id === itemId);
    };

    return (
        <HRLayout>
            <Head title={`Penilaian: ${review.employee.name}`} />

            <div className="pt-6">
                <DetailPage
                    title={`Penilaian Kinerja: ${review.employee.name}`}
                    description={`Periode ${review.period.name}`}
                    backUrl={route('hr.performance-reviews.index')}
                    actions={
                        <div className="flex items-center gap-2">
                            {review.can_self_review && (
                                <Button onClick={() => setShowSelfReview(!showSelfReview)}>
                                    Self Review
                                </Button>
                            )}
                            {review.can_manager_review && (
                                <Button variant="outline" onClick={() => setShowManagerReview(!showManagerReview)}>
                                    Manager Review
                                </Button>
                            )}
                            {(review.status === 'manager_review' || review.status === 'calibration') && (
                                <Button variant="default" onClick={handleComplete}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Selesaikan
                                </Button>
                            )}
                            {review.status !== 'completed' && (
                                <Button variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                </Button>
                            )}
                        </div>
                    }
                >
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm">Status</span>
                                </div>
                                {getStatusBadge()}
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                    <Target className="w-4 h-4" />
                                    <span className="text-sm">Self Score</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {review.self_score ?? '-'}
                                </p>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                                    <Target className="w-4 h-4" />
                                    <span className="text-sm">Manager Score</span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                                    {review.manager_score ?? '-'}
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm">Final</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        {review.final_score ?? '-'}
                                    </p>
                                    {getGradeBadge(review.final_grade)}
                                </div>
                            </div>
                        </div>

                        {/* Employee Info */}
                        <div>
                            <h3 className="font-semibold text-lg border-b pb-2 mb-4">Informasi Karyawan</h3>
                            <dl className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm text-muted-foreground">Nama</dt>
                                    <dd className="font-medium">{review.employee.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">NIP</dt>
                                    <dd className="font-medium">{review.employee.employee_id}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">Unit</dt>
                                    <dd className="font-medium">{review.employee.organization_unit || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">Periode</dt>
                                    <dd className="font-medium">{review.period.name}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Self Review Form */}
                        {showSelfReview && (
                            <Card className="border-blue-200 bg-blue-50/50">
                                <CardHeader>
                                    <CardTitle className="text-blue-800">Self Review</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submitSelfReview} className="space-y-4">
                                        {itemsByCategory.map((cat) => (
                                            <div key={cat.category.id} className="space-y-3">
                                                <h4 className="font-medium">{cat.category.name}</h4>
                                                {cat.items.map((item) => {
                                                    const formData = getSelfItemData(item.id);
                                                    return (
                                                        <div key={item.id} className="bg-white p-3 rounded border space-y-2">
                                                            <div className="font-medium text-sm">{item.name}</div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <Label className="text-xs">Realisasi</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={formData?.actual ?? ''}
                                                                        onChange={(e) => updateSelfItem(item.id, 'actual', e.target.value)}
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Nilai (0-100)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={formData?.self_score ?? ''}
                                                                        onChange={(e) => updateSelfItem(item.id, 'self_score', e.target.value)}
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Komentar</Label>
                                                                    <Input
                                                                        value={formData?.self_comment ?? ''}
                                                                        onChange={(e) => updateSelfItem(item.id, 'self_comment', e.target.value)}
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        <div>
                                            <Label>Catatan Tambahan</Label>
                                            <Textarea
                                                value={selfReviewForm.data.employee_notes}
                                                onChange={(e) => selfReviewForm.setData('employee_notes', e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={selfReviewForm.processing}>
                                                Simpan Self Review
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowSelfReview(false)}>
                                                Batal
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Manager Review Form */}
                        {showManagerReview && (
                            <Card className="border-yellow-200 bg-yellow-50/50">
                                <CardHeader>
                                    <CardTitle className="text-yellow-800">Manager Review</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submitManagerReview} className="space-y-4">
                                        {itemsByCategory.map((cat) => (
                                            <div key={cat.category.id} className="space-y-3">
                                                <h4 className="font-medium">{cat.category.name}</h4>
                                                {cat.items.map((item) => {
                                                    const formData = getManagerItemData(item.id);
                                                    return (
                                                        <div key={item.id} className="bg-white p-3 rounded border space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium text-sm">{item.name}</span>
                                                                {item.self_score !== null && (
                                                                    <span className="text-sm text-muted-foreground">
                                                                        Self: {item.self_score}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <Label className="text-xs">Nilai (0-100)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={formData?.manager_score ?? ''}
                                                                        onChange={(e) => updateManagerItem(item.id, 'manager_score', e.target.value)}
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Komentar</Label>
                                                                    <Input
                                                                        value={formData?.manager_comment ?? ''}
                                                                        onChange={(e) => updateManagerItem(item.id, 'manager_comment', e.target.value)}
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Kekuatan</Label>
                                                <Textarea
                                                    value={managerReviewForm.data.strengths}
                                                    onChange={(e) => managerReviewForm.setData('strengths', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div>
                                                <Label>Area Pengembangan</Label>
                                                <Textarea
                                                    value={managerReviewForm.data.improvements}
                                                    onChange={(e) => managerReviewForm.setData('improvements', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Rencana Pengembangan</Label>
                                            <Textarea
                                                value={managerReviewForm.data.development_plan}
                                                onChange={(e) => managerReviewForm.setData('development_plan', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <Label>Catatan Manager</Label>
                                            <Textarea
                                                value={managerReviewForm.data.manager_notes}
                                                onChange={(e) => managerReviewForm.setData('manager_notes', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={managerReviewForm.processing}>
                                                Simpan Manager Review
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowManagerReview(false)}>
                                                Batal
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* KPI Results */}
                        {!showSelfReview && !showManagerReview && (
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Detail Penilaian KPI</h3>
                                <div className="space-y-4">
                                    {itemsByCategory.map((cat) => (
                                        <Card key={cat.category.id}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {cat.category.name}
                                                    <Badge variant="outline">{cat.category.code}</Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {cat.items.map((item) => (
                                                        <div key={item.id} className="border rounded p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <p className="font-medium">{item.name}</p>
                                                                    {item.description && (
                                                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                                                    )}
                                                                </div>
                                                                <Badge variant="secondary">Bobot: {item.weight}</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-muted-foreground">Target:</span>{' '}
                                                                    <span className="font-medium">
                                                                        {item.target ?? '-'} {item.unit}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Realisasi:</span>{' '}
                                                                    <span className="font-medium">
                                                                        {item.actual ?? '-'} {item.unit}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Self:</span>{' '}
                                                                    <span className="font-medium text-blue-600">
                                                                        {item.self_score ?? '-'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Manager:</span>{' '}
                                                                    <span className="font-medium text-yellow-600">
                                                                        {item.manager_score ?? '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {(item.self_comment || item.manager_comment) && (
                                                                <div className="mt-2 pt-2 border-t text-sm">
                                                                    {item.self_comment && (
                                                                        <p><span className="text-muted-foreground">Self:</span> {item.self_comment}</p>
                                                                    )}
                                                                    {item.manager_comment && (
                                                                        <p><span className="text-muted-foreground">Manager:</span> {item.manager_comment}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Feedback Section */}
                        {(review.strengths || review.improvements || review.development_plan) && (
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Feedback & Development</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {review.strengths && (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Kekuatan</h4>
                                            <p className="text-sm">{review.strengths}</p>
                                        </div>
                                    )}
                                    {review.improvements && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                            <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Area Pengembangan</h4>
                                            <p className="text-sm">{review.improvements}</p>
                                        </div>
                                    )}
                                    {review.development_plan && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Rencana Pengembangan</h4>
                                            <p className="text-sm">{review.development_plan}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Goals */}
                        {goals.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Target Kerja</h3>
                                <div className="space-y-3">
                                    {goals.map((goal) => (
                                        <div key={goal.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{goal.title}</p>
                                                    {goal.description && (
                                                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                                                    )}
                                                </div>
                                                <Badge variant={goal.is_overdue ? 'destructive' : 'outline'}>
                                                    {goal.status_label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Progress value={goal.progress} className="flex-1" />
                                                <span className="text-sm font-medium">{goal.progress}%</span>
                                            </div>
                                            {goal.due_date && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Due: {goal.due_date}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DetailPage>
            </div>
        </HRLayout>
    );
}
