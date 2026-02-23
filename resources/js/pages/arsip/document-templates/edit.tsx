import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, Save, Eye,
    Loader2, ZoomIn, ZoomOut, RotateCcw, Check
} from 'lucide-react';
import { useTemplateBuilder, getVariablesByTemplateType } from '@/hooks/use-template-builder';
import { PageSettingsPanel } from '@/components/document-template/page-settings-panel';
import { HeaderSettingsPanel } from '@/components/document-template/header-settings-panel';
import { ContentBlocksPanel } from '@/components/document-template/content-blocks-panel';
import { SignatureSettingsPanel } from '@/components/document-template/signature-settings-panel';
import { VariablesPanel } from '@/components/document-template/variables-panel';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { NumberingFormatBuilder } from '@/components/document-template/numbering-format-builder';
import { DocumentTemplate, TemplateType } from '@/types/document-template';

interface Props {
    template: DocumentTemplate;
    categories?: string[];
}

export default function Edit({ template: initialTemplate, categories = [] }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewScale, setPreviewScale] = useState(0.6);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const breadcrumbs = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Template Surat', href: '/arsip/document-templates' },
        { title: initialTemplate.name, href: '#' },
    ];

    const {
        template,
        updateTemplate,
        updatePageSettings,
        updateMargins,
        updateDefaultFont,
        resetPageSettings,
        updateHeaderSettings,
        updateHeaderLogo,
        updateHeaderBorder,
        addHeaderTextLine,
        updateHeaderTextLine,
        removeHeaderTextLine,
        reorderHeaderTextLines,
        resetHeaderSettings,
        addContentBlock,
        updateContentBlock,
        updateContentBlockStyle,
        removeContentBlock,
        reorderContentBlocks,
        duplicateContentBlock,
        updateSignatureSettings,
        addSignatureSlot,
        updateSignatureSlot,
        removeSignatureSlot,
        updateFooterSettings,
        toggleFooter,
        addVariable,
        updateVariable,
        removeVariable,
    } = useTemplateBuilder(initialTemplate);

    // Auto-fit preview scale based on container size and orientation
    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const container = previewContainerRef.current;
                const containerHeight = container.clientHeight - 80;
                const containerWidth = container.clientWidth - 48;
                
                // A4 dimensions in pixels at 96 DPI
                const isLandscape = template.page_settings?.orientation === 'landscape';
                const a4Width = isLandscape ? 1123 : 794;
                const a4Height = isLandscape ? 794 : 1123;
                
                const scaleByHeight = containerHeight / a4Height;
                const scaleByWidth = containerWidth / a4Width;
                const optimalScale = Math.min(scaleByHeight, scaleByWidth, 0.75);
                
                setPreviewScale(Math.max(0.3, optimalScale));
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [template.page_settings?.orientation]);

    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        setSaveSuccess(false);

        router.put(`/arsip/document-templates/${initialTemplate.id}`, template as any, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            },
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
        });
    };

    const handlePreview = () => {
        window.open(`/arsip/document-templates/${initialTemplate.id}/preview`, '_blank');
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.6);
    };

    return (
        <AppLayout>
            <Head title={`Edit: ${initialTemplate.name}`} />

            <div className="h-[calc(100vh-64px)] flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/arsip/document-templates')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-sm font-semibold leading-none">{initialTemplate.name}</h1>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {initialTemplate.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {saveSuccess && (
                            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                                <Check className="h-3 w-3" />
                                Tersimpan
                            </Badge>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={handlePreview}>
                            <Eye className="h-4 w-4 mr-1.5" />
                            Preview
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1.5" />
                            )}
                            Simpan
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 grid grid-cols-2 overflow-hidden">
                    {/* Left Panel - Settings */}
                    <div className="border-r flex flex-col bg-background overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                            <TabsList className="w-full h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b">
                                <TabsTrigger 
                                    value="general" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Umum
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="page" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Halaman
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="content" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Konten
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="signature" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    TTD
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="variables" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Variabel
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-4">
                                    <TabsContent value="general" className="m-0 space-y-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-xs">
                                                    Nama Template <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={template.name}
                                                    onChange={(e) => updateTemplate({ name: e.target.value })}
                                                    placeholder="Surat Keputusan"
                                                    className="h-9"
                                                />
                                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="code" className="text-xs">
                                                        Kode <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="code"
                                                        value={template.code}
                                                        onChange={(e) => updateTemplate({ code: e.target.value.toUpperCase() })}
                                                        placeholder="SK"
                                                        className="h-9 uppercase font-mono"
                                                    />
                                                    {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="category" className="text-xs">Kategori</Label>
                                                    <Select
                                                        value={template.category || '__none__'}
                                                        onValueChange={(value) => updateTemplate({ category: value === '__none__' ? null : value })}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Pilih" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none__">Tanpa Kategori</SelectItem>
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat} value={cat}>
                                                                    {cat}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="template_type" className="text-xs">Tipe Template</Label>
                                                <Select
                                                    value={template.template_type}
                                                    onValueChange={(value: TemplateType) => {
                                                        const presetVariables = getVariablesByTemplateType(value);
                                                        updateTemplate({ 
                                                            template_type: value,
                                                            variables: presetVariables.length > 0 ? presetVariables : template.variables,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Pilih tipe" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="general">Umum</SelectItem>
                                                        <SelectItem value="leave">Surat Pengajuan Cuti</SelectItem>
                                                        <SelectItem value="early_leave">Surat Pengajuan Izin Pulang Cepat</SelectItem>
                                                        <SelectItem value="leave_response">Surat Balasan Cuti</SelectItem>
                                                        <SelectItem value="early_leave_response">Surat Balasan Izin Pulang Cepat</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {template.template_type === 'leave' && 'Variabel fixed otomatis tersedia. Lihat di tab Variabel.'}
                                                    {template.template_type === 'early_leave' && 'Variabel fixed otomatis tersedia. Lihat di tab Variabel.'}
                                                    {template.template_type === 'leave_response' && 'Template surat balasan cuti dengan variabel otomatis.'}
                                                    {template.template_type === 'early_leave_response' && 'Template surat balasan izin pulang cepat dengan variabel otomatis.'}
                                                    {template.template_type === 'general' && 'Template surat umum dengan variabel manual'}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-xs">Deskripsi</Label>
                                                <Textarea
                                                    id="description"
                                                    value={template.description || ''}
                                                    onChange={(e) => updateTemplate({ description: e.target.value || null })}
                                                    placeholder="Deskripsi singkat..."
                                                    rows={2}
                                                    className="resize-none text-sm"
                                                />
                                            </div>

                                            <Separator />

                                            <NumberingFormatBuilder
                                                value={template.numbering_format}
                                                onChange={(format) => updateTemplate({ numbering_format: format })}
                                            />

                                            <Separator />

                                            <div className="space-y-2">
                                                <Label htmlFor="is_active" className="text-xs">Status</Label>
                                                <Select
                                                    value={template.is_active ? 'true' : 'false'}
                                                    onValueChange={(value) => updateTemplate({ is_active: value === 'true' })}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue placeholder="Pilih status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Aktif</SelectItem>
                                                        <SelectItem value="false">Nonaktif</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">Template aktif dapat digunakan</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="page" className="m-0 space-y-4">
                                        <PageSettingsPanel
                                            settings={template.page_settings}
                                            onUpdate={updatePageSettings}
                                            onUpdateMargins={updateMargins}
                                            onUpdateDefaultFont={updateDefaultFont}
                                            onReset={resetPageSettings}
                                        />

                                        <HeaderSettingsPanel
                                            settings={template.header_settings}
                                            defaultFont={template.page_settings.default_font}
                                            onUpdate={updateHeaderSettings}
                                            onUpdateLogo={updateHeaderLogo}
                                            onUpdateBorder={updateHeaderBorder}
                                            onAddTextLine={addHeaderTextLine}
                                            onUpdateTextLine={updateHeaderTextLine}
                                            onRemoveTextLine={removeHeaderTextLine}
                                            onReorderTextLines={reorderHeaderTextLines}
                                            onReset={resetHeaderSettings}
                                        />
                                    </TabsContent>

                                    <TabsContent value="content" className="m-0">
                                        <ContentBlocksPanel
                                            blocks={template.content_blocks}
                                            defaultFont={template.page_settings.default_font}
                                            variables={template.variables}
                                            onAdd={addContentBlock}
                                            onUpdate={updateContentBlock}
                                            onUpdateStyle={updateContentBlockStyle}
                                            onRemove={removeContentBlock}
                                            onReorder={reorderContentBlocks}
                                            onDuplicate={duplicateContentBlock}
                                        />
                                    </TabsContent>

                                    <TabsContent value="signature" className="m-0">
                                        <SignatureSettingsPanel
                                            settings={template.signature_settings}
                                            totalPages={template.content_blocks.filter(b => b.type === 'page-break').length + 1}
                                            variables={template.variables}
                                            onUpdate={updateSignatureSettings}
                                            onAddSlot={addSignatureSlot}
                                            onUpdateSlot={updateSignatureSlot}
                                            onRemoveSlot={removeSignatureSlot}
                                        />
                                    </TabsContent>

                                    <TabsContent value="variables" className="m-0">
                                        <VariablesPanel
                                            variables={template.variables}
                                            templateType={template.template_type}
                                            onAdd={addVariable}
                                            onUpdate={updateVariable}
                                            onRemove={removeVariable}
                                        />
                                    </TabsContent>
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right Panel - Preview */}
                    <div 
                        ref={previewContainerRef}
                        className="flex flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                    >
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b bg-background/80 backdrop-blur-sm flex items-center justify-center gap-1 px-4 shrink-0">
                            <Button 
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
                            <div 
                                className="min-h-full min-w-full flex items-start justify-center p-6"
                                style={{
                                    minWidth: template.page_settings?.orientation === 'landscape' 
                                        ? Math.max(1123 * previewScale + 48, '100%' as any) 
                                        : '100%'
                                }}
                            >
                                <div 
                                    style={{ 
                                        width: (template.page_settings?.orientation === 'landscape' ? 1123 : 794) * previewScale,
                                        height: (template.page_settings?.orientation === 'landscape' ? 794 : 1123) * previewScale,
                                        flexShrink: 0,
                                    }}
                                >
                                    <div 
                                        className="shadow-2xl origin-top-left"
                                        style={{ transform: `scale(${previewScale})` }}
                                    >
                                        <TemplatePreview
                                            pageSettings={template.page_settings}
                                            headerSettings={template.header_settings}
                                            contentBlocks={template.content_blocks}
                                            signatureSettings={template.signature_settings}
                                            footerSettings={template.footer_settings}
                                            scale={1}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
