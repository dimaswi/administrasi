import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MinimalMetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    change?: {
        value: number;
        label: string;
    };
    className?: string;
}

export function MinimalMetricCard({
    title,
    value,
    unit,
    icon: Icon,
    change,
    className,
}: MinimalMetricCardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800',
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                            <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                    </div>
                    
                    <div className="flex items-baseline space-x-2 mb-2">
                        <p className="text-3xl font-light text-slate-900 dark:text-slate-100">
                            {value}
                        </p>
                        {unit && (
                            <span className="text-lg text-slate-500 dark:text-slate-400">{unit}</span>
                        )}
                    </div>
                    
                    {change && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className={cn(
                                'font-medium',
                                change.value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            )}>
                                {change.value > 0 ? '+' : ''}{change.value}%
                            </span>
                            {' '}{change.label}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}