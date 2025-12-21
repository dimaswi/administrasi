import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { FormPage } from '@/components/ui/form-page';
import { Upload, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Archive {
    id: number;
    document_number: string | null;
    title: string;
    description: string | null;
    category: string | null;
    document_date: string;
    document_type: string | null;
    file_path: string;
    file_type: string | null;
    sender: string | null;
    recipient: string | null;
    classification: 'public' | 'internal' | 'confidential' | 'secret';
    retention_period: number | null;
    tags: string[];
}

interface Props {
    archive: Archive;
}

export default function Edit({ archive }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [tags, setTags] = useState<string[]>(archive.tags || []);
    const [tagInput, setTagInput] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        document_number: archive.document_number || '',
        title: archive.title,
        description: archive.description || '',
        category: archive.category || '',
        document_date: archive.document_date,
        document_type: archive.document_type || '',
        file: null as File | null,
        sender: archive.sender || '',
        recipient: archive.recipient || '',
        classification: archive.classification,
        retention_period: archive.retention_period?.toString() || '',
        tags: archive.tags || [],
        _method: 'PUT',
    });

    const classificationOptions: SearchableSelectOption[] = [
        { value: 'public', label: 'Publik' },
        { value: 'internal', label: 'Internal' },
        { value: 'confidential', label: 'Rahasia' },
        { value: 'secret', label: 'Sangat Rahasia' },
    ];

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Update tags before submitting
        setData('tags', tags);

        post(route('arsip.archives.update', archive.id), {
            onError: () => toast.error('Gagal memperbarui arsip'),
        });
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <AppLayout>
            <Head title={`Edit Arsip: ${archive.title}`} />

            <FormPage
                title="Edit Arsip Dokumen"
                description="Perbarui informasi arsip dokumen"
                backUrl={route('arsip.archives.index')}
                onSubmit={handleSubmit}
                submitLabel="Simpan Perubahan"
                isLoading={processing}
            >
                {/* File Upload */}
                <div className="space-y-2">
                    <Label htmlFor="file">File Dokumen (Opsional - kosongkan jika tidak ingin mengganti)</Label>
                    <div className="space-y-2">
                        <input
                            ref={fileInputRef}
                            id="file"
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setData('file', file);
                            }}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                {data.file ? 'Ganti File' : 'Upload File Baru'}
                            </Button>
                            {data.file && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                                    <span className="text-sm">{data.file.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setData('file', null)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            File saat ini: {archive.file_type?.toUpperCase()} • Format: PDF, DOC, DOCX, JPG, PNG (Max: 10MB)
                        </p>
                        {errors.file && (
                            <p className="text-sm text-destructive">{errors.file}</p>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">
                        Judul Dokumen <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Masukkan judul dokumen"
                        required
                    />
                    {errors.title && (
                        <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                </div>

                {/* Document Number */}
                <div className="space-y-2">
                    <Label htmlFor="document_number">Nomor Dokumen</Label>
                    <Input
                        id="document_number"
                        value={data.document_number}
                        onChange={(e) => setData('document_number', e.target.value)}
                        placeholder="Contoh: 001/SK/2025"
                    />
                    {errors.document_number && (
                        <p className="text-sm text-destructive">{errors.document_number}</p>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Deskripsi singkat tentang dokumen"
                        rows={3}
                    />
                    {errors.description && (
                        <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                </div>

                {/* Document Date */}
                <div className="space-y-2">
                    <Label htmlFor="document_date">
                        Tanggal Dokumen <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="document_date"
                        type="date"
                        value={data.document_date}
                        onChange={(e) => setData('document_date', e.target.value)}
                        required
                    />
                    {errors.document_date && (
                        <p className="text-sm text-destructive">{errors.document_date}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori</Label>
                        <Input
                            id="category"
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            placeholder="Contoh: Surat Keputusan"
                        />
                        {errors.category && (
                            <p className="text-sm text-destructive">{errors.category}</p>
                        )}
                    </div>

                    {/* Document Type */}
                    <div className="space-y-2">
                        <Label htmlFor="document_type">Jenis Dokumen</Label>
                        <Input
                            id="document_type"
                            value={data.document_type}
                            onChange={(e) => setData('document_type', e.target.value)}
                            placeholder="Contoh: SK, MoU, Undangan"
                        />
                        {errors.document_type && (
                            <p className="text-sm text-destructive">{errors.document_type}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sender */}
                    <div className="space-y-2">
                        <Label htmlFor="sender">Pengirim</Label>
                        <Input
                            id="sender"
                            value={data.sender}
                            onChange={(e) => setData('sender', e.target.value)}
                            placeholder="Nama pengirim dokumen"
                        />
                        {errors.sender && (
                            <p className="text-sm text-destructive">{errors.sender}</p>
                        )}
                    </div>

                    {/* Recipient */}
                    <div className="space-y-2">
                        <Label htmlFor="recipient">Penerima</Label>
                        <Input
                            id="recipient"
                            value={data.recipient}
                            onChange={(e) => setData('recipient', e.target.value)}
                            placeholder="Nama penerima dokumen"
                        />
                        {errors.recipient && (
                            <p className="text-sm text-destructive">{errors.recipient}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Classification */}
                    <div className="space-y-2">
                        <Label htmlFor="classification">
                            Klasifikasi <span className="text-destructive">*</span>
                        </Label>
                        <SearchableSelect
                            options={classificationOptions}
                            value={data.classification}
                            onValueChange={(value) => setData('classification', value as 'public' | 'internal' | 'confidential' | 'secret')}
                            placeholder="Pilih klasifikasi"
                            searchPlaceholder="Cari klasifikasi..."
                        />
                        {errors.classification && (
                            <p className="text-sm text-destructive">{errors.classification}</p>
                        )}
                    </div>

                    {/* Retention Period */}
                    <div className="space-y-2">
                        <Label htmlFor="retention_period">Masa Retensi (Tahun)</Label>
                        <Input
                            id="retention_period"
                            type="number"
                            min="1"
                            value={data.retention_period}
                            onChange={(e) => setData('retention_period', e.target.value)}
                            placeholder="Contoh: 5"
                        />
                        <p className="text-xs text-muted-foreground">
                            Masa penyimpanan dokumen dalam tahun
                        </p>
                        {errors.retention_period && (
                            <p className="text-sm text-destructive">{errors.retention_period}</p>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label htmlFor="tags">Tag</Label>
                    <div className="flex gap-2">
                        <Input
                            id="tags"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag();
                                }
                            }}
                            placeholder="Ketik tag dan tekan Enter"
                        />
                        <Button type="button" variant="outline" onClick={addTag}>
                            Tambah
                        </Button>
                    </div>
                    {tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                            {tags.map((tag) => (
                                <div
                                    key={tag}
                                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                                >
                                    <span>{tag}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => removeTag(tag)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </FormPage>
        </AppLayout>
    );
}
