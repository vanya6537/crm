import { CRMSidebar } from '@/components/crm-sidebar';
import { AppShell } from '@/components/app-shell';
import { AppContent } from '@/components/app-content';
import type { ReactNode } from 'react';

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
}
