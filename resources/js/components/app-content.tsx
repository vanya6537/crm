import * as React from 'react';
import { SidebarInset } from '@/components/radix/sidebar';

console.log('[app-content.tsx] Module loading...');
console.log('[app-content.tsx] SidebarInset imported:', typeof SidebarInset);

type Props = React.ComponentProps<'main'> & {
    variant?: 'header' | 'sidebar';
};

export function AppContent({ variant = 'header', children, ...props }: Props) {
    try {
        console.log('%c[AppContent] Rendering:', 'color: #ff00ff; font-weight: bold', {
            variant,
            hasChildren: !!children,
        });

        if (variant === 'sidebar') {
            return <SidebarInset {...props}>{children}</SidebarInset>;
        }

        return (
            <main
                className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl"
                {...props}
            >
                {children}
            </main>
        );
    } catch (error) {
        console.error('[AppContent] ERROR:', error);
        throw error;
    }
}

console.log('[app-content.tsx] AppContent exported:', typeof AppContent);
