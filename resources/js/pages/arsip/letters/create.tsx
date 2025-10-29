import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileText, Save, Send, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Variable {
    name: string;
    type: 'text' | 'textarea' | 'richtext' | 'date' | 'select' | 'user_select' | 'auto';
    label: string;
    required: boolean;
    default?: string;
    options?: string[];
}

interface Template {
    id: number;
    name: string;
    code: string;
    category: string | null;
    variables: Variable[];
    content: any;
    letterhead: any;
    signatures: any[];
}

interface Props extends SharedData {
    templates: Template[];
    selectedTemplate?: Template;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Surat Keluar', href: '/arsip/letters' },
    { title: 'Buat Surat', href: '/arsip/letters/create' },
];

export default function CreateLetter({ templates, selectedTemplate }: Props) {
    const [templateId, setTemplateId] = useState(selectedTemplate?.id.toString() || '');
    const [template, setTemplate] = useState<Template | null>(selectedTemplate || null);
    const [subject, setSubject] = useState('');
    const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);
    const [recipient, setRecipient] = useState('');
    const [notes, setNotes] = useState('');
    const [variableData, setVariableData] = useState<Record<string, any>>({});
    const [showPreview, setShowPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (templateId) {
            const selected = templates.find((t) => t.id.toString() === templateId);
            setTemplate(selected || null);

            // Initialize variable data with defaults
            if (selected && selected.variables && Array.isArray(selected.variables)) {
                const initialData: Record<string, any> = {};
                selected.variables.forEach((variable) => {
                    if (variable.default) {
                        initialData[variable.name] = variable.default;
                    } else if (variable.type === 'date') {
                        initialData[variable.name] = new Date().toISOString().split('T')[0];
                    } else {
                        initialData[variable.name] = '';
                    }
                });
                setVariableData(initialData);
            }
        } else {
            setTemplate(null);
            setVariableData({});
        }
    }, [templateId, templates]);

    const handleVariableChange = (name: string, value: any) => {
        setVariableData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!templateId) {
            toast.error('Pilih template terlebih dahulu');
            return false;
        }

        if (!subject.trim()) {
            toast.error('Perihal surat harus diisi');
            return false;
        }

        if (!letterDate) {
            toast.error('Tanggal surat harus diisi');
            return false;
        }

        // Validate required variables
        if (template && template.variables && Array.isArray(template.variables)) {
            for (const variable of template.variables) {
                if (variable.required && !variableData[variable.name]) {
                    toast.error(`${variable.label} harus diisi`);
                    return false;
                }
            }
        }

        return true;
    };

    const handleSubmit = (submitType: 'draft' | 'submit') => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        const data = {
            template_id: templateId,
            subject,
            letter_date: letterDate,
            recipient: recipient || null,
            data: variableData,
            notes: notes || null,
            submit_type: submitType,
        };

        router.post('/arsip/letters', data, {
            onSuccess: () => {
 
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal membuat surat');
                setIsSubmitting(false);
            },
        });
    };

    const renderVariableInput = (variable: Variable) => {
        const value = variableData[variable.name] || '';
        const placeholder = variable.default || `Masukkan ${variable.label.toLowerCase()}`;

        switch (variable.type) {
            case 'text':
                return (
                    <Input
                        id={variable.name}
                        value={value}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={placeholder}
                    />
                );

            case 'auto':
                return (
                    <Input
                        id={variable.name}
                        value={value}
                        placeholder={placeholder}
                        disabled
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        id={variable.name}
                        value={value}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                    />
                );

            case 'date':
                return <Input id={variable.name} type="date" value={value} onChange={(e) => handleVariableChange(variable.name, e.target.value)} />;

            case 'select':
                return (
                    <SearchableSelect
                        options={variable.options?.map((opt) => ({ value: opt, label: opt })) || []}
                        value={value}
                        onValueChange={(val) => handleVariableChange(variable.name, val)}
                        placeholder={`Pilih ${variable.label.toLowerCase()}`}
                    />
                );

            default:
                return <Input id={variable.name} value={value} onChange={(e) => handleVariableChange(variable.name, e.target.value)} placeholder={placeholder} />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Surat Baru" />

            <div className="space-y-6">
                {/* Header */}
                <div className="my-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold">Buat Surat</h2>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono">Buat surat baru dari template</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => router.visit('/arsip/letters')}>
                            <X className="mr-2 h-4 w-4" />
                            Batal
                        </Button>
                    </div>
                </div>

                {/* Template Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pilih Template Surat</CardTitle>
                        <CardDescription>Template menentukan format dan field yang harus diisi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="template">
                                    Template <span className="text-destructive">*</span>
                                </Label>
                                <SearchableSelect
                                    options={templates.map((t) => ({
                                        value: t.id.toString(),
                                        label: t.name,
                                        description: t.code,
                                    }))}
                                    value={templateId}
                                    onValueChange={setTemplateId}
                                    placeholder="Pilih template surat"
                                />
                            </div>

                            {template && (
                                <Alert>
                                    <FileText className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>{template.name}</strong> - {template.code}
                                        {template.category && <span className="ml-2 text-muted-foreground">({template.category})</span>}
                                        <div className="mt-1 text-sm">
                                            {template.variables?.length || 0} field harus diisi, {template.signatures?.length || 0} penandatangan
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {template && (
                    <>
                        {/* Letter Info - Metadata Surat */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Surat</CardTitle>
                                <CardDescription>Metadata dasar surat (wajib diisi)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="subject">
                                        Perihal Surat <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Contoh: Undangan Rapat Koordinasi"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="letter_date">
                                            Tanggal Surat <span className="text-destructive">*</span>
                                        </Label>
                                        <Input id="letter_date" type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} />
                                    </div>

                                    <div>
                                        <Label htmlFor="recipient">Penerima</Label>
                                        <Input
                                            id="recipient"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            placeholder="Contoh: Kepala Dinas Pendidikan"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Catatan Internal</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Catatan untuk keperluan internal (tidak akan tercetak di surat)"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Variable Fields - Data Template */}
                        {template.variables && template.variables.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data Template</CardTitle>
                                    <CardDescription>Isi field sesuai template yang dipilih</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {template.variables.map((variable) => (
                                        <div key={variable.name}>
                                            <Label htmlFor={variable.name}>
                                                {variable.label}
                                                {variable.required && <span className="ml-1 text-destructive">*</span>}
                                            </Label>
                                            {renderVariableInput(variable)}
                                            {variable.type === 'auto' && (
                                                <p className="mt-1 text-xs text-muted-foreground">Field ini akan otomatis diisi oleh sistem</p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                    <p>Template ini tidak memiliki field yang perlu diisi</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        {template.signatures && template.signatures.length > 0 && (
                                            <div>Surat ini memerlukan persetujuan dari {template.signatures.length} penandatangan</div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Draft
                                        </Button>
                                        <Button onClick={() => handleSubmit('submit')} disabled={isSubmitting}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Kirim untuk Persetujuan
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
