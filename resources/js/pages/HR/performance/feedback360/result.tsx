import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    ArrowLeft,
    User,
    Star,
    MessageSquare,
    TrendingUp,
    BarChart3,
} from 'lucide-react';

interface CategoryScore {
    category: string;
    category_label: string;
    average: number;
    count: number;
}

interface RelationshipScore {
    relationship: string;
    relationship_label: string;
    average: number;
    count: number;
}

interface FeedbackComment {
    relationship: string;
    relationship_label: string;
    reviewer_name: string | null;
    strengths: string | null;
    improvements: string | null;
    additional_comments: string | null;
}

interface Props {
    session: {
        id: number;
        name: string;
        is_anonymous: boolean;
    };
    participant: {
        id: number;
        employee: {
            id: number;
            employee_id: string;
            name: string;
            organization_unit: string | null;
        };
        average_score: number | null;
        total_feedbacks: number;
    };
    categoryScores: CategoryScore[];
    relationshipScores: RelationshipScore[];
    feedbackComments: FeedbackComment[];
    categories: Record<string, string>;
}

export default function Result({
    session,
    participant,
    categoryScores,
    relationshipScores,
    feedbackComments,
    categories,
}: Props) {
    const getScoreColor = (score: number) => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-blue-600';
        if (score >= 2) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 4) return 'bg-green-500';
        if (score >= 3) return 'bg-blue-500';
        if (score >= 2) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <HRLayout>
            <Head title={`Hasil 360 Feedback: ${participant.employee.name}`} />

            <div className="pt-6">
                <DetailPage
                    title={`Hasil 360 Feedback: ${participant.employee.name}`}
                    description={`${session.name} • ${participant.employee.employee_id}`}
                    backUrl={route('hr.feedback360.show', session.id)}
                >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Karyawan</p>
                                        <p className="font-medium">{participant.employee.name}</p>
                                        <p className="text-xs text-muted-foreground">{participant.employee.organization_unit || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-3">
                                        <Star className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Skor Rata-rata</p>
                                        <p className={`text-2xl font-bold ${getScoreColor(participant.average_score || 0)}`}>
                                            {participant.average_score?.toFixed(2) || '-'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">dari skala 5.00</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
                                        <MessageSquare className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Feedback</p>
                                        <p className="text-2xl font-bold">{participant.total_feedbacks}</p>
                                        <p className="text-xs text-muted-foreground">penilai</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Category Scores */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Skor per Kategori
                                </CardTitle>
                                <CardDescription>Rata-rata skor berdasarkan kategori kompetensi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {categoryScores.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                                ) : (
                                    <div className="space-y-4">
                                        {categoryScores.map((cat) => (
                                            <div key={cat.category}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium">{cat.category_label}</span>
                                                    <span className={`font-bold ${getScoreColor(cat.average)}`}>
                                                        {cat.average.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${getScoreBgColor(cat.average)} transition-all`}
                                                        style={{ width: `${(cat.average / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Relationship Scores */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Skor per Hubungan
                                </CardTitle>
                                <CardDescription>Rata-rata skor berdasarkan hubungan penilai</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {relationshipScores.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                                ) : (
                                    <div className="space-y-4">
                                        {relationshipScores.map((rel) => (
                                            <div key={rel.relationship}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium">
                                                        {rel.relationship_label}
                                                        <span className="text-muted-foreground ml-1">({rel.count})</span>
                                                    </span>
                                                    <span className={`font-bold ${getScoreColor(rel.average)}`}>
                                                        {rel.average.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${getScoreBgColor(rel.average)} transition-all`}
                                                        style={{ width: `${(rel.average / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Feedback Comments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Komentar Feedback
                            </CardTitle>
                            <CardDescription>
                                {session.is_anonymous ? 'Komentar ditampilkan secara anonim' : 'Komentar dari para penilai'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {feedbackComments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Belum ada komentar</p>
                            ) : (
                                <div className="space-y-4">
                                    {feedbackComments.map((comment, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant="secondary">{comment.relationship_label}</Badge>
                                                {!session.is_anonymous && comment.reviewer_name && (
                                                    <span className="text-sm text-muted-foreground">{comment.reviewer_name}</span>
                                                )}
                                            </div>
                                            
                                            {comment.strengths && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-green-600 mb-1">Kekuatan</p>
                                                    <p className="text-sm">{comment.strengths}</p>
                                                </div>
                                            )}
                                            
                                            {comment.improvements && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-orange-600 mb-1">Area Pengembangan</p>
                                                    <p className="text-sm">{comment.improvements}</p>
                                                </div>
                                            )}
                                            
                                            {comment.additional_comments && (
                                                <div>
                                                    <p className="text-xs font-medium text-blue-600 mb-1">Komentar Tambahan</p>
                                                    <p className="text-sm">{comment.additional_comments}</p>
                                                </div>
                                            )}

                                            {!comment.strengths && !comment.improvements && !comment.additional_comments && (
                                                <p className="text-sm text-muted-foreground italic">Tidak ada komentar</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </DetailPage>
            </div>
        </HRLayout>
    );
}
