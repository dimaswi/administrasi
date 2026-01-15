import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ClipboardList,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageSquareShare,
    ArrowRight,
} from 'lucide-react';

interface FeedbackRequest {
    id: number;
    participant_name: string;
    session_name: string;
    relationship: string;
    relationship_label: string;
    deadline?: string;
    status: string;
    completed_at?: string;
}

interface Props {
    pendingRequests: FeedbackRequest[];
    completedRequests: FeedbackRequest[];
    message?: string;
}

export default function MyRequests({ pendingRequests, completedRequests, message }: Props) {
    if (message) {
        return (
            <HRLayout>
                <Head title="Permintaan Feedback" />
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

    return (
        <HRLayout>
            <Head title="Permintaan Feedback" />

            <div className="pt-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Permintaan Feedback 360</h1>
                    <p className="text-muted-foreground">Berikan feedback untuk rekan kerja Anda</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="overflow-hidden">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4">
                            <div className="flex items-center justify-between">
                                <div className="bg-white/20 rounded-lg p-2">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white/80">Menunggu Diisi</p>
                                    <p className="text-2xl font-bold text-white">{pendingRequests.length}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="overflow-hidden">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
                            <div className="flex items-center justify-between">
                                <div className="bg-white/20 rounded-lg p-2">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white/80">Sudah Selesai</p>
                                    <p className="text-2xl font-bold text-white">{completedRequests.length}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Pending Requests */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Feedback yang Perlu Diisi
                        </CardTitle>
                        <CardDescription>Silakan isi feedback untuk rekan kerja berikut</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquareShare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Tidak ada permintaan feedback yang menunggu</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.map((request) => (
                                    <div 
                                        key={request.id} 
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <h4 className="font-medium">{request.participant_name}</h4>
                                            <p className="text-sm text-muted-foreground">{request.session_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary">{request.relationship_label}</Badge>
                                                {request.deadline && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Deadline: {request.deadline}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button asChild>
                                            <Link href={route('hr.feedback360.give-feedback', request.id)}>
                                                Isi Feedback
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Requests */}
                {completedRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Feedback yang Sudah Dikirim
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {completedRequests.map((request) => (
                                    <div 
                                        key={request.id} 
                                        className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                                    >
                                        <div>
                                            <h4 className="font-medium">{request.participant_name}</h4>
                                            <p className="text-sm text-muted-foreground">{request.session_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary">{request.relationship_label}</Badge>
                                                {request.completed_at && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Dikirim: {request.completed_at}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Selesai
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </HRLayout>
    );
}
