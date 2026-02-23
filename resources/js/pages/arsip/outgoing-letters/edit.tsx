import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    ArrowLeft, Save, Loader2, FileText, User, Calendar, Hash, Variable,
    ZoomIn, ZoomOut, RotateCcw, PenTool, Zap, GripVertical, CheckCircle
} from 'lucide-react';
import { DocumentTemplate, TemplateVariable, SignatureSlot } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';

interface UserType {
    id: number;
    name: string;
    email?: string;
    position?: string;
    nip?: string;
    organization_unit?: string;
}

interface Signatory {
    id: number;
    user_id: number;
    slot_id: string;
    sign_order: number;
    status: string;
    user: UserType;
}

interface OutgoingLetter {
    id: number;
    letter_number: string | null;
    subject: string;
    letter_date: string;
    status: string;
    variable_values: Record<string, any>;
    notes: string | null;
    template: DocumentTemplate;
    signatories: Signatory[];
}

interface Props {
    letter: OutgoingLetter;
    users: UserType[];
}

export default function Edit({ letter, users }: Props) {
    const [activeTab, setActiveTab] = useState('info');
    const [previewScale, setPreviewScale] = useState(0.5);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    
    const { data, setData, put, processing, errors, isDirty } = useForm({
        subject: letter.subject,
        letter_date: letter.letter_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        variable_values: letter.variable_values || {},
        signatories: letter.signatories.map(s => ({
            user_id: s.user_id,
            slot_id: s.slot_id,
            sign_order: s.sign_order,
        })),
        notes: letter.notes || '',
    });

    const template = letter.template;

    const breadcrumbs = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Surat Keluar', href: '/arsip/outgoing-letters' },
        { title: letter.letter_number || letter.subject, href: `/arsip/outgoing-letters/${letter.id}` },
        { title: 'Edit', href: '#' },
    ];

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
                const optimalScale = Math.min(scaleByHeight, scaleByWidth, 0.7);
                
                setPreviewScale(Math.max(0.3, optimalScale));
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Reset success badge after delay
    useEffect(() => {
        if (saveSuccess) {
            const timer = setTimeout(() => setSaveSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveSuccess]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/arsip/outgoing-letters/${letter.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSaveSuccess(true);
            },
        });
    };

    const updateVariableValue = (key: string, value: any) => {
        setData('variable_values', {
            ...data.variable_values,
            [key]: value,
        });
    };

    const updateSignatory = (slotId: string, userId: number) => {
        const newSignatories = [...data.signatories];
        const existingIndex = newSignatories.findIndex(s => s.slot_id === slotId);
        if (existingIndex >= 0) {
            newSignatories[existingIndex].user_id = userId;
        } else {
            const slotIndex = template?.signature_settings?.slots?.findIndex(s => s.id === slotId) ?? 0;
            newSignatories.push({ slot_id: slotId, user_id: userId, sign_order: slotIndex });
        }
        setData('signatories', newSignatories);
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.5);
    };

    // Get manual variables only
    const manualVariables = template?.variables?.filter(v => !v.source || v.source === 'manual') || [];

    const renderVariableInput = (variable: TemplateVariable) => {
        const value = data.variable_values[variable.key] ?? variable.default_value ?? '';

        switch (variable.type) {
            case 'textarea':
                return (
                    <Textarea
                        value={value}
                        onChange={(e) => updateVariableValue(variable.key, e.target.value)}
                        placeholder={variable.placeholder || `Masukkan ${variable.label}`}
                        rows={3}
                        className="text-sm resize-none"
                    />
                );
            case 'date':
                return (
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="date"
                            value={value}
                            onChange={(e) => updateVariableValue(variable.key, e.target.value)}
                            className="h-8 pl-9 text-sm"
                        />
                    </div>
                );
            case 'number':
                return (
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => updateVariableValue(variable.key, e.target.value)}
                            placeholder={variable.placeholder || `Masukkan ${variable.label}`}
                            className="h-8 pl-9 text-sm"
                        />
                    </div>
                );
            case 'select':
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => updateVariableValue(variable.key, val)}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder={`Pilih ${variable.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {(variable.options || []).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return (
                    <Input
                        value={value}
                        onChange={(e) => updateVariableValue(variable.key, e.target.value)}
                        placeholder={variable.placeholder || `Masukkan ${variable.label}`}
                        className="h-8 text-sm"
                    />
                );
        }
    };

    return (
        <AppLayout>
            <Head title={`Edit - ${letter.letter_number || letter.subject}`} />

            <form onSubmit={handleSubmit} className="h-[calc(100vh-64px)] flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit(`/arsip/outgoing-letters/${letter.id}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold leading-none">Edit Surat Keluar</h1>
                                {saveSuccess && (
                                    <Badge variant="secondary" className="text-[10px] h-5 gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        Tersimpan
                                    </Badge>
                                )}
                                {isDirty && !saveSuccess && (
                                    <Badge variant="outline" className="text-[10px] h-5">
                                        Belum disimpan
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {template?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={letter.status === 'draft' ? 'secondary' : 'default'} className="text-xs">
                            {letter.status === 'draft' ? 'Draft' : letter.status}
                        </Badge>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1.5" />
                            )}
                            Simpan
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Form */}
                    <div className="w-[400px] border-r flex flex-col bg-background shrink-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                            <TabsList className="w-full h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b">
                                <TabsTrigger 
                                    value="info" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Info Surat
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="variables" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Variabel {manualVariables.length > 0 && `(${manualVariables.length})`}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="signatories" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    TTD {template?.signature_settings?.slots?.length ? `(${template.signature_settings.slots.length})` : ''}
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-auto">
                                <div className="p-4">
                                    <TabsContent value="info" className="m-0 space-y-4">
                                        {/* Template Info */}
                                        <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground text-xs">Template:</span>
                                                <span className="text-xs font-medium">{template?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground text-xs">Kode:</span>
                                                <span className="font-mono text-xs">{template?.code}</span>
                                            </div>
                                            {letter.letter_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Nomor Surat:</span>
                                                    <span className="font-mono text-xs font-medium">{letter.letter_number}</span>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Subject */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">
                                                Perihal Surat <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                value={data.subject}
                                                onChange={(e) => setData('subject', e.target.value)}
                                                placeholder="Masukkan perihal surat..."
                                                className={`h-9 ${errors.subject ? 'border-destructive' : ''}`}
                                            />
                                            {errors.subject && (
                                                <p className="text-xs text-destructive">{errors.subject}</p>
                                            )}
                                        </div>

                                        {/* Letter Date */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">
                                                Tanggal Surat <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    type="date"
                                                    value={data.letter_date}
                                                    onChange={(e) => setData('letter_date', e.target.value)}
                                                    className={`h-9 pl-9 ${errors.letter_date ? 'border-destructive' : ''}`}
                                                />
                                            </div>
                                            {errors.letter_date && (
                                                <p className="text-xs text-destructive">{errors.letter_date}</p>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">Catatan</Label>
                                            <Textarea
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Catatan internal (opsional)..."
                                                rows={3}
                                                className="text-sm resize-none"
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="variables" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium">Isi Data Surat</h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                Lengkapi variabel yang diperlukan
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {manualVariables.map((variable) => (
                                                <div key={variable.key} className="border rounded-lg p-3 bg-muted/20 space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <GripVertical className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <Label className="text-xs font-medium">
                                                                    {variable.label}
                                                                    {variable.required && (
                                                                        <span className="text-destructive ml-1">*</span>
                                                                    )}
                                                                </Label>
                                                                <Badge variant="outline" className="text-[9px]">
                                                                    {variable.type}
                                                                </Badge>
                                                            </div>
                                                            
                                                            {renderVariableInput(variable)}
                                                            
                                                            {(errors as Record<string, string>)[`variable_values.${variable.key}`] && (
                                                                <p className="text-[10px] text-destructive">
                                                                    {(errors as Record<string, string>)[`variable_values.${variable.key}`]}
                                                                </p>
                                                            )}
                                                            
                                                            <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono">
                                                                {'{{'}{variable.key}{'}}'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {manualVariables.length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <Variable className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada variabel yang perlu diisi</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Auto variables info */}
                                        {(template?.variables || []).filter(v => v.source && v.source !== 'manual').length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                                                    Variabel Otomatis
                                                </div>
                                                <div className="space-y-1">
                                                    {(template?.variables || []).filter(v => v.source && v.source !== 'manual').map((variable) => (
                                                        <div key={variable.key} className="flex items-center justify-between text-xs bg-muted/30 px-2 py-1.5 rounded">
                                                            <span>{variable.label}</span>
                                                            <Badge variant="secondary" className="text-[9px]">
                                                                {variable.source === 'auto_number' && 'Nomor Otomatis'}
                                                                {variable.source === 'auto_date' && 'Tanggal Otomatis'}
                                                                {variable.source === 'auto_user' && 'User Pembuat'}
                                                                {variable.source === 'auto_unit' && 'Unit Kerja'}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="signatories" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium flex items-center gap-2">
                                                <PenTool className="h-4 w-4" />
                                                Penanda Tangan
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                Tentukan siapa yang akan menandatangani
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {(template?.signature_settings?.slots || []).map((slot, index) => {
                                                const signatory = data.signatories.find(s => s.slot_id === slot.id);
                                                const existingSignatory = letter.signatories.find(s => s.slot_id === slot.id);
                                                
                                                return (
                                                    <div key={slot.id} className="border rounded-lg p-3 bg-muted/20 space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-background border text-[10px] font-medium shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <Label className="text-xs font-medium">
                                                                            {slot.label_position || `Penanda Tangan ${index + 1}`}
                                                                        </Label>
                                                                        {slot.label_above && (
                                                                            <p className="text-[10px] text-muted-foreground">
                                                                                {slot.label_above}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {existingSignatory?.status === 'approved' && (
                                                                        <Badge variant="default" className="text-[9px] bg-green-500">
                                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                                            Signed
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                
                                                                <SearchableSelect
                                                                    options={users.map((user) => ({
                                                                        value: user.id.toString(),
                                                                        label: user.name,
                                                                        description: user.nip ? `NIP. ${user.nip}` : user.position || undefined,
                                                                    }))}
                                                                    value={signatory?.user_id?.toString() || ''}
                                                                    onValueChange={(value) => updateSignatory(slot.id, parseInt(value))}
                                                                    placeholder="Cari penanda tangan..."
                                                                    searchPlaceholder="Ketik nama atau NIP..."
                                                                    className="h-8"
                                                                    disabled={existingSignatory?.status === 'approved'}
                                                                />

                                                                <div className="flex gap-2 flex-wrap">
                                                                    <Badge variant="secondary" className="text-[9px]">
                                                                        Kolom {slot.column}
                                                                    </Badge>
                                                                    {slot.show_name && (
                                                                        <Badge variant="outline" className="text-[9px]">Nama</Badge>
                                                                    )}
                                                                    {slot.show_nip && (
                                                                        <Badge variant="outline" className="text-[9px]">NIP</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {(!template?.signature_settings?.slots?.length) && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <PenTool className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada slot tanda tangan</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right Panel - Preview */}
                    <div 
                        ref={previewContainerRef}
                        className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                    >
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b bg-background/80 backdrop-blur-sm flex items-center justify-center gap-1 px-4 shrink-0">
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleZoom(-0.1)}
                                disabled={previewScale <= 0.3}
                            >
                                <ZoomOut className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground w-12 text-center font-mono">
                                {Math.round(previewScale * 100)}%
                            </span>
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleZoom(0.1)}
                                disabled={previewScale >= 1}
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

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto">
                            {template ? (
                                <div className="min-h-full flex items-start justify-center py-6 px-4">
                                    <TemplatePreview
                                        pageSettings={template.page_settings}
                                        headerSettings={template.header_settings}
                                        contentBlocks={template.content_blocks}
                                        signatureSettings={template.signature_settings}
                                        footerSettings={template.footer_settings}
                                        variableValues={data.variable_values}
                                        scale={previewScale}
                                        hideSignature={true}
                                        signatoriesData={data.signatories.map(s => {
                                            const user = users.find(u => u.id === s.user_id);
                                            return {
                                                slot_id: s.slot_id,
                                                name: user?.name || '',
                                                nip: user?.nip || '',
                                            };
                                        })}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-sm">Template tidak ditemukan</p>
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
