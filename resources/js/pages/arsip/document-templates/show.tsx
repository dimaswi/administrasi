import { Head, router, Link } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    ArrowLeft, Edit, Copy, Eye, FileText, Settings, PenTool, Variable,
    Calendar, Hash, LayoutTemplate, Type, AlignLeft, List, Table2, 
    ImageIcon, ZoomIn, ZoomOut, RotateCcw, User, Clock
} from 'lucide-react';
import { DocumentTemplate, ContentBlock } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';

interface Props {
    template: DocumentTemplate & {
        created_at: string;
        updated_at: string;
    };
}

const getBlockIcon = (type: string) => {
    switch (type) {
        case 'text': return <Type className="h-3.5 w-3.5" />;
        case 'paragraph': return <AlignLeft className="h-3.5 w-3.5" />;
        case 'list': return <List className="h-3.5 w-3.5" />;
        case 'table': return <Table2 className="h-3.5 w-3.5" />;
        case 'image': return <ImageIcon className="h-3.5 w-3.5" />;
        default: return <LayoutTemplate className="h-3.5 w-3.5" />;
    }
};

const getBlockTypeName = (type: string) => {
    switch (type) {
        case 'text': return 'Teks';
        case 'paragraph': return 'Paragraf';
        case 'list': return 'Daftar';
        case 'table': return 'Tabel';
        case 'image': return 'Gambar';
        case 'page-break': return 'Page Break';
        default: return type;
    }
};

export default function Show({ template }: Props) {
    const [previewScale, setPreviewScale] = useState(0.5);
    const [activeTab, setActiveTab] = useState('info');
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const breadcrumbs = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Template Surat', href: '/arsip/document-templates' },
        { title: template.name, href: '#' },
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

    const handleDuplicate = () => {
        router.visit(`/arsip/document-templates/${template.id}/duplicate`);
    };

    const handlePreview = () => {
        window.open(`/arsip/document-templates/${template.id}/preview`, '_blank');
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.5);
    };

    const getColumnCount = () => {
        return parseInt(template.signature_settings?.layout?.split('-')[0] || '1') || 1;
    };

    return (
        <AppLayout>
            <Head title={template.name} />

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
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold leading-none">{template.name}</h1>
                                <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                    {template.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {template.code}
                                {template.category && (
                                    <>
                                        <span className="mx-1">•</span>
                                        {template.category}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                            <Eye className="h-4 w-4 mr-1.5" />
                            Preview PDF
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleDuplicate}>
                            <Copy className="h-4 w-4 mr-1.5" />
                            Duplikat
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={`/arsip/document-templates/${template.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Info */}
                    <div className="w-[400px] border-r flex flex-col bg-background shrink-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                            <TabsList className="w-full h-auto p-0 bg-transparent justify-start gap-0 rounded-none border-b">
                                <TabsTrigger 
                                    value="info" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Info
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="content" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Konten ({template.content_blocks?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="variables" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Variabel ({template.variables?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="signature" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    TTD
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-4 space-y-4">
                                    <TabsContent value="info" className="m-0 space-y-4">
                                        {/* Description */}
                                        {template.description && (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Deskripsi
                                                </div>
                                                <p className="text-sm">{template.description}</p>
                                            </div>
                                        )}

                                        {/* Page Settings */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Settings className="h-3.5 w-3.5" />
                                                Pengaturan Halaman
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Ukuran:</span>
                                                    <span className="font-medium">{template.page_settings.paper_size} ({template.page_settings.orientation})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Margin:</span>
                                                    <span className="font-mono text-xs">
                                                        {template.page_settings.margins.top}/{template.page_settings.margins.right}/{template.page_settings.margins.bottom}/{template.page_settings.margins.left} mm
                                                    </span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Font:</span>
                                                    <span className="font-medium">{template.page_settings.default_font.family}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Ukuran Font:</span>
                                                    <span>{template.page_settings.default_font.size} pt</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Line Height:</span>
                                                    <span>{template.page_settings.default_font.line_height}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Header Settings */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <LayoutTemplate className="h-3.5 w-3.5" />
                                                Kop Surat
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <Badge variant={template.header_settings.enabled ? 'default' : 'secondary'} className="text-[10px]">
                                                        {template.header_settings.enabled ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </div>
                                                {template.header_settings.enabled && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Tinggi:</span>
                                                            <span>{template.header_settings.height} mm</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Logo:</span>
                                                            <span>{template.header_settings?.logo?.enabled ? 'Ya' : 'Tidak'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Baris Teks:</span>
                                                            <span>{template.header_settings?.text_lines?.length || 0} baris</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Numbering Format */}
                                        {template.numbering_format && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <Hash className="h-3.5 w-3.5" />
                                                    Format Penomoran
                                                </div>
                                                <div className="bg-muted/40 rounded-lg p-3">
                                                    <code className="text-xs font-mono">{template.numbering_format}</code>
                                                </div>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                Informasi
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Dibuat:</span>
                                                    <span>{new Date(template.created_at).toLocaleDateString('id-ID', { 
                                                        day: 'numeric', month: 'short', year: 'numeric' 
                                                    })}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Diperbarui:</span>
                                                    <span>{new Date(template.updated_at).toLocaleDateString('id-ID', { 
                                                        day: 'numeric', month: 'short', year: 'numeric' 
                                                    })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="content" className="m-0 space-y-2">
                                        <div className="text-xs text-muted-foreground mb-3">
                                            Blok konten yang digunakan dalam template ini
                                        </div>
                                        {(template.content_blocks?.length || 0) > 0 ? (
                                            <div className="space-y-2">
                                                {(template.content_blocks || []).map((block: ContentBlock, index: number) => (
                                                    <div key={block.id || index} className="border rounded-lg p-3 bg-muted/20">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded bg-background border text-muted-foreground">
                                                                {getBlockIcon(block.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium">{getBlockTypeName(block.type)}</span>
                                                                    <Badge variant="outline" className="text-[9px]">#{index + 1}</Badge>
                                                                </div>
                                                                {block.type !== 'page-break' && (
                                                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                                                        {block.content?.substring(0, 100)}{block.content?.length > 100 ? '...' : ''}
                                                                    </p>
                                                                )}
                                                                {block.style && (
                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                        {block.style.font_size && (
                                                                            <Badge variant="secondary" className="text-[9px]">
                                                                                {block.style.font_size}pt
                                                                            </Badge>
                                                                        )}
                                                                        {block.style.text_align && (
                                                                            <Badge variant="secondary" className="text-[9px]">
                                                                                {block.style.text_align}
                                                                            </Badge>
                                                                        )}
                                                                        {block.style.font_weight === 'bold' && (
                                                                            <Badge variant="secondary" className="text-[9px]">
                                                                                Bold
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                Tidak ada blok konten
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="variables" className="m-0 space-y-2">
                                        <div className="text-xs text-muted-foreground mb-3">
                                            Variabel yang perlu diisi saat membuat surat
                                        </div>
                                        {(template.variables?.length || 0) > 0 ? (
                                            <div className="space-y-2">
                                                {(template.variables || []).map((variable, index) => (
                                                    <div key={index} className="border rounded-lg p-3 bg-muted/20">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium">{variable.label}</span>
                                                                    {variable.required && (
                                                                        <Badge variant="destructive" className="text-[9px]">Wajib</Badge>
                                                                    )}
                                                                </div>
                                                                <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                                                                    {`{{${variable.key}}}`}
                                                                </code>
                                                                {variable.placeholder && (
                                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                                        Placeholder: {variable.placeholder}
                                                                    </p>
                                                                )}
                                                                {variable.default_value && (
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        Default: {variable.default_value}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] shrink-0">
                                                                {variable.type}
                                                            </Badge>
                                                        </div>
                                                        {variable.type === 'select' && (variable.options?.length || 0) > 0 && (
                                                            <div className="mt-2 pt-2 border-t">
                                                                <span className="text-[9px] text-muted-foreground">Opsi: </span>
                                                                <span className="text-[10px]">{(variable.options || []).join(', ')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                Tidak ada variabel
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="signature" className="m-0 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <PenTool className="h-3.5 w-3.5" />
                                                Pengaturan Layout
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Layout:</span>
                                                    <span className="font-medium">{getColumnCount()} Kolom</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Jumlah Slot:</span>
                                                    <span>{template.signature_settings?.slots?.length || 0} slot</span>
                                                </div>
                                            </div>
                                        </div>

                                        {(template.signature_settings?.slots?.length || 0) > 0 ? (
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    Slot Tanda Tangan
                                                </div>
                                                {(template.signature_settings?.slots || []).map((slot, index) => (
                                                    <div key={slot.id || index} className="border rounded-lg p-3 bg-muted/20">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border text-xs font-medium">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium">
                                                                        {slot.label_position || `Slot ${index + 1}`}
                                                                    </span>
                                                                </div>
                                                                {slot.label_above && (
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        Label Atas: {slot.label_above}
                                                                    </p>
                                                                )}
                                                                <div className="flex gap-2 mt-2">
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
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                Tidak ada slot tanda tangan
                                            </div>
                                        )}
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
                            <div className="min-h-full flex items-start justify-center py-6 px-4">
                                <TemplatePreview
                                    pageSettings={template.page_settings}
                                    headerSettings={template.header_settings}
                                    contentBlocks={template.content_blocks}
                                    signatureSettings={template.signature_settings}
                                    footerSettings={template.footer_settings}
                                    scale={previewScale}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
