import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SignatureSettings, SignatureSlot } from '@/types/document-template';
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useMemo } from 'react';

interface SignatureSettingsPanelProps {
    settings: SignatureSettings;
    totalPages: number; // Dynamic page count from content blocks
    onUpdate: (updates: Partial<SignatureSettings>) => void;
    onAddSlot: (column: number) => void;
    onUpdateSlot: (id: string, updates: Partial<SignatureSlot>) => void;
    onRemoveSlot: (id: string) => void;
}

const layoutOptions = [
    { value: '1-column', label: '1 Kolom' },
    { value: '2-column', label: '2 Kolom' },
    { value: '3-column', label: '3 Kolom' },
    { value: '4-column', label: '4 Kolom' },
];

export function SignatureSettingsPanel({
    settings,
    totalPages,
    onUpdate,
    onAddSlot,
    onUpdateSlot,
    onRemoveSlot,
}: SignatureSettingsPanelProps) {
    // Generate dynamic page position options based on total pages
    const pagePositionOptions = useMemo(() => {
        const options = [{ value: 'last', label: 'Halaman Terakhir' }];
        for (let i = 1; i <= totalPages; i++) {
            options.push({ value: String(i), label: `Halaman ${i}` });
        }
        return options;
    }, [totalPages]);
    const getColumnCount = () => {
        return parseInt(settings.layout.split('-')[0]) || 1;
    };

    const columnCount = getColumnCount();

    const getColumnSlots = (column: number) => {
        return settings.slots
            .filter(s => s.column === column)
            .sort((a, b) => a.order - b.order);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">Pengaturan Tanda Tangan</h3>
            
            {/* Layout Settings */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Tata Letak</Label>
                    <Select
                        value={settings.layout}
                        onValueChange={(value) => onUpdate({ layout: value as SignatureSettings['layout'] })}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {layoutOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Posisi Halaman</Label>
                    <Select
                        value={settings.page_position === 'last' || !settings.page_position ? 'last' : String(settings.page_position)}
                        onValueChange={(value) => {
                            const newPosition = value === 'last' ? 'last' : Number(value);
                            onUpdate({ page_position: newPosition as 'last' | number });
                        }}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pagePositionOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Margin Atas (mm)</Label>
                    <Input
                        type="number"
                        value={settings.margin_top}
                        onChange={(e) => onUpdate({ margin_top: parseFloat(e.target.value) || 30 })}
                        min={0}
                        max={100}
                        step={1}
                        className="h-8"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Jarak Antar Kolom (mm)</Label>
                    <Input
                        type="number"
                        value={settings.column_gap}
                        onChange={(e) => onUpdate({ column_gap: parseFloat(e.target.value) || 20 })}
                        min={5}
                        max={50}
                        step={1}
                        className="h-8"
                    />
                </div>
            </div>

            {/* Columns with Slots */}
            <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-medium">Slot Tanda Tangan</Label>
                
                <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                    {Array.from({ length: columnCount }).map((_, colIndex) => {
                        const columnSlots = getColumnSlots(colIndex);
                        
                        return (
                            <div key={colIndex} className="border rounded p-2 space-y-2 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-medium">Kolom {colIndex + 1}</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px]"
                                        onClick={() => onAddSlot(colIndex)}
                                    >
                                        <Plus className="h-3 w-3 mr-0.5" />
                                        Slot
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {columnSlots.map((slot, slotIndex) => (
                                        <div key={slot.id} className="border rounded p-2 space-y-2 bg-background">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-medium text-muted-foreground">
                                                    Slot {slotIndex + 1}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0"
                                                    onClick={() => onRemoveSlot(slot.id)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[9px] text-muted-foreground">Label Atas</Label>
                                                <Input
                                                    value={slot.label_above}
                                                    onChange={(e) => onUpdateSlot(slot.id, { label_above: e.target.value })}
                                                    placeholder="Contoh: Mengetahui,"
                                                    className="h-6 text-[10px]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[9px] text-muted-foreground">Jabatan</Label>
                                                <Input
                                                    value={slot.label_position}
                                                    onChange={(e) => onUpdateSlot(slot.id, { label_position: e.target.value })}
                                                    placeholder="Contoh: Kepala Bagian"
                                                    className="h-6 text-[10px]"
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Switch
                                                        id={`name-${slot.id}`}
                                                        checked={slot.show_name}
                                                        onCheckedChange={(checked) => onUpdateSlot(slot.id, { show_name: checked })}
                                                    />
                                                    <Label htmlFor={`name-${slot.id}`} className="text-[9px]">Nama</Label>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Switch
                                                        id={`nip-${slot.id}`}
                                                        checked={slot.show_nip}
                                                        onCheckedChange={(checked) => onUpdateSlot(slot.id, { show_nip: checked })}
                                                    />
                                                    <Label htmlFor={`nip-${slot.id}`} className="text-[9px]">NIP</Label>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Label className="text-[9px] text-muted-foreground shrink-0">Tinggi TTD (mm):</Label>
                                                <Input
                                                    type="number"
                                                    value={slot.signature_height}
                                                    onChange={(e) => onUpdateSlot(slot.id, { 
                                                        signature_height: parseFloat(e.target.value) || 25 
                                                    })}
                                                    className="h-5 w-12 text-[10px]"
                                                    min={15}
                                                    max={50}
                                                />
                                            </div>

                                            <div className="flex gap-0.5">
                                                {(['left', 'center', 'right'] as const).map((align) => (
                                                    <Button
                                                        key={align}
                                                        type="button"
                                                        variant={slot.text_align === align ? 'secondary' : 'ghost'}
                                                        size="sm"
                                                        className="h-5 w-5 p-0"
                                                        onClick={() => onUpdateSlot(slot.id, { text_align: align })}
                                                    >
                                                        {align === 'left' && <AlignLeft className="h-3 w-3" />}
                                                        {align === 'center' && <AlignCenter className="h-3 w-3" />}
                                                        {align === 'right' && <AlignRight className="h-3 w-3" />}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {columnSlots.length === 0 && (
                                        <div className="text-center py-3 text-[10px] text-muted-foreground border border-dashed rounded">
                                            Klik "+ Slot"
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
