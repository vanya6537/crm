import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';

type Props = React.ComponentProps<'main'> & {
    variant?: 'header' | 'sidebar';
};

export function AppContent({ variant = 'header', children, ...props }: Props) {
    console.log('%c[AppContent] Rendering:', 'color: #ff00ff; font-weight: bold', {
        variant,
        hasChildren: !!children,
        childrenCount: Array.isArray(children) ? children.length : 1,
    });

    if (variant === 'sidebar') {
        console.log('%c[AppContent] Using SidebarInset variant', 'color: #ff0088');
        return <SidebarInset {...props}>{children}</SidebarInset>
    }

    return (
        <main
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl"
            {...props}
        >
            {children}
        </main>
    );
}
