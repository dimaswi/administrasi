import { Head, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CreditCard, User, FileText, Calendar, Building2, ExternalLink, Info } from 'lucide-react';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface CredentialData {
    id?: number;
    type: string;
    name: string;
    number: string;
    issued_by: string;
    issued_date: string;
    expiry_date: string;
    notes: string;
    document_url: string | null;
}

interface Props {
    employee: Employee;
    types: Record<string, string>;
    credential: CredentialData | null;
}

export default function Form({ employee, types, credential }: Props) {
    const isEditing = !!credential?.id;

    const { data, setData, processing, errors } = useForm({
        type: credential?.type || '',
        name: credential?.name || '',
        number: credential?.number || '',
        issued_by: credential?.issued_by || '',
        issued_date: credential?.issued_date || '',
        expiry_date: credential?.expiry_date || '',
        notes: credential?.notes || '',
        document: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('type', data.type);
        formData.append('name', data.name);
        formData.append('number', data.number);
        formData.append('issued_by', data.issued_by);
        formData.append('issued_date', data.issued_date);
        formData.append('expiry_date', data.expiry_date);
        formData.append('notes', data.notes);
        if (data.document) {
            formData.append('document', data.document);
        }

        if (isEditing) {
            formData.append('_method', 'PUT');
            router.post(route('hr.credentials.update', credential.id), formData);
        } else {
            router.post(route('hr.employees.credentials.store', employee.id), formData);
        }
    };

    // Auto-fill name based on type selection
    const handleTypeChange = (value: string) => {
        setData(prev => ({
            ...prev,
            type: value,
            name: prev.name || types[value] || '',
        }));
    };

    return (
        <HRLayout>
            <Head title={isEditing ? 'Edit Kredensial' : 'Tambah Kredensial'} />

            <div className="pt-6">
                <FormPage
                    title={isEditing ? 'Edit Kredensial' : 'Tambah Kredensial'}
                    description={isEditing ? 'Perbarui informasi kredensial karyawan' : 'Tambah kredensial baru untuk karyawan'}
                    backUrl={isEditing ? route('hr.credentials.show', credential?.id) : route('hr.employees.show', employee.id)}
                    onSubmit={handleSubmit}
                    isLoading={processing}
                    submitLabel={isEditing ? 'Simpan Perubahan' : 'Simpan Kredensial'}
                >
                    {/* Employee Info Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informasi Karyawan
                            </CardTitle>
                            <CardDescription>
                                Kredensial akan ditambahkan untuk karyawan berikut
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{employee.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="outline" className="font-mono">
                                            {employee.employee_id}
                                        </Badge>
                                        {employee.organization_unit && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {employee.organization_unit}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credential Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Data Kredensial
                            </CardTitle>
                            <CardDescription>
                                Masukkan informasi lengkap kredensial
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Jenis Kredensial <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.type} onValueChange={handleTypeChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis kredensial" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(types).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama/Label <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: SIM A, Bank BCA, NPWP"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="number">
                                        Nomor Kredensial <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="number"
                                        value={data.number}
                                        onChange={(e) => setData('number', e.target.value)}
                                        placeholder="Masukkan nomor kredensial"
                                        className="font-mono"
                                    />
                                    {errors.number && (
                                        <p className="text-sm text-destructive">{errors.number}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="issued_by">Diterbitkan Oleh</Label>
                                    <Input
                                        id="issued_by"
                                        value={data.issued_by}
                                        onChange={(e) => setData('issued_by', e.target.value)}
                                        placeholder="Contoh: Kepolisian RI, Bank BCA"
                                    />
                                    {errors.issued_by && (
                                        <p className="text-sm text-destructive">{errors.issued_by}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="issued_date">Tanggal Terbit</Label>
                                    <Input
                                        id="issued_date"
                                        type="date"
                                        value={data.issued_date}
                                        onChange={(e) => setData('issued_date', e.target.value)}
                                    />
                                    {errors.issued_date && (
                                        <p className="text-sm text-destructive">{errors.issued_date}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Validity Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Masa Berlaku
                            </CardTitle>
                            <CardDescription>
                                Atur masa berlaku kredensial untuk tracking otomatis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Berlaku Sampai</Label>
                                    <Input
                                        id="expiry_date"
                                        type="date"
                                        value={data.expiry_date}
                                        onChange={(e) => setData('expiry_date', e.target.value)}
                                    />
                                    {errors.expiry_date && (
                                        <p className="text-sm text-destructive">{errors.expiry_date}</p>
                                    )}
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-blue-700 dark:text-blue-300">
                                        Kosongkan jika kredensial tidak memiliki masa berlaku. Sistem akan 
                                        mengirimkan notifikasi saat kredensial mendekati tanggal kedaluwarsa.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document & Notes Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Dokumen & Catatan
                            </CardTitle>
                            <CardDescription>
                                Upload dokumen pendukung dan tambahkan catatan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="document">Upload Dokumen</Label>
                                    <div className="space-y-3">
                                        <Input
                                            id="document"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setData('document', e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Format yang didukung: PDF, JPG, PNG. Ukuran maksimal 5MB.
                                        </p>
                                        {credential?.document_url && (
                                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">Dokumen saat ini:</span>
                                                <a 
                                                    href={credential.document_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                                >
                                                    Lihat Dokumen
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                        {errors.document && (
                                            <p className="text-sm text-destructive">{errors.document}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Tambahkan catatan atau informasi tambahan (opsional)"
                                        rows={4}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-destructive">{errors.notes}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </FormPage>
            </div>
        </HRLayout>
    );
}
