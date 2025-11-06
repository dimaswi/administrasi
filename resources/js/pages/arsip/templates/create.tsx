import { TipTapEditor, type TipTapEditorRef } from '@/components/tiptap/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileText, Plus, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
    user_id?: number;
    placement?: 'left' | 'center' | 'right' | 'custom';
    customX?: number; // percentage from left (0-100)
    customY?: number; // percentage from top (0-100)
}

interface User {
    id: number;
    name: string;
    email: string;
    position: string;
    organization_unit: string;
    nip?: string;
}

interface CreateTemplateProps extends SharedData {
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arsip', href: '/arsip' },
    { title: 'Template Surat', href: '/arsip/templates' },
    { title: 'Buat Template', href: '/arsip/templates/create' },
];

export default function CreateTemplate({ users }: CreateTemplateProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState<any>(null);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [letterhead, setLetterhead] = useState<any>(null);
    const [numberingFormat, setNumberingFormat] = useState('');
    const [isActive, setIsActive] = useState(true);
    
    // Signature states - TTD sekarang embedded di content, ini hanya untuk temporary insert ke editor
    const [signatures, setSignatures] = useState<Signature[]>([]);

    const [showVariableDialog, setShowVariableDialog] = useState(false);
    const [showLetterheadDialog, setShowLetterheadDialog] = useState(false);
    const [showInsertVariableDialog, setShowInsertVariableDialog] = useState(false);
    const [showInsertSignatureDialog, setShowInsertSignatureDialog] = useState(false);
    const [currentVariable, setCurrentVariable] = useState<Variable>({
        name: '',
        type: 'text',
        label: '',
        required: false,
    });

    const editorRef = useRef<TipTapEditorRef>(null);

    // Add default letter number variable on mount
    useEffect(() => {
        if (variables.length === 0) {
            setVariables([
                {
                    name: 'nomor_surat',
                    type: 'auto',
                    label: 'Nomor Surat',
                    required: true,
                    default: 'Auto-generated',
                },
            ]);
        }
    }, []);

    const variableTypeOptions: SearchableSelectOption[] = [
        { value: 'text', label: 'Text', description: 'Input teks satu baris' },
        { value: 'textarea', label: 'Text Area', description: 'Input teks multi baris' },
        { value: 'richtext', label: 'Rich Text', description: 'Editor teks dengan formatting' },
        { value: 'date', label: 'Date', description: 'Pemilih tanggal' },
        { value: 'select', label: 'Select/Dropdown', description: 'Pilihan dropdown' },
        { value: 'user_select', label: 'User Select', description: 'Pemilih user' },
        { value: 'auto', label: 'Auto Generate', description: 'Otomatis diisi sistem' },
    ];

    const handleAddVariable = () => {
        if (!currentVariable.name || !currentVariable.label) {
            toast.error('Nama dan label variable harus diisi');
            return;
        }

        setVariables([...variables, currentVariable]);
        setCurrentVariable({
            name: '',
            type: 'text',
            label: '',
            required: false,
        });
        setShowVariableDialog(false);
        toast.success('Variable ditambahkan');
    };

    const handleRemoveVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    const handleInsertVariable = () => {
        if (variables.length === 0) {
            // Jika belum ada variable, buka dialog tambah variable
            setShowVariableDialog(true);
        } else {
            // Jika sudah ada variable, tampilkan pilihan variable untuk diinsert
            setShowInsertVariableDialog(true);
        }
    };

    const handleInsertVariableToEditor = (variableName: string) => {
        if (editorRef.current) {
            // Insert variable node ke editor
            editorRef.current.insertVariable(variableName);
            setShowInsertVariableDialog(false);
        }
    };

    const handleInsertLetterhead = () => {
        // Selalu buka dialog untuk konfigurasi
        setShowLetterheadDialog(true);
    };

    const handleInsertSignature = () => {
        setShowInsertSignatureDialog(true);
    };

    const handleInsertSignatureDirectly = (user: User, signatureData: any) => {
        if (editorRef.current) {
            // Insert signature block lengkap (bukan plain text)
            // Gunakan signature.position (Posisi/Keterangan) sebagai jabatan
            const position = signatureData.position || 'Jabatan';
            
            editorRef.current.insertSignature({
                userId: user.id,
                userName: user.name,
                position: position,  // Gunakan position dari signature card
                nip: user.nip || null,
            });
            
            setShowInsertSignatureDialog(false);
            toast.success(`Tanda tangan ${user.name} berhasil disisipkan`);
        }
    };

    const handleSubmit = (e: React.FormEvent, submitType: 'draft' | 'active' = 'active') => {
        e.preventDefault();

        if (!name || !code || !content) {
            toast.error('Nama, kode, dan konten template harus diisi');
            return;
        }

        if (!letterhead?.logo) {
            toast.error('Kop surat harus diupload');
            return;
        }

        if (variables.length === 0) {
            toast.error('Tambahkan minimal satu variable');
            return;
        }

        // Get HTML from editor
        const contentHtml = editorRef.current?.getHTML() || '';
        
        // Get JSON content from editor (penting untuk save signature)
        const currentContent = editorRef.current?.getJSON() || content;
        
        const data = {
            name,
            code: code.toUpperCase(),
            category: category || null,
            description: description || null,
            content: JSON.stringify(currentContent), // Gunakan content dari editor
            content_html: contentHtml,
            variables: JSON.stringify(variables),
            letterhead: JSON.stringify(letterhead),
            signatures: JSON.stringify(signatures), // Kirim signatures ke database
            signature_layout: 'bottom_right_1',
            numbering_format: numberingFormat || null,
            is_active: submitType === 'active',
        };

        router.post('/arsip/templates', data, {
            onSuccess: () => {
                toast.success('Template berhasil dibuat');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal membuat template');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Template Surat" />

            <form onSubmit={(e) => handleSubmit(e, 'active')} className="space-y-6">
                {/* Header */}
                    <div className="my-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-semibold">Tambah Template Surat</h2>
                            <p className="text-xs md:text-sm text-muted-foreground font-mono">Buat template surat baru</p>
                        </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => router.visit('/arsip/templates')}>
                            <X className="mr-2 h-4 w-4" />
                            Batal
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Simpan
                        </Button>
                    </div>
                </div>

                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Template</CardTitle>
                        <CardDescription>Data dasar template surat</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama Template <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Surat Keputusan Pengangkatan"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Kode <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    placeholder="e.g., SK"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Input id="category" placeholder="e.g., Kepegawaian" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                placeholder="Deskripsi template..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="numbering_format">Format Penomoran</Label>
                            <Input
                                id="numbering_format"
                                placeholder="e.g., {{seq}}/{{code}}/{{unit}}/{{month}}/{{year}}"
                                value={numberingFormat}
                                onChange={(e) => setNumberingFormat(e.target.value)}
                            />
                            <div className="space-y-1 text-xs text-muted-foreground">
                                <p className="font-medium">Placeholder yang tersedia:</p>
                                <ul className="ml-2 list-inside list-disc space-y-0.5">
                                    <li>
                                        <code className="rounded bg-muted px-1 py-0.5">{'{{seq}}'}</code> - Nomor urut otomatis (001, 002, ...)
                                    </li>
                                    <li>
                                        <code className="rounded bg-muted px-1 py-0.5">{'{{code}}'}</code> - Kode template (contoh: SK, SPT)
                                    </li>
                                    <li>
                                        <code className="rounded bg-muted px-1 py-0.5">{'{{unit}}'}</code> - Kode unit/bagian (diisi saat buat surat)
                                    </li>
                                    <li>
                                        <code className="rounded bg-muted px-1 py-0.5">{'{{month}}'}</code> - Bulan romawi (I-XII)
                                    </li>
                                    <li>
                                        <code className="rounded bg-muted px-1 py-0.5">{'{{year}}'}</code> - Tahun penuh (2025)
                                    </li>
                                </ul>
                                <p className="mt-2">
                                    <span className="font-medium">Contoh:</span>{' '}
                                    <code className="rounded bg-muted px-1 py-0.5">{'{{seq}}/{{code}}/{{unit}}/{{month}}/{{year}}'}</code>
                                    <br />
                                    <span className="font-medium">Hasil:</span>{' '}
                                    <code className="rounded bg-muted px-1 py-0.5">001/SK/HRD/X/2025</code>
                                </p>
                            </div>
                        </div>

                        {/* Letterhead Section */}
                        <div className="border-t pt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <Label>
                                    Kop Surat <span className="text-destructive">*</span>
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowLetterheadDialog(true)}>
                                    {letterhead?.logo ? 'Ubah Kop Surat' : 'Upload Kop Surat'}
                                </Button>
                            </div>
                            {letterhead?.logo ? (
                                <div className="rounded-lg border bg-gray-50 p-2">
                                    <div className="overflow-hidden rounded bg-white" style={{ width: '100%', height: '120px' }}>
                                        <img
                                            src={letterhead.logo}
                                            alt="Preview Kop Surat"
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        ✓ Kop surat sudah diupload (700 x 178 px saat cetak)
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-lg border-2 border-dashed p-6 text-center text-muted-foreground">
                                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                    <p className="text-sm">Belum ada kop surat</p>
                                    <p className="mt-1 text-xs">Klik "Upload Kop Surat" untuk menambahkan</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                            <Label htmlFor="is_active">Template aktif</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Signature Configuration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Tanda Tangan</CardTitle>
                                <CardDescription>Daftar penandatangan yang bisa disisipkan ke konten surat</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSignatures([...signatures, { label: '', position: '', user_id: undefined, placement: 'right' }]);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Penandatangan
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {signatures.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Belum ada penandatangan</p>
                                <p className="text-xs mt-1">Klik "Tambah Penandatangan" untuk menambahkan</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                            {signatures.map((signature, index) => (
                                <Card key={index} className="bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">Penandatangan {index + 1}</CardTitle>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const signature = signatures[index];
                                                    // Remove signature from editor if it has a user_id
                                                    if (signature.user_id && editorRef.current) {
                                                        editorRef.current.removeSignatureByUserId(signature.user_id);
                                                    }
                                                    setSignatures(signatures.filter((_, i) => i !== index));
                                                    toast.success('Penandatangan dihapus dari form dan konten');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <Label htmlFor={`signature_user_${index}`}>Pilih User Penandatangan</Label>
                                            <SearchableSelect
                                                options={users.map((user) => ({
                                                    value: user.id.toString(),
                                                    label: `${user.name} - ${user.position}`,
                                                    description: user.organization_unit,
                                                }))}
                                                value={signature.user_id?.toString() || ''}
                                                onValueChange={(value) => {
                                                    const newSignatures = [...signatures];
                                                    newSignatures[index].user_id = value ? Number(value) : undefined;
                                                    // Auto-fill label and position with user data
                                                    const selectedUser = users.find(u => u.id === Number(value));
                                                    if (selectedUser) {
                                                        newSignatures[index].label = selectedUser.name;
                                                        newSignatures[index].position = selectedUser.position || '';
                                                    }
                                                    setSignatures(newSignatures);
                                                }}
                                                placeholder="-- Pilih User --"
                                                emptyText="User tidak ditemukan"
                                                searchPlaceholder="Cari nama atau unit..."
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`signature_label_${index}`}>Nama / Jabatan</Label>
                                            <Input
                                                id={`signature_label_${index}`}
                                                placeholder="Contoh: Dr. John Doe"
                                                value={signature.label}
                                                onChange={(e) => {
                                                    const newSignatures = [...signatures];
                                                    newSignatures[index].label = e.target.value;
                                                    setSignatures(newSignatures);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`signature_position_${index}`}>Posisi / Keterangan</Label>
                                            <Input
                                                id={`signature_position_${index}`}
                                                placeholder="Contoh: Direktur Utama"
                                                value={signature.position}
                                                onChange={(e) => {
                                                    const newSignatures = [...signatures];
                                                    newSignatures[index].position = e.target.value;
                                                    setSignatures(newSignatures);
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        )}

                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong className="text-blue-600">💡 Cara Penggunaan:</strong><br />
                                1. <strong>Konfigurasikan penandatangan di sini</strong> - Data ini akan digunakan untuk approval tracking<br />
                                2. <strong>Sisipkan NAMA penandatangan</strong> ke konten surat dengan klik tombol <strong>"✍️ Tanda Tangan"</strong> di toolbar editor<br />
                                3. Saat surat dibuat, approval records akan dibuat berdasarkan konfigurasi di atas
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Variables */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Variables</CardTitle>
                                <CardDescription>Field yang akan diisi saat membuat surat</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {!variables.some((v) => v.name === 'nomor_surat') && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setVariables([
                                                ...variables,
                                                {
                                                    name: 'nomor_surat',
                                                    type: 'auto',
                                                    label: 'Nomor Surat',
                                                    required: true,
                                                    default: 'Auto-generated',
                                                },
                                            ]);
                                            toast.success('Variable nomor_surat ditambahkan');
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Nomor Surat
                                    </Button>
                                )}
                                <Button type="button" onClick={() => setShowVariableDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Variable
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {variables.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                <p>Belum ada variable</p>
                                <p className="mt-1 text-xs">Klik "Tambah Variable" untuk menambahkan</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {variables.map((variable, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{'{{' + variable.name + '}}'}</code>
                                                <Badge variant={variable.type === 'auto' ? 'default' : 'outline'}>
                                                    {variable.type === 'auto' ? '🤖 Auto' : variable.type}
                                                </Badge>
                                                {variable.required && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Required
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {variable.label}
                                                {variable.type === 'auto' && (
                                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Sistem generate otomatis)</span>
                                                )}
                                            </p>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVariable(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Content Editor */}
                <Card>
                    <CardHeader>
                        <CardTitle>Konten Template</CardTitle>
                        <CardDescription>
                            Desain isi surat dengan editor. Gunakan variable untuk data dinamis.
                            <br />
                            <strong className="text-amber-600">Catatan:</strong> Kop surat dan tanda tangan akan otomatis ditambahkan saat cetak. Anda
                            hanya perlu mendesain isi surat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TipTapEditor
                            ref={editorRef}
                            content={content}
                            onChange={setContent}
                            onInsertVariable={handleInsertVariable}
                            onInsertSignature={handleInsertSignature}
                        />
                    </CardContent>
                </Card>
            </form>

            {/* Insert Variable Dialog */}
            <Dialog open={showInsertVariableDialog} onOpenChange={setShowInsertVariableDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pilih Variable</DialogTitle>
                        <DialogDescription>Pilih variable yang akan dimasukkan ke dalam konten template</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        {variables.map((variable, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleInsertVariableToEditor(variable.name)}
                                className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{'{{' + variable.name + '}}'}</code>
                                        <Badge variant={variable.type === 'auto' ? 'default' : 'outline'}>
                                            {variable.type === 'auto' ? '🤖 Auto' : variable.type}
                                        </Badge>
                                        {variable.required && (
                                            <Badge variant="destructive" className="text-xs">
                                                Required
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {variable.label}
                                        {variable.type === 'auto' && (
                                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Sistem generate otomatis)</span>
                                        )}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowInsertVariableDialog(false)}>
                            Batal
                        </Button>
                        <Button type="button" onClick={() => setShowVariableDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Variable Baru
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Variable Dialog */}
            <Dialog open={showVariableDialog} onOpenChange={setShowVariableDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tambah Variable</DialogTitle>
                        <DialogDescription>Variable akan tersedia saat membuat surat dari template ini</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="var_name">Nama Variable</Label>
                            <Input
                                id="var_name"
                                placeholder="e.g., nomor_surat"
                                value={currentVariable.name}
                                onChange={(e) => setCurrentVariable({ ...currentVariable, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="var_label">Label</Label>
                            <Input
                                id="var_label"
                                placeholder="e.g., Nomor Surat"
                                value={currentVariable.label}
                                onChange={(e) => setCurrentVariable({ ...currentVariable, label: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="var_type">Tipe Input</Label>
                            <SearchableSelect
                                options={variableTypeOptions}
                                value={currentVariable.type}
                                onValueChange={(value: any) => setCurrentVariable({ ...currentVariable, type: value })}
                                placeholder="Pilih tipe input"
                                searchPlaceholder="Cari tipe input..."
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="var_required"
                                checked={currentVariable.required}
                                onCheckedChange={(checked) => setCurrentVariable({ ...currentVariable, required: checked })}
                            />
                            <Label htmlFor="var_required">Field wajib diisi</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowVariableDialog(false)}>
                            Batal
                        </Button>
                        <Button type="button" onClick={handleAddVariable}>
                            Tambah
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Letterhead Dialog */}
            <Dialog open={showLetterheadDialog} onOpenChange={setShowLetterheadDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Upload Kop Surat</DialogTitle>
                        <DialogDescription>
                            Upload gambar kop surat lengkap. Gambar akan ditampilkan dengan ukuran 700x178px saat cetak.
                            <br />
                            <strong className="text-amber-600">Catatan:</strong> Kop surat akan otomatis muncul di bagian atas surat, tidak perlu
                            dimasukkan ke konten.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="logo">
                                Gambar Kop Surat <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // Check file size (max 2MB)
                                        if (file.size > 2 * 1024 * 1024) {
                                            toast.error('Ukuran file maksimal 2MB');
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            setLetterhead({
                                                logo: event.target?.result as string,
                                                width: 700,
                                                height: 178,
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                        toast.success('Gambar berhasil diupload');
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload gambar kop surat lengkap (PNG/JPG, max 2MB). Ukuran render: <strong>700 x 178 px</strong>
                            </p>
                            {letterhead?.logo && (
                                <div className="mt-2 rounded-lg border p-2">
                                    <div className="overflow-hidden rounded bg-gray-50" style={{ width: '100%', height: '178px' }}>
                                        <img
                                            src={letterhead.logo}
                                            alt="Preview Kop Surat"
                                            style={{
                                                width: '700px',
                                                height: '178px',
                                                objectFit: 'cover',
                                                maxWidth: '100%',
                                            }}
                                        />
                                    </div>
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        Preview: 700 x 178 px (ukuran sebenarnya saat cetak)
                                    </p>

                                    <Button type="button" variant="destructive" size="sm" className="mt-2 w-full" onClick={() => setLetterhead(null)}>
                                        Hapus Gambar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowLetterheadDialog(false)}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (!letterhead?.logo) {
                                    toast.error('Upload gambar kop surat terlebih dahulu');
                                    return;
                                }
                                setShowLetterheadDialog(false);
                            }}
                        >
                            Simpan Kop Surat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Insert Signature Dialog */}
            <Dialog open={showInsertSignatureDialog} onOpenChange={setShowInsertSignatureDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Sisipkan Tanda Tangan</DialogTitle>
                        <DialogDescription>
                            Pilih user yang sudah di-assign di template
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        {signatures.filter(sig => sig.user_id).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Belum ada user yang di-assign di template</p>
                                <p className="text-xs mt-2">Silakan assign user di Signature Card terlebih dahulu</p>
                            </div>
                        ) : (
                            signatures
                                .filter(sig => sig.user_id)
                                .map((signature, index) => {
                                    const user = users.find(u => u.id === signature.user_id);
                                    if (!user) return null;
                                    
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                                onClick={() => handleInsertSignatureDirectly(user, signature)}
                                            className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {user.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {signature.label} - {user.organization_unit}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowInsertSignatureDialog(false)}>
                            Batal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
