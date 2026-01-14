import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { HRSidebar } from '@/components/hr-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function HRSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <HRSidebar />
            <AppContent variant="sidebar" className="overflow-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 min-h-0 p-4 overflow-hidden">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
