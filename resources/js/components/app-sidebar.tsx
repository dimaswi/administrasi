import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import {
    Home,
    Calendar,
    Archive,
    MailIcon,
    FileText,
    FileSignature,
    FolderArchive,
} from 'lucide-react';

export function AppSidebar() {
    const { hasPermission } = usePermission();

    const arsipChildren: NavItem[] = [
        hasPermission('incoming_letter.view') && {
            title: 'Surat Masuk',
            href: '/arsip/incoming-letters',
            icon: MailIcon,
        },
        hasPermission('outgoing_letter.view') && {
            title: 'Surat Keluar',
            href: '/arsip/outgoing-letters',
            icon: FileText,
        },
        hasPermission('document_template.view') && {
            title: 'Template Surat',
            href: '/arsip/document-templates',
            icon: FileSignature,
        },
        hasPermission('disposition.view') && {
            title: 'Disposisi Saya',
            href: '/arsip/dispositions',
            icon: FileSignature,
        },
        hasPermission('archive.view') && {
            title: 'Arsip Dokumen',
            href: '/arsip/archives',
            icon: Archive,
        },
    ].filter(Boolean) as NavItem[];

    const navItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: Home,
        },
        {
            title: 'Rapat',
            href: '/meeting/meetings',
            icon: Calendar,
        },
        ...(arsipChildren.length > 0
            ? [{
                title: 'Arsip',
                href: '/arsip',
                icon: FolderArchive,
                children: arsipChildren,
            }]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <WorkspaceSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
