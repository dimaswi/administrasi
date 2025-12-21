import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TemplateVariable } from '@/types/document-template';
import { Plus, Trash2, GripVertical, Zap } from 'lucide-react';
import { useState } from 'react';

interface VariablesPanelProps {
    variables: TemplateVariable[];
    onAdd: () => void;
    onUpdate: (index: number, updates: Partial<TemplateVariable>) => void;
    onRemove: (index: number) => void;
}

const variableTypeOptions = [
    { value: 'text', label: 'Teks' },
    { value: 'textarea', label: 'Teks Panjang' },
    { value: 'date', label: 'Tanggal' },
    { value: 'number', label: 'Angka' },
    { value: 'select', label: 'Pilihan' },
];

const variableSourceOptions = [
    { value: 'manual', label: 'Input Manual', description: 'Diisi pengguna saat membuat surat' },
    { value: 'auto_number', label: 'Nomor Otomatis', description: 'Nomor surat digenerate otomatis' },
    { value: 'auto_date', label: 'Tanggal Otomatis', description: 'Tanggal saat surat dibuat' },
    { value: 'auto_user', label: 'User Pembuat', description: 'Nama user yang membuat surat' },
    { value: 'auto_unit', label: 'Unit Kerja', description: 'Unit kerja user pembuat' },
];

export function VariablesPanel({
    variables,
    onAdd,
    onUpdate,
    onRemove,
}: VariablesPanelProps) {
    const generateKeyFromLabel = (label: string): string => {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium">Variabel Template</h3>
                    <p className="text-[10px] text-muted-foreground">
                        Gunakan: {'{{'}<code>key</code>{'}}'}
                    </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-7">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah
                </Button>
            </div>

            <div className="space-y-2">
                {variables.map((variable, index) => (
                    <div key={index} className="border rounded p-2 space-y-2 bg-muted/30">
                        <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 mt-1.5 text-muted-foreground cursor-move shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Label</Label>
                                        <Input
                                            value={variable.label}
                                            onChange={(e) => {
                                                const label = e.target.value;
                                                const autoKey = generateKeyFromLabel(label);
                                                const currentKeyIsAuto = !variable.key || 
                                                    variable.key.startsWith('var_') || 
                                                    variable.key === generateKeyFromLabel(variable.label);
                                                
                                                const updates: Partial<TemplateVariable> = { label };
                                                if (currentKeyIsAuto) {
                                                    updates.key = autoKey;
                                                }
                                                onUpdate(index, updates);
                                            }}
                                            placeholder="Nomor Surat"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Key (auto)</Label>
                                        <Input
                                            value={variable.key}
                                            onChange={(e) => onUpdate(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').replace(/\s+/g, '_') })}
                                            placeholder="nomor_surat"
                                            className="h-7 font-mono text-[10px]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Tipe</Label>
                                        <Select
                                            value={variable.type}
                                            onValueChange={(value) => onUpdate(index, { type: value as TemplateVariable['type'] })}
                                        >
                                            <SelectTrigger className="h-7 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {variableTypeOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Placeholder</Label>
                                        <Input
                                            value={variable.placeholder}
                                            onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
                                            placeholder="..."
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Sumber Variabel */}
                                <div className="space-y-0.5">
                                    <Label className="text-[9px] text-muted-foreground">Sumber</Label>
                                    <Select
                                        value={variable.source || 'manual'}
                                        onValueChange={(value) => onUpdate(index, { source: value as TemplateVariable['source'] })}
                                    >
                                        <SelectTrigger className="h-7 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {variableSourceOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-1.5">
                                                        {opt.value !== 'manual' && <Zap className="h-3 w-3 text-amber-500" />}
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[9px] text-muted-foreground">
                                        {variableSourceOptions.find(o => o.value === (variable.source || 'manual'))?.description}
                                    </p>
                                </div>

                                {variable.source === 'manual' && (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <Switch
                                                id={`required-${index}`}
                                                checked={variable.required}
                                                onCheckedChange={(checked) => onUpdate(index, { required: checked })}
                                            />
                                            <Label htmlFor={`required-${index}`} className="text-[10px]">Wajib</Label>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Switch
                                                id={`readonly-${index}`}
                                                checked={variable.readonly || false}
                                                onCheckedChange={(checked) => onUpdate(index, { readonly: checked })}
                                            />
                                            <Label htmlFor={`readonly-${index}`} className="text-[10px]">Readonly</Label>
                                        </div>
                                    </div>
                                )}

                                {variable.source !== 'manual' && (
                                    <Badge variant="secondary" className="text-[9px] w-fit">
                                        <Zap className="h-2.5 w-2.5 mr-1 text-amber-500" />
                                        Otomatis terisi saat membuat surat
                                    </Badge>
                                )}

                                {variable.source === 'manual' && variable.type !== 'select' && (
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Nilai Default</Label>
                                        <Input
                                            value={variable.default_value || ''}
                                            onChange={(e) => onUpdate(index, { default_value: e.target.value || null })}
                                            placeholder="Opsional"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                )}

                                {variable.source === 'manual' && variable.type === 'select' && (
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Opsi (satu per baris)</Label>
                                        <textarea
                                            value={variable.options.join('\n')}
                                            onChange={(e) => onUpdate(index, { 
                                                options: e.target.value.split('\n').filter(o => o.trim())
                                            })}
                                            placeholder="Opsi 1&#10;Opsi 2"
                                            className="w-full min-h-[60px] text-xs p-2 border rounded resize-none"
                                        />
                                    </div>
                                )}

                                <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono">
                                    {'{{'}{variable.key || 'key'}{'}}'}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => onRemove(index)}
                            >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}

                {variables.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded">
                        Belum ada variabel
                    </div>
                )}
            </div>
        </div>
    );
}
