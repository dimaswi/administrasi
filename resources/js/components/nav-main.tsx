import { 
    SidebarGroup, 
    SidebarGroupLabel, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem, type NavItemWithSub } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [], label = "Platform" }: { items: NavItem[]; label?: string }) {
    const page = usePage();
    
    const isItemActive = (href: string) => {
        // For dashboard/root paths, only match exactly
        if (href === '/hr' || href === '/') {
            return page.url === href;
        }
        // For other paths, match prefix
        return page.url.startsWith(href);
    };
    
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="px-2 mb-2">{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isItemActive(item.href)} tooltip={{ children: item.title }}>
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function NavMainWithSub({ item }: { item: NavItemWithSub }) {
    const page = usePage();
    const isActive = item.items.some(subItem => page.url.startsWith(subItem.href));
    
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={{ children: item.title }} isActive={isActive}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {item.items.map((subItem) => (
                                    <SidebarMenuSubItem key={subItem.href}>
                                        <SidebarMenuSubButton asChild isActive={page.url === subItem.href}>
                                            <Link href={subItem.href} prefetch>
                                                <span>{subItem.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}
