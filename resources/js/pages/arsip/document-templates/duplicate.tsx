import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { 
    ArrowLeft, Copy, FileText, Building2, Hash, Link2, Unlink, Info,
    Check, ChevronsUpDown, Loader2
} from 'lucide-react';
import { DocumentTemplate } from '@/types/document-template';
import { cn } from '@/lib/utils';

interface OrganizationUnit {
    id: number;
    name: string;
    code: string;
}

interface Props {
    template: DocumentTemplate & {
        organization_unit?: OrganizationUnit;
    };
    organizationUnits: OrganizationUnit[];
    currentLetterCount: number;
    linkedTemplates: (DocumentTemplate & { organization_unit?: OrganizationUnit })[];
}

export default function Duplicate({ template, organizationUnits, currentLetterCount, linkedTemplates }: Props) {
    const [orgOpen, setOrgOpen] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        name: template.name,
        code: template.code,
        organization_unit_id: '', // Start empty, user must select
        numbering_format: template.numbering_format || '',
        is_new_template: false as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/arsip/document-templates/${template.id}/duplicate`);
    };

    const selectedOrg = useMemo(() => 
        organizationUnits.find(o => o.id.toString() === data.organization_unit_id),
        [organizationUnits, data.organization_unit_id]
    );

    // Filter organization units based on template type
    // For linked templates (same code), exclude current org unit to avoid duplicate code
    const availableOrgs = useMemo(() => {
        if (data.is_new_template) {
            return organizationUnits;
        }
        // For linked template, exclude the source template's org unit
        return organizationUnits.filter(o => o.id !== template.organization_unit_id);
    }, [organizationUnits, data.is_new_template, template.organization_unit_id]);

    // When is_new_template changes, reset or keep the values
    const handleNewTemplateChange = (checked: boolean) => {
        setData(prev => ({
            ...prev,
            is_new_template: checked,
            // If switching to new template mode, add suffix to differentiate
            name: checked ? template.name + ' (Copy)' : template.name,
            code: checked ? template.code + '-' + Date.now().toString().slice(-4) : template.code,
            // Reset org selection when switching modes
            organization_unit_id: '',
        }));
    };

    return (
        <AppLayout>
            <Head title={`Duplikasi: ${template.name} `} />

            <div className="h-[calc(100vh-64px)] flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit(`/arsip/document-templates/${template.id}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-sm font-semibold leading-none">Duplikasi Template</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {template.name} - <b>Unit</b> : {template.organization_unit?.name || '-'} - <b>Kode</b> : {template.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(`/arsip/document-templates/${template.id}`)}
                        >
                            Batal
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={processing}>
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                <Copy className="h-4 w-4 mr-1.5" />
                            )}
                            Duplikasi
                        </Button>
                    </div>
                </div>

                {/* Main Content - 2 Panel Layout */}
                <div className="flex-1 grid grid-cols-2 overflow-hidden">
                    {/* Left Panel - Form */}
                    <div className="border-r flex flex-col bg-background overflow-hidden">
                        <ScrollArea className="flex-1">
                            <form onSubmit={handleSubmit} className="p-4 space-y-4">

                                {/* Linked Templates Info */}
                                {linkedTemplates.length > 0 && (
                                    <Alert>
                                        <Link2 className="h-4 w-4" />
                                        <AlertTitle className="text-sm">Template Terhubung</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Template ini berbagi penomoran dengan:
                                            <ul className="mt-1 space-y-0.5">
                                                {linkedTemplates.map(t => (
                                                    <li key={t.id} className="flex items-center gap-1">
                                                        <Badge variant="outline" className="text-xs px-1">{t.code}</Badge>
                                                        <span className="truncate">{t.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Template Type Selection */}
                                <Card className={data.is_new_template ? '' : 'border-primary'}>
                                    <CardContent className="space-y-3 pt-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                            <div className="flex items-center gap-2">
                                                {data.is_new_template ? (
                                                    <Unlink className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Link2 className="h-4 w-4 text-primary" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {data.is_new_template 
                                                            ? 'Template Baru (Independen)' 
                                                            : 'Template Terhubung (Linked)'
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {data.is_new_template 
                                                            ? 'Kode & nama bisa berbeda, nomor mulai dari 001' 
                                                            : 'Kode & nama sama, nomor melanjutkan'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={data.is_new_template}
                                                onCheckedChange={handleNewTemplateChange}
                                            />
                                        </div>

                                        {data.is_new_template ? (
                                            <Alert variant="default" className="py-2">
                                                <Unlink className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    Nomor surat pertama: <strong>001</strong>
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <div className="space-y-2">
                                                <Alert className="border-primary/50 bg-primary/5 py-2">
                                                    <Link2 className="h-4 w-4 text-primary" />
                                                    <AlertDescription className="text-xs">
                                                        Nomor surat berikutnya: <strong className="text-primary">{String(currentLetterCount + 1).padStart(3, '0')}</strong>
                                                    </AlertDescription>
                                                </Alert>
                                                <Alert variant="default" className="py-2 border-amber-500/50 bg-amber-500/5">
                                                    <Info className="h-4 w-4 text-amber-600" />
                                                    <AlertDescription className="text-xs text-amber-800">
                                                        Template terhubung harus dipasang ke <strong>unit organisasi berbeda</strong> karena kode yang sama.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* New Template Settings */}
                                <Card>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="name" className="text-xs">
                                                    Nama Template {data.is_new_template && <span className="text-destructive">*</span>}
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Nama template"
                                                    disabled={!data.is_new_template}
                                                    className={cn(
                                                        "h-9 text-sm",
                                                        !data.is_new_template && "bg-muted"
                                                    )}
                                                />
                                                {errors.name && (
                                                    <p className="text-xs text-destructive">{errors.name}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="code" className="text-xs">
                                                    Kode {data.is_new_template && <span className="text-destructive">*</span>}
                                                </Label>
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    placeholder="Kode template"
                                                    disabled={!data.is_new_template}
                                                    className={cn(
                                                        "h-9 text-sm font-mono",
                                                        !data.is_new_template && "bg-muted"
                                                    )}
                                                />
                                                {errors.code && (
                                                    <p className="text-xs text-destructive">{errors.code}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs">
                                                Unit Organisasi <span className="text-destructive">*</span>
                                            </Label>
                                            <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={orgOpen}
                                                        className="w-full justify-between h-9 text-sm font-normal"
                                                    >
                                                        {selectedOrg ? (
                                                            <span className="flex items-center gap-2 truncate">
                                                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">{selectedOrg.name}</span>
                                                                <Badge variant="outline" className="ml-auto text-xs px-1 font-mono">
                                                                    {selectedOrg.code}
                                                                </Badge>
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Pilih unit organisasi...</span>
                                                        )}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Cari unit organisasi..." className="h-9" />
                                                        <CommandList>
                                                            <CommandEmpty>Unit organisasi tidak ditemukan.</CommandEmpty>
                                                            <CommandGroup>
                                                                {availableOrgs.map((unit) => (
                                                                    <CommandItem
                                                                        key={unit.id}
                                                                        value={`${unit.name} ${unit.code}`}
                                                                        onSelect={() => {
                                                                            setData('organization_unit_id', unit.id.toString());
                                                                            setOrgOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                data.organization_unit_id === unit.id.toString()
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <span className="flex-1 truncate">{unit.name}</span>
                                                                        <Badge variant="outline" className="ml-2 font-mono text-xs">
                                                                            {unit.code}
                                                                        </Badge>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {errors.organization_unit_id && (
                                                <p className="text-xs text-destructive">{errors.organization_unit_id}</p>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-1.5">
                                            <Label htmlFor="numbering_format" className="text-xs">Format Penomoran</Label>
                                            <Input
                                                id="numbering_format"
                                                value={data.numbering_format}
                                                onChange={(e) => setData('numbering_format', e.target.value)}
                                                placeholder="{CODE}/{NO}/{MONTH}/{YEAR}"
                                                className="h-9 text-sm font-mono"
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Placeholder: {'{CODE}'}, {'{NO}'}, {'{MONTH}'}, {'{YEAR}'}, {'{UNIT}'}
                                            </p>
                                            {errors.numbering_format && (
                                                <p className="text-xs text-destructive">{errors.numbering_format}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </form>
                        </ScrollArea>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="flex flex-col bg-muted/30 overflow-hidden">
                        <div className="p-4 flex-1 overflow-auto">
                            <Card className="h-full">
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs text-muted-foreground">Nama Template</span>
                                                <p className="font-medium">{data.name || '-'}</p>
                                            </div>
                                            <Badge variant={data.is_new_template ? 'secondary' : 'default'}>
                                                {data.is_new_template ? (
                                                    <><Unlink className="h-3 w-3 mr-1" /> Independen</>
                                                ) : (
                                                    <><Link2 className="h-3 w-3 mr-1" /> Terhubung</>
                                                )}
                                            </Badge>
                                        </div>
                                        
                                        <div>
                                            <span className="text-xs text-muted-foreground">Kode Template</span>
                                            <p className="font-mono">{data.code || '-'}</p>
                                        </div>

                                        <div>
                                            <span className="text-xs text-muted-foreground">Unit Organisasi</span>
                                            <p>{selectedOrg?.name || '-'}</p>
                                            {selectedOrg && (
                                                <Badge variant="outline" className="mt-1 font-mono text-xs">
                                                    {selectedOrg.code}
                                                </Badge>
                                            )}
                                        </div>

                                        <Separator />

                                        <div>
                                            <span className="text-xs text-muted-foreground">Nomor Surat Berikutnya</span>
                                            <p className="text-lg font-bold text-primary font-mono">
                                                {data.is_new_template ? '001' : String(currentLetterCount + 1).padStart(3, '0')}
                                            </p>
                                        </div>

                                        {selectedOrg && data.numbering_format && (
                                            <div>
                                                <span className="text-xs text-muted-foreground">Contoh Format Nomor</span>
                                                <p className="font-mono text-sm bg-muted p-2 rounded mt-1">
                                                    {data.numbering_format
                                                        .replace('{CODE}', data.code)
                                                        .replace('{NO}', data.is_new_template 
                                                            ? '001'
                                                            : String(currentLetterCount + 1).padStart(3, '0')
                                                        )
                                                        .replace('{MONTH}', 'XII')
                                                        .replace('{YEAR}', new Date().getFullYear().toString())
                                                        .replace('{UNIT}', selectedOrg.code)
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-2">Yang akan disalin:</p>
                                            <ul className="text-xs space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    Pengaturan halaman (ukuran, margin, orientasi)
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    Header & kop surat
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    Blok konten (paragraf, tabel, dll)
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    Pengaturan tanda tangan
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    Variabel template
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
