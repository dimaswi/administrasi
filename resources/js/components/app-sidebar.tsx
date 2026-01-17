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
<<<<<<< HEAD
    },
    {
        title: 'Arsip Dokumen',
        href: '/arsip/archives',
        icon: Archive,
        permission: 'archive.view',
=======
    },
    {
        title: 'Arsip Dokumen',
        href: '/arsip/archives',
        icon: Archive,
        permission: 'archive.view',
    },
];

const settingsNavItems: NavItem[] = [
    {
        title: 'Daftar User',
        href: '/master/users',
        icon: Users,
        permission: 'user.view',
    },
    {
        title: 'Daftar Role',
        href: '/master/roles',
        icon: Shield,
        permission: 'role.view',
    },
    {
        title: 'Daftar Permission',
        href: '/master/permissions',
        icon: Key,
        permission: 'permission.view',
    },
    {
        title: 'Daftar Ruangan',
        href: '/master/rooms',
        icon: LayoutGrid,
        permission: 'room.view',
    },
    {
        title: 'Unit Organisasi',
        href: '/master/organizations',
        icon: BookOpen,
        permission: 'organization.view',
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
    },
];

export function AppSidebar() {
    const { hasPermission } = usePermission();

    // Filter navigation items based on permissions
    const filteredArsipItems = arsipNavItems.filter(item => 
        !item.permission || hasPermission(item.permission)
    );

<<<<<<< HEAD
=======
    const filteredSettingsItems = settingsNavItems.filter(item => 
        !item.permission || hasPermission(item.permission)
    );

>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
<<<<<<< HEAD
=======
                {filteredSettingsItems.length > 0 && (
                    <NavMain items={filteredSettingsItems} label="Pengaturan" />
                )}
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
