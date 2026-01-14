import { Head, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { 
    Plus, 
    Trash2, 
    Users,
    HelpCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Period {
    id: number;
    name: string;
    status: string;
}

interface Employee {
    id: number;
    employee_id: string;
    name: string;
}

interface Question {
    id?: number;
    category: string;
    question: string;
    description?: string;
    type: 'rating' | 'text' | 'yes_no';
    weight: number;
    is_required: boolean;
}

interface SessionData {
    id: number;
    name: string;
    description: string | null;
    period_id: number;
    start_date: string;
    end_date: string;
    is_anonymous: boolean;
    min_reviewers: number;
    participant_ids: number[];
    questions: Question[];
}

interface Props {
    periods: Period[];
    employees: Employee[];
    categories: Record<string, string>;
    relationships: Record<string, string>;
    questionTypes: Record<string, string>;
    session: SessionData | null;
}

const defaultQuestions: Question[] = [
    { category: 'leadership', question: 'Menunjukkan kemampuan kepemimpinan yang baik', type: 'rating', weight: 1, is_required: true },
    { category: 'leadership', question: 'Mampu memotivasi tim untuk mencapai tujuan', type: 'rating', weight: 1, is_required: true },
    { category: 'communication', question: 'Berkomunikasi dengan jelas dan efektif', type: 'rating', weight: 1, is_required: true },
    { category: 'communication', question: 'Mendengarkan dengan baik dan responsif', type: 'rating', weight: 1, is_required: true },
    { category: 'teamwork', question: 'Bekerja sama dengan baik dalam tim', type: 'rating', weight: 1, is_required: true },
    { category: 'teamwork', question: 'Membantu rekan kerja ketika dibutuhkan', type: 'rating', weight: 1, is_required: true },
    { category: 'problem_solving', question: 'Mampu mengidentifikasi dan menyelesaikan masalah', type: 'rating', weight: 1, is_required: true },
    { category: 'professionalism', question: 'Menunjukkan sikap profesional dalam bekerja', type: 'rating', weight: 1, is_required: true },
    { category: 'professionalism', question: 'Menjaga integritas dan etika kerja', type: 'rating', weight: 1, is_required: true },
];

export default function Form({ periods, employees, categories, questionTypes, session }: Props) {
    const isEdit = !!session;
    
    const [formData, setFormData] = useState({
        name: session?.name || '',
        period_id: session?.period_id ? String(session.period_id) : '',
        description: session?.description || '',
        start_date: session?.start_date || '',
        end_date: session?.end_date || '',
        is_anonymous: session?.is_anonymous ?? true,
        min_reviewers: session?.min_reviewers || 3,
    });

    const [selectedEmployees, setSelectedEmployees] = useState<number[]>(session?.participant_ids || []);
    const [questions, setQuestions] = useState<Question[]>(session?.questions || defaultQuestions);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [newQuestion, setNewQuestion] = useState<Question>({
        category: 'leadership',
        question: '',
        type: 'rating',
        weight: 1,
        is_required: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        
        const submitData = {
            ...formData,
            period_id: Number(formData.period_id),
            participant_ids: selectedEmployees,
            questions: JSON.stringify(questions),
        };
        
        if (isEdit && session) {
            router.put(route('hr.feedback360.update', session.id), submitData as any, {
                onFinish: () => setProcessing(false),
                onError: (err) => setErrors(err),
            });
        } else {
            router.post(route('hr.feedback360.store'), submitData as any, {
                onFinish: () => setProcessing(false),
                onError: (err) => setErrors(err),
            });
        }
    };

    const addParticipant = (employeeId: string) => {
        if (employeeId && !selectedEmployees.includes(Number(employeeId))) {
            setSelectedEmployees([...selectedEmployees, Number(employeeId)]);
        }
    };

    const removeParticipant = (employeeId: number) => {
        setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    };

    const addQuestion = () => {
        if (newQuestion.question.trim()) {
            setQuestions([...questions, { ...newQuestion }]);
            setNewQuestion({
                category: newQuestion.category,
                question: '',
                type: 'rating',
                weight: 1,
                is_required: true,
            });
        }
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const selectedEmployeesList = employees.filter(e => selectedEmployees.includes(e.id));

    // Group questions by category
    const questionsByCategory = questions.reduce((acc, q, idx) => {
        if (!acc[q.category]) acc[q.category] = [];
        acc[q.category].push({ ...q, _index: idx });
        return acc;
    }, {} as Record<string, (Question & { _index: number })[]>);

    return (
        <HRLayout>
            <Head title={isEdit ? 'Edit Sesi 360 Feedback' : 'Buat Sesi 360 Feedback'} />

            <div className="pt-6">
                <FormPage
                    title={isEdit ? 'Edit Sesi 360 Feedback' : 'Buat Sesi 360 Feedback'}
                    description={isEdit ? 'Perbarui data sesi 360 feedback' : 'Buat sesi baru untuk penilaian 360 feedback'}
                    backUrl={route('hr.feedback360.index')}
                    onSubmit={handleSubmit}
                    isLoading={processing}
                    submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
                >
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>Data dasar sesi 360 feedback</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Sesi *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: 360 Feedback Q1 2024"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="period_id">Periode Penilaian *</Label>
                                    <SearchableSelect
                                        value={formData.period_id}
                                        onValueChange={(value) => setFormData({ ...formData, period_id: value })}
                                        placeholder="Pilih Periode"
                                        options={periods.map(p => ({ value: String(p.id), label: p.name }))}
                                    />
                                    {errors.period_id && <p className="text-sm text-red-500">{errors.period_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi atau instruksi untuk sesi ini..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Tanggal Mulai *</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                    {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">Tanggal Selesai *</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                    {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min_reviewers">Minimum Penilai *</Label>
                                    <Input
                                        id="min_reviewers"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={formData.min_reviewers}
                                        onChange={(e) => setFormData({ ...formData, min_reviewers: Number(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">Jumlah minimum penilai per partisipan</p>
                                </div>
                                <div className="space-y-2 pt-6">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="is_anonymous"
                                            checked={formData.is_anonymous}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                                        />
                                        <Label htmlFor="is_anonymous">Feedback Anonim</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Nama penilai tidak ditampilkan dalam hasil</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Participants */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Partisipan ({selectedEmployees.length})
                            </CardTitle>
                            <CardDescription>Karyawan yang akan dinilai dalam sesi ini</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <SearchableSelect
                                        value=""
                                        onValueChange={addParticipant}
                                        placeholder="Cari dan pilih karyawan..."
                                        options={employees
                                            .filter(e => !selectedEmployees.includes(e.id))
                                            .map(e => ({ value: String(e.id), label: `${e.name} (${e.employee_id})` }))}
                                    />
                                </div>
                            </div>

                            {selectedEmployeesList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedEmployeesList.map(emp => (
                                        <Badge key={emp.id} variant="secondary" className="py-1.5 pl-3 pr-1.5">
                                            {emp.name}
                                            <button
                                                type="button"
                                                onClick={() => removeParticipant(emp.id)}
                                                className="ml-2 hover:text-red-500"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Belum ada partisipan dipilih
                                </p>
                            )}
                            {errors.participant_ids && <p className="text-sm text-red-500">{errors.participant_ids}</p>}
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5" />
                                Pertanyaan/Kriteria ({questions.length})
                            </CardTitle>
                            <CardDescription>Daftar pertanyaan untuk penilaian 360 feedback</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Question Form */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <p className="font-medium text-sm">Tambah Pertanyaan Baru</p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <SearchableSelect
                                        value={newQuestion.category}
                                        onValueChange={(value) => setNewQuestion({ ...newQuestion, category: value })}
                                        placeholder="Kategori"
                                        options={Object.entries(categories).map(([value, label]) => ({ value, label }))}
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            value={newQuestion.question}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                            placeholder="Tulis pertanyaan..."
                                        />
                                    </div>
                                    <Button type="button" onClick={addQuestion} disabled={!newQuestion.question.trim()}>
                                        <Plus className="h-4 w-4 mr-1" /> Tambah
                                    </Button>
                                </div>
                            </div>

                            {/* Questions List */}
                            {questions.length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
                                        <div key={category} className="border rounded-lg">
                                            <div className="bg-muted/30 px-4 py-2 border-b">
                                                <p className="font-medium text-sm">{categories[category] || category}</p>
                                            </div>
                                            <div className="divide-y">
                                                {categoryQuestions.map((q) => (
                                                    <div key={q._index} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20">
                                                        <span className="text-sm flex-1">{q.question}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {questionTypes[q.type]}
                                                        </Badge>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeQuestion(q._index)}
                                                            className="text-muted-foreground hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Belum ada pertanyaan ditambahkan
                                </p>
                            )}
                            {errors.questions && <p className="text-sm text-red-500">{errors.questions}</p>}
                        </CardContent>
                    </Card>
                </FormPage>
            </div>
        </HRLayout>
    );
}
