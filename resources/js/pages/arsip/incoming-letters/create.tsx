import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, OrganizationUnit, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { FormEvent, useRef } from 'react';
import { toast } from 'sonner';

interface Props extends SharedData {
    organizationUnits: OrganizationUnit[];
    categories: string[];
    classifications: { value: string; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Surat Masuk', href: '/arsip/incoming-letters' },
    { title: 'Registrasi Surat Masuk', href: '/arsip/incoming-letters/create' },
];

export default function CreateIncomingLetter({ organizationUnits, categories, classifications }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        original_number: '',
        original_date: '',
        received_date: new Date().toISOString().split('T')[0],
        sender: '',
        subject: '',
        category: '',
        classification: 'biasa',
        attachment_count: 0,
        attachment_description: '',
        organization_unit_id: '',
        notes: '',
        file: null as File | null,
    });

    // Prepare options for SearchableSelect
    const categoryOptions: SearchableSelectOption[] = categories.map((category) => ({
        value: category,
        label: category,
    }));

    const classificationOptions: SearchableSelectOption[] = classifications.map((classification) => ({
        value: classification.value,
        label: classification.label,
    }));

    const organizationUnitOptions: SearchableSelectOption[] = organizationUnits.map((unit) => ({
        value: unit.id.toString(),
        label: unit.name,
        description: unit.code,
    }));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post('/arsip/incoming-letters', {
            forceFormData: true,
            onSuccess: () => {
            },
            onError: () => {
                toast.error('Gagal menyimpan surat masuk');
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Sanitize filename - remove / and \ characters
            const sanitizedName = file.name.replace(/[\/\\]/g, '-');
            // Create new file with sanitized name
            const sanitizedFile = new File([file], sanitizedName, { type: file.type });
            setData('file', sanitizedFile);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registrasi Surat Masuk" />

            <div className="max-w-7xl space-y-6 my-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold">Registrasi Surat Masuk</h2>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono">Daftarkan surat masuk baru ke dalam sistem</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => router.visit('/arsip/incoming-letters')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Surat</CardTitle>
                            <CardDescription>Lengkapi data surat masuk</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Nomor Surat Asal */}
                            <div className="space-y-2">
                                <Label htmlFor="original_number">
                                    Nomor Surat Asal <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="original_number"
                                    placeholder="Contoh: 001/DIR/2025"
                                    value={data.original_number}
                                    onChange={(e) => setData('original_number', e.target.value)}
                                    className={errors.original_number ? 'border-red-500' : ''}
                                />
                                {errors.original_number && <p className="text-sm text-red-500">{errors.original_number}</p>}
                            </div>

                            {/* Tanggal */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="original_date">
                                        Tanggal Surat <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="original_date"
                                        type="date"
                                        value={data.original_date}
                                        onChange={(e) => setData('original_date', e.target.value)}
                                        className={errors.original_date ? 'border-red-500' : ''}
                                    />
                                    {errors.original_date && <p className="text-sm text-red-500">{errors.original_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="received_date">
                                        Tanggal Diterima <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="received_date"
                                        type="date"
                                        value={data.received_date}
                                        onChange={(e) => setData('received_date', e.target.value)}
                                        className={errors.received_date ? 'border-red-500' : ''}
                                    />
                                    {errors.received_date && <p className="text-sm text-red-500">{errors.received_date}</p>}
                                </div>
                            </div>

                            {/* Pengirim */}
                            <div className="space-y-2">
                                <Label htmlFor="sender">
                                    Pengirim/Asal Surat <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="sender"
                                    placeholder="Contoh: Dinas Pendidikan Provinsi"
                                    value={data.sender}
                                    onChange={(e) => setData('sender', e.target.value)}
                                    className={errors.sender ? 'border-red-500' : ''}
                                />
                                {errors.sender && <p className="text-sm text-red-500">{errors.sender}</p>}
                            </div>

                            {/* Perihal */}
                            <div className="space-y-2">
                                <Label htmlFor="subject">
                                    Perihal <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="subject"
                                    placeholder="Perihal surat..."
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    className={errors.subject ? 'border-red-500' : ''}
                                    rows={3}
                                />
                                {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                            </div>

                            {/* Kategori & Sifat */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori</Label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        value={data.category}
                                        onValueChange={(value) => setData('category', value)}
                                        placeholder="Pilih kategori"
                                        searchPlaceholder="Cari kategori..."
                                    />
                                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="classification">
                                        Sifat Surat <span className="text-red-500">*</span>
                                    </Label>
                                    <SearchableSelect
                                        options={classificationOptions}
                                        value={data.classification}
                                        onValueChange={(value) => setData('classification', value)}
                                        placeholder="Pilih sifat surat"
                                        searchPlaceholder="Cari sifat..."
                                    />
                                    {errors.classification && <p className="text-sm text-red-500">{errors.classification}</p>}
                                </div>
                            </div>

                            {/* Lampiran */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="attachment_count">Jumlah Lampiran</Label>
                                    <Input
                                        id="attachment_count"
                                        type="number"
                                        min="0"
                                        value={data.attachment_count}
                                        onChange={(e) => setData('attachment_count', parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="attachment_description">Deskripsi Lampiran</Label>
                                    <Input
                                        id="attachment_description"
                                        placeholder="Contoh: 1 berkas proposal"
                                        value={data.attachment_description}
                                        onChange={(e) => setData('attachment_description', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Unit Tujuan */}
                            <div className="space-y-2">
                                <Label htmlFor="organization_unit_id">
                                    Unit Tujuan <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={organizationUnitOptions}
                                    value={data.organization_unit_id}
                                    onValueChange={(value) => setData('organization_unit_id', value)}
                                    placeholder="Pilih unit tujuan"
                                    searchPlaceholder="Cari unit organisasi..."
                                />
                                {errors.organization_unit_id && <p className="text-sm text-red-500">{errors.organization_unit_id}</p>}
                            </div>

                            {/* Upload File */}
                            <div className="space-y-2">
                                <Label htmlFor="file">Upload Scan Surat (PDF/JPG/PNG, Max 10MB)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={fileInputRef}
                                        id="file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                                        <Upload className="mr-2 h-4 w-4" />
                                        {data.file ? data.file.name : 'Pilih File'}
                                    </Button>
                                </div>
                                {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
                            </div>

                            {/* Catatan */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Catatan tambahan..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.visit('/arsip/incoming-letters')} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Surat Masuk'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
