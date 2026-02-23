import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { 
    ArrowLeft, Save, Loader2, FileText, Calendar, Hash, Variable,
    ZoomIn, ZoomOut, RotateCcw, GripVertical, CheckCircle, AlertTriangle
} from 'lucide-react';
import { DocumentTemplate, TemplateVariable } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';

interface OutgoingLetter {
    id: number;
    letter_number: string | null;
    subject: string;
    letter_date: string;
    status: string;
    variable_values: Record<string, any>;
    notes: string | null;
    current_version: number;
    revision_request_notes: string | null;
    template: DocumentTemplate;
    revision_requester?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    letter: OutgoingLetter;
    paper_sizes: Record<string, { width: number; height: number }>;
}

export default function Revision({ letter, paper_sizes }: Props) {
    const [activeTab, setActiveTab] = useState('revision');
    const [previewScale, setPreviewScale] = useState(0.5);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    
    const { data, setData, post, processing, errors, isDirty } = useForm({
        variable_values: letter.variable_values || {},
        revision_notes: '',
    });

    const template = letter.template;

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
        post(`/arsip/outgoing-letters/${letter.id}/submit-revision`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSaveSuccess(true);
                router.visit(`/arsip/outgoing-letters/${letter.id}`);
            },
        });
    };

    const updateVariableValue = (key: string, value: any) => {
        setData('variable_values', {
            ...data.variable_values,
            [key]: value,
        });
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
            <Head title={`Revisi - ${letter.letter_number || letter.subject}`} />

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
                                <h1 className="text-sm font-semibold leading-none">Revisi Surat</h1>
                                <Badge variant="destructive" className="text-[10px] h-5">
                                    v{letter.current_version} → v{letter.current_version + 1}
                                </Badge>
                                {saveSuccess && (
                                    <Badge variant="secondary" className="text-[10px] h-5 gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        Tersimpan
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {letter.letter_number || letter.subject}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(`/arsip/outgoing-letters/${letter.id}`)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1.5" />
                            )}
                            Submit Revisi
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
                                    value="revision" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Permintaan Revisi
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="variables" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Variabel {manualVariables.length > 0 && `(${manualVariables.length})`}
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-auto">
                                <div className="p-4">
                                    <TabsContent value="revision" className="m-0 space-y-4">
                                        {/* Revision Request Info */}
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle className="text-sm">Permintaan Revisi</AlertTitle>
                                            <AlertDescription className="text-xs">
                                                <p className="mt-1">{letter.revision_request_notes}</p>
                                                <p className="mt-2 text-muted-foreground">
                                                    Diminta oleh: {letter.revision_requester?.name}
                                                </p>
                                            </AlertDescription>
                                        </Alert>

                                        <Separator />

                                        {/* Letter Info */}
                                        <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground text-xs">Nomor Surat:</span>
                                                <span className="font-mono text-xs font-medium">{letter.letter_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground text-xs">Perihal:</span>
                                                <span className="text-xs">{letter.subject}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground text-xs">Versi Saat Ini:</span>
                                                <Badge variant="outline" className="text-[10px]">v{letter.current_version}</Badge>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Revision Notes */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">Catatan Revisi</Label>
                                            <Textarea
                                                value={data.revision_notes}
                                                onChange={(e) => setData('revision_notes', e.target.value)}
                                                placeholder="Jelaskan perubahan yang Anda lakukan..."
                                                rows={4}
                                                className="text-sm resize-none"
                                            />
                                            {errors.revision_notes && (
                                                <p className="text-xs text-destructive">{errors.revision_notes}</p>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="variables" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium">Edit Data Surat</h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                Perbaiki data sesuai permintaan revisi
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
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {manualVariables.length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <Variable className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada variabel yang bisa diedit</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right Panel - Preview */
                    <div 
                        ref={previewContainerRef}
                        className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                    >
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b bg-background/80 flex items-center justify-between px-4 shrink-0">
                            <span className="text-xs text-muted-foreground">
                                Preview
                            </span>
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleZoom(-0.1)}
                                >
                                    <ZoomOut className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs w-12 text-center">
                                    {Math.round(previewScale * 100)}%
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleZoom(0.1)}
                                >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0"
                                    onClick={resetZoom}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto">
                            <div className="p-6 flex justify-center">
                                {template && (
                                    <TemplatePreview
                                        pageSettings={template.page_settings}
                                        headerSettings={template.header_settings}
                                        contentBlocks={template.content_blocks}
                                        signatureSettings={template.signature_settings}
                                        footerSettings={template.footer_settings}
                                        variableValues={data.variable_values}
                                        scale={previewScale}
                                        hideSignature={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
