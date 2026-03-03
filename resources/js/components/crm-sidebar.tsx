import { Link } from '@inertiajs/react';
import {
    Home,
    Building,
    Users,
    TrendingUp,
    FileText,
    Zap,
    Settings,
    LogOut,
    ChevronDown,
    BarChart3,
    Workflow,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarGroup,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const crmNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: Home,
    },
    {
        title: 'Properties',
        href: '/properties',
        icon: Building,
    },
    {
        title: 'Buyers',
        href: '/buyers',
        icon: Users,
    },
    {
        title: 'Agents',
        href: '/agents',
        icon: TrendingUp,
    },
    {
        title: 'Transactions',
        href: '/transactions',
        icon: FileText,
    },
];

const automationNavItems: NavItem[] = [
    {
        title: 'Process Modeler',
        href: '/process-modeler',
        icon: Workflow,
    },
    {
        title: 'Triggers',
        href: '/triggers',
        icon: Zap,
    },
    {
        title: 'Orchestrator',
        href: '/orchestrator',
        icon: BarChart3,
    },
];

const settingsNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];

export function CRMSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        🏢
                                    </div>
                                    <div className="hidden group-data-[collapsible=icon]:hidden">
                                        <span className="font-bold">CRM</span>
                                        <p className="text-xs text-muted-foreground">
                                            Real Estate
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* CRM Core */}
                <SidebarGroup>
                    <SidebarGroupLabel>CRM</SidebarGroupLabel>
                    <SidebarMenu>
                        {crmNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Automation & Workflows */}
                <SidebarGroup>
                    <SidebarGroupLabel>Automation</SidebarGroupLabel>
                    <SidebarMenu>
                        {automationNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Settings */}
                <SidebarGroup>
                    <SidebarMenu>
                        {settingsNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
