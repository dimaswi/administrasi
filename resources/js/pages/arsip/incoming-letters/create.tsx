import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    ArrowLeft, Save, Loader2, FileText, Calendar, Hash, 
    ZoomIn, ZoomOut, RotateCcw, Upload, Building2, User, Tag, Paperclip, AlertCircle, FileUp
} from 'lucide-react';
import type { OrganizationUnit, SharedData } from '@/types';

interface Props extends SharedData {
    organizationUnits: OrganizationUnit[];
    categories: string[];
    classifications: { value: string; label: string }[];
}

export default function CreateIncomingLetter({ organizationUnits, categories, classifications }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewScale, setPreviewScale] = useState(0.7);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const { data, setData, post, processing, errors } = useForm<{
        original_number: string;
        original_date: string;
        received_date: string;
        sender: string;
        subject: string;
        category: string;
        classification: string;
        attachment_count: number;
        attachment_description: string;
        organization_unit_id: string;
        notes: string;
        file: File | null;
    }>({
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
        file: null,
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

    // Auto-fit preview scale based on container size
    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const container = previewContainerRef.current;
                const containerHeight = container.clientHeight - 80;
                const containerWidth = container.clientWidth - 48;
                
                const a4Height = 1123;
                const a4Width = 794;
                
                const scaleByHeight = containerHeight / a4Height;
                const scaleByWidth = containerWidth / a4Width;
                const optimalScale = Math.min(scaleByHeight, scaleByWidth, 0.8);
                
                setPreviewScale(Math.max(0.3, optimalScale));
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Handle file preview
    useEffect(() => {
        if (data.file) {
            const url = URL.createObjectURL(data.file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [data.file]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Client-side validation
        const newErrors: string[] = [];
        
        if (!data.original_number.trim()) {
            newErrors.push('Nomor surat asal harus diisi');
        }
        if (!data.original_date) {
            newErrors.push('Tanggal surat harus diisi');
        }
        if (!data.received_date) {
            newErrors.push('Tanggal diterima harus diisi');
        }
        if (!data.sender.trim()) {
            newErrors.push('Pengirim harus diisi');
        }
        if (!data.subject.trim()) {
            newErrors.push('Perihal harus diisi');
        }
        if (!data.organization_unit_id) {
            newErrors.push('Unit tujuan harus dipilih');
        }
        
        if (newErrors.length > 0) {
            setValidationErrors(newErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        setValidationErrors([]);
        
        // Prepare form data object for Inertia
        const formPayload: Record<string, any> = {
            original_number: data.original_number,
            original_date: data.original_date,
            received_date: data.received_date,
            sender: data.sender,
            subject: data.subject,
            classification: data.classification,
            attachment_count: data.attachment_count || 0,
            organization_unit_id: data.organization_unit_id,
        };
        
        if (data.category) formPayload.category = data.category;
        if (data.attachment_description) formPayload.attachment_description = data.attachment_description;
        if (data.notes) formPayload.notes = data.notes;
        
        // Get file directly from input element
        const fileInput = fileInputRef.current;
        if (fileInput?.files?.[0]) {
            formPayload.file = fileInput.files[0];
        }
        
        router.post('/arsip/incoming-letters', formPayload, {
            forceFormData: true,
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat() as string[];
                setValidationErrors(errorMessages.length > 0 ? errorMessages : ['Validasi gagal']);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (20MB max)
            if (file.size > 20 * 1024 * 1024) {
                setValidationErrors(['Ukuran file maksimal 20MB']);
                return;
            }
            
            // Check file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setValidationErrors(['Tipe file harus PDF, JPG, atau PNG']);
                return;
            }
            
            setValidationErrors([]);
            setData('file', file);
        }
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1.5, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.7);
    };

    const isPdf = data.file?.type === 'application/pdf';
    const isImage = data.file?.type?.startsWith('image/');

    return (
        <AppLayout>
            <Head title="Registrasi Surat Masuk" />

            <form onSubmit={handleSubmit} className="h-[calc(100vh-64px)] flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/arsip/incoming-letters')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-sm font-semibold leading-none">Registrasi Surat Masuk</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {data.file ? data.file.name : 'Daftarkan surat masuk baru'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1.5" />
                            )}
                            Simpan Surat Masuk
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Form */}
                    <div className="w-[420px] border-r flex flex-col bg-background shrink-0">
                        {/* Validation Errors Alert */}
                        {validationErrors.length > 0 && (
                            <div className="p-3 border-b">
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            {validationErrors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                        
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-6">
                                {/* Upload File Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <FileUp className="h-4 w-4 text-primary" />
                                        Upload Scan Surat
                                    </div>
                                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full"
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {data.file ? 'Ganti File' : 'Pilih File'}
                                        </Button>
                                        {data.file && (
                                            <p className="text-xs text-muted-foreground mt-2 truncate">
                                                {data.file.name}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PDF, JPG, PNG (Maks. 20MB)
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Informasi Surat */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Informasi Surat
                                    </div>

                                    {/* Nomor Surat Asal */}
                                    <div className="space-y-2">
                                        <Label htmlFor="original_number" className="text-xs">
                                            Nomor Surat Asal <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                id="original_number"
                                                placeholder="Contoh: 001/DIR/2025"
                                                value={data.original_number}
                                                onChange={(e) => setData('original_number', e.target.value)}
                                                className={`h-9 pl-9 text-sm ${errors.original_number ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.original_number && <p className="text-xs text-destructive">{errors.original_number}</p>}
                                    </div>

                                    {/* Tanggal Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="original_date" className="text-xs">
                                                Tanggal Surat <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    id="original_date"
                                                    type="date"
                                                    value={data.original_date}
                                                    onChange={(e) => setData('original_date', e.target.value)}
                                                    className={`h-9 pl-9 text-sm ${errors.original_date ? 'border-destructive' : ''}`}
                                                />
                                            </div>
                                            {errors.original_date && <p className="text-xs text-destructive">{errors.original_date}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="received_date" className="text-xs">
                                                Tanggal Diterima <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    id="received_date"
                                                    type="date"
                                                    value={data.received_date}
                                                    onChange={(e) => setData('received_date', e.target.value)}
                                                    className={`h-9 pl-9 text-sm ${errors.received_date ? 'border-destructive' : ''}`}
                                                />
                                            </div>
                                            {errors.received_date && <p className="text-xs text-destructive">{errors.received_date}</p>}
                                        </div>
                                    </div>

                                    {/* Pengirim */}
                                    <div className="space-y-2">
                                        <Label htmlFor="sender" className="text-xs">
                                            Pengirim/Asal Surat <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                id="sender"
                                                placeholder="Contoh: Dinas Pendidikan Provinsi"
                                                value={data.sender}
                                                onChange={(e) => setData('sender', e.target.value)}
                                                className={`h-9 pl-9 text-sm ${errors.sender ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.sender && <p className="text-xs text-destructive">{errors.sender}</p>}
                                    </div>

                                    {/* Perihal */}
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-xs">
                                            Perihal <span className="text-destructive">*</span>
                                        </Label>
                                        <Textarea
                                            id="subject"
                                            placeholder="Perihal surat..."
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            className={`text-sm resize-none ${errors.subject ? 'border-destructive' : ''}`}
                                            rows={2}
                                        />
                                        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                                    </div>
                                </div>

                                <Separator />

                                {/* Klasifikasi */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Tag className="h-4 w-4 text-primary" />
                                        Klasifikasi
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Kategori</Label>
                                            <SearchableSelect
                                                options={categoryOptions}
                                                value={data.category}
                                                onValueChange={(value) => setData('category', value)}
                                                placeholder="Pilih kategori"
                                                searchPlaceholder="Cari kategori..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">
                                                Sifat Surat <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                value={data.classification}
                                                onValueChange={(value) => setData('classification', value)}
                                            >
                                                <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue placeholder="Pilih sifat" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {classificationOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Unit Tujuan */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Unit Tujuan
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">
                                            Pilih Unit <span className="text-destructive">*</span>
                                        </Label>
                                        <SearchableSelect
                                            options={organizationUnitOptions}
                                            value={data.organization_unit_id}
                                            onValueChange={(value) => setData('organization_unit_id', value)}
                                            placeholder="Pilih unit tujuan"
                                            searchPlaceholder="Cari unit organisasi..."
                                        />
                                        {errors.organization_unit_id && <p className="text-xs text-destructive">{errors.organization_unit_id}</p>}
                                    </div>
                                </div>

                                <Separator />

                                {/* Lampiran */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Paperclip className="h-4 w-4 text-primary" />
                                        Lampiran
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="attachment_count" className="text-xs">Jumlah</Label>
                                            <Input
                                                id="attachment_count"
                                                type="number"
                                                min="0"
                                                value={data.attachment_count}
                                                onChange={(e) => setData('attachment_count', parseInt(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="attachment_description" className="text-xs">Deskripsi</Label>
                                            <Input
                                                id="attachment_description"
                                                placeholder="1 berkas proposal"
                                                value={data.attachment_description}
                                                onChange={(e) => setData('attachment_description', e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Catatan */}
                                <div className="space-y-3">
                                    <Label htmlFor="notes" className="text-xs">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Catatan tambahan..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="text-sm resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Panel - Preview */}
                    <div ref={previewContainerRef} className="flex-1 bg-muted/30 flex flex-col overflow-hidden">
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b bg-background flex items-center justify-between px-4 shrink-0">
                            <span className="text-xs text-muted-foreground">
                                {previewUrl ? 'Preview Dokumen' : 'Preview akan muncul setelah upload file'}
                            </span>
                            {previewUrl && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleZoom(-0.1)}
                                    >
                                        <ZoomOut className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground w-12 text-center">
                                        {Math.round(previewScale * 100)}%
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleZoom(0.1)}
                                    >
                                        <ZoomIn className="h-3.5 w-3.5" />
                                    </Button>
                                    <Separator orientation="vertical" className="h-4 mx-1" />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={resetZoom}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {previewUrl ? (
                                <div className="flex justify-center">
                                    {isPdf ? (
                                        <iframe
                                            src={`${previewUrl}#toolbar=0&navpanes=0`}
                                            className="bg-white shadow-lg rounded-lg border"
                                            style={{
                                                width: `${794 * previewScale}px`,
                                                height: `${1123 * previewScale}px`,
                                            }}
                                        />
                                    ) : isImage ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="bg-white shadow-lg rounded-lg border max-w-full"
                                            style={{
                                                maxWidth: `${794 * previewScale}px`,
                                                maxHeight: `${1123 * previewScale}px`,
                                                objectFit: 'contain',
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-muted-foreground">
                                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                                <p className="text-sm">Format file tidak dapat di-preview</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <div 
                                            className="bg-white shadow-lg rounded-lg border flex items-center justify-center mx-auto"
                                            style={{
                                                width: `${794 * previewScale}px`,
                                                height: `${1123 * previewScale}px`,
                                            }}
                                        >
                                            <div className="text-center p-8">
                                                <FileUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Belum ada file yang diupload
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Upload scan surat untuk melihat preview
                                                </p>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="mt-4"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-4 w-4 mr-1.5" />
                                                    Upload File
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
