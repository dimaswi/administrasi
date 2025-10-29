import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Send, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { BreadcrumbItem, SharedData } from '@/types';

interface Variable {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'select' | 'auto';
    required: boolean;
    default?: string;
    options?: Array<{ value: string; label: string }>;
}

interface Template {
    id: number;
    name: string;
    code: string;
    category: string;
    variables: Variable[];
    signatures: Array<{
        position_name: string;
        signature_type: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}

interface Letter {
    id: number;
    letter_number: string;
    subject: string;
    letter_date: string;
    recipient: string | null;
    notes: string | null;
    data: Record<string, any>;
    status: string;
    template: Template;
}

interface Props extends SharedData {
    letter: Letter;
}

export default function EditLetter({ letter }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Surat Keluar', href: '/arsip/letters' },
        { title: letter.letter_number, href: `/arsip/letters/${letter.id}` },
        { title: 'Edit', href: `/arsip/letters/${letter.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        subject: letter.subject,
        letter_date: letter.letter_date,
        recipient: letter.recipient || '',
        notes: letter.notes || '',
        data: letter.data,
        submit_type: 'draft' as 'draft' | 'submit',
    });

    const handleSubmit = (submitType: 'draft' | 'submit') => {
        setData('submit_type', submitType);

        // Validate required fields
        const missingFields: string[] = [];
        letter.template.variables.forEach((variable) => {
            if (variable.required && !data.data[variable.name]) {
                missingFields.push(variable.label);
            }
        });

        if (missingFields.length > 0) {
            toast.error(`Field wajib belum diisi: ${missingFields.join(', ')}`);
            return;
        }

        put(`/arsip/letters/${letter.id}`, {
            onSuccess: () => {
                toast.success(
                    submitType === 'submit'
                        ? 'Surat berhasil diperbarui dan dikirim untuk persetujuan'
                        : 'Surat berhasil diperbarui'
                );
            },
            onError: () => {
                toast.error('Gagal memperbarui surat');
            },
        });
    };

    const renderVariableInput = (variable: Variable) => {
        const value = data.data[variable.name] || '';
        const error = errors[`data.${variable.name}` as keyof typeof errors];
        const placeholder = variable.default || `Masukkan ${variable.label.toLowerCase()}`;

        const updateData = (newValue: string) => {
            setData('data', {
                ...data.data,
                [variable.name]: newValue,
            });
        };

        switch (variable.type) {
            case 'textarea':
                return (
                    <Textarea
                        id={variable.name}
                        value={value}
                        onChange={(e) => updateData(e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        id={variable.name}
                        value={value}
                        onChange={(e) => updateData(e.target.value)}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'select':
                return (
                    <div>
                        <SearchableSelect
                            value={value}
                            onValueChange={updateData}
                            options={variable.options || []}
                            placeholder={`Pilih ${variable.label.toLowerCase()}`}
                        />
                        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                    </div>
                );

            case 'auto':
                return (
                    <Input
                        id={variable.name}
                        value={value}
                        disabled
                        placeholder={placeholder}
                    />
                );

            case 'text':
            default:
                return (
                    <Input
                        id={variable.name}
                        value={value}
                        onChange={(e) => updateData(e.target.value)}
                        placeholder={placeholder}
                        className={error ? 'border-destructive' : ''}
                    />
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${letter.letter_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.visit(`/arsip/letters/${letter.id}`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Surat</h1>
                        <p className="text-muted-foreground mt-1">{letter.letter_number}</p>
                    </div>
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Template:</strong> {letter.template.name} ({letter.template.code})<br />
                        <strong>Kategori:</strong> {letter.template.category}<br />
                        <strong>Field:</strong> {letter.template.variables.length} field<br />
                        <strong>Penandatangan:</strong> {letter.template.signatures.length} orang
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Form Surat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Subject */}
                        <div>
                            <Label htmlFor="subject">
                                Perihal <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="subject"
                                value={data.subject}
                                onChange={(e) => setData('subject', e.target.value)}
                                placeholder="Contoh: Undangan Rapat Koordinasi"
                                className={errors.subject ? 'border-destructive' : ''}
                            />
                            {errors.subject && (
                                <p className="text-sm text-destructive mt-1">{errors.subject}</p>
                            )}
                        </div>

                        {/* Letter Date */}
                        <div>
                            <Label htmlFor="letter_date">
                                Tanggal Surat <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                id="letter_date"
                                value={data.letter_date}
                                onChange={(e) => setData('letter_date', e.target.value)}
                                className={errors.letter_date ? 'border-destructive' : ''}
                            />
                            {errors.letter_date && (
                                <p className="text-sm text-destructive mt-1">{errors.letter_date}</p>
                            )}
                        </div>

                        {/* Recipient */}
                        <div>
                            <Label htmlFor="recipient">Penerima</Label>
                            <Input
                                id="recipient"
                                value={data.recipient}
                                onChange={(e) => setData('recipient', e.target.value)}
                                placeholder="Contoh: Kepala Dinas Pendidikan"
                                className={errors.recipient ? 'border-destructive' : ''}
                            />
                            {errors.recipient && (
                                <p className="text-sm text-destructive mt-1">{errors.recipient}</p>
                            )}
                        </div>

                        {/* Dynamic Variables */}
                        {letter.template.variables.map((variable) => (
                            <div key={variable.name}>
                                <Label htmlFor={variable.name}>
                                    {variable.label}
                                    {variable.required && <span className="text-destructive ml-1">*</span>}
                                </Label>
                                {renderVariableInput(variable)}
                                {errors[`data.${variable.name}` as keyof typeof errors] && (
                                    <p className="text-sm text-destructive mt-1">
                                        {errors[`data.${variable.name}` as keyof typeof errors]}
                                    </p>
                                )}
                            </div>
                        ))}

                        {/* Notes */}
                        <div>
                            <Label htmlFor="notes">Catatan Internal</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan untuk keperluan internal (tidak akan tercetak di surat)"
                                rows={3}
                            />
                            {errors.notes && (
                                <p className="text-sm text-destructive mt-1">{errors.notes}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSubmit('draft')}
                                disabled={processing}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Simpan Draft
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleSubmit('submit')}
                                disabled={processing}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Perbarui & Kirim untuk Persetujuan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
