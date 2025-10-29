import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { 
    Plus, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Trash2,
    Edit,
    User,
    Calendar,
    Flag,
    Check,
    ChevronsUpDown,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActionItem {
    id: number;
    title: string;
    description?: string;
    assigned_to?: number;
    assigned_user?: {
        id: number;
        name: string;
    };
    deadline?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    completed_at?: string;
    created_at: string;
}

interface User {
    id: number;
    name: string;
}

interface ActionItemsProps {
    meetingId: number;
    canEdit: boolean;
    users: User[];
}

export function ActionItems({ meetingId, canEdit, users }: ActionItemsProps) {
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        deadline: '',
        priority: 'medium',
        status: 'pending',
        notes: '',
    });

    // Fetch action items
    const fetchActionItems = async () => {
        try {
            const response = await axios.get(`/meeting/meetings/${meetingId}/action-items`);
            setActionItems(response.data);
        } catch (error) {
            console.error('Failed to fetch action items:', error);
            toast.error('Gagal memuat action items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActionItems();
    }, [meetingId]);

    // Handle form change
    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            assigned_to: '',
            deadline: '',
            priority: 'medium',
            status: 'pending',
            notes: '',
        });
        setEditingItem(null);
    };

    // Open dialog for new item
    const handleOpenDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    // Open dialog for edit
    const handleEdit = (item: ActionItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            description: item.description || '',
            assigned_to: item.assigned_to?.toString() || '',
            deadline: item.deadline || '',
            priority: item.priority,
            status: item.status,
            notes: item.notes || '',
        });
        setIsDialogOpen(true);
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingItem) {
                // Update existing item
                const response = await axios.put(
                    `/meeting/meetings/${meetingId}/action-items/${editingItem.id}`,
                    formData
                );
                toast.success(response.data.message);
            } else {
                // Create new item
                const response = await axios.post(
                    `/meeting/meetings/${meetingId}/action-items`,
                    formData
                );
                toast.success(response.data.message);
            }
            
            fetchActionItems();
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            console.error('Failed to save action item:', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan action item');
        }
    };

    // Delete action item
    const handleDelete = async (itemId: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus action item ini?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `/meeting/meetings/${meetingId}/action-items/${itemId}`
            );
            toast.success(response.data.message);
            fetchActionItems();
        } catch (error: any) {
            console.error('Failed to delete action item:', error);
            toast.error(error.response?.data?.message || 'Gagal menghapus action item');
        }
    };

    // Mark as completed
    const handleComplete = async (itemId: number) => {
        try {
            const response = await axios.post(
                `/meeting/meetings/${meetingId}/action-items/${itemId}/complete`
            );
            toast.success(response.data.message);
            fetchActionItems();
        } catch (error: any) {
            console.error('Failed to complete action item:', error);
            toast.error(error.response?.data?.message || 'Gagal menyelesaikan action item');
        }
    };

    // Get priority badge
    const getPriorityBadge = (priority: string) => {
        const colors = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        const labels = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
        return <Badge variant="outline" className={colors[priority as keyof typeof colors]}>{labels[priority as keyof typeof labels]}</Badge>;
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-gray-100 text-gray-800 border-gray-200',
            in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        };
        const labels = {
            pending: 'Pending',
            in_progress: 'Dalam Progress',
            completed: 'Selesai',
            cancelled: 'Dibatalkan',
        };
        return <Badge variant="outline" className={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Badge>;
    };

    // Check if overdue
    const isOverdue = (item: ActionItem) => {
        if (!item.deadline || item.status === 'completed') return false;
        return new Date(item.deadline) < new Date();
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Action Items & Tindak Lanjut
                        </CardTitle>
                        <CardDescription>
                            Daftar tindak lanjut dari hasil rapat
                        </CardDescription>
                    </div>
                    {canEdit && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleOpenDialog}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Action Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingItem ? 'Edit Action Item' : 'Tambah Action Item Baru'}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Isi informasi tindak lanjut yang perlu dilakukan
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Judul <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => handleChange('title', e.target.value)}
                                                required
                                                placeholder="Contoh: Buat laporan hasil survei"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Deskripsi</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                rows={3}
                                                placeholder="Detail lengkap tentang action item ini..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="assigned_to">Ditugaskan Kepada</Label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: '', label: 'Tidak ada' },
                                                        ...users.map(user => ({
                                                            value: user.id.toString(),
                                                            label: user.name,
                                                        }))
                                                    ]}
                                                    value={formData.assigned_to}
                                                    onValueChange={(value) => handleChange('assigned_to', value)}
                                                    placeholder="Pilih user..."
                                                    searchPlaceholder="Cari user..."
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="deadline">Deadline</Label>
                                                <Input
                                                    id="deadline"
                                                    type="date"
                                                    value={formData.deadline}
                                                    onChange={(e) => handleChange('deadline', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="priority">Prioritas <span className="text-red-500">*</span></Label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: 'low', label: 'Rendah' },
                                                        { value: 'medium', label: 'Sedang' },
                                                        { value: 'high', label: 'Tinggi' },
                                                    ]}
                                                    value={formData.priority}
                                                    onValueChange={(value) => handleChange('priority', value)}
                                                    placeholder="Pilih prioritas..."
                                                />
                                            </div>

                                            {editingItem && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="status">Status</Label>
                                                    <SearchableSelect
                                                        options={[
                                                            { value: 'pending', label: 'Pending' },
                                                            { value: 'in_progress', label: 'Dalam Progress' },
                                                            { value: 'completed', label: 'Selesai' },
                                                            { value: 'cancelled', label: 'Dibatalkan' },
                                                        ]}
                                                        value={formData.status}
                                                        onValueChange={(value) => handleChange('status', value)}
                                                        placeholder="Pilih status..."
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="notes">Catatan</Label>
                                            <Textarea
                                                id="notes"
                                                value={formData.notes}
                                                onChange={(e) => handleChange('notes', e.target.value)}
                                                rows={2}
                                                placeholder="Catatan tambahan..."
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit">
                                            {editingItem ? 'Simpan Perubahan' : 'Tambah Action Item'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : actionItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Belum ada action item</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {actionItems.map((item) => (
                            <div
                                key={item.id}
                                className={`p-4 rounded-lg border ${
                                    isOverdue(item) ? 'border-red-200 bg-red-50/50' : 'border-border'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-sm">{item.title}</h4>
                                            {getPriorityBadge(item.priority)}
                                            {getStatusBadge(item.status)}
                                            {isOverdue(item) && (
                                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Terlambat
                                                </Badge>
                                            )}
                                        </div>

                                        {item.description && (
                                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                            {item.assigned_user && (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {item.assigned_user.name}
                                                </div>
                                            )}
                                            {item.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(item.deadline), 'dd MMM yyyy', { locale: id })}
                                                </div>
                                            )}
                                            {item.completed_at && (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Selesai: {format(new Date(item.completed_at), 'dd MMM yyyy', { locale: id })}
                                                </div>
                                            )}
                                        </div>

                                        {item.notes && (
                                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                                <strong>Catatan:</strong> {item.notes}
                                            </div>
                                        )}
                                    </div>

                                    {canEdit && (
                                        <div className="flex items-center gap-2">
                                            {item.status !== 'completed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleComplete(item.id)}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
