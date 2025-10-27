import { cn } from '@/lib/utils';

interface DataPoint {
    time: string;
    value: number;
}

interface SimpleLineChartProps {
    data: DataPoint[];
    title?: string;
    height?: number;
    color?: string;
    showGrid?: boolean;
    className?: string;
}

export function SimpleLineChart({
    data,
    title,
    height = 200,
    color = '#10b981',
    showGrid = true,
    className,
}: SimpleLineChartProps) {
    if (!data.length) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950',
                    className
                )}
                style={{ height }}
            >
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No data available</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    
    const padding = 30;
    const chartWidth = 100 - (padding * 2 / 100) * 100;
    const chartHeight = height - padding * 2;

    // Create SVG path
    const pathData = data
        .map((point, index) => {
            const x = (index / (data.length - 1)) * chartWidth + padding;
            const y = height - ((point.value - minValue) / range) * chartHeight - padding;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    return (
        <div className={cn('w-full', className)}>
            {title && (
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                </h3>
            )}
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <svg
                    width="100%"
                    height={height}
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="block"
                >
                    {/* Grid lines */}
                    {showGrid && (
                        <g className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5">
                            {[0, 25, 50, 75, 100].map(y => (
                                <line
                                    key={y}
                                    x1={padding}
                                    y1={(y / 100) * height}
                                    x2={100 - padding}
                                    y2={(y / 100) * height}
                                />
                            ))}
                            {[0, 25, 50, 75, 100].map(x => (
                                <line
                                    key={x}
                                    x1={(x / 100) * 100}
                                    y1={padding}
                                    x2={(x / 100) * 100}
                                    y2={height - padding}
                                />
                            ))}
                        </g>
                    )}
                    
                    {/* Chart line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        className="drop-shadow-sm"
                    />
                    
                    {/* Area fill */}
                    <path
                        d={`${pathData} L ${chartWidth + padding} ${height - padding} L ${padding} ${height - padding} Z`}
                        fill={color}
                        fillOpacity="0.1"
                    />
                    
                    {/* Data points */}
                    {data.map((point, index) => {
                        const x = (index / (data.length - 1)) * chartWidth + padding;
                        const y = height - ((point.value - minValue) / range) * chartHeight - padding;
                        
                        return (
                            <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="2"
                                fill={color}
                                className="drop-shadow-sm"
                            />
                        );
                    })}
                </svg>
                
                {/* Value labels */}
                <div className="absolute inset-0 flex items-end justify-between p-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{data[0]?.time}</span>
                    <span>{data[data.length - 1]?.time}</span>
                </div>
            </div>
        </div>
    );
}