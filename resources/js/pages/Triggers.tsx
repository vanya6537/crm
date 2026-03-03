import React from 'react';
import { Head } from '@inertiajs/react';
import TriggerBuilder from '@/components/ProcessModeler/TriggerBuilder';
import ProcessModelerNav from '@/components/ProcessModeler/ProcessModelerNav';

interface TriggersPageProps {
    processId?: number;
    processName?: string;
}

export default function TriggersPage({
    processId = 0,
    processName = 'Current Process',
}: TriggersPageProps) {
    return (
        <>
            <Head title="Process Triggers" />
            <ProcessModelerNav />
            <div style={{ height: 'calc(100vh - 56px)', width: '100%', padding: '16px', overflowY: 'auto' }}>
                <TriggerBuilder
                    processId={processId}
                    processName={processName}
                />
            </div>
        </>
    );
}
