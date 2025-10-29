import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';
import { toast } from 'sonner';

interface OrganizationUnit {
    id: number;
    name: string;
}

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    sender: string;
    subject: string;
    original_date: string;
    received_date: string;
    category: string;
    classification: 'biasa' | 'penting' | 'segera' | 'rahasia';
    description: string | null;
    attachment_count: number;
    attachment_description: string | null;
    file_path: string | null;
    notes: string | null;
    organization_unit_id: number;
}

interface Props {
    letter: IncomingLetter;
    organizationUnits: OrganizationUnit[];
    categories: string[];
}

export default function Edit({ letter, organizationUnits, categories }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        original_number: letter.original_number,
        sender: letter.sender,
        subject: letter.subject,
        original_date: letter.original_date,
        received_date: letter.received_date,
        category: letter.category,
        classification: letter.classification,
        description: letter.description || '',
        attachment_count: letter.attachment_count,
        attachment_description: letter.attachment_description || '',
        notes: letter.notes || '',
        organization_unit_id: letter.organization_unit_id,
        file: null as File | null,
        _method: 'PUT',
    });

    // Prepare options for SearchableSelect
    const categoryOptions: SearchableSelectOption[] = categories.map((category) => ({
        value: category,
        label: category,
    }));

    const classificationOptions: SearchableSelectOption[] = [
        { value: 'biasa', label: 'Biasa' },
        { value: 'penting', label: 'Penting' },
        { value: 'segera', label: 'Segera' },
        { value: 'rahasia', label: 'Rahasia' },
    ];

    const organizationUnitOptions: SearchableSelectOption[] = organizationUnits.map((unit) => ({
        value: unit.id.toString(),
        label: unit.name,
    }));

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('arsip.incoming-letters.update', letter.id), {
            forceFormData: true,
            onError: () => toast.error('Gagal memperbarui surat masuk'),
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit Surat Masuk - ${letter.incoming_number}`} />

            <div className="space-y-6 my-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold md:text-2xl">Edit Surat Masuk</h2>
                        <p className="font-mono text-xs text-muted-foreground md:text-sm">{letter.incoming_number}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => router.visit('/arsip/incoming-letters')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Informasi Surat */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Informasi Surat</CardTitle>
                            <CardDescription>Data surat masuk yang diterima</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="original_number">
                                        Nomor Surat Asli <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="original_number"
                                        value={data.original_number}
                                        onChange={(e) => setData('original_number', e.target.value)}
                                        placeholder="Masukkan nomor surat asli"
                                        required
                                    />
                                    {errors.original_number && <p className="text-sm text-destructive">{errors.original_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="original_date">
                                        Tanggal Surat <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="original_date"
                                        type="date"
                                        value={data.original_date}
                                        onChange={(e) => setData('original_date', e.target.value)}
                                        required
                                    />
                                    {errors.original_date && <p className="text-sm text-destructive">{errors.original_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sender">
                                    Pengirim <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="sender"
                                    value={data.sender}
                                    onChange={(e) => setData('sender', e.target.value)}
                                    placeholder="Nama pengirim/instansi pengirim"
                                    required
                                />
                                {errors.sender && <p className="text-sm text-destructive">{errors.sender}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">
                                    Perihal <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="subject"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="Perihal surat"
                                    required
                                />
                                {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Keterangan</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Keterangan tambahan (opsional)"
                                    rows={3}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Klasifikasi */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Klasifikasi</CardTitle>
                            <CardDescription>Kategori dan tingkat urgensi surat</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="category">
                                        Kategori <span className="text-destructive">*</span>
                                    </Label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        value={data.category}
                                        onValueChange={(value) => setData('category', value)}
                                        placeholder="Pilih kategori"
                                        searchPlaceholder="Cari kategori..."
                                    />
                                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="classification">
                                        Klasifikasi <span className="text-destructive">*</span>
                                    </Label>
                                    <SearchableSelect
                                        options={classificationOptions}
                                        value={data.classification}
                                        onValueChange={(value) => setData('classification', value as any)}
                                        placeholder="Pilih klasifikasi"
                                        searchPlaceholder="Cari klasifikasi..."
                                    />
                                    {errors.classification && <p className="text-sm text-destructive">{errors.classification}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="received_date">
                                        Tanggal Diterima <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="received_date"
                                        type="date"
                                        value={data.received_date}
                                        onChange={(e) => setData('received_date', e.target.value)}
                                        required
                                    />
                                    {errors.received_date && <p className="text-sm text-destructive">{errors.received_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="organization_unit_id">
                                    Unit Organisasi <span className="text-destructive">*</span>
                                </Label>
                                <SearchableSelect
                                    options={organizationUnitOptions}
                                    value={data.organization_unit_id.toString()}
                                    onValueChange={(value) => setData('organization_unit_id', parseInt(value))}
                                    placeholder="Pilih unit organisasi"
                                    searchPlaceholder="Cari unit organisasi..."
                                />
                                {errors.organization_unit_id && <p className="text-sm text-destructive">{errors.organization_unit_id}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lampiran */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Lampiran</CardTitle>
                            <CardDescription>File dan lampiran surat</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="attachment_count">Jumlah Lampiran</Label>
                                    <Input
                                        id="attachment_count"
                                        type="number"
                                        min="0"
                                        value={data.attachment_count}
                                        onChange={(e) => setData('attachment_count', parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                    {errors.attachment_count && <p className="text-sm text-destructive">{errors.attachment_count}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="attachment_description">Keterangan Lampiran</Label>
                                    <Input
                                        id="attachment_description"
                                        value={data.attachment_description}
                                        onChange={(e) => setData('attachment_description', e.target.value)}
                                        placeholder="Deskripsi lampiran (opsional)"
                                    />
                                    {errors.attachment_description && <p className="text-sm text-destructive">{errors.attachment_description}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file">File Surat (Opsional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={fileInputRef}
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Sanitize filename - remove / and \ characters
                                                const sanitizedName = file.name.replace(/[\/\\]/g, '-');
                                                // Create new file with sanitized name
                                                const sanitizedFile = new File([file], sanitizedName, { type: file.type });
                                                setData('file', sanitizedFile);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                                        <Upload className="h-4 w-4" />
                                        {data.file ? 'Ganti File' : letter.file_path ? 'Ganti File' : 'Pilih File'}
                                    </Button>
                                    {data.file && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{data.file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setData('file', null);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                    )}
                                    {!data.file && letter.file_path && (
                                        <span className="self-center text-sm text-muted-foreground">File saat ini tersimpan</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">Format: PDF, DOC, DOCX, JPG, JPEG, PNG (Maks. 10MB)</p>
                                {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Catatan */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Catatan Internal</CardTitle>
                            <CardDescription>Catatan untuk penggunaan internal</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Catatan internal (opsional)"
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Link href={route('arsip.incoming-letters.show', letter.id)}>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="gap-2">
                            <Save className="h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
