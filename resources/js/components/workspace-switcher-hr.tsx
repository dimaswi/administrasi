import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Building, Check, ChevronsUpDown, Users } from 'lucide-react';
import AppLogoIcon from './app-logo-icon';

interface Workspace {
    id: string;
    name: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
}

const workspaces: Workspace[] = [
    {
        id: 'administrasi',
        name: 'Administrasi',
        label: 'Administrasi',
        icon: Building,
        href: '/dashboard',
    },
    {
        id: 'hr',
        name: 'Human Resources',
        label: 'Human Resources',
        icon: Users,
        href: '/hr',
    },
];

export function WorkspaceSwitcherHR() {
    const { state } = useSidebar();
    const currentWorkspace = workspaces.find(w => w.id === 'hr') || workspaces[1];
    const isCollapsed = state === 'collapsed';

    const handleWorkspaceChange = (workspace: Workspace) => {
        if (workspace.id !== currentWorkspace.id) {
            window.location.href = workspace.href;
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className={cn(
                                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                "transition-colors"
                            )}
                        >
                            <div className={cn(
                                "flex aspect-square size-8 items-center justify-center rounded-lg",
                                "bg-primary text-primary-foreground"
                            )}>
                                <AppLogoIcon className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{currentWorkspace.name}</span>
                                <span className="truncate text-xs text-muted-foreground">Modul {currentWorkspace.label}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isCollapsed ? "right" : "bottom"}
                        sideOffset={4}
                    >
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Modul Sistem
                        </div>
                        {workspaces.map((workspace) => (
                            <DropdownMenuItem
                                key={workspace.id}
                                onClick={() => handleWorkspaceChange(workspace)}
                                className="cursor-pointer gap-2 p-2"
                            >
                                <div className={cn(
                                    "flex size-8 items-center justify-center rounded-lg border",
                                    workspace.id === currentWorkspace.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background border-border"
                                )}>
                                    <workspace.icon className="size-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{workspace.name}</div>
                                    <div className="text-xs text-muted-foreground">Modul {workspace.label}</div>
                                </div>
                                {workspace.id === currentWorkspace.id && (
                                    <Check className="size-4 text-primary" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
