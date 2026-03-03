import React from 'react';
import { Head } from '@inertiajs/react';
import ProcessCanvas from '@/components/ProcessModeler/ProcessCanvas';
import ProcessModelerNav from '@/components/ProcessModeler/ProcessModelerNav';

interface DesignerPageProps {
    processId?: number;
}

export default function DesignerPage({ processId }: DesignerPageProps) {
    return (
        <>
            <Head title="Process Designer" />
            <ProcessModelerNav />
            <div style={{ height: 'calc(100vh - 56px)', width: '100%' }}>
                <ProcessCanvas />
            </div>
        </>
    );
}
