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
    Users, 
    Shield, 
    Key, 
    LayoutGrid, 
    BookOpen,
} from 'lucide-react';

const mainNavItems: NavItem[] = [
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
];

const arsipNavItems: NavItem[] = [
    {
        title: 'Surat Masuk',
        href: '/arsip/incoming-letters',
        icon: MailIcon,
        permission: 'incoming_letter.view',
    },
    {
        title: 'Surat Keluar',
        href: '/arsip/outgoing-letters',
        icon: FileText,
        permission: 'outgoing_letter.view',
    },
    {
        title: 'Template Surat',
        href: '/arsip/document-templates',
        icon: FileSignature,
        permission: 'document_template.view',
    },
    {
        title: 'Disposisi Saya',
        href: '/arsip/dispositions',
        icon: FileSignature,
        permission: 'disposition.view',
    },
    {
        title: 'Arsip Dokumen',
        href: '/arsip/archives',
        icon: Archive,
        permission: 'archive.view',
    },
];

export function AppSidebar() {
    const { hasPermission } = usePermission();

    // Filter navigation items based on permissions
    const filteredArsipItems = arsipNavItems.filter(item => 
        !item.permission || hasPermission(item.permission)
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <WorkspaceSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Menu" />
                {filteredArsipItems.length > 0 && (
                    <NavMain items={filteredArsipItems} label="Arsip" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
