import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface StatusIndicatorProps {
    status: 'online' | 'offline' | 'warning' | 'maintenance';
    label: string;
    description?: string;
    lastChecked?: string;
    className?: string;
}

export function StatusIndicator({
    status,
    label,
    description,
    lastChecked,
    className,
}: StatusIndicatorProps) {
    const statusConfig = {
        online: {
            icon: CheckCircle,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
            borderColor: 'border-emerald-200 dark:border-emerald-800/50',
            dotColor: 'bg-emerald-500',
        },
        offline: {
            icon: XCircle,
            color: 'text-rose-500',
            bgColor: 'bg-rose-50 dark:bg-rose-950/30',
            borderColor: 'border-rose-200 dark:border-rose-800/50',
            dotColor: 'bg-rose-500',
        },
        warning: {
            icon: AlertCircle,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50 dark:bg-amber-950/30',
            borderColor: 'border-amber-200 dark:border-amber-800/50',
            dotColor: 'bg-amber-500',
        },
        maintenance: {
            icon: Clock,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            borderColor: 'border-blue-200 dark:border-blue-800/50',
            dotColor: 'bg-blue-500',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                'flex items-center justify-between rounded-lg border p-4',
                config.bgColor,
                config.borderColor,
                className
            )}
        >
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <Icon className={cn('h-5 w-5', config.color)} />
                    <div
                        className={cn(
                            'absolute -bottom-1 -right-1 h-2 w-2 rounded-full',
                            config.dotColor,
                            status === 'online' && 'animate-pulse'
                        )}
                    />
                </div>
                <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">{label}</h4>
                    {description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
                    )}
                </div>
            </div>
            
            {lastChecked && (
                <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last checked
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {lastChecked}
                    </p>
                </div>
            )}
        </div>
    );
}

interface SystemStatusProps {
    services: Array<{
        name: string;
        status: 'online' | 'offline' | 'warning' | 'maintenance';
        description?: string;
        lastChecked?: string;
    }>;
    className?: string;
}

export function SystemStatus({ services, className }: SystemStatusProps) {
    const overallStatus = services.some(s => s.status === 'offline') 
        ? 'offline' 
        : services.some(s => s.status === 'warning') 
        ? 'warning' 
        : services.some(s => s.status === 'maintenance')
        ? 'maintenance'
        : 'online';

    const statusLabels = {
        online: 'All Systems Operational',
        offline: 'System Issues Detected',
        warning: 'Minor Issues',
        maintenance: 'Maintenance Mode',
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    System Status
                </h3>
                <span
                    className={cn(
                        'rounded-full px-3 py-1 text-sm font-medium',
                        overallStatus === 'online' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
                        overallStatus === 'offline' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
                        overallStatus === 'warning' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
                        overallStatus === 'maintenance' && 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
                    )}
                >
                    {statusLabels[overallStatus]}
                </span>
            </div>
            
            <div className="space-y-3">
                {services.map((service, index) => (
                    <StatusIndicator
                        key={index}
                        status={service.status}
                        label={service.name}
                        description={service.description}
                        lastChecked={service.lastChecked}
                    />
                ))}
            </div>
        </div>
    );
}