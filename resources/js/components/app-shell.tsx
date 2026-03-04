import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/radix/sidebar';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    try {
        const { props } = usePage();
        const sidebarOpen = (props as any)?.sidebarOpen !== false;

        const htmlClass = typeof document === 'undefined' ? '' : document.documentElement.className;

        console.log('%c[AppShell] Rendering:', 'color: #ffaa00; font-weight: bold', {
            variant,
            sidebarOpen,
            hasChildren: !!children,
            childrenIsArray: Array.isArray(children),
            childrenLength: Array.isArray(children) ? children.length : 1,
            htmlClass,
        });

        if (variant === 'header') {
            console.log('%c[AppShell] Using header variant', 'color: #ffaa00');
            return (
                <div className="flex min-h-screen w-full flex-col">{children}</div>
            );
        }

        console.log('%c[AppShell] Using sidebar variant, passing to SidebarProvider', 'color: #ffaa00');
        return <SidebarProvider defaultOpen={sidebarOpen}>{children}</SidebarProvider>;
    } catch (error) {
        console.error('[AppShell] ERROR:', error);
        throw error;
    }
}
