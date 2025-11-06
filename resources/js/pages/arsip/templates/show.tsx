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
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Variable, VariableNode } from '@/components/tiptap/variable-extension';
import { Letterhead } from '@/components/tiptap/letterhead-extension';
import { Signature } from '@/components/tiptap/signature-extension';
import { SignatureBlock } from '@/components/tiptap/signature-block-extension';
import { PageBreak } from '@/components/tiptap/extensions/page-break-extension';
import { AlignmentTable, AlignmentTableRow, AlignmentTableCell } from '@/components/tiptap/alignment-table-extension';
import { Tab } from '@/components/tiptap/extensions/tab-extension';
import { FontSize, LineHeight } from '@/components/tiptap/font-extensions';
import { Indent } from '@/extensions/indent';

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

    // Create read-only editor for preview
    const previewEditor = useEditor({
        extensions: [
            StarterKit.configure({
                // StarterKit sudah include: underline, gapcursor, dropcursor
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Image,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            FontFamily.configure({ types: ['textStyle'] }),
            FontSize,
            LineHeight,
            Indent.configure({
                types: ['paragraph', 'heading', 'listItem'],
                indentLevels: [0, 30, 60, 90, 120, 150, 180, 210, 240],
                defaultIndentLevel: 0,
            }),
            Variable,
            VariableNode,
            Letterhead,
            Signature,
            SignatureBlock,
            Tab,
            PageBreak,
            AlignmentTable,
            AlignmentTableRow,
            AlignmentTableCell,
        ],
        content: template.content,
        editable: false,
        editorProps: {
            attributes: {
                class: 'tiptap-preview focus:outline-none',
            },
        },
    });

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
                            Preview tampilan surat PERSIS dari editor (TipTap read-only)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="bg-gray-100 p-6 rounded-lg overflow-auto">
                            {/* A4 Paper - ukuran presisi tanpa CSS berlebih */}
                            <div 
                                style={{ 
                                    width: '210mm',
                                    minHeight: '297mm',
                                    margin: '0 auto',
                                    padding: '10mm 15mm 15mm 15mm',
                                    backgroundColor: 'white',
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                        /* Reset ProseMirror defaults untuk presisi */
                                        .ProseMirror {
                                            font-family: 'Times New Roman', serif;
                                            font-size: 12pt;
                                            line-height: 1.5;
                                            color: #000;
                                            outline: none;
                                        }
                                        
                                        .ProseMirror p {
                                            margin: 0;
                                            line-height: 1.5;
                                        }
                                        
                                        /* Page Break - Visual Halaman Baru */
                                        .ProseMirror div[data-type="page-break"] {
                                            page-break-after: always;
                                            break-after: page;
                                            margin: 30px 0;
                                            padding: 0;
                                            position: relative;
                                            height: 1px;
                                        }
                                        
                                        .ProseMirror div[data-type="page-break"]::before {
                                            content: '';
                                            position: absolute;
                                            left: 50%;
                                            transform: translateX(-50%);
                                            width: 210mm;
                                            top: 0;
                                            height: 1px;
                                            border-top: 2px dashed #cbd5e1;
                                        }
                                        
                                        .ProseMirror div[data-type="page-break"]::after {
                                            content: '📄 Halaman Baru';
                                            position: absolute;
                                            left: 50%;
                                            transform: translateX(-50%);
                                            top: -12px;
                                            background: white;
                                            padding: 4px 12px;
                                            color: #64748b;
                                            font-size: 11px;
                                            font-weight: 500;
                                            border-radius: 4px;
                                            border: 1px solid #cbd5e1;
                                            white-space: nowrap;
                                            z-index: 1;
                                        }
                                        
                                        @media print {
                                            .ProseMirror div[data-type="page-break"] {
                                                margin: 0;
                                                padding: 0;
                                                height: 0;
                                                background: none;
                                                border: none;
                                            }
                                            
                                            .ProseMirror div[data-type="page-break"]::before,
                                            .ProseMirror div[data-type="page-break"]::after {
                                                display: none;
                                            }
                                        }
                                    `
                                }} />
                                {/* Render menggunakan TipTap Editor read-only - output 100% sama dengan editor */}
                                {previewEditor && <EditorContent editor={previewEditor} />}
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
