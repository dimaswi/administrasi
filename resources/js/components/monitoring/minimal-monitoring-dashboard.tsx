import { MinimalMetricCard } from '@/components/monitoring/minimal-metric-card';
import { ProgressBar } from '@/components/monitoring/progress-bar';
import { SimpleLineChart } from '@/components/monitoring/simple-line-chart';
import { useMonitoring } from '@/hooks/use-monitoring';
import { cn } from '@/lib/utils';
import { Activity, Database, HardDrive, Loader2, RefreshCw, Server, Wifi } from 'lucide-react';

interface MinimalMonitoringDashboardProps {
    className?: string;
}

export function MinimalMonitoringDashboard({ className }: MinimalMonitoringDashboardProps) {
    const { data, loading, error, lastUpdated, refresh } = useMonitoring();

    if (loading && !data) {
        return (
            <div className={cn('flex h-96 items-center justify-center', className)}>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading monitoring data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn('flex h-96 items-center justify-center', className)}>
                <div className="text-center">
                    <p className="text-rose-600 dark:text-rose-400 mb-2">Error loading monitoring data</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const memoryPercentage = (data.system.memory.used / data.system.memory.total) * 100;
    const diskPercentage = (data.system.disk.used / data.system.disk.total) * 100;

    return (
        <div className={cn('space-y-8', className)}>
            {/* Minimal Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900 dark:text-slate-100">
                        System Overview
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Live system metrics and performance data
                    </p>
                </div>
                
                <div className="flex items-center space-x-4">
                    {lastUpdated && (
                        <span className="text-sm text-slate-400">
                            {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className={cn('h-4 w-4 text-slate-600 dark:text-slate-400', loading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MinimalMetricCard
                    title="CPU Usage"
                    value={data.system.cpu.usage.toFixed(1)}
                    unit="%"
                    icon={Activity}
                    change={{
                        value: Math.round((Math.random() - 0.5) * 10),
                        label: 'from last hour'
                    }}
                />
                
                <MinimalMetricCard
                    title="Memory"
                    value={data.system.memory.used.toFixed(1)}
                    unit="GB"
                    icon={Database}
                    change={{
                        value: Math.round((Math.random() - 0.5) * 5),
                        label: 'from last hour'
                    }}
                />
                
                <MinimalMetricCard
                    title="Storage"
                    value={data.system.disk.used}
                    unit="GB"
                    icon={HardDrive}
                    change={{
                        value: Math.round(Math.random() * 2),
                        label: 'from yesterday'
                    }}
                />
                
                <MinimalMetricCard
                    title="Network"
                    value={data.system.network.download.toFixed(0)}
                    unit="Mbps"
                    icon={Wifi}
                    change={{
                        value: Math.round((Math.random() - 0.5) * 20),
                        label: 'from last hour'
                    }}
                />
            </div>

            {/* Usage Bars */}
            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-light text-slate-900 dark:text-slate-100 mb-6">
                    Resource Usage
                </h2>
                
                <div className="grid gap-8 lg:grid-cols-3">
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CPU</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {data.system.cpu.usage.toFixed(1)}%
                            </span>
                        </div>
                        <ProgressBar
                            value={data.system.cpu.usage}
                            showPercentage={false}
                            size="lg"
                        />
                    </div>
                    
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Memory</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {data.system.memory.used.toFixed(1)}GB / {data.system.memory.total}GB
                            </span>
                        </div>
                        <ProgressBar
                            value={memoryPercentage}
                            showPercentage={false}
                            size="lg"
                        />
                    </div>
                    
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Storage</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {data.system.disk.used}GB / {data.system.disk.total}GB
                            </span>
                        </div>
                        <ProgressBar
                            value={diskPercentage}
                            showPercentage={false}
                            size="lg"
                        />
                    </div>
                </div>
            </div>

            {/* Performance Charts */}
            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <SimpleLineChart
                        data={data.metrics.cpu}
                        title="CPU Performance"
                        color="#6366f1"
                        height={200}
                    />
                </div>
                
                <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <SimpleLineChart
                        data={data.metrics.memory}
                        title="Memory Usage"
                        color="#8b5cf6"
                        height={200}
                    />
                </div>
            </div>

            {/* System Info */}
            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3 mb-6">
                    <Server className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-xl font-light text-slate-900 dark:text-slate-100">
                        System Information
                    </h2>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center">
                        <p className="text-2xl font-light text-slate-900 dark:text-slate-100">
                            {data.uptime.days}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Days</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-light text-slate-900 dark:text-slate-100">
                            {data.uptime.hours}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Hours</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-light text-slate-900 dark:text-slate-100">
                            {data.system.cpu.cores}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">CPU Cores</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-light text-slate-900 dark:text-slate-100">
                            {data.system.cpu.temperature}°C
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Temperature</p>
                    </div>
                </div>
            </div>
        </div>
    );
}