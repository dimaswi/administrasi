import { useEffect, useState } from 'react';

export interface MonitoringData {
    system: {
        cpu: {
            usage: number;
            cores: number;
            temperature: number;
        };
        memory: {
            used: number;
            total: number;
            available: number;
        };
        disk: {
            used: number;
            total: number;
            available: number;
        };
        network: {
            upload: number;
            download: number;
        };
    };
    services: Array<{
        name: string;
        status: 'online' | 'offline' | 'warning' | 'maintenance';
        description?: string;
        lastChecked: string;
    }>;
    metrics: {
        cpu: Array<{ time: string; value: number }>;
        memory: Array<{ time: string; value: number }>;
        network: Array<{ time: string; value: number }>;
    };
    uptime: {
        days: number;
        hours: number;
        minutes: number;
    };
}

// Mock data generator
const generateMockData = (): MonitoringData => {
    const now = new Date();
    const generateTimeSeriesData = (baseValue: number, variance: number, points: number = 20) => {
        return Array.from({ length: points }, (_, i) => {
            const time = new Date(now.getTime() - (points - i - 1) * 30000); // 30 seconds apart
            const value = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * variance));
            return {
                time: time.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                }),
                value: Math.round(value * 10) / 10,
            };
        });
    };

    // Generate more realistic data based on the screenshot
    const cpuUsage = 20 + Math.random() * 15; // 20-35% range
    const memoryUsage = 75 + Math.random() * 10; // 75-85% range  
    const diskUsage = 50 + Math.random() * 10; // 50-60% range

    return {
        system: {
            cpu: {
                usage: Math.round(cpuUsage * 10) / 10,
                cores: 8,
                temperature: Math.round((45 + Math.random() * 15) * 10) / 10, // 45-60°C
            },
            memory: {
                used: Math.round(memoryUsage * 16 / 100 * 10) / 10, // GB out of 16GB
                total: 16,
                available: Math.round((100 - memoryUsage) * 16 / 100 * 10) / 10,
            },
            disk: {
                used: Math.round(diskUsage * 1024 / 100), // GB out of 1TB
                total: 1024,
                available: Math.round((100 - diskUsage) * 1024 / 100),
            },
            network: {
                upload: Math.round(Math.random() * 50 * 10) / 10, // 0-50 Mbps
                download: Math.round((100 + Math.random() * 50) * 10) / 10, // 100-150 Mbps
            },
        },
        services: [
            {
                name: 'Web Server',
                status: Math.random() > 0.95 ? 'warning' : 'online',
                description: 'Nginx 1.20.2',
                lastChecked: now.toLocaleTimeString(),
            },
            {
                name: 'Database',
                status: Math.random() > 0.98 ? 'warning' : 'online',
                description: 'MySQL 8.0.35',
                lastChecked: now.toLocaleTimeString(),
            },
            {
                name: 'Cache Server',
                status: Math.random() > 0.92 ? 'maintenance' : 'online',
                description: 'Redis 7.2.0',
                lastChecked: now.toLocaleTimeString(),
            },
            {
                name: 'File Storage',
                status: 'online',
                description: 'Local Storage',
                lastChecked: now.toLocaleTimeString(),
            },
        ],
        metrics: {
            cpu: generateTimeSeriesData(cpuUsage, 15),
            memory: generateTimeSeriesData(memoryUsage, 10),
            network: generateTimeSeriesData(50, 30),
        },
        uptime: {
            days: Math.floor(Math.random() * 30) + 10,
            hours: Math.floor(Math.random() * 24),
            minutes: Math.floor(Math.random() * 60),
        },
    };
};

export function useMonitoring(refreshInterval: number = 30000) {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = async () => {
        try {
            setError(null);
            // In a real app, this would be an API call
            // const response = await fetch('/api/monitoring');
            // const data = await response.json();
            
            // For now, we'll use mock data
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            const mockData = generateMockData();
            
            setData(mockData);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        const interval = setInterval(fetchData, refreshInterval);
        
        return () => clearInterval(interval);
    }, [refreshInterval]);

    const refresh = () => {
        setLoading(true);
        fetchData();
    };

    return {
        data,
        loading,
        error,
        lastUpdated,
        refresh,
    };
}