import HRLayoutTemplate from '@/layouts/app/hr-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { useFlashMessages } from '@/hooks/useFlashMessages';

interface HRLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: HRLayoutProps) => {
    useFlashMessages();
    
    return (
        <HRLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </HRLayoutTemplate>
    );
};
