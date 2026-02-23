import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem, type NavItemWithSub } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';

function isActive(href: string, pageUrl: string) {
    if (!href) return false;
    if (href === '/hr' || href === '/') return pageUrl === href;
    return pageUrl.startsWith(href);
}

function hasActiveDescendant(items: NavItem[], pageUrl: string): boolean {
    return items.some(item => {
        if (isActive(item.href ?? '', pageUrl)) return true;
        if (item.children) return hasActiveDescendant(item.children, pageUrl);
        return false;
    });
}

// Persist collapsible open state in sessionStorage so navigation doesn't reset it
function useCollapsibleState(key: string, initialOpen: boolean) {
    const storageKey = `nav_open_${key}`;
    const [open, setOpen] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') return initialOpen;
        const saved = sessionStorage.getItem(storageKey);
        // If the item has an active child, always open regardless of saved state
        if (initialOpen) return true;
        return saved !== null ? saved === 'true' : initialOpen;
    });

    // If active descendant changes (navigation), force open
    React.useEffect(() => {
        if (initialOpen && !open) {
            setOpen(true);
            sessionStorage.setItem(storageKey, 'true');
        }
    }, [initialOpen]);

    const handleChange = (value: boolean) => {
        setOpen(value);
        sessionStorage.setItem(storageKey, String(value));
    };

    return [open, handleChange] as const;
}

// Leaf node rendered inside tree children list
function NavTreeLeaf({ item, isLast }: { item: NavItem; isLast: boolean }) {
    const { url } = usePage();
    const active = isActive(item.href ?? '', url);

    return (
        <li className="relative flex">
            {/* Vertical line — stops at center of last item */}
            <div className={cn(
                'absolute left-0 w-px bg-sidebar-border/50',
                isLast ? 'top-0 bottom-1/2' : 'top-0 bottom-0',
            )} />
            {/* Horizontal tick */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px bg-sidebar-border/50" />
            {/* Content */}
            <Link
                href={item.href ?? '#'}
                prefetch
                className={cn(
                    'ml-4 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm w-full transition-colors',
                    active
                        ? 'text-foreground font-semibold'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground',
                )}
            >
                <span className={cn(
                    'size-1.5 rounded-full shrink-0',
                    active ? 'bg-foreground' : 'bg-sidebar-foreground/30',
                )} />
                <span className="truncate">{item.title}</span>
            </Link>
        </li>
    );
}

// Nested collapsible inside tree
function NestedBranch({ item, isLast }: { item: NavItem; isLast: boolean }) {
    const { url } = usePage();
    const selfActive = isActive(item.href ?? '', url);
    const childActive = item.children ? hasActiveDescendant(item.children, url) : false;
    const [open, setOpen] = useCollapsibleState(item.href ?? item.title, selfActive || childActive);

    return (
        <li className="relative flex flex-col">
            {/* Vertical line — stops at center of last item */}
            <div className={cn(
                'absolute left-0 w-px bg-sidebar-border/50',
                isLast ? 'top-0 bottom-1/2' : 'top-0 bottom-0',
            )} />
            {/* Horizontal tick */}
            <div className="absolute left-0 top-[14px] w-3 h-px bg-sidebar-border/50" />

            <Collapsible
                open={open}
                onOpenChange={setOpen}
                className="group/nested ml-4 w-[calc(100%-1rem)]"
            >
                <CollapsibleTrigger className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    (selfActive || childActive)
                        ? 'text-foreground font-semibold'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground',
                )}>
                    <span className={cn(
                        'size-1.5 rounded-full shrink-0',
                        (selfActive || childActive) ? 'bg-foreground' : 'bg-sidebar-foreground/30',
                    )} />
                    <span className="truncate flex-1 text-left">{item.title}</span>
                    <ChevronRight className={cn(
                        'size-3 shrink-0 transition-transform duration-200',
                        open && 'rotate-90',
                    )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <ul className="relative ml-3 flex flex-col">
                        {item.children!.map((child, idx) => (
                            <NavTreeLeaf
                                key={child.href ?? child.title}
                                item={child}
                                isLast={idx === item.children!.length - 1}
                            />
                        ))}
                    </ul>
                </CollapsibleContent>
            </Collapsible>
        </li>
    );
}

// Root-level branch (has icon, collapsible children)
function NavTreeBranch({ item }: { item: NavItem }) {
    const { url } = usePage();
    const selfActive = isActive(item.href ?? '', url);
    const childActive = item.children ? hasActiveDescendant(item.children, url) : false;
    const hasChildren = !!(item.children && item.children.length > 0);
    const [open, setOpen] = useCollapsibleState(item.href ?? item.title, selfActive || childActive);

    if (!hasChildren) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={selfActive} tooltip={{ children: item.title }}>
                    <Link href={item.href ?? '#'} prefetch>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <Collapsible
                open={open}
                onOpenChange={setOpen}
                className="group/collapsible w-full"
            >
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={{ children: item.title }}
                        isActive={selfActive || childActive}
                        className="w-full"
                    >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className={cn(
                            'ml-auto size-4 shrink-0 transition-transform duration-200',
                            open && 'rotate-90',
                        )} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <ul className="relative ml-[1.375rem] mt-0.5 mb-1 flex flex-col">
                        {item.children!.map((child, idx) => {
                            const isLast = idx === item.children!.length - 1;
                            return child.children && child.children.length > 0 ? (
                                <NestedBranch key={child.href ?? child.title} item={child} isLast={isLast} />
                            ) : (
                                <NavTreeLeaf key={child.href ?? child.title} item={child} isLast={isLast} />
                            );
                        })}
                    </ul>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
}

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    return (
        <SidebarGroup className="px-2 py-0">
            {label && <SidebarGroupLabel className="px-2 mb-1">{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => (
                    <NavTreeBranch key={item.href ?? item.title} item={item} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

// Legacy compatibility
export function NavMainWithSub({ item }: { item: NavItemWithSub }) {
    const navItem: NavItem = {
        title: item.title,
        href: '',
        icon: item.icon ?? null,
        children: item.items.map((sub) => ({
            title: sub.title,
            href: sub.href,
        })),
    };
    return <NavMain items={[navItem]} />;
}
