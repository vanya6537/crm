import { CRMSidebar } from '@/components/crm-sidebar';
import { AppShell } from '@/components/app-shell';
import { SidebarInset, SidebarProvider } from '@/components/radix/sidebar';
import type { ReactNode } from 'react';

const AppContent = ({ variant = 'header', children, ...props }: React.ComponentProps<'main'> & { variant?: 'header' | 'sidebar' }) => {
    console.log('[AppContent] Called with:', { variant, hasChildren: !!children, propsKeys: Object.keys(props) });
    if (variant === 'sidebar') {
        console.log('[AppContent] Using SidebarInset');
        try {
            return <SidebarInset {...props}>{children}</SidebarInset>;
        } catch (err) {
            console.error('[AppContent] Error rendering SidebarInset:', err);
            throw err;
        }
    }
    console.log('[AppContent] Using main element');
    return (
        <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl" {...props}>
            {children}
        </main>
    );
};

interface CRMLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export default function CRMLayout({
    children,
    title,
    description,
}: CRMLayoutProps) {
    console.log('%c[CRMLayout] Rendering:', 'color: #00ccff; font-weight: bold', { title, description });

    try {
        return (
            <AppShell variant="sidebar">
                <CRMSidebar />
                <AppContent variant="sidebar" className="overflow-x-hidden">
                    {(title || description) && (
                        <div className="border-b border-sidebar-border px-6 py-4">
                            {title && (
                                <h1 className="text-2xl font-bold text-foreground">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                    {children}
                </AppContent>
            </AppShell>
        );
    } catch (error) {
        console.error('[CRMLayout] ERROR rendering:', error);
        throw error;
    }
}
