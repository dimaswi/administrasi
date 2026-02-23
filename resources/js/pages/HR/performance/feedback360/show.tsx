import { Head, Link, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { DetailPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Edit,
    Trash2,
    Play,
    CheckCircle,
    Users,
    HelpCircle,
    Plus,
    UserPlus,
    Eye,
    Clock,
    Calendar,
    MessageSquareShare,
    UserX,
} from 'lucide-react';
import { useState } from 'react';

interface Session {
    id: number;
    name: string;
    description: string | null;
    period: { id: number; name: string } | null;
    status: string;
    status_label: string;
    start_date: string;
    end_date: string;
    is_anonymous: boolean;
    min_reviewers: number;
    progress: {
        total: number;
        completed: number;
        percentage: number;
    };
    creator_name: string | null;
    created_at: string;
}

interface Reviewer {
    id: number;
    reviewer_employee: { id: number; name: string };
    relationship: string;
    relationship_label: string;
    status: string;
    status_label: string;
    completed_at: string | null;
}

interface Participant {
    id: number;
    employee: {
        id: number;
        employee_id: string;
        name: string;
        organization_unit: string | null;
    };
    status: string;
    status_label: string;
    average_score: number | null;
    total_feedbacks: number;
    reviewers: Reviewer[];
}

interface Question {
    id: number;
    question: string;
    description: string | null;
    type: string;
    type_label: string;
    weight: number;
    is_required: boolean;
}

interface QuestionGroup {
    category: string;
    category_label: string;
    questions: Question[];
}

interface Props {
    session: Session;
    participants: Participant[];
    questionGroups: QuestionGroup[];
    categories: Record<string, string>;
    relationships: Record<string, string>;
}

export default function Show({ session, participants, questionGroups, categories, relationships }: Props) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [addReviewerOpen, setAddReviewerOpen] = useState(false);
    
    const addReviewerForm = useForm({
        reviewer_employee_id: '',
        relationship: 'peer',
    });

    const getStatusBadge = (status: string, label: string) => {
        const variants: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-700 border-gray-200',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
            'completed': 'bg-green-100 text-green-700 border-green-200',
            'cancelled': 'bg-red-100 text-red-700 border-red-200',
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'declined': 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <Badge variant="outline" className={variants[status] || ''}>
                {label}
            </Badge>
        );
    };

    const handleStart = () => {
        router.post(route('hr.feedback360.start', session.id));
    };

    const handleComplete = () => {
        router.post(route('hr.feedback360.complete', session.id));
    };

    const handleDelete = () => {
        router.delete(route('hr.feedback360.destroy', session.id));
    };

    const handleAddReviewer = () => {
        if (selectedParticipant) {
            addReviewerForm.post(route('hr.feedback360.add-reviewer', selectedParticipant.id), {
                onSuccess: () => {
                    setAddReviewerOpen(false);
                    addReviewerForm.reset();
                },
            });
        }
    };

    const handleRemoveReviewer = (reviewerId: number) => {
        router.delete(route('hr.feedback360.remove-reviewer', reviewerId));
    };

    // Get all employees for reviewer selection (excluding already assigned)
    const getAvailableReviewers = (participant: Participant) => {
        const assignedIds = participant.reviewers.map(r => r.reviewer_employee.id);
        return participants
            .map(p => p.employee)
            .filter(e => !assignedIds.includes(e.id))
            .map(e => ({ value: String(e.id), label: `${e.name} (${e.employee_id})` }));
    };

    return (
        <HRLayout>
            <Head title={`360 Feedback: ${session.name}`} />

            <div className="pt-6">
                <DetailPage
                    title={session.name}
                    description={`Sesi 360 Feedback • ${session.period?.name || 'Tanpa Periode'}`}
                    backUrl={route('hr.feedback360.index')}
                    actions={
                        <div className="flex gap-2">
                            {session.status === 'draft' && (
                                <>
                                    <Button variant="outline" asChild>
                                        <Link href={route('hr.feedback360.edit', session.id)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button>
                                                <Play className="h-4 w-4 mr-2" />
                                                Mulai Sesi
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Mulai Sesi 360 Feedback?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Sesi akan dimulai dan penilai dapat mulai mengisi feedback. 
                                                    Pastikan semua partisipan dan pertanyaan sudah lengkap.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleStart}>Mulai</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                            {session.status === 'in_progress' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Selesaikan Sesi
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Selesaikan Sesi?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Sesi akan ditandai selesai. Penilai tidak bisa lagi mengisi feedback.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleComplete}>Selesaikan</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {['draft', 'cancelled'].includes(session.status) && (
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
                                                Semua data sesi termasuk partisipan dan pertanyaan akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
                    {/* Session Info */}
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
                                        <dt className="text-muted-foreground">Tanggal Mulai</dt>
                                        <dd className="mt-1 font-medium">{session.start_date}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Tanggal Selesai</dt>
                                        <dd className="mt-1 font-medium">{session.end_date}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Min. Penilai</dt>
                                        <dd className="mt-1 font-medium">{session.min_reviewers} orang</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Mode</dt>
                                        <dd className="mt-1">
                                            {session.is_anonymous ? (
                                                <Badge variant="secondary">Anonim</Badge>
                                            ) : (
                                                <Badge variant="outline">Non-Anonim</Badge>
                                            )}
                                        </dd>
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
                                        {session.progress.completed} dari {session.progress.total} selesai
                                    </p>
                                </div>
                                <Progress value={session.progress.percentage} className="h-3" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="participants" className="space-y-4">
                        <TabsList className="h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b w-full">
                            <TabsTrigger value="participants" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                                <Users className="h-4 w-4" />
                                Partisipan ({participants.length})
                            </TabsTrigger>
                            <TabsTrigger value="questions" className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Pertanyaan ({questionGroups.reduce((acc, g) => acc + g.questions.length, 0)})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="participants">
                            <Card>
                                <CardContent className="pt-6">
                                    {participants.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">Belum ada partisipan</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {participants.map((participant) => (
                                                <div key={participant.id} className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-medium">{participant.employee.name}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {participant.employee.employee_id} • {participant.employee.organization_unit || '-'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(participant.status, participant.status_label)}
                                                            {participant.average_score !== null && (
                                                                <Badge className="bg-blue-100 text-blue-700">
                                                                    Skor: {participant.average_score.toFixed(1)}
                                                                </Badge>
                                                            )}
                                                            {(session.status === 'completed' || participant.total_feedbacks > 0) && (
                                                                <Button size="sm" variant="outline" asChild>
                                                                    <Link href={route('hr.feedback360.participant-result', participant.id)}>
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        Hasil
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Reviewers */}
                                                    <div className="bg-muted/30 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium">
                                                                Penilai ({participant.reviewers.length}/{session.min_reviewers} min)
                                                            </p>
                                                            {session.status !== 'completed' && (
                                                                <Dialog open={addReviewerOpen && selectedParticipant?.id === participant.id} 
                                                                        onOpenChange={(open) => {
                                                                            setAddReviewerOpen(open);
                                                                            if (open) setSelectedParticipant(participant);
                                                                        }}>
                                                                    <DialogTrigger asChild>
                                                                        <Button size="sm" variant="outline">
                                                                            <UserPlus className="h-4 w-4 mr-1" />
                                                                            Tambah
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Tambah Penilai</DialogTitle>
                                                                            <DialogDescription>
                                                                                Pilih karyawan yang akan menilai {participant.employee.name}
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="space-y-4 py-4">
                                                                            <div className="space-y-2">
                                                                                <Label>Karyawan</Label>
                                                                                <SearchableSelect
                                                                                    value={addReviewerForm.data.reviewer_employee_id}
                                                                                    onValueChange={(value) => addReviewerForm.setData('reviewer_employee_id', value)}
                                                                                    placeholder="Pilih karyawan..."
                                                                                    options={getAvailableReviewers(participant)}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label>Hubungan</Label>
                                                                                <SearchableSelect
                                                                                    value={addReviewerForm.data.relationship}
                                                                                    onValueChange={(value) => addReviewerForm.setData('relationship', value)}
                                                                                    placeholder="Pilih hubungan..."
                                                                                    options={Object.entries(relationships).map(([v, l]) => ({ value: v, label: l }))}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={() => setAddReviewerOpen(false)}>Batal</Button>
                                                                            <Button onClick={handleAddReviewer} disabled={addReviewerForm.processing}>
                                                                                Tambah
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </div>
                                                        {participant.reviewers.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground">Belum ada penilai ditugaskan</p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                {participant.reviewers.map((reviewer) => (
                                                                    <Badge 
                                                                        key={reviewer.id} 
                                                                        variant={reviewer.status === 'completed' ? 'default' : 'secondary'}
                                                                        className="py-1 px-2 gap-1"
                                                                    >
                                                                        {reviewer.reviewer_employee.name}
                                                                        <span className="text-xs opacity-70">({reviewer.relationship_label})</span>
                                                                        {reviewer.status === 'completed' ? (
                                                                            <CheckCircle className="h-3 w-3 ml-1" />
                                                                        ) : session.status !== 'completed' ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveReviewer(reviewer.id)}
                                                                                className="ml-1 hover:text-red-500"
                                                                            >
                                                                                <UserX className="h-3 w-3" />
                                                                            </button>
                                                                        ) : null}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="questions">
                            <Card>
                                <CardContent className="pt-6">
                                    {questionGroups.length === 0 ? (
                                        <div className="text-center py-8">
                                            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">Belum ada pertanyaan</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {questionGroups.map((group) => (
                                                <div key={group.category} className="border rounded-lg">
                                                    <div className="bg-muted/30 px-4 py-2 border-b">
                                                        <h4 className="font-medium">{group.category_label}</h4>
                                                    </div>
                                                    <div className="divide-y">
                                                        {group.questions.map((q, idx) => (
                                                            <div key={q.id} className="px-4 py-3 flex items-center justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="text-muted-foreground text-sm">{idx + 1}.</span>
                                                                    <div>
                                                                        <p className="text-sm">{q.question}</p>
                                                                        {q.description && (
                                                                            <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-xs">{q.type_label}</Badge>
                                                                    {q.is_required && (
                                                                        <Badge variant="secondary" className="text-xs">Wajib</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </DetailPage>
            </div>
        </HRLayout>
    );
}
