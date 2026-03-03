import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Plus, Settings } from 'lucide-react';
import ProcessCanvas from './ProcessCanvas';
import TriggerBuilder from './TriggerBuilder';
import CrmEntityTriggers from './CrmEntityTriggers';
import './ProcessModelerWithTriggers.css';

interface ProcessMetadata {
    id?: number;
    name: string;
    description?: string;
    version: number;
}

interface ProcessData {
    name: string;
    nodes: any[];
    edges: any[];
    triggers: any[];
}

export const ProcessModelerWithTriggers: React.FC<{
    processId?: number;
    processName?: string;
}> = ({ processId, processName = 'Untitled Process' }) => {
    const [metadata, setMetadata] = useState<ProcessMetadata>({
        name: processName,
        description: '',
        version: 1,
    });

    const [activeTab, setActiveTab] = useState<'modeler' | 'triggers' | 'crm'>('modeler');
    const [showTriggerPanel, setShowTriggerPanel] = useState(false);
    const [triggerCount, setTriggerCount] = useState(0);
    const [selectedCrmEntity, setSelectedCrmEntity] = useState<string>('Property');
    const canvasRef = useRef(null);

    // Track trigger updates
    const handleTriggerCreated = (trigger: any) => {
        setTriggerCount(triggerCount + 1);
        // Visual feedback
        const btn = document.querySelector('[data-triggers-btn]') as HTMLElement;
        if (btn) {
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 500);
        }
    };

    const crmEntities = [
        { name: 'Property', icon: '🏠' },
        { name: 'Agent', icon: '👤' },
        { name: 'Buyer', icon: '💼' },
        { name: 'Transaction', icon: '📋' },
        { name: 'PropertyShowing', icon: '🔍' },
        { name: 'Communication', icon: '💬' },
    ];

    return (
        <div className="process-modeler-with-triggers">
            {/* Top Header Bar */}
            <header className="modeler-header">
                <div className="header-left">
                    <h1 className="modeler-title">⚡ Process Modeler</h1>
                    <input
                        type="text"
                        className="process-name-input"
                        value={metadata.name}
                        onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                        placeholder="Process name..."
                    />
                </div>

                <div className="header-right">
                    <div className="header-stats">
                        <div className="stat-item">
                            <span className="stat-label">v</span>
                            <span className="stat-value">{metadata.version}</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-label">⚡ Triggers</span>
                            <span className="stat-value">{triggerCount}</span>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn btn-icon"
                            onClick={() => setShowTriggerPanel(!showTriggerPanel)}
                            data-triggers-btn
                            title="Show triggers panel"
                        >
                            ⚡
                            {triggerCount > 0 && <span className="trigger-badge">{triggerCount}</span>}
                        </button>
                        <button className="btn btn-secondary" title="Save">
                            <Save size={16} />
                        </button>
                        <button className="btn btn-secondary" title="Export">
                            <Download size={16} />
                        </button>
                        <button className="btn btn-primary" title="Publish">
                            <Plus size={16} />
                            Publish
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="modeler-content">
                {/* Left Sidebar - Tabs */}
                <div className="modeler-sidebar">
                    <div className="tab-group">
                        <button
                            className={`tab-btn ${activeTab === 'modeler' ? 'active' : ''}`}
                            onClick={() => setActiveTab('modeler')}
                        >
                            📐 Designer
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'triggers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('triggers')}
                        >
                            ⚡ Triggers
                            {triggerCount > 0 && <span className="tab-badge">{triggerCount}</span>}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
                            onClick={() => setActiveTab('crm')}
                        >
                            🔗 CRM Bindings
                        </button>
                    </div>

                    {/* CRM Entity Selector (shown in CRM tab) */}
                    {activeTab === 'crm' && (
                        <div className="crm-selector">
                            <p className="selector-label">Select Entity Type:</p>
                            <div className="entity-buttons">
                                {crmEntities.map(entity => (
                                    <button
                                        key={entity.name}
                                        className={`entity-btn ${selectedCrmEntity === entity.name ? 'active' : ''}`}
                                        onClick={() => setSelectedCrmEntity(entity.name)}
                                    >
                                        {entity.icon}
                                        <span>{entity.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Canvas Area */}
                <div className="modeler-canvas-wrapper">
                    {activeTab === 'modeler' && (
                        <div ref={canvasRef} className="canvas-container">
                            <ProcessCanvas />
                        </div>
                    )}

                    {activeTab === 'triggers' && (
                        <div className="triggers-container">
                            <TriggerBuilder
                                processId={processId || 0}
                                processName={metadata.name}
                                onTriggerCreated={handleTriggerCreated}
                            />
                        </div>
                    )}

                    {activeTab === 'crm' && (
                        <div className="crm-bindings-container">
                            <CrmEntityTriggers
                                entityType={selectedCrmEntity}
                                entityId={undefined}
                            />
                        </div>
                    )}
                </div>

                {/* Right Floating Trigger Panel */}
                {showTriggerPanel && activeTab === 'modeler' && (
                    <div className="floating-trigger-panel">
                        <div className="panel-header">
                            <h3>Process Triggers</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowTriggerPanel(false)}
                                title="Close triggers panel"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="panel-body">
                            <TriggerBuilder
                                processId={processId || 0}
                                processName={metadata.name}
                                onTriggerCreated={handleTriggerCreated}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Quick Guide */}
            <div className="quick-guide">
                <strong>💡 Pro Tip:</strong> Switch to <code>Triggers</code> tab to bind CRM events to this process
            </div>
        </div>
    );
};

export default ProcessModelerWithTriggers;
