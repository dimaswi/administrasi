import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
    ArrowLeft, Download, FileText, User, Calendar, Hash,
    CheckCircle, XCircle, Clock, PenTool, ZoomIn, ZoomOut, RotateCcw,
    Variable, Info, Archive, Shield, Tag, Printer
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DocumentTemplate } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';

interface Signatory {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        nip?: string;
    };
    slot_id: string;
    sign_order: number;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    signed_at: string | null;
    slot_info?: {
        label_above?: string;
        label_position?: string;
    } | null;
}

interface OutgoingLetter {
    id: number;
    letter_number: string | null;
    subject: string;
    letter_date: string;
    status: string;
    variable_values: Record<string, any>;
    template: DocumentTemplate;
    signatories: Signatory[];
    creator?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface ArchiveData {
    id: number;
    document_number: string;
    title: string;
    description: string | null;
    category: string;
    document_date: string;
    document_type: string;
    classification: 'public' | 'internal' | 'confidential' | 'secret';
    retention_period: number | null;
    retention_until: string | null;
    created_at: string;
    archiver?: {
        id: number;
        name: string;
    };
}

interface Props {
    archive: ArchiveData;
    letter: OutgoingLetter;
    paper_sizes: Record<string, { width: number; height: number }>;
}

const classificationConfig = {
    public: { label: 'Publik', variant: 'secondary' as const },
    internal: { label: 'Internal', variant: 'default' as const },
    confidential: { label: 'Rahasia', variant: 'default' as const },
    secret: { label: 'Sangat Rahasia', variant: 'destructive' as const },
};

const signatoryStatusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-600" />,
    approved: <CheckCircle className="h-4 w-4 text-green-600" />,
    rejected: <XCircle className="h-4 w-4 text-red-600" />,
};

export default function PreviewLetter({ archive, letter, paper_sizes }: Props) {
    const [activeTab, setActiveTab] = useState('archive');
    const [previewScale, setPreviewScale] = useState(0.5);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const breadcrumbs = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Daftar Arsip', href: '/arsip/archives' },
        { title: archive.title, href: '#' },
    ];

    const template = letter.template;
    const classification = classificationConfig[archive.classification];

    // Calculate signatories status
    const signedCount = (letter.signatories || []).filter(s => s.status === 'approved').length;
    const totalSignatories = (letter.signatories || []).length;

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

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.5);
    };

    const handlePrint = () => {
        if (!previewRef.current) return;
        
        const previewElements = previewRef.current.querySelectorAll('.template-preview-content');
        if (!previewElements.length) {
            return;
        }

        const pageSettings = template?.page_settings || {};
        const pageSize = pageSettings.paper_size || 'A4';
        const orientation = pageSettings.orientation || 'portrait';
        const defaultFont = pageSettings.default_font || { family: 'Times New Roman', size: 12, line_height: 1.5 };

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak.');
            return;
        }

        const pageSizes: Record<string, { width: number; height: number }> = {
            'A4': { width: 210, height: 297 },
            'Letter': { width: 216, height: 279 },
            'Legal': { width: 216, height: 356 },
            'F4': { width: 215, height: 330 },
        };
        const size = pageSizes[pageSize] || pageSizes['A4'];
        const pageWidth = orientation === 'portrait' ? size.width : size.height;
        const pageHeight = orientation === 'portrait' ? size.height : size.width;

        let pagesHtml = '';
        previewElements.forEach((el, index) => {
            const innerDiv = el.querySelector('div');
            if (innerDiv) {
                const clonedInner = innerDiv.cloneNode(true) as HTMLElement;
                clonedInner.style.transform = 'none';
                clonedInner.style.width = `${pageWidth}mm`;
                clonedInner.style.height = `${pageHeight}mm`;
                pagesHtml += `<div class="page${index > 0 ? ' page-break' : ''}">${clonedInner.outerHTML}</div>`;
            }
        });

        let styles = '';
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleEl => {
            if (styleEl.tagName === 'STYLE') {
                styles += styleEl.outerHTML;
            }
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${archive.document_number || archive.title}</title>
                ${styles}
                <style>
                    @page {
                        size: ${pageWidth}mm ${pageHeight}mm;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    html, body {
                        width: ${pageWidth}mm;
                        background: white;
                    }
                    body {
                        font-family: '${defaultFont.family}', 'Times New Roman', Times, serif;
                        font-size: ${defaultFont.size}pt;
                        line-height: ${defaultFont.line_height};
                    }
                    .page {
                        width: ${pageWidth}mm;
                        min-height: ${pageHeight}mm;
                        background: white;
                        overflow: hidden;
                        position: relative;
                    }
                    .page > div {
                        transform: none !important;
                        width: ${pageWidth}mm !important;
                        min-height: ${pageHeight}mm !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    @media print {
                        html, body {
                            width: ${pageWidth}mm;
                            height: ${pageHeight}mm;
                        }
                        body {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .page {
                            page-break-after: always;
                            page-break-inside: avoid;
                        }
                        .page:last-child {
                            page-break-after: auto;
                        }
                    }
                </style>
            </head>
            <body>
                ${pagesHtml}
            </body>
            </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    // Prepare signatories data for template preview
    const signatoriesData = (letter.signatories || []).map(sig => ({
        slot_id: sig.slot_id,
        name: sig.user.name,
        nip: sig.user.nip || '',
        signed: sig.status === 'approved',
        signed_at: sig.signed_at,
    }));

    // Merge variable values with letter_date
    const mergedVariableValues = {
        ...letter.variable_values,
        letter_date: letter.letter_date,
    };

    // Verification URL for QR code
    const verificationUrl = letter.status === 'fully_signed' 
        ? `${window.location.origin}/verify/${letter.letter_number}` 
        : undefined;

    return (
        <AppLayout>
            <Head title={`Arsip - ${archive.title}`} />
            
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                {/* Header Bar */}
                <div className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/arsip/archives')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold leading-none">
                                    {archive.document_number || archive.title}
                                </h1>
                                <Badge variant="outline" className="text-[10px]">
                                    <Archive className="h-3 w-3 mr-1" />
                                    Arsip
                                </Badge>
                                <Badge variant={classification.variant} className="text-[10px]">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {classification.label}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {template?.name} • {archive.category}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/arsip/archives/${archive.id}`}>
                            <Button variant="outline" size="sm">
                                <Info className="h-4 w-4 mr-1.5" />
                                Detail Arsip
                            </Button>
                        </Link>
                        <Button size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1.5" />
                            Cetak / Download PDF
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
                                    value="archive" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Info Arsip
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="letter" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Info Surat
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="variables" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Data ({Object.keys(letter.variable_values || {}).length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="signatories" 
                                    className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    TTD ({signedCount}/{totalSignatories})
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-auto">
                                <div className="p-4">
                                    {/* Archive Info Tab */}
                                    <TabsContent value="archive" className="m-0 space-y-4">
                                        {/* Archive Status */}
                                        <div className="bg-muted/40 rounded-lg p-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">Klasifikasi</span>
                                                <Badge variant={classification.variant}>
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {classification.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">Tipe</span>
                                                <Badge variant="outline">
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    Surat Keluar
                                                </Badge>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Archive Details */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Archive className="h-3.5 w-3.5" />
                                                Detail Arsip
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Nomor Dokumen:</span>
                                                    <span className="font-mono text-xs font-medium">{archive.document_number}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Kategori:</span>
                                                    <span className="text-xs font-medium">{archive.category}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Jenis Dokumen:</span>
                                                    <span className="text-xs">{archive.document_type}</span>
                                                </div>
                                                <Separator />
                                                <div className="pt-1">
                                                    <span className="text-muted-foreground text-xs">Judul:</span>
                                                    <p className="text-xs mt-1">{archive.title}</p>
                                                </div>
                                                {archive.description && (
                                                    <div className="pt-1">
                                                        <span className="text-muted-foreground text-xs">Deskripsi:</span>
                                                        <p className="text-xs mt-1">{archive.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Retention */}
                                        {archive.retention_until && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Masa Retensi
                                                </div>
                                                <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Periode:</span>
                                                        <span className="text-xs">{archive.retention_period} tahun</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Sampai:</span>
                                                        <span className="text-xs">
                                                            {new Date(archive.retention_until).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Informasi
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Tanggal Dokumen:</span>
                                                    <span className="text-xs">
                                                        {new Date(archive.document_date).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Diarsipkan:</span>
                                                    <span className="text-xs">
                                                        {new Date(archive.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                {archive.archiver && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Diarsipkan oleh:</span>
                                                        <span className="text-xs">{archive.archiver.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Letter Info Tab */}
                                    <TabsContent value="letter" className="m-0 space-y-4">
                                        {/* Letter Info */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <FileText className="h-3.5 w-3.5" />
                                                Detail Surat
                                            </div>
                                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                {letter.letter_number && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Nomor Surat:</span>
                                                        <span className="font-mono text-xs font-medium">{letter.letter_number}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Template:</span>
                                                    <span className="text-xs font-medium">{template?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground text-xs">Kode:</span>
                                                    <span className="font-mono text-xs">{template?.code}</span>
                                                </div>
                                                <Separator />
                                                <div className="pt-1">
                                                    <span className="text-muted-foreground text-xs">Perihal:</span>
                                                    <p className="text-xs mt-1">{letter.subject}</p>
                                                </div>
                                                {letter.letter_date && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Tanggal Surat:</span>
                                                        <span className="text-xs">
                                                            {new Date(letter.letter_date).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Creator Info */}
                                        {letter.creator && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <User className="h-3.5 w-3.5" />
                                                    Pembuat
                                                </div>
                                                <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground text-xs">Dibuat oleh:</span>
                                                        <span className="text-xs">{letter.creator.name}</span>
                                                    </div>
                                                    {letter.created_at && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground text-xs">Dibuat:</span>
                                                            <span className="text-xs">
                                                                {new Date(letter.created_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Link to Original Letter */}
                                        <div className="pt-2">
                                            <Link href={`/arsip/outgoing-letters/${letter.id}`}>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Lihat Surat Asli
                                                </Button>
                                            </Link>
                                        </div>
                                    </TabsContent>

                                    {/* Variables Tab */}
                                    <TabsContent value="variables" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium">Data Surat</h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                Nilai variabel yang diisikan pada surat ini
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            {Object.entries(letter.variable_values || {}).map(([key, value]) => {
                                                const variable = template?.variables?.find(v => v.key === key);
                                                return (
                                                    <div key={key} className="border rounded-lg p-3 bg-muted/20">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-xs font-medium">
                                                                    {variable?.label || key}
                                                                </span>
                                                                <p className="text-sm mt-1">
                                                                    {value || <span className="text-muted-foreground italic">-</span>}
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] shrink-0">
                                                                {variable?.type || 'text'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono mt-2">
                                                            {'{{'}{key}{'}}'}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {Object.keys(letter.variable_values || {}).length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <Variable className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada data variabel</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Signatories Tab */}
                                    <TabsContent value="signatories" className="m-0 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium flex items-center gap-2">
                                                <PenTool className="h-4 w-4" />
                                                Tanda Tangan
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground">
                                                {signedCount} dari {totalSignatories} sudah menandatangani
                                            </p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="bg-muted/40 rounded-lg p-3">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-muted-foreground">Progress TTD</span>
                                                <span className="font-medium">{signedCount}/{totalSignatories}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 rounded-full transition-all"
                                                    style={{ 
                                                        width: `${totalSignatories > 0 ? (signedCount / totalSignatories) * 100 : 0}%` 
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {(letter.signatories || []).map((signatory, index) => (
                                                <div key={signatory.id} className="border rounded-lg p-3 bg-muted/20">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {signatory.user?.name?.substring(0, 2).toUpperCase() || '??'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium truncate">
                                                                    {signatory.user?.name}
                                                                </span>
                                                                {signatoryStatusIcons[signatory.status]}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {signatory.slot_info?.label_position || `Penanda Tangan ${index + 1}`}
                                                            </p>
                                                            {signatory.user?.nip && (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    NIP. {signatory.user.nip}
                                                                </p>
                                                            )}
                                                            
                                                            {signatory.status === 'approved' && signatory.signed_at && (
                                                                <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    <span>
                                                                        {new Date(signatory.signed_at).toLocaleDateString('id-ID', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            {signatory.status === 'rejected' && signatory.notes && (
                                                                <div className="mt-2 p-2 bg-red-50 rounded text-[10px] text-red-600">
                                                                    Alasan: {signatory.notes}
                                                                </div>
                                                            )}
                                                            
                                                            {signatory.status === 'pending' && (
                                                                <Badge variant="outline" className="text-[9px] mt-2">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Menunggu
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {(letter.signatories || []).length === 0 && (
                                                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                    <PenTool className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                    <p>Tidak ada penanda tangan</p>
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
                        <div className="flex-1 overflow-auto" ref={previewRef}>
                            {template ? (
                                <div className="min-h-full flex items-start justify-center py-6 px-4">
                                    <TemplatePreview
                                        pageSettings={template.page_settings}
                                        headerSettings={template.header_settings}
                                        contentBlocks={template.content_blocks}
                                        signatureSettings={template.signature_settings}
                                        footerSettings={template.footer_settings}
                                        variableValues={mergedVariableValues}
                                        scale={previewScale}
                                        signatoriesData={signatoriesData}
                                        showQrCode={letter.status === 'fully_signed'}
                                        verificationUrl={verificationUrl}
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
            </div>
        </AppLayout>
    );
}
