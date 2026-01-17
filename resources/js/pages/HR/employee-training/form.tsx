import { Head, Link, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, User, Star } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
}

interface Training {
    id: number;
    code: string;
    name: string;
}

interface EmployeeTrainingData {
    id?: number;
    employee_id: number | null;
    training_id: number | null;
    status: string;
    start_date: string;
    end_date: string;
    completion_date: string;
    score: number | null;
    grade: string;
    certificate_number: string;
    certificate_expiry: string;
    certificate_url: string | null;
    feedback: string;
    rating: number | null;
    notes: string;
}

interface Props {
    employees: Employee[];
    trainings: Training[];
    statuses: Record<string, string>;
    employeeTraining: EmployeeTrainingData | null;
    preselectedEmployeeId: string | null;
    preselectedTrainingId: string | null;
}

export default function Form({ employees, trainings, statuses, employeeTraining, preselectedEmployeeId, preselectedTrainingId }: Props) {
    const isEditing = !!employeeTraining?.id;

    const { data, setData, post, put, processing, errors } = useForm({
        employee_id: employeeTraining?.employee_id?.toString() || preselectedEmployeeId || '',
        training_id: employeeTraining?.training_id?.toString() || preselectedTrainingId || '',
        status: employeeTraining?.status || 'registered',
        start_date: employeeTraining?.start_date || '',
        end_date: employeeTraining?.end_date || '',
        completion_date: employeeTraining?.completion_date || '',
        score: employeeTraining?.score?.toString() || '',
        grade: employeeTraining?.grade || '',
        certificate_number: employeeTraining?.certificate_number || '',
        certificate_expiry: employeeTraining?.certificate_expiry || '',
        feedback: employeeTraining?.feedback || '',
        rating: employeeTraining?.rating?.toString() || '',
        notes: employeeTraining?.notes || '',
        certificate: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        
        // Only include employee_id and training_id for new records
        if (!isEditing) {
            formData.append('employee_id', data.employee_id);
            formData.append('training_id', data.training_id);
        }
        
        formData.append('status', data.status);
        formData.append('start_date', data.start_date);
        formData.append('end_date', data.end_date);
        formData.append('completion_date', data.completion_date);
        formData.append('score', data.score);
        formData.append('grade', data.grade);
        formData.append('certificate_number', data.certificate_number);
        formData.append('certificate_expiry', data.certificate_expiry);
        formData.append('feedback', data.feedback);
        formData.append('rating', data.rating);
        formData.append('notes', data.notes);
        
        if (data.certificate) {
            formData.append('certificate', data.certificate);
        }

        if (isEditing) {
            formData.append('_method', 'PUT');
            router.post(route('hr.employee-trainings.update', employeeTraining.id), formData);
        } else {
            router.post(route('hr.employee-trainings.store'), formData);
        }
    };

    const employeeOptions = employees.map((e) => ({
        value: e.id.toString(),
        label: `${e.employee_id} - ${e.name}`,
    }));

    const trainingOptions = trainings.map((t) => ({
        value: t.id.toString(),
        label: `${t.code} - ${t.name}`,
    }));

    return (
        <HRLayout>
            <Head title={isEditing ? 'Edit Peserta Training' : 'Tambah Peserta Training'} />

            <div className="pt-6">
                <FormPage
                    title={isEditing ? 'Edit Peserta Training' : 'Tambah Peserta Training'}
                    description="Isi informasi data training karyawan"
                    backUrl={isEditing ? route('hr.employee-trainings.show', employeeTraining?.id) : route('hr.employee-trainings.index')}
                    onSubmit={handleSubmit}
                    isLoading={processing}
                    submitLabel={isEditing ? 'Simpan Perubahan' : 'Simpan Data'}
                >
                    {/* Employee & Training Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Karyawan & Training
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">Karyawan <span className="text-red-500">*</span></Label>
                                    <SearchableSelect
                                        options={employeeOptions}
                                        value={data.employee_id}
                                        onValueChange={(value: string) => setData('employee_id', value)}
                                        placeholder="Pilih karyawan"
                                        disabled={isEditing}
                                    />
                                    {errors.employee_id && <p className="text-sm text-destructive">{errors.employee_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="training_id">Training <span className="text-red-500">*</span></Label>
                                    <SearchableSelect
                                        options={trainingOptions}
                                        value={data.training_id}
                                        onValueChange={(value: string) => setData('training_id', value)}
                                        placeholder="Pilih training"
                                        disabled={isEditing}
                                    />
                                    {errors.training_id && <p className="text-sm text-destructive">{errors.training_id}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Training Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Detail Training
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                    <SearchableSelect
                                        options={Object.entries(statuses).map(([value, label]) => ({ value, label }))}
                                        value={data.status}
                                        onValueChange={(value: string) => setData('status', value)}
                                        placeholder="Pilih status"
                                    />
                                    {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                    {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_date">Tanggal Selesai</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                    {errors.end_date && <p className="text-sm text-destructive">{errors.end_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="completion_date">Tanggal Kelulusan</Label>
                                    <Input
                                        id="completion_date"
                                        type="date"
                                        value={data.completion_date}
                                        onChange={(e) => setData('completion_date', e.target.value)}
                                    />
                                    {errors.completion_date && <p className="text-sm text-destructive">{errors.completion_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="score">Nilai</Label>
                                    <Input
                                        id="score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.score}
                                        onChange={(e) => setData('score', e.target.value)}
                                        placeholder="0-100"
                                    />
                                    {errors.score && <p className="text-sm text-destructive">{errors.score}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="grade">Grade</Label>
                                    <Input
                                        id="grade"
                                        value={data.grade}
                                        onChange={(e) => setData('grade', e.target.value)}
                                        placeholder="A, B, C, ..."
                                    />
                                    {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Certificate */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Star className="h-5 w-5" />
                                Sertifikat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_number">Nomor Sertifikat</Label>
                                    <Input
                                        id="certificate_number"
                                        value={data.certificate_number}
                                        onChange={(e) => setData('certificate_number', e.target.value)}
                                        placeholder="No. Sertifikat"
                                    />
                                    {errors.certificate_number && <p className="text-sm text-destructive">{errors.certificate_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="certificate_expiry">Masa Berlaku Sertifikat</Label>
                                    <Input
                                        id="certificate_expiry"
                                        type="date"
                                        value={data.certificate_expiry}
                                        onChange={(e) => setData('certificate_expiry', e.target.value)}
                                    />
                                    {errors.certificate_expiry && <p className="text-sm text-destructive">{errors.certificate_expiry}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="certificate">Upload Sertifikat</Label>
                                    <Input
                                        id="certificate"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setData('certificate', e.target.files?.[0] || null)}
                                    />
                                    <p className="text-xs text-muted-foreground">Format: PDF, JPG, PNG (Max 5MB)</p>
                                    {employeeTraining?.certificate_url && (
                                        <p className="text-sm text-blue-600">
                                            <a href={employeeTraining.certificate_url} target="_blank" rel="noopener noreferrer">
                                                Lihat sertifikat saat ini
                                            </a>
                                        </p>
                                    )}
                                    {errors.certificate && <p className="text-sm text-destructive">{errors.certificate}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feedback */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Feedback & Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="rating">Rating (1-5)</Label>
                                        <SearchableSelect
                                            options={[
                                                { value: '1', label: '1 - Sangat Kurang' },
                                                { value: '2', label: '2 - Kurang' },
                                                { value: '3', label: '3 - Cukup' },
                                                { value: '4', label: '4 - Baik' },
                                                { value: '5', label: '5 - Sangat Baik' },
                                            ]}
                                            value={data.rating}
                                            onValueChange={(value: string) => setData('rating', value)}
                                            placeholder="Pilih rating"
                                        />
                                        {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="feedback">Feedback</Label>
                                    <Textarea
                                        id="feedback"
                                        value={data.feedback}
                                        onChange={(e) => setData('feedback', e.target.value)}
                                        placeholder="Feedback dari peserta tentang training"
                                        rows={3}
                                    />
                                    {errors.feedback && <p className="text-sm text-destructive">{errors.feedback}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan tambahan"
                                        rows={3}
                                    />
                                    {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </FormPage>
            </div>
        </HRLayout>
    );
}
