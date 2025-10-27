import { cn } from '@/lib/utils';

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    label,
    showPercentage = true,
    size = 'md',
    variant = 'default',
    className,
}: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);
    
    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    };

    const getVariantColor = (percentage: number) => {
        if (variant !== 'default') {
            const colors = {
                success: 'bg-emerald-500',
                warning: 'bg-amber-500',
                danger: 'bg-rose-500',
            };
            return colors[variant];
        }

        // Auto color based on percentage
        if (percentage >= 90) return 'bg-rose-500';
        if (percentage >= 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const getVariantBackground = (percentage: number) => {
        if (variant !== 'default') {
            const colors = {
                success: 'bg-emerald-100 dark:bg-emerald-950/50',
                warning: 'bg-amber-100 dark:bg-amber-950/50',
                danger: 'bg-rose-100 dark:bg-rose-950/50',
            };
            return colors[variant];
        }

        // Auto background based on percentage
        if (percentage >= 90) return 'bg-rose-100 dark:bg-rose-950/50';
        if (percentage >= 75) return 'bg-amber-100 dark:bg-amber-950/50';
        return 'bg-emerald-100 dark:bg-emerald-950/50';
    };

    return (
        <div className={cn('w-full', className)}>
            {(label || showPercentage) && (
                <div className="mb-2 flex items-center justify-between">
                    {label && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {percentage.toFixed(1)}%
                        </span>
                    )}
                </div>
            )}
            <div
                className={cn(
                    'w-full overflow-hidden rounded-full',
                    sizeClasses[size],
                    getVariantBackground(percentage)
                )}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-300 ease-in-out',
                        getVariantColor(percentage)
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}