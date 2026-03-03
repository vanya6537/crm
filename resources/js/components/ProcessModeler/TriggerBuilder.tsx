import React, { useState, useEffect } from 'react';
import './TriggerBuilder.css';

interface Trigger {
    id?: number;
    process_id: number;
    trigger_type: string;
    entity_type: string;
    event_name: string;
    condition_expression?: string;
    context_mapping?: Record<string, string>;
    metadata?: Record<string, any>;
    is_active: boolean;
    execution_mode: 'sync' | 'async' | 'scheduled';
    max_executions?: number;
}

interface TriggerBinding {
    entity_type: string;
    entity_field?: string;
    trigger_event: string;
    field_value_conditions?: Record<string, any>;
    enabled: boolean;
    priority: number;
}

interface TriggerBuilderProps {
    processId: number;
    processName: string;
    onTriggerCreated?: (trigger: Trigger) => void;
}

export const TriggerBuilder: React.FC<TriggerBuilderProps> = ({ 
    processId, 
    processName,
    onTriggerCreated 
}) => {
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableEvents, setAvailableEvents] = useState<Record<string, string[]>>({});

    const [formData, setFormData] = useState<Trigger>({
        process_id: processId,
        trigger_type: 'entity_event',
        entity_type: 'Property',
        event_name: 'created',
        is_active: true,
        execution_mode: 'async',
    });

    // Trigger types
    const triggerTypes = [
        { id: 'entity_event', label: 'Entity Event', description: 'When CRM entity event occurs' },
        { id: 'field_changed', label: 'Field Changed', description: 'When specific field changes' },
        { id: 'status_changed', label: 'Status Changed', description: 'When status field changes' },
    ];

    const entityTypes = ['Property', 'Agent', 'Buyer', 'Transaction', 'PropertyShowing', 'Communication'];

    // Load available events
    useEffect(() => {
        loadAvailableEvents();
        loadTriggers();
    }, [processId]);

    const loadAvailableEvents = async () => {
        try {
            const response = await fetch('/api/v1/triggers/available-events');
            const { data } = await response.json();
            setAvailableEvents(data);
        } catch (error) {
            console.error('Failed to load available events:', error);
        }
    };

    const loadTriggers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/triggers/?process_id=${processId}`);
            const { data } = await response.json();
            setTriggers(data);
        } catch (error) {
            console.error('Failed to load triggers:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTrigger = async () => {
        try {
            const response = await fetch('/api/v1/triggers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to create trigger');

            const { data } = await response.json();
            setTriggers([...triggers, data]);
            setShowForm(false);
            setFormData({
                process_id: processId,
                trigger_type: 'entity_event',
                entity_type: 'Property',
                event_name: 'created',
                is_active: true,
                execution_mode: 'async',
            });

            onTriggerCreated?.(data);
        } catch (error) {
            console.error('Failed to create trigger:', error);
        }
    };

    const toggleTrigger = async (triggerId: number) => {
        try {
            const response = await fetch(`/api/v1/triggers/${triggerId}/toggle`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to toggle trigger');

            const { data } = await response.json();
            setTriggers(triggers.map(t => t.id === triggerId ? data : t));
        } catch (error) {
            console.error('Failed to toggle trigger:', error);
        }
    };

    const deleteTrigger = async (triggerId: number) => {
        if (!window.confirm('Delete this trigger?')) return;

        try {
            const response = await fetch(`/api/v1/triggers/${triggerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete trigger');

            setTriggers(triggers.filter(t => t.id !== triggerId));
            if (selectedTrigger?.id === triggerId) {
                setSelectedTrigger(null);
            }
        } catch (error) {
            console.error('Failed to delete trigger:', error);
        }
    };

    const executeTrigger = async (triggerId: number) => {
        try {
            const response = await fetch(`/api/v1/triggers/${triggerId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_type: 'Property',
                    entity_id: 1,
                    context_data: {},
                }),
            });

            if (!response.ok) throw new Error('Failed to execute trigger');

            const { message } = await response.json();
            alert(message);
        } catch (error) {
            console.error('Failed to execute trigger:', error);
            alert('Failed to execute trigger');
        }
    };

    return (
        <div className="trigger-builder">
            <div className="trigger-header">
                <h2 className="trigger-title">⚡ Process Triggers</h2>
                <p className="trigger-subtitle">Bind CRM events to this process</p>
            </div>

            <div className="trigger-content">
                {/* Triggers List */}
                <div className="triggers-section">
                    <div className="section-header">
                        <h3>Active Triggers ({triggers.length})</h3>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowForm(!showForm)}
                        >
                            + New Trigger
                        </button>
                    </div>

                    {triggers.length === 0 && !showForm ? (
                        <div className="empty-state">
                            <div className="empty-icon">⚡</div>
                            <p>No triggers configured yet</p>
                            <p className="empty-hint">Create a trigger to auto-execute this process when CRM events occur</p>
                        </div>
                    ) : null}

                    {/* Create Form */}
                    {showForm && (
                        <div className="trigger-form">
                            <h4>Create New Trigger</h4>

                            <div className="form-group">
                                <label>Trigger Type</label>
                                <select
                                    value={formData.trigger_type}
                                    onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                                >
                                    {triggerTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>CRM Entity</label>
                                <select
                                    value={formData.entity_type}
                                    onChange={(e) => {
                                        setFormData({ ...formData, entity_type: e.target.value });
                                        // Reset event based on new entity type
                                        const events = availableEvents[e.target.value] || {};
                                        const firstEvent = Object.keys(events)[0] || 'created';
                                        setFormData(prev => ({ ...prev, event_name: firstEvent }));
                                    }}
                                >
                                    {entityTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Event</label>
                                <select
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                >
                                    {Object.entries(availableEvents[formData.entity_type] || {}).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Execution Mode</label>
                                <select
                                    value={formData.execution_mode}
                                    onChange={(e) => setFormData({ ...formData, execution_mode: e.target.value as any })}
                                >
                                    <option value="async">Async (Background)</option>
                                    <option value="sync">Sync (Immediate)</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                                <p className="form-hint">Async executes in background, Sync waits for completion</p>
                            </div>

                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    Active (Enabled)
                                </label>
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-primary" onClick={createTrigger}>
                                    Create Trigger
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Triggers List */}
                    {triggers.map(trigger => (
                        <div
                            key={trigger.id}
                            className={`trigger-item ${selectedTrigger?.id === trigger.id ? 'active' : ''}`}
                            onClick={() => setSelectedTrigger(trigger)}
                        >
                            <div className="trigger-item-header">
                                <div className="trigger-icon">
                                    {trigger.is_active ? '⚡' : '⊗'}
                                </div>
                                <div className="trigger-info">
                                    <div className="trigger-name">
                                        {trigger.entity_type} → {trigger.event_name}
                                    </div>
                                    <div className="trigger-mode">
                                        {trigger.execution_mode === 'async' ? '🔄 Async' : trigger.execution_mode === 'sync' ? '⏱️ Sync' : '📅 Scheduled'}
                                    </div>
                                </div>
                                <div className="trigger-actions">
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTrigger(trigger.id!);
                                        }}
                                        title={trigger.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {trigger.is_active ? '✓' : '○'}
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            executeTrigger(trigger.id!);
                                        }}
                                        title="Test execute"
                                    >
                                        ▶
                                    </button>
                                    <button
                                        className="icon-btn delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTrigger(trigger.id!);
                                        }}
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected Trigger Details */}
                {selectedTrigger && (
                    <div className="trigger-details">
                        <div className="details-header">
                            <h3>Trigger Details</h3>
                            <div className="status-badge" style={{ backgroundColor: selectedTrigger.is_active ? '#10b981' : '#6b7280' }}>
                                {selectedTrigger.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>

                        <div className="details-content">
                            <div className="detail-row">
                                <span className="label">Trigger Type:</span>
                                <span className="value">{selectedTrigger.trigger_type}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Entity:</span>
                                <span className="value">{selectedTrigger.entity_type}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Event:</span>
                                <span className="value">{selectedTrigger.event_name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Execution Mode:</span>
                                <span className="value">{selectedTrigger.execution_mode}</span>
                            </div>

                            <div className="info-box">
                                <h4>💡 How it works</h4>
                                <p>When a <strong>{selectedTrigger.entity_type}</strong> {selectedTrigger.event_name} event occurs, this process will be triggered {selectedTrigger.execution_mode === 'async' ? 'in the background' : 'immediately'}.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TriggerBuilder;
