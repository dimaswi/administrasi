import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Bell,
    CheckCheck,
    Trash2,
    Calendar,
    CheckCircle2,
    Clock,
    Users,
    FileText,
    AlertCircle,
    Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';
import type { BreadcrumbItem, SharedData } from '@/types';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    icon?: string;
    color: string;
    data?: any;
    action_url?: string;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

interface Props extends SharedData {
    notifications: Notification[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notifikasi', href: '/notifications' },
];

export default function NotificationsPage({ notifications: initialNotifications }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(false);
    const [clearReadDialogOpen, setClearReadDialogOpen] = useState(false);

    // Filter notifications by tab
    const filteredNotifications = notifications.filter(notification => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !notification.is_read;
        if (activeTab === 'read') return notification.is_read;
        return true;
    });

    // Mark as read
    const handleMarkAsRead = async (notification: Notification, e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (notification.is_read) return;

        try {
            await axios.post(`/notifications/${notification.id}/mark-as-read`);
            
            setNotifications(prev => 
                prev.map(n => n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/mark-all-as-read');
            
            setNotifications(prev => 
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            toast.success('Semua notifikasi telah ditandai sebagai dibaca');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Gagal menandai semua notifikasi');
        }
    };

    // Delete notification
    const handleDelete = async (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await axios.delete(`/notifications/${notificationId}`);
            
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            toast.success('Notifikasi dihapus');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Gagal menghapus notifikasi');
        }
    };

    // Clear all read notifications
    const handleClearRead = async () => {
        try {
            await axios.delete('/notifications/clear-read');
            
            setNotifications(prev => prev.filter(n => !n.is_read));
            setClearReadDialogOpen(false);
            toast.success('Notifikasi yang sudah dibaca telah dihapus');
        } catch (error) {
            console.error('Failed to clear read notifications:', error);
            toast.error('Gagal menghapus notifikasi');
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification);

        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    // Get icon component
    const getIcon = (notification: Notification) => {
        const iconName = notification.icon || 'Bell';
        const iconClass = "h-5 w-5";
        
        const icons: Record<string, React.ReactElement> = {
            Calendar: <Calendar className={iconClass} />,
            CheckCircle2: <CheckCircle2 className={iconClass} />,
            Clock: <Clock className={iconClass} />,
            Users: <Users className={iconClass} />,
            FileText: <FileText className={iconClass} />,
            AlertCircle: <AlertCircle className={iconClass} />,
            Bell: <Bell className={iconClass} />,
        };

        return icons[iconName] || icons.Bell;
    };

    // Get color classes
    const getColorClasses = (color: string, isRead: boolean) => {
        const colors: Record<string, { bg: string; text: string }> = {
            blue: { 
                bg: isRead ? 'bg-muted' : 'bg-blue-100 dark:bg-blue-950', 
                text: isRead ? 'text-muted-foreground' : 'text-blue-600 dark:text-blue-400', 
            },
            green: { 
                bg: isRead ? 'bg-muted' : 'bg-green-100 dark:bg-green-950', 
                text: isRead ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400', 
            },
            red: { 
                bg: isRead ? 'bg-muted' : 'bg-red-100 dark:bg-red-950', 
                text: isRead ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400', 
            },
            yellow: { 
                bg: isRead ? 'bg-muted' : 'bg-yellow-100 dark:bg-yellow-950', 
                text: isRead ? 'text-muted-foreground' : 'text-yellow-600 dark:text-yellow-400', 
            },
            purple: { 
                bg: isRead ? 'bg-muted' : 'bg-purple-100 dark:bg-purple-950', 
                text: isRead ? 'text-muted-foreground' : 'text-purple-600 dark:text-purple-400', 
            },
        };

        return colors[color] || colors.blue;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const readCount = notifications.filter(n => n.is_read).length;

    return (
        <AppLayout>
            <Head title="Notifikasi" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifikasi</h1>
                        <p className="text-muted-foreground mt-1">
                            {unreadCount > 0 
                                ? `${unreadCount} notifikasi belum dibaca` 
                                : 'Semua notifikasi telah dibaca'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                            >
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Tandai Semua Dibaca
                            </Button>
                        )}
                        {readCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setClearReadDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus yang Dibaca
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid">
                        <TabsTrigger value="all" className="gap-2">
                            <Inbox className="h-4 w-4" />
                            <span className="hidden sm:inline">Semua</span>
                            <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">Belum Dibaca</span>
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="read" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Dibaca</span>
                            <Badge variant="secondary" className="ml-1">{readCount}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {filteredNotifications.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Bell className="h-16 w-16 mb-4 opacity-30 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-1">Tidak ada notifikasi</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {activeTab === 'unread' && 'Semua notifikasi sudah dibaca'}
                                        {activeTab === 'read' && 'Belum ada notifikasi yang dibaca'}
                                        {activeTab === 'all' && 'Notifikasi Anda akan muncul di sini'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {filteredNotifications.map((notification) => {
                                    const colorClasses = getColorClasses(notification.color, notification.is_read);
                                    
                                    return (
                                        <Card
                                            key={notification.id}
                                            className={cn(
                                                "cursor-pointer transition-all hover:shadow-md group relative overflow-hidden",
                                                !notification.is_read && "border-l-4 border-l-blue-500"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "flex-shrink-0 p-2 sm:p-2.5 rounded-full transition-colors",
                                                        colorClasses.bg
                                                    )}>
                                                        <div className={colorClasses.text}>
                                                            {getIcon(notification)}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h3 className={cn(
                                                                "font-semibold text-sm sm:text-base",
                                                                notification.is_read && "text-muted-foreground"
                                                            )}>
                                                                {notification.title}
                                                            </h3>
                                                            {!notification.is_read && (
                                                                <Badge variant="default" className="ml-2 flex-shrink-0">
                                                                    Baru
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        
                                                        <p className={cn(
                                                            "text-sm mb-2",
                                                            notification.is_read ? "text-muted-foreground" : "text-foreground"
                                                        )}>
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(notification.created_at), { 
                                                                    addSuffix: true,
                                                                    locale: id 
                                                                })}
                                                            </span>

                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!notification.is_read && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => handleMarkAsRead(notification, e)}
                                                                        className="h-8"
                                                                    >
                                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                                        Tandai Dibaca
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => handleDelete(notification.id, e)}
                                                                    className="h-8 text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Clear Read Confirmation Dialog */}
            <Dialog open={clearReadDialogOpen} onOpenChange={setClearReadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Notifikasi yang Dibaca</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus semua notifikasi yang sudah dibaca? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setClearReadDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleClearRead}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
