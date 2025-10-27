import { MetricCard } from '@/components/monitoring/metric-card';
import { ProgressBar } from '@/components/monitoring/progress-bar';
import { SimpleLineChart } from '@/components/monitoring/simple-line-chart';
import { SystemStatus } from '@/components/monitoring/system-status';
import { useMonitoring } from '@/hooks/use-monitoring';
import { cn } from '@/lib/utils';
import { Activity, Database, HardDrive, Loader2, MemoryStick, RefreshCw, Server, Wifi } from 'lucide-react';

interface MonitoringDashboardProps {
    className?: string;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
    const { data, loading, error, lastUpdated, refresh } = useMonitoring();

    if (loading && !data) {
        return (
            <div className={cn('flex h-96 items-center justify-center', className)}>
                <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
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
                    <p className="text-red-600 dark:text-red-400 mb-2">Error loading monitoring data</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const getCpuStatus = (usage: number) => {
        if (usage >= 90) return 'critical';
        if (usage >= 75) return 'warning';
        return 'normal';
    };

    const getMemoryStatus = (percentage: number) => {
        if (percentage >= 90) return 'critical';
        if (percentage >= 80) return 'warning';
        return 'normal';
    };

    const getDiskStatus = (percentage: number) => {
        if (percentage >= 95) return 'critical';
        if (percentage >= 85) return 'warning';
        return 'normal';
    };

    const memoryPercentage = (data.system.memory.used / data.system.memory.total) * 100;
    const diskPercentage = (data.system.disk.used / data.system.disk.total) * 100;

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        System Monitoring
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Real-time system performance and health monitoring
                    </p>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                    {lastUpdated && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* System Overview Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="CPU Usage"
                    value={data.system.cpu.usage.toFixed(1)}
                    unit="%"
                    icon={Activity}
                    status={getCpuStatus(data.system.cpu.usage)}
                    description={`${data.system.cpu.cores} cores • ${data.system.cpu.temperature}°C`}
                />
                
                <MetricCard
                    title="Memory Usage"
                    value={data.system.memory.used.toFixed(1)}
                    unit="GB"
                    icon={MemoryStick}
                    status={getMemoryStatus(memoryPercentage)}
                    description={`${data.system.memory.total}GB total • ${memoryPercentage.toFixed(1)}% used`}
                />
                
                <MetricCard
                    title="Disk Usage"
                    value={data.system.disk.used}
                    unit="GB"
                    icon={HardDrive}
                    status={getDiskStatus(diskPercentage)}
                    description={`${data.system.disk.total}GB total • ${diskPercentage.toFixed(1)}% used`}
                />
                
                <MetricCard
                    title="Network"
                    value={data.system.network.download.toFixed(1)}
                    unit="Mbps"
                    icon={Wifi}
                    status="normal"
                    description={`↓${data.system.network.download.toFixed(1)} ↑${data.system.network.upload.toFixed(1)} Mbps`}
                />
            </div>

            {/* Progress Bars for Resource Usage */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">CPU Usage</h3>
                    <ProgressBar
                        value={data.system.cpu.usage}
                        label="Current Usage"
                        size="lg"
                    />
                </div>
                
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Memory Usage</h3>
                    <ProgressBar
                        value={memoryPercentage}
                        label={`${data.system.memory.used.toFixed(1)}GB / ${data.system.memory.total}GB`}
                        size="lg"
                    />
                </div>
                
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Disk Usage</h3>
                    <ProgressBar
                        value={diskPercentage}
                        label={`${data.system.disk.used}GB / ${data.system.disk.total}GB`}
                        size="lg"
                    />
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <SimpleLineChart
                        data={data.metrics.cpu}
                        title="CPU Usage Over Time"
                        color="#6366f1"
                        height={250}
                    />
                </div>
                
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <SimpleLineChart
                        data={data.metrics.memory}
                        title="Memory Usage Over Time"
                        color="#8b5cf6"
                        height={250}
                    />
                </div>
            </div>

            {/* System Status and Uptime */}
            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <SystemStatus services={data.services} />
                    </div>
                </div>
                
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center space-x-3 mb-4">
                        <Server className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            System Uptime
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Days</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {data.uptime.days}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Hours</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {data.uptime.hours}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Minutes</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {data.uptime.minutes}
                            </span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                System Running Smoothly
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}