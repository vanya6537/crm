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
} from '@/components/radix/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import type { NavItem } from '@/types';

const crmNavItems: NavItem[] = [
    {
        title: 'Панель управления',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Объекты',
        href: '/properties',
        icon: Building,
    },
    {
        title: 'Клиенты',
        href: '/buyers',
        icon: Users,
    },
    {
        title: 'Команда',
        href: '/agents',
        icon: TrendingUp,
    },
    {
        title: 'Сделки',
        href: '/transactions',
        icon: FileText,
    },
    {
        title: 'Справочники',
        href: '/list-of-values',
        icon: BarChart3,
    },
];

const automationNavItems: NavItem[] = [
    {
        title: 'Конструктор процессов',
        href: '/process-modeler',
        icon: Workflow,
    },
    {
        title: 'Триггеры',
        href: '/triggers',
        icon: Zap,
    },
    {
        title: 'Оркестратор',
        href: '/orchestrator',
        icon: BarChart3,
    },
];

const settingsNavItems: NavItem[] = [
    {
        title: 'Настройки',
        href: '/settings',
        icon: Settings,
    },
];

export function CRMSidebar() {
    console.log('%c[CRMSidebar] Rendering', 'color: #ff6600; font-weight: bold');

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        🏢
                                    </div>
                                    <div className="hidden group-data-[collapsible=icon]:hidden">
                                        <span className="font-bold">CRM</span>
                                        <p className="text-xs text-muted-foreground">
                                            Недвижимость
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
                    <SidebarGroupLabel>Автоматизация</SidebarGroupLabel>
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
