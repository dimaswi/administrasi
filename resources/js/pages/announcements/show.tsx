import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Users, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Announcement {
    id: number;
    title: string;
    message: string;
    type: 'general' | 'urgent' | 'info';
    creator: {
        id: number;
        name: string;
    };
    sent_at: string | null;
    recipients_count: number;
    created_at: string;
    recipients: Array<{
        id: number;
        user: {
            id: number;
            name: string;
        };
        is_read: boolean;
        read_at: string | null;
    }>;
}

interface Props {
    announcement: Announcement;
}

const typeLabels = {
    general: 'Umum',
    urgent: 'Penting',
    info: 'Informasi',
};

const typeColors = {
    general: 'default',
    urgent: 'destructive',
    info: 'secondary',
} as const;

export default function Show({ announcement }: Props) {
    const readCount = announcement.recipients.filter((r) => r.is_read).length;
    const readPercentage = announcement.recipients.length > 0
        ? Math.round((readCount / announcement.recipients.length) * 100)
        : 0;

    return (
        <HRLayout>
            <Head title={`Pengumuman: ${announcement.title}`} />

            <div className="space-y-6 pt-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.announcements.index')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <div>
                    <HeadingSmall
                        title={announcement.title}
                        description="Detail informasi pengumuman"
                    />
                    <div className="flex items-center gap-3 mt-2">
                        <Badge variant={typeColors[announcement.type]}>
                            {typeLabels[announcement.type]}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {announcement.creator.name}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(announcement.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                        </span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Pesan Pengumuman</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {announcement.message}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Statistik</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Total Penerima
                                    </span>
                                    <span className="font-semibold">{announcement.recipients.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Sudah Dibaca
                                    </span>
                                    <span className="font-semibold">{readCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Belum Dibaca
                                    </span>
                                    <span className="font-semibold">{announcement.recipients.length - readCount}</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Progress</span>
                                        <span className="text-sm font-semibold">{readPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all"
                                            style={{ width: `${readPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {announcement.sent_at && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Waktu Pengiriman</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">
                                        {format(new Date(announcement.sent_at), 'dd MMMM yyyy', { locale: id })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(announcement.sent_at), 'HH:mm', { locale: id })} WIB
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ({formatDistanceToNow(new Date(announcement.sent_at), { addSuffix: true, locale: id })})
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}
