import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormPage } from '@/components/ui/form-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, Mail, User } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
}

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    sender: string;
    subject: string;
    received_date: string;
}

interface ParentDisposition {
    id: number;
    from_user_name: string;
    to_user_name: string;
    instruction: string;
    priority: 'normal' | 'high' | 'urgent';
}

interface Props {
    incoming_letter?: IncomingLetter;
    parent_disposition?: ParentDisposition;
    users: User[];
}

export default function Create({ incoming_letter, parent_disposition, users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        incoming_letter_id: incoming_letter?.id || null,
        parent_disposition_id: parent_disposition?.id || null,
        to_user_id: 0,
        instruction: '',
        priority: 'normal' as 'normal' | 'high' | 'urgent',
        deadline: '',
        notes: '',
    });
    
    // Debug: Log the incoming data
    console.log('Props incoming_letter:', incoming_letter);
    console.log('Form data:', data);

    // Prepare options for SearchableSelect
    const userOptions: SearchableSelectOption[] = users.map((user) => ({
        value: user.id.toString(),
        label: user.name,
        description: user.email,
    }));

    const priorityOptions: SearchableSelectOption[] = [
        { value: 'normal', label: 'Biasa' },
        { value: 'high', label: 'Penting' },
        { value: 'urgent', label: 'Segera' },
    ];

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Validate that incoming_letter_id exists
        if (!data.incoming_letter_id) {
            toast.error('ID surat masuk tidak valid');
            return;
        }
        
        // Create form data
        const submitData: any = {
            incoming_letter_id: data.incoming_letter_id,
            to_user_id: data.to_user_id,
            instruction: data.instruction,
            priority: data.priority,
            notes: data.notes || '',
        };
        
        // Only add these if they have valid values
        if (data.parent_disposition_id) {
            submitData.parent_disposition_id = data.parent_disposition_id;
        }
        if (data.deadline) {
            submitData.deadline = data.deadline;
        }
        
        router.post(route('arsip.dispositions.store'), submitData, {
            onError: () => toast.error('Gagal membuat disposisi'),
        });
    };

    const backUrl = parent_disposition
        ? route('arsip.dispositions.show', parent_disposition.id)
        : incoming_letter
        ? `/arsip/incoming-letters/${incoming_letter.id}`
        : '/arsip/incoming-letters';

    return (
        <AppLayout>
            <Head title="Buat Disposisi Baru" />

            <FormPage
                title="Buat Disposisi Baru"
                description={parent_disposition ? 'Sub-disposisi' : 'Disposisi surat masuk'}
                backUrl={backUrl}
                onSubmit={handleSubmit}
                submitLabel="Buat Disposisi"
                isLoading={processing}
            >
                {/* Surat Info */}
                {incoming_letter && (
                    <Card>
                        <CardHeader className="p-6">
                        <CardTitle>Informasi Surat</CardTitle>
                            <CardDescription>Surat yang akan didisposisikan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Nomor Surat</p>
                                        <p className="text-sm text-muted-foreground">
                                            {incoming_letter.incoming_number}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Tanggal Diterima</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(incoming_letter.received_date), 'dd MMMM yyyy', {
                                                locale: idLocale,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium mb-1">Pengirim</p>
                                <p className="text-sm text-muted-foreground">{incoming_letter.sender}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1">Perihal</p>
                                <p className="text-sm text-muted-foreground">{incoming_letter.subject}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Parent Disposition Info */}
                {parent_disposition && (
                    <Card className="border-orange-200 bg-orange-50/50">
                        <CardHeader className='pt-4'>
                            <CardTitle className="text-orange-900">Disposisi Induk</CardTitle>
                            <CardDescription>Disposisi yang akan didelegasikan lebih lanjut</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-900">Dari</p>
                                        <p className="text-sm text-orange-700">{parent_disposition.from_user_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-900">Kepada</p>
                                        <p className="text-sm text-orange-700">{parent_disposition.to_user_name}</p>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium mb-1 text-orange-900">Instruksi Sebelumnya</p>
                                <p className="text-sm text-orange-700 whitespace-pre-wrap">
                                    {parent_disposition.instruction}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Disposisi Form */}
                <Card>
                    <CardHeader className="p-6">
                        <CardTitle>Detail Disposisi</CardTitle>
                        <CardDescription>Instruksi dan penerima disposisi</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="to_user_id">
                                Disposisi Kepada <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSelect
                                options={userOptions}
                                value={data.to_user_id.toString()}
                                onValueChange={(value) => setData('to_user_id', parseInt(value))}
                                placeholder="Pilih penerima disposisi"
                                searchPlaceholder="Cari user..."
                            />
                            {errors.to_user_id && <p className="text-sm text-destructive">{errors.to_user_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instruction">
                                Instruksi <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="instruction"
                                value={data.instruction}
                                onChange={(e) => setData('instruction', e.target.value)}
                                placeholder="Tulis instruksi disposisi..."
                                rows={5}
                                required
                            />
                            {errors.instruction && <p className="text-sm text-destructive">{errors.instruction}</p>}
                            <p className="text-sm text-muted-foreground">
                                Jelaskan dengan jelas tindakan yang diharapkan dari penerima disposisi
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority">
                                    Prioritas <span className="text-destructive">*</span>
                                </Label>
                                <SearchableSelect
                                    options={priorityOptions}
                                    value={data.priority}
                                    onValueChange={(value) => setData('priority', value as any)}
                                    placeholder="Pilih prioritas"
                                    searchPlaceholder="Cari prioritas..."
                                />
                                {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Batas Waktu (Opsional)</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={data.deadline}
                                    onChange={(e) => setData('deadline', e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                />
                                {errors.deadline && <p className="text-sm text-destructive">{errors.deadline}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan Internal (Opsional)</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan untuk referensi internal..."
                                rows={3}
                            />
                            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                        </div>
                    </CardContent>
                </Card>
            </FormPage>
        </AppLayout>
    );
}
