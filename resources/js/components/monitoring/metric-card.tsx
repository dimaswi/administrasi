import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    status?: 'normal' | 'warning' | 'critical';
    description?: string;
}

export function MetricCard({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    className,
    status = 'normal',
    description,
}: MetricCardProps) {
    const statusColors = {
        normal: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
        warning: 'border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/30',
        critical: 'border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/30',
    };

    const iconColors = {
        normal: 'text-slate-600 dark:text-slate-400',
        warning: 'text-amber-600 dark:text-amber-400',
        critical: 'text-rose-600 dark:text-rose-400',
    };

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg border p-6 transition-all hover:shadow-md',
                statusColors[status],
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                    <div
                        className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl',
                            status === 'normal' && 'bg-slate-100 dark:bg-slate-800',
                            status === 'warning' && 'bg-amber-100 dark:bg-amber-900/50',
                            status === 'critical' && 'bg-rose-100 dark:bg-rose-900/50'
                        )}
                    >
                        <Icon className={cn('h-6 w-6', iconColors[status])} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{title}</p>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {value}
                            </p>
                            {unit && (
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
                            )}
                        </div>
                        {description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{description}</p>
                        )}
                    </div>
                </div>

                {trend && (
                    <div className="flex items-center space-x-1">
                        {trend.isPositive ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                        )}
                        <span
                            className={cn(
                                'text-sm font-medium',
                                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            )}
                        >
                            {Math.abs(trend.value)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Status indicator */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 h-1 w-full',
                    status === 'normal' && 'bg-emerald-500',
                    status === 'warning' && 'bg-amber-500',
                    status === 'critical' && 'bg-rose-500'
                )}
            />
        </div>
    );
}