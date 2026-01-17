import { Head, Link, useForm, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
    ArrowLeft,
    Send,
    Save,
    Star,
    Calendar,
    User,
    MessageSquare,
} from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: number;
    question: string;
    description: string | null;
    type: 'rating' | 'text' | 'yes_no';
    is_required: boolean;
    existing_score: number | null;
    existing_answer: string | null;
    existing_boolean: boolean | null;
}

interface QuestionGroup {
    category: string;
    category_label: string;
    questions: Question[];
}

interface Props {
    reviewer: {
        id: number;
        relationship: string;
        relationship_label: string;
    };
    participant: {
        name: string;
    };
    session: {
        id: number;
        name: string;
        is_anonymous: boolean;
        end_date: string;
    };
    questionGroups: QuestionGroup[];
    existingComment: {
        strengths: string | null;
        improvements: string | null;
        additional_comments: string | null;
    } | null;
}

export default function GiveFeedback({
    reviewer,
    participant,
    session,
    questionGroups,
    existingComment,
}: Props) {
    // Initialize responses from existing data
    const initialResponses: Record<number, { score?: number; answer?: string; boolean_answer?: boolean }> = {};
    questionGroups.forEach(group => {
        group.questions.forEach(q => {
            initialResponses[q.id] = {
                score: q.existing_score ?? undefined,
                answer: q.existing_answer ?? undefined,
                boolean_answer: q.existing_boolean ?? undefined,
            };
        });
    });

    const [responses, setResponses] = useState(initialResponses);
    const [comment, setComment] = useState({
        strengths: existingComment?.strengths || '',
        improvements: existingComment?.improvements || '',
        additional_comments: existingComment?.additional_comments || '',
    });
    const [processing, setProcessing] = useState(false);

    const updateResponse = (questionId: number, field: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value,
            },
        }));
    };

    const handleSubmit = (isSubmit: boolean) => {
        setProcessing(true);
        
        const data = {
            responses: Object.entries(responses).map(([questionId, response]) => ({
                question_id: Number(questionId),
                score: response.score ?? null,
                answer: response.answer ?? null,
                boolean_answer: response.boolean_answer ?? null,
            })),
            comment: comment,
            is_submit: isSubmit,
        };

        router.post(route('hr.feedback360.submit-feedback', reviewer.id), data, {
            onFinish: () => setProcessing(false),
        });
    };

    const ratingLabels: Record<number, string> = {
        1: 'Sangat Kurang',
        2: 'Kurang',
        3: 'Cukup',
        4: 'Baik',
        5: 'Sangat Baik',
    };

    return (
        <HRLayout>
            <Head title={`Feedback untuk ${participant.name}`} />

            <div className="pt-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={route('hr.feedback360.my-requests')}>
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Kembali
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold">Feedback untuk {participant.name}</h1>
                        <p className="text-muted-foreground">{session.name}</p>
                    </div>
                    <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Deadline: {session.end_date}
                        </div>
                        <Badge variant="secondary" className="mt-1">{reviewer.relationship_label}</Badge>
                    </div>
                </div>

                {/* Info Banner */}
                {session.is_anonymous && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-blue-700">
                                <User className="h-5 w-5" />
                                <p className="text-sm font-medium">Feedback ini bersifat anonim. Identitas Anda tidak akan ditampilkan kepada yang dinilai.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Questions by Category */}
                {questionGroups.map((group) => (
                    <Card key={group.category}>
                        <CardHeader>
                            <CardTitle>{group.category_label}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {group.questions.map((question, qIndex) => (
                                <div key={question.id} className="border-b pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-start gap-2 mb-3">
                                        <span className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                            {qIndex + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium">
                                                {question.question}
                                                {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                            </p>
                                            {question.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {question.type === 'rating' && (
                                        <div className="pl-8">
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        type="button"
                                                        onClick={() => updateResponse(question.id, 'score', rating)}
                                                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors min-w-[80px] ${
                                                            responses[question.id]?.score === rating
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-muted hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex">
                                                            {Array.from({ length: rating }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-4 w-4 ${
                                                                        responses[question.id]?.score === rating
                                                                            ? 'text-yellow-500 fill-yellow-500'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs mt-1 text-muted-foreground">{ratingLabels[rating]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {question.type === 'text' && (
                                        <div className="pl-8">
                                            <Textarea
                                                value={responses[question.id]?.answer || ''}
                                                onChange={(e) => updateResponse(question.id, 'answer', e.target.value)}
                                                placeholder="Tulis jawaban Anda..."
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {question.type === 'yes_no' && (
                                        <div className="pl-8">
                                            <RadioGroup
                                                value={responses[question.id]?.boolean_answer?.toString() || ''}
                                                onValueChange={(value) => updateResponse(question.id, 'boolean_answer', value === 'true')}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="true" id={`q${question.id}-yes`} />
                                                        <Label htmlFor={`q${question.id}-yes`}>Ya</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="false" id={`q${question.id}-no`} />
                                                        <Label htmlFor={`q${question.id}-no`}>Tidak</Label>
                                                    </div>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                {/* Comments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Komentar Tambahan
                        </CardTitle>
                        <CardDescription>Berikan masukan konstruktif untuk pengembangan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="strengths">Kekuatan (Strengths)</Label>
                            <Textarea
                                id="strengths"
                                value={comment.strengths}
                                onChange={(e) => setComment({ ...comment, strengths: e.target.value })}
                                placeholder="Apa kekuatan utama dari orang ini?"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="improvements">Area Pengembangan (Areas for Improvement)</Label>
                            <Textarea
                                id="improvements"
                                value={comment.improvements}
                                onChange={(e) => setComment({ ...comment, improvements: e.target.value })}
                                placeholder="Aspek apa yang perlu ditingkatkan?"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="additional">Komentar Tambahan</Label>
                            <Textarea
                                id="additional"
                                value={comment.additional_comments}
                                onChange={(e) => setComment({ ...comment, additional_comments: e.target.value })}
                                placeholder="Komentar atau saran lainnya..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between items-center bg-background sticky bottom-0 py-4 border-t">
                    <Button variant="outline" asChild>
                        <Link href={route('hr.feedback360.my-requests')}>Batal</Link>
                    </Button>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => handleSubmit(false)}
                            disabled={processing}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Simpan Draft
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={processing}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Kirim Feedback
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Kirim Feedback?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Setelah dikirim, feedback tidak dapat diubah. Pastikan semua jawaban sudah benar.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleSubmit(true)}>
                                        Kirim
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}
