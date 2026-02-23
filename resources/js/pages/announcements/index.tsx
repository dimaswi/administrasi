import { Head, Link } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus, Calendar, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Announcement {
    id: number;
    title: string;
    message: string;
    type: 'general' | 'urgent' | 'info';
    created_by: number;
    creator: {
        id: number;
        name: string;
    };
    sent_at: string | null;
    recipients_count: number;
    created_at: string;
}

interface Props {
    announcements: {
        data: Announcement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

const typeLabels: Record<string, string> = {
    general: 'Umum',
    urgent: 'Penting',
    info: 'Informasi',
};

const typeVariants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    general: 'default',
    urgent: 'destructive',
    info: 'secondary',
};

export default function Index({ announcements }: Props) {
    const columns = [
        {
            key: 'title',
            label: 'Judul',
            sortable: true,
            render: (announcement: Announcement) => (
                <div>
                    <Link
                        href={route('hr.announcements.show', announcement.id)}
                        className="font-medium text-blue-600 hover:underline"
                    >
                        {announcement.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">{typeLabels[announcement.type]} • {announcement.creator?.name || '-'}</div>
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Tipe',
            sortable: true,
            render: (announcement: Announcement) => (
                <Badge variant={typeVariants[announcement.type]}>
                    {typeLabels[announcement.type]}
                </Badge>
            ),
        },
        {
            key: 'creator',
            label: 'Pengirim',
            render: (announcement: Announcement) => (
                <span className="text-gray-600">{announcement.creator?.name || '-'}</span>
            ),
        },
        {
            key: 'recipients',
            label: 'Penerima',
            render: (announcement: Announcement) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{announcement.recipients_count}</span>
                </div>
            ),
        },
        {
            key: 'sent_at',
            label: 'Waktu Kirim',
            sortable: true,
            render: (announcement: Announcement) => (
                announcement.sent_at ? (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(announcement.sent_at), {
                            addSuffix: true,
                            locale: id,
                        })}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">Belum dikirim</span>
                )
            ),
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            sortable: true,
            render: (announcement: Announcement) => (
                <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(announcement.created_at), {
                        addSuffix: true,
                        locale: id,
                    })}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px]',
            render: (announcement: Announcement) => (
                <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('hr.announcements.show', announcement.id)}>Detail</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HRLayout>
            <Head title="Pengumuman" />

            <IndexPage
                title="Pengumuman"
                description="Broadcast pengumuman ke seluruh pengguna"
                data={announcements.data}
                columns={columns}
                pagination={{
                    current_page: announcements.current_page,
                    last_page: announcements.last_page,
                    per_page: announcements.per_page,
                    total: announcements.total,
                    from: announcements.from,
                    to: announcements.to,
                }}
                actions={[
                    {
                        label: 'Broadcast Pengumuman',
                        href: route('hr.announcements.create'),
                        icon: Plus,
                    },
                ]}
                emptyMessage="Belum ada pengumuman"
                emptyIcon={Megaphone}
            />
        </HRLayout>
    );
}

