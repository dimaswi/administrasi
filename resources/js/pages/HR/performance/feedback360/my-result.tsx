import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Eye,
    Lock,
    Clock,
    CheckCircle,
    AlertCircle,
    Star,
    TrendingUp,
} from 'lucide-react';

interface Participation {
    id: number;
    session_name: string;
    session_status: string;
    status: string;
    status_label: string;
    average_score: number | null;
    total_feedbacks: number;
    can_view_result: boolean;
}

interface Props {
    participations: Participation[];
    message?: string;
}

export default function MyResult({ participations, message }: Props) {
    if (message) {
        return (
            <HRLayout>
                <Head title="Hasil Feedback Saya" />
                <div className="pt-6">
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Tidak Dapat Mengakses</h3>
                        <p className="text-muted-foreground">{message}</p>
                    </div>
                </div>
            </HRLayout>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-blue-600';
        if (score >= 2) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (status: string, label: string) => {
        const variants: Record<string, string> = {
            'pending': 'bg-gray-100 text-gray-700 border-gray-200',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
            'completed': 'bg-green-100 text-green-700 border-green-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {label}
            </Badge>
        );
    };

    return (
        <HRLayout>
            <Head title="Hasil Feedback Saya" />

            <div className="pt-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Hasil Feedback 360 Saya</h1>
                    <p className="text-muted-foreground">Lihat hasil feedback yang telah diberikan untuk Anda</p>
                </div>

                {/* Participations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Sesi Feedback Saya
                        </CardTitle>
                        <CardDescription>Daftar sesi 360 feedback yang Anda ikuti</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {participations.length === 0 ? (
                            <div className="text-center py-8">
                                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Anda belum terdaftar dalam sesi 360 feedback</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {participations.map((p) => (
                                    <div 
                                        key={p.id} 
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <h4 className="font-medium">{p.session_name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getStatusBadge(p.status, p.status_label)}
                                                <span className="text-sm text-muted-foreground">
                                                    {p.total_feedbacks} feedback diterima
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {p.average_score !== null && (
                                                <div className="text-right">
                                                    <p className="text-sm text-muted-foreground">Skor</p>
                                                    <p className={`text-2xl font-bold ${getScoreColor(p.average_score)}`}>
                                                        {p.average_score.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}
                                            {p.can_view_result ? (
                                                <Button asChild>
                                                    <Link href={route('hr.feedback360.participant-result', p.id)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Lihat Hasil
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button variant="outline" disabled>
                                                    <Lock className="h-4 w-4 mr-2" />
                                                    Belum Tersedia
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HRLayout>
    );
}
