import React from 'react';
import ProcessCanvas from './ProcessCanvas';
import ProcessModelerWithTriggers from './ProcessModelerWithTriggers';

// Main export - ProcessModeler with integrated trigger system
export default function ProcessModeler() {
    return <ProcessModelerWithTriggers />;
}

// Individual component exports
export { default as ProcessCanvas } from './ProcessCanvas';
export { default as ProcessNode } from './ProcessNode';
export { default as PropertyPanel } from './PropertyPanel';
export { default as Toolbar } from './Toolbar';
export { TriggerBuilder } from './TriggerBuilder';
export { CrmEntityTriggers } from './CrmEntityTriggers';
export { default as ProcessModelerWithTriggers } from './ProcessModelerWithTriggers';
