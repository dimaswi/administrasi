import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    ArrowLeft, 
    Edit, 
    Copy, 
    Trash2, 
    FileText,
    Power,
    Calendar,
    User,
    Code,
    FolderOpen,
    Hash,
    Eye,
    EyeOff,
    Share2
} from 'lucide-react';
import { toast } from 'sonner';
import type { BreadcrumbItem, SharedData } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper function to render TipTap JSON content to HTML
function renderTipTapContent(content: any): string {
    if (!content) return '';
    
    const renderNode = (node: any): string => {
        if (!node) return '';
        
        // Handle text nodes
        if (node.type === 'text') {
            let text = node.text || '';
            
            // Only preserve multiple consecutive spaces (for indentation)
            // Single spaces are handled normally for justify to work
            text = text.replace(/  +/g, (match: string) => '&nbsp;'.repeat(match.length));
            
            // Apply marks (bold, italic, textStyle, etc.)
            if (node.marks) {
                node.marks.forEach((mark: any) => {
                    if (mark.type === 'bold') text = `<strong>${text}</strong>`;
                    if (mark.type === 'italic') text = `<em>${text}</em>`;
                    if (mark.type === 'underline') text = `<u>${text}</u>`;
                    if (mark.type === 'strike') text = `<s>${text}</s>`;
                    if (mark.type === 'code') text = `<code>${text}</code>`;
                    
                    // Handle textStyle mark with fontSize, fontFamily, etc.
                    if (mark.type === 'textStyle') {
                        const styles: string[] = [];
                        if (mark.attrs?.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`);
                        if (mark.attrs?.fontFamily) styles.push(`font-family: ${mark.attrs.fontFamily}`);
                        if (styles.length > 0) {
                            text = `<span style="${styles.join('; ')}">${text}</span>`;
                        }
                    }
                });
            }
            
            return text;
        }
        
        // Handle block nodes
        const content = node.content ? node.content.map(renderNode).join('') : '';
        
        switch (node.type) {
            case 'doc':
                return content;
            case 'paragraph':
                const styles: string[] = [];
                if (node.attrs?.textAlign) {
                    styles.push(`text-align: ${node.attrs.textAlign}`);
                }
                // Handle indent (margin-left from indent extension)
                if (node.attrs?.indent && node.attrs.indent > 0) {
                    styles.push(`margin-left: ${node.attrs.indent}px`);
                }
                // Handle line-height (don't force default, let CSS handle it)
                if (node.attrs?.lineHeight && node.attrs.lineHeight !== 'normal') {
                    styles.push(`line-height: ${node.attrs.lineHeight}`);
                }
                const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
                // Handle empty paragraph for line breaks
                const paraContent = content || '&nbsp;';
                return `<p${styleAttr}>${paraContent}</p>`;
            case 'heading':
                const level = node.attrs?.level || 1;
                const headingStyles: string[] = [];
                if (node.attrs?.textAlign) {
                    headingStyles.push(`text-align: ${node.attrs.textAlign}`);
                }
                // Handle indent
                if (node.attrs?.indent && node.attrs.indent > 0) {
                    headingStyles.push(`margin-left: ${node.attrs.indent}px`);
                }
                // Handle line-height
                if (node.attrs?.lineHeight && node.attrs.lineHeight !== 'normal') {
                    headingStyles.push(`line-height: ${node.attrs.lineHeight}`);
                }
                const headingStyleAttr = headingStyles.length > 0 ? ` style="${headingStyles.join('; ')}"` : '';
                return `<h${level}${headingStyleAttr}>${content}</h${level}>`;
            case 'bulletList':
                return `<ul>${content}</ul>`;
            case 'orderedList':
                return `<ol>${content}</ol>`;
            case 'listItem':
                return `<li>${content}</li>`;
            case 'blockquote':
                return `<blockquote>${content}</blockquote>`;
            case 'codeBlock':
                return `<pre><code>${content}</code></pre>`;
            case 'hardBreak':
                return '<br>';
            case 'horizontalRule':
                return '<hr>';
            case 'variable':
                const varName = node.attrs?.name || '';
                return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{{${varName}}}</span>`;
            default:
                return content;
        }
    };
    
    return renderNode(content);
}

// Helper function to render signatures based on layout
function renderSignatures(layout: string, signatures: Signature[]) {
    const SignatureBox = ({ label, position }: { label: string; position: string }) => (
        <div className="text-center" style={{ minWidth: '120px', transform: 'scale(0.6)', transformOrigin: 'center' }}>
            <div style={{ marginBottom: '50px' }}>
                <div className="text-sm mb-1">{position}</div>
                <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    border: '1px dashed #ccc',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: '#999'
                }}>
                    QR / TTD
                </div>
            </div>
            <div style={{ borderBottom: '1px solid #000', width: '160px', margin: '0 auto' }}></div>
            <div className="text-sm mt-1 font-semibold">{label}</div>
        </div>
    );

    switch (layout) {
        case 'bottom_right_1':
            // Opsi 1: Kanan bawah (1 ttd)
            return (
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', paddingRight: '80px' }}>
                    <SignatureBox label={signatures[0]?.label || 'Penandatangan'} position={signatures[0]?.position || 'Direktur'} />
                </div>
            );
        
        case 'bottom_left_right':
            // Opsi 2: Kiri dan Kanan bawah (2 ttd)
            return (
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', paddingLeft: '60px', paddingRight: '60px' }}>
                    <SignatureBox label={signatures[0]?.label || 'Penandatangan 1'} position={signatures[0]?.position || 'Jabatan 1'} />
                    <SignatureBox label={signatures[1]?.label || 'Penandatangan 2'} position={signatures[1]?.position || 'Jabatan 2'} />
                </div>
            );
        
        case 'three_signatures':
            // Opsi 3: Kiri-Kanan atas, Tengah bawah (3 ttd)
            return (
                <div style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '60px', paddingRight: '60px', marginBottom: '15px' }}>
                        <SignatureBox label={signatures[0]?.label || 'Penandatangan 1'} position={signatures[0]?.position || 'Jabatan 1'} />
                        <SignatureBox label={signatures[1]?.label || 'Penandatangan 2'} position={signatures[1]?.position || 'Jabatan 2'} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <SignatureBox label={signatures[2]?.label || 'Mengetahui'} position={signatures[2]?.position || 'Jabatan 3'} />
                    </div>
                </div>
            );
        
        case 'four_signatures':
            // Opsi 4: Kiri-Kanan atas, Kiri-Kanan bawah (4 ttd)
            return (
                <div style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '60px', paddingRight: '60px', marginBottom: '15px' }}>
                        <SignatureBox label={signatures[0]?.label || 'Penandatangan 1'} position={signatures[0]?.position || 'Jabatan 1'} />
                        <SignatureBox label={signatures[1]?.label || 'Penandatangan 2'} position={signatures[1]?.position || 'Jabatan 2'} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '60px', paddingRight: '60px' }}>
                        <SignatureBox label={signatures[2]?.label || 'Penandatangan 3'} position={signatures[2]?.position || 'Jabatan 3'} />
                        <SignatureBox label={signatures[3]?.label || 'Penandatangan 4'} position={signatures[3]?.position || 'Jabatan 4'} />
                    </div>
                </div>
            );
        
        default:
            return null;
    }
}

interface Variable {
    name: string;
    type: 'text' | 'textarea' | 'richtext' | 'date' | 'select' | 'user_select' | 'auto';
    label: string;
    required: boolean;
    default?: string;
    options?: string[];
}

interface Signature {
    label: string;
    position: string;
}

interface Template {
    id: number;
    name: string;
    code: string;
    category: string | null;
    description: string | null;
    content: any;
    variables: Variable[];
    letterhead: any;
    signature_layout: string;
    signatures: Signature[];
    numbering_format: string | null;
    is_active: boolean;
    letters_count: number;
    created_at: string;
    updated_at: string;
    creator: {
        id: number;
        name: string;
    };
    updater?: {
        id: number;
        name: string;
    };
}

interface Props extends SharedData {
    template: Template;
}

export default function ShowTemplate({ template }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Template Surat', href: '/arsip/templates' },
        { title: template.name, href: `/arsip/templates/${template.id}` },
    ];

    const handleDuplicate = () => {
        router.post(`/arsip/templates/${template.id}/duplicate`, {}, {
            onSuccess: () => {
                toast.success('Template berhasil diduplikasi');
            },
        });
    };

    const handleToggleActive = () => {
        router.post(`/arsip/templates/${template.id}/toggle-active`, {}, {
            onSuccess: () => {
            },
        });
    };

    const handleDelete = () => {
        if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;

        router.delete(`/arsip/templates/${template.id}`, {
            onSuccess: () => {
                toast.success('Template berhasil dihapus');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal menghapus template');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Template - ${template.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="mt-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{template.name}</h1>
                            {template.is_active ? (
                                <Badge variant="default">Aktif</Badge>
                            ) : (
                                <Badge variant="secondary">Nonaktif</Badge>
                            )}
                        </div>
                        {template.description && (
                            <p className="text-muted-foreground mt-1">{template.description}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-6">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/arsip/templates')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleToggleActive}
                        >
                            <Power className="h-4 w-4 mr-2" />
                            {template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDuplicate}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplikasi
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(`/arsip/templates/${template.id}/share`)}
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Bagikan
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(`/arsip/templates/${template.id}/edit`)}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        {template.letters_count === 0 && (
                            <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                            </Button>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Template</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Code className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Kode Template</p>
                                    <p className="text-sm text-muted-foreground">{template.code}</p>
                                </div>
                            </div>

                            {template.category && (
                                <div className="flex items-start gap-3">
                                    <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Kategori</p>
                                        <p className="text-sm text-muted-foreground">{template.category}</p>
                                    </div>
                                </div>
                            )}

                            {template.numbering_format && (
                                <div className="flex items-start gap-3">
                                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Format Penomoran</p>
                                        <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                            {template.numbering_format}
                                        </code>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Jumlah Surat</p>
                                    <p className="text-sm text-muted-foreground">
                                        {template.letters_count} surat dibuat dari template ini
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Dibuat Oleh</p>
                                    <p className="text-sm text-muted-foreground">{template.creator.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Tanggal Dibuat</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(template.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                                    </p>
                                </div>
                            </div>

                            {template.updater && (
                                <>
                                    <Separator />
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Terakhir Diubah</p>
                                            <p className="text-sm text-muted-foreground">{template.updater.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(template.updated_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Letterhead Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kop Surat</CardTitle>
                            <CardDescription>Preview kop surat template (700 x 178 px)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {template.letterhead?.logo ? (
                                <div className="border rounded-lg overflow-hidden bg-gray-50">
                                    <img 
                                        src={template.letterhead.logo} 
                                        alt="Kop Surat" 
                                        style={{
                                            width: '100%',
                                            height: '178px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Tidak ada kop surat</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Variables */}
                <Card>
                    <CardHeader>
                        <CardTitle>Variables ({template.variables.length})</CardTitle>
                        <CardDescription>
                            Field yang akan diisi saat membuat surat dari template ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {template.variables.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Tidak ada variable</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {template.variables.map((variable, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                    {'{{' + variable.name + '}}'}
                                                </code>
                                                <Badge variant="outline" className="text-xs">
                                                    {variable.type}
                                                </Badge>
                                                {variable.required && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Required
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {variable.label}
                                            </p>
                                            {variable.default && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Default: {variable.default}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Content Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview Surat</CardTitle>
                        <CardDescription>
                            Preview tampilan surat lengkap dengan kop surat (seperti saat dicetak)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="bg-gray-100 p-6 rounded-lg overflow-auto">
                            {/* A4 Paper - Same styling as letter preview */}
                            <div 
                                className="mx-auto bg-white shadow-sm" 
                                style={{ 
                                    maxWidth: '850px',
                                    minHeight: '1100px',
                                    padding: '48px',
                                }}
                            >
                                {/* Content with letterhead */}
                                <div 
                                    className="template-content"
                                    style={{
                                        fontSize: '12pt',
                                        fontFamily: 'Times New Roman, serif',
                                        color: '#000',
                                    }}
                                >
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                            .template-content p {
                                                margin-bottom: 1em;
                                            }
                                            .template-content p:empty {
                                                min-height: 1em;
                                            }
                                            .template-content br {
                                                display: block;
                                                content: "";
                                                margin-top: 0.5em;
                                            }
                                            .template-content .variable-placeholder,
                                            .template-content span[data-variable] {
                                                display: inline !important;
                                                line-height: inherit !important;
                                                vertical-align: baseline !important;
                                                padding: 2px 8px !important;
                                                margin: 0 2px !important;
                                                background: #dbeafe !important;
                                                color: #1e40af !important;
                                                border: 1px solid #93c5fd !important;
                                                border-radius: 4px !important;
                                                font-family: monospace !important;
                                                font-size: 0.9em !important;
                                            }
                                        `
                                    }} />
                                    <div dangerouslySetInnerHTML={{ __html: renderTipTapContent(template.content) }} />
                                </div>

                                {/* Signature Area */}
                                {renderSignatures(
                                    template.signature_layout || 'bottom_right_1', 
                                    template.signatures && template.signatures.length > 0 
                                        ? template.signatures 
                                        : [{ label: 'Penandatangan', position: 'Direktur' }]
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content JSON for Debug */}
                <Card>
                    <CardHeader>
                        <CardTitle>Struktur Konten (JSON)</CardTitle>
                        <CardDescription>
                            Data mentah konten template dalam format TipTap JSON
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
                            <pre className="text-xs">
                                {JSON.stringify(template.content, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
