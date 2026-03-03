import React from 'react';
import { Head } from '@inertiajs/react';
import ProcessModelerWithTriggers from '@/components/ProcessModeler/ProcessModelerWithTriggers';
import ProcessModelerNav from '@/components/ProcessModeler/ProcessModelerNav';

interface ProcessModelerPageProps {
    processId?: number;
    processName?: string;
}

export default function ProcessModelerPage({
    processId,
    processName = 'New Process',
}: ProcessModelerPageProps) {
    return (
        <>
            <Head title="Конструктор процессов" />
            <ProcessModelerNav />
            <div style={{ height: 'calc(100vh - 56px)', width: '100%' }}>
                <ProcessModelerWithTriggers
                    processId={processId}
                    processName={processName}
                />
            </div>
        </>
    );
}
