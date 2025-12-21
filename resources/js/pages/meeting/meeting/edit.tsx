import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, Room, OrganizationUnit, User, Meeting, SharedData } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { Loader2, Save, Search, Users as UsersIcon, CheckSquare, XSquare, Calendar, AlertTriangle } from "lucide-react";
import { FormEventHandler, useState, useMemo, useEffect } from "react";
import { format } from "date-fns";

interface Props extends SharedData {
    meeting: Meeting;
    rooms: Room[];
    organizationUnits: OrganizationUnit[];
    users: User[];
}

interface SelectedParticipant {
    user_id: number;
    role: string;
}

export default function MeetingEdit({ meeting, rooms, organizationUnits, users }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Rapat', href: '/meeting/meetings' },
        { title: meeting.title, href: `/meeting/meetings/${meeting.id}` },
        { title: 'Edit', href: `/meeting/meetings/${meeting.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<{
        title: string;
        agenda: string;
        meeting_date: string;
        start_time: string;
        end_time: string;
        room_id: string;
        organization_unit_id: string;
        notes: string;
        status: string;
        participant_ids: number[];
        participant_roles: Record<number, string>;
    }>({
        title: meeting.title,
        agenda: meeting.agenda,
        meeting_date: meeting.meeting_date,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        room_id: meeting.room_id.toString(),
        organization_unit_id: meeting.organization_unit_id?.toString() || '',
        notes: meeting.notes || '',
        status: meeting.status === 'cancelled' ? 'scheduled' : meeting.status,
        participant_ids: [],
        participant_roles: {},
    });

    const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOrgUnit, setFilterOrgUnit] = useState('');
    const [timeError, setTimeError] = useState<string>('');

    // Initialize participants from meeting data
    useEffect(() => {
        if (meeting.participants) {
            const participants = meeting.participants.map(p => ({
                user_id: p.user_id,
                role: p.role,
            }));
            setSelectedParticipants(participants);
        }
    }, [meeting.participants]);

    // Calculate minimum time for today
    const minTime = useMemo(() => {
        if (!data.meeting_date) return '';
        
        const today = new Date().toISOString().split('T')[0];
        if (data.meeting_date === today) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
        return '';
    }, [data.meeting_date]);

    const roomOptions: SearchableSelectOption[] = rooms.map((room) => ({
        value: room.id.toString(),
        label: room.name,
        description: `${room.building || ''} ${room.floor ? `Lt. ${room.floor}` : ''} - Kapasitas: ${room.capacity}`,
    }));

    const organizationOptions: SearchableSelectOption[] = [
        { value: '', label: 'Tidak ada unit khusus' },
        ...organizationUnits.map((unit) => ({
            value: unit.id.toString(),
            label: `[${unit.code}] ${unit.name}`,
            description: `Level ${unit.level}`,
        })),
    ];

    const roleOptions = [
        { value: 'participant', label: 'Peserta', color: 'bg-blue-100 text-blue-800' },
        { value: 'moderator', label: 'Moderator', color: 'bg-purple-100 text-purple-800' },
        { value: 'secretary', label: 'Sekretaris', color: 'bg-green-100 text-green-800' },
        { value: 'observer', label: 'Observer', color: 'bg-gray-100 text-gray-800' },
    ];

    // Filter users berdasarkan search dan org unit
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = searchQuery === '' || 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.nip.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesOrgUnit = filterOrgUnit === '' || 
                user.organization_unit_id?.toString() === filterOrgUnit;
            
            return matchesSearch && matchesOrgUnit;
        });
    }, [users, searchQuery, filterOrgUnit]);

    const handleToggleParticipant = (userId: number, checked: boolean) => {
        if (checked) {
            setSelectedParticipants([...selectedParticipants, { user_id: userId, role: 'participant' }]);
        } else {
            setSelectedParticipants(selectedParticipants.filter(p => p.user_id !== userId));
        }
    };

    const handleSelectAll = () => {
        const newParticipants = filteredUsers.map(user => ({
            user_id: user.id,
            role: 'participant',
        }));
        setSelectedParticipants(newParticipants);
    };

    const handleDeselectAll = () => {
        setSelectedParticipants([]);
    };

    const handleChangeRole = (userId: number, role: string) => {
        setSelectedParticipants(selectedParticipants.map(p => 
            p.user_id === userId ? { ...p, role } : p
        ));
    };

    const isParticipantSelected = (userId: number) => {
        return selectedParticipants.some(p => p.user_id === userId);
    };

    const getParticipantRole = (userId: number) => {
        return selectedParticipants.find(p => p.user_id === userId)?.role || 'participant';
    };

    // Validate time selection
    const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
        if (!data.meeting_date) {
            setData(field, value);
            setTimeError('');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (data.meeting_date === today) {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            if (value < currentTime) {
                setTimeError('Waktu yang dipilih sudah lewat. Silakan pilih waktu yang lebih dari sekarang.');
                return;
            }
        }

        // Validate end_time must be after start_time
        if (field === 'end_time' && data.start_time && value <= data.start_time) {
            setTimeError('Waktu selesai harus lebih dari waktu mulai.');
            return;
        }

        if (field === 'start_time' && data.end_time && value >= data.end_time) {
            setTimeError('Waktu mulai harus lebih kecil dari waktu selesai.');
            return;
        }

        setTimeError('');
        setData(field, value);
    };

    // Check if form has time validation errors
    const hasTimeValidationError = useMemo(() => {
        if (timeError) return true;
        
        if (!data.meeting_date || !data.start_time) return false;
        
        // Only validate time for today's date
        const today = new Date().toISOString().split('T')[0];
        if (data.meeting_date === today) {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            if (data.start_time < currentTime) return true;
            if (data.end_time && data.end_time < currentTime) return true;
        }

        // Always validate end_time must be after start_time
        if (data.start_time && data.end_time && data.end_time <= data.start_time) {
            return true;
        }

        return false;
    }, [timeError, data.meeting_date, data.start_time, data.end_time]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const participantIds = selectedParticipants.map(p => p.user_id);
        const participantRoles = selectedParticipants.reduce((acc, p) => {
            acc[p.user_id] = p.role;
            return acc;
        }, {} as Record<number, string>);

        router.put(`/meeting/meetings/${meeting.id}`, {
            ...data,
            participant_ids: participantIds,
            participant_roles: participantRoles,
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit - ${meeting.title}`} />

            <div className="p-4 max-w-7xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Edit Rapat</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Perbarui informasi rapat - {meeting.meeting_number}
                    </p>
                </div>

                {meeting.status !== 'draft' && meeting.status !== 'cancelled' ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Rapat Tidak Dapat Diedit</AlertTitle>
                        <AlertDescription>
                            Rapat yang sudah dijadwalkan tidak dapat diedit lagi. Hanya rapat dengan status draft atau cancelled yang dapat diedit.
                            {meeting.status === 'scheduled' && (
                                <span className="block mt-2">Jika ingin mengubah jadwal, silakan batalkan rapat terlebih dahulu.</span>
                            )}
                        </AlertDescription>
                        <div className="mt-4">
                            <Button variant="outline" onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}>
                                Kembali ke Detail Rapat
                            </Button>
                        </div>
                    </Alert>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Rapat */}
                    <Card>
                        <CardHeader className="p-6">
                        <CardTitle>Informasi Rapat</CardTitle>
                            <CardDescription>Data dasar mengenai rapat yang akan diadakan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="title">Judul Rapat</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Contoh: Rapat Koordinasi Bulanan"
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="agenda">Agenda</Label>
                                    <Textarea
                                        id="agenda"
                                        value={data.agenda}
                                        onChange={(e) => setData('agenda', e.target.value)}
                                        placeholder="Deskripsi agenda rapat..."
                                        rows={3}
                                        className={errors.agenda ? 'border-red-500' : ''}
                                    />
                                    {errors.agenda && <p className="text-sm text-red-600 mt-1">{errors.agenda}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="meeting_date">Tanggal</Label>
                                    <Input
                                        id="meeting_date"
                                        type="date"
                                        value={data.meeting_date}
                                        onChange={(e) => setData('meeting_date', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={errors.meeting_date ? 'border-red-500' : ''}
                                    />
                                    {errors.meeting_date && <p className="text-sm text-red-600 mt-1">{errors.meeting_date}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="start_time">Waktu Mulai</Label>
                                        <Input
                                            id="start_time"
                                            type="time"
                                            value={data.start_time}
                                            onChange={(e) => handleTimeChange('start_time', e.target.value)}
                                            className={errors.start_time || timeError ? 'border-red-500' : ''}
                                        />
                                        {errors.start_time && <p className="text-sm text-red-600 mt-1">{errors.start_time}</p>}
                                        {minTime && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Waktu minimal untuk hari ini: {minTime}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="end_time">Waktu Selesai</Label>
                                        <Input
                                            id="end_time"
                                            type="time"
                                            value={data.end_time}
                                            onChange={(e) => handleTimeChange('end_time', e.target.value)}
                                            className={errors.end_time || timeError ? 'border-red-500' : ''}
                                        />
                                        {errors.end_time && <p className="text-sm text-red-600 mt-1">{errors.end_time}</p>}
                                        {(data.start_time || minTime) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Waktu minimal: {data.start_time || minTime}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {timeError && (
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-red-600 flex items-center gap-2">
                                            <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                                            {timeError}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="room_id">Ruangan</Label>
                                    <SearchableSelect
                                        options={roomOptions}
                                        value={data.room_id}
                                        onValueChange={(value) => setData('room_id', value)}
                                        placeholder="Pilih ruangan..."
                                    />
                                    {errors.room_id && <p className="text-sm text-red-600 mt-1">{errors.room_id}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="organization_unit_id">Unit Organisasi</Label>
                                    <SearchableSelect
                                        options={organizationOptions}
                                        value={data.organization_unit_id}
                                        onValueChange={(value) => setData('organization_unit_id', value)}
                                        placeholder="Pilih unit organisasi..."
                                    />
                                    {errors.organization_unit_id && <p className="text-sm text-red-600 mt-1">{errors.organization_unit_id}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan tambahan (opsional)..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pemilihan Peserta */}
                    <Card>
                        <CardHeader className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <UsersIcon className="h-5 w-5" />
                                        Pilih Peserta Rapat
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedParticipants.length} peserta dipilih
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAll}
                                    >
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        Pilih Semua
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeselectAll}
                                    >
                                        <XSquare className="h-4 w-4 mr-2" />
                                        Batal Semua
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filter */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nama atau NIP..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <SearchableSelect
                                        options={[
                                            { value: '', label: 'Semua Unit' },
                                            ...organizationUnits.map(unit => ({
                                                value: unit.id.toString(),
                                                label: unit.name,
                                            })),
                                        ]}
                                        value={filterOrgUnit}
                                        onValueChange={setFilterOrgUnit}
                                        placeholder="Filter unit..."
                                    />
                                </div>
                            </div>

                            {/* User List */}
                            <div className="border rounded-lg">
                                <div className="max-h-96 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Tidak ada user ditemukan
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {filteredUsers.map((user) => {
                                                const isSelected = isParticipantSelected(user.id);
                                                const role = getParticipantRole(user.id);
                                                
                                                return (
                                                    <div
                                                        key={user.id}
                                                        className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors ${
                                                            isSelected ? 'bg-muted/30' : ''
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleToggleParticipant(user.id, checked as boolean)}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm md:text-base truncate">{user.name}</p>
                                                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                                                                {user.nip} • {user.organization_unit?.name || 'Tanpa Unit'}
                                                            </p>
                                                            {isSelected && (
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {roleOptions.map(roleOption => (
                                                                        <Button
                                                                            key={roleOption.value}
                                                                            type="button"
                                                                            size="sm"
                                                                            variant={role === roleOption.value ? 'default' : 'outline'}
                                                                            onClick={() => handleChangeRole(user.id, roleOption.value)}
                                                                            className="h-7 text-xs touch-manipulation"
                                                                        >
                                                                            {roleOption.label}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {errors.participant_ids && <p className="text-sm text-red-600 mt-1">{errors.participant_ids}</p>}
                        </CardContent>
                    </Card>

                    {/* Status Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                <Calendar className="h-5 w-5" />
                                Status Rapat
                            </CardTitle>
                            <CardDescription>
                                {meeting.status === 'cancelled' 
                                    ? 'Pilih status untuk penjadwalan ulang rapat yang dibatalkan'
                                    : 'Pilih apakah rapat ini masih draft atau langsung dijadwalkan'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {meeting.status === 'cancelled' && (
                                <Alert className="mb-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Penjadwalan Ulang</AlertTitle>
                                    <AlertDescription>
                                        Rapat yang dibatalkan akan dijadwalkan ulang. Status default adalah <strong>Terjadwalkan</strong>. 
                                        Pastikan tanggal dan waktu tidak bentrok dengan rapat lain.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <RadioGroup value={data.status} onValueChange={(value: string) => setData('status', value)}>
                                <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/50"
                                    onClick={() => setData('status', 'draft')}>
                                    <RadioGroupItem value="draft" id="status-draft" />
                                    <div className="space-y-1 leading-none flex-1">
                                        <Label htmlFor="status-draft" className="text-base font-medium cursor-pointer">
                                            Draft
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Simpan sebagai draft. Rapat dapat diedit dan jadwal boleh bentrok dengan rapat lain.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/50"
                                    onClick={() => setData('status', 'scheduled')}>
                                    <RadioGroupItem value="scheduled" id="status-scheduled" />
                                    <div className="space-y-1 leading-none flex-1">
                                        <Label htmlFor="status-scheduled" className="text-base font-medium cursor-pointer">
                                            Jadwalkan
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Jadwalkan rapat. Rapat tidak dapat diedit lagi dan jadwal tidak boleh bentrok dengan rapat lain yang sudah dijadwalkan.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                            {errors.status && <p className="text-sm text-red-600 mt-2">{errors.status}</p>}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)}
                            disabled={processing}
                            className="w-full sm:w-auto"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || hasTimeValidationError} 
                            className="w-full sm:w-auto"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Update Rapat
                                </>
                            )}
                        </Button>
                    </div>
                </form>
                )}
            </div>
        </AppLayout>
    );
}
