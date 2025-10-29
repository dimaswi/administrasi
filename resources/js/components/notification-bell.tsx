import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Bell, 
    Check, 
    CheckCheck, 
    Trash2, 
    X,
    Calendar,
    CheckCircle2,
    Clock,
    Users,
    FileText,
    AlertCircle,
    ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';

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

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/notifications?api=1&limit=10');
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Poll every 30 seconds for new notifications
        const interval = setInterval(() => {
            fetchUnreadCount();
            if (isOpen) {
                fetchNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Prevent body scroll when dropdown is open on mobile
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    // Mark as read
    const handleMarkAsRead = async (notification: Notification, e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (notification.is_read) return;

        try {
            await axios.post(`/notifications/${notification.id}/mark-as-read`);
            
            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
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
            setUnreadCount(0);
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

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        handleMarkAsRead(notification);

        // Navigate if action_url exists
        if (notification.action_url) {
            setIsOpen(false);
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
        const opacity = isRead ? 'muted' : '';
        
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            blue: { 
                bg: isRead ? 'bg-muted' : 'bg-blue-100 dark:bg-blue-950', 
                text: isRead ? 'text-muted-foreground' : 'text-blue-600 dark:text-blue-400', 
                border: 'border-blue-200' 
            },
            green: { 
                bg: isRead ? 'bg-muted' : 'bg-green-100 dark:bg-green-950', 
                text: isRead ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400', 
                border: 'border-green-200' 
            },
            red: { 
                bg: isRead ? 'bg-muted' : 'bg-red-100 dark:bg-red-950', 
                text: isRead ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400', 
                border: 'border-red-200' 
            },
            yellow: { 
                bg: isRead ? 'bg-muted' : 'bg-yellow-100 dark:bg-yellow-950', 
                text: isRead ? 'text-muted-foreground' : 'text-yellow-600 dark:text-yellow-400', 
                border: 'border-yellow-200' 
            },
            purple: { 
                bg: isRead ? 'bg-muted' : 'bg-purple-100 dark:bg-purple-950', 
                text: isRead ? 'text-muted-foreground' : 'text-purple-600 dark:text-purple-400', 
                border: 'border-purple-200' 
            },
        };

        return colors[color] || colors.blue;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        fetchNotifications();
                    }
                }}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        variant="destructive"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
                    
                    <div className="fixed inset-0 sm:absolute sm:inset-auto sm:right-0 sm:top-full mt-0 sm:mt-2 w-full sm:w-96 max-w-full sm:max-w-md bg-background border sm:rounded-lg shadow-lg z-50 flex flex-col sm:max-h-[32rem]">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-background border-b p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-base sm:text-lg">Notifikasi</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua telah dibaca'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    {unreadCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs h-8 px-2 sm:px-3"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5 sm:mr-1" />
                                            <span className="hidden sm:inline">Tandai Semua</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">{notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground px-4">
                                <Bell className="h-12 w-12 sm:h-16 sm:w-16 mb-3 opacity-30" />
                                <p className="text-sm sm:text-base font-medium">Tidak ada notifikasi</p>
                                <p className="text-xs text-muted-foreground mt-1">Notifikasi Anda akan muncul di sini</p>
                            </div>
                        ) : (
                            <div className="divide-y">{notifications.map((notification) => {
                                    const colorClasses = getColorClasses(notification.color, notification.is_read);
                                    
                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-3 sm:p-4 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors relative group",
                                                !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            {/* Unread indicator */}
                                            {!notification.is_read && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 sm:h-16 bg-blue-500 rounded-r" />
                                            )}

                                            <div className="flex items-start gap-2.5 sm:gap-3">
                                                {/* Icon */}
                                                <div className={cn(
                                                    "flex-shrink-0 p-1.5 sm:p-2 rounded-full transition-colors",
                                                    notification.is_read ? 'bg-muted' : colorClasses.bg
                                                )}>
                                                    <div className={cn(
                                                        "transition-colors",
                                                        notification.is_read ? 'text-muted-foreground' : colorClasses.text
                                                    )}>
                                                        {getIcon(notification)}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={cn(
                                                            "text-sm sm:text-base font-medium leading-tight pr-2",
                                                            notification.is_read && "text-muted-foreground"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                        
                                                        {/* Delete button - visible on hover on desktop, always on mobile */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 sm:h-6 sm:w-6 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-2 top-2 sm:relative sm:right-auto sm:top-auto"
                                                            onClick={(e) => handleDelete(notification.id, e)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                                        </Button>
                                                    </div>
                                                    
                                                    <p className={cn(
                                                        "text-xs sm:text-sm mt-1 line-clamp-2",
                                                        notification.is_read ? "text-muted-foreground" : "text-foreground"
                                                    )}>
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center justify-between mt-2 gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(notification.created_at), { 
                                                                addSuffix: true,
                                                                locale: id 
                                                            })}
                                                        </span>

                                                        {!notification.is_read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs px-2 sm:px-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => handleMarkAsRead(notification, e)}
                                                            >
                                                                <Check className="h-3 w-3 sm:mr-1" />
                                                                <span className="hidden sm:inline">Tandai dibaca</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        </div>

                        {/* Footer - Optional "View All" button */}
                        {notifications.length > 0 && (
                            <div className="flex-shrink-0 p-2 sm:p-3 border-t bg-muted/30 backdrop-blur-sm">
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs sm:text-sm h-9"
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.visit('/notifications');
                                    }}
                                >
                                    Lihat Semua Notifikasi
                                    <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
