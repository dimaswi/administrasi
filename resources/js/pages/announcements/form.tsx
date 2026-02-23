import { Head, useForm, router } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, Search, X } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';

interface User {
    id: number;
    name: string;
    nip: string;
    position?: string;
    employee?: {
        organization_unit?: string;
    };
}

interface Props {
    announcement: null;
    userCount: number;
    users: User[];
}

export default function Form({ announcement, userCount, users }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        message: string;
        type: string;
        send_immediately: boolean;
        target_type: 'all' | 'specific';
        user_ids: number[];
    }>({
        title: '',
        message: '',
        type: 'general',
        send_immediately: true,
        target_type: 'all',
        user_ids: [],
    });

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(query) ||
                user.nip.toLowerCase().includes(query) ||
                user.position?.toLowerCase().includes(query) ||
                user.employee?.organization_unit?.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    const selectedUsers = useMemo(() => {
        return users.filter((user) => selectedUserIds.includes(user.id));
    }, [users, selectedUserIds]);

    const toggleUser = useCallback((userId: number) => {
        setSelectedUserIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    }, []);

    const removeUser = useCallback((userId: number) => {
        setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        router.post(route('hr.announcements.store'), {
            title: data.title,
            message: data.message,
            type: data.type,
            send_immediately: data.send_immediately,
            target_type: data.target_type,
            user_ids: selectedUserIds,
        }, {
            onError: () => setIsSubmitting(false),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const recipientCount = data.target_type === 'all' ? userCount : selectedUserIds.length;

    return (
        <HRLayout>
            <Head title="Broadcast Pengumuman" />

            <div className="pt-6">
                <FormPage
                    title="Broadcast Pengumuman"
                    description="Kirim pengumuman ke pengguna"
                    backUrl={route('hr.announcements.index')}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitLabel="Kirim Pengumuman"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                Informasi Pengumuman
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Judul Pengumuman <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Masukkan judul pengumuman"
                                    />
                                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipe Pengumuman <span className="text-red-500">*</span></Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">Umum</SelectItem>
                                            <SelectItem value="urgent">Penting</SelectItem>
                                            <SelectItem value="info">Informasi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="message">Pesan <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="message"
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Tulis pesan pengumuman..."
                                        rows={6}
                                    />
                                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                                </div>

                                <div className="flex items-center gap-8 md:col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="send_immediately"
                                            checked={data.send_immediately}
                                            onCheckedChange={(checked) => setData('send_immediately', checked)}
                                        />
                                        <Label htmlFor="send_immediately">Kirim Segera</Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Penerima Pengumuman
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="target_all"
                                            name="target_type"
                                            value="all"
                                            checked={data.target_type === 'all'}
                                            onChange={() => setData('target_type', 'all')}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="target_all">Semua Pengguna ({userCount})</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="target_specific"
                                            name="target_type"
                                            value="specific"
                                            checked={data.target_type === 'specific'}
                                            onChange={() => setData('target_type', 'specific')}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="target_specific">Pengguna Tertentu</Label>
                                    </div>
                                </div>

                                {data.target_type === 'specific' && (
                                    <div className="space-y-3">
                                        {/* Selected users */}
                                        {selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsers.map((user) => (
                                                    <Badge key={user.id} variant="secondary" className="gap-1">
                                                        {user.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(user.id)}
                                                            className="ml-1 hover:text-destructive"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Search */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Cari pengguna..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>

                                        {/* User list */}
                                        <div className="h-64 border rounded-md overflow-y-auto">
                                            <div className="p-2 space-y-1">
                                                {filteredUsers.map((user) => {
                                                    const isSelected = selectedUserIds.includes(user.id);
                                                    return (
                                                        <label
                                                            key={user.id}
                                                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleUser(user.id)}
                                                                className="h-4 w-4 rounded border-gray-300"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {user.nip}
                                                                    {user.position && <> • {user.position}</>}
                                                                    {user.employee?.organization_unit && (
                                                                        <> • {user.employee.organization_unit}</>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                                {filteredUsers.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        Tidak ada pengguna ditemukan
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {errors.user_ids && (
                                            <p className="text-sm text-destructive">{errors.user_ids}</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                                    <Users className="h-4 w-4" />
                                    <span>
                                        Akan dikirim ke <strong className="text-foreground">{recipientCount}</strong> pengguna
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </FormPage>
            </div>
        </HRLayout>
    );
}
