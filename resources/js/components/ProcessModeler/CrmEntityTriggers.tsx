import React, { useState, useEffect } from 'react';
import './CrmEntityTriggers.css';

interface EntityTrigger {
    id: number;
    entity_type: string;
    entity_field?: string;
    trigger_event: string;
    process_trigger_id: number;
    process_name: string;
    field_value_conditions?: Record<string, any>;
    enabled: boolean;
    priority: number;
    display_name: string;
}

interface CrmEntityTriggersProps {
    entityType: string;
    entityId?: number;
}

export const CrmEntityTriggers: React.FC<CrmEntityTriggersProps> = ({ 
    entityType,
    entityId 
}) => {
    const [triggers, setTriggers] = useState<EntityTrigger[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTrigger, setSelectedTrigger] = useState<EntityTrigger | null>(null);

    useEffect(() => {
        loadEntityTriggers();
    }, [entityType]);

    const loadEntityTriggers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/triggers/entity/${entityType}`);
            const { data } = await response.json();
            setTriggers(data);
        } catch (error) {
            console.error('Failed to load entity triggers:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTrigger = async (bindingId: number) => {
        try {
            const trigger = triggers.find(t => t.id === bindingId);
            if (!trigger) return;

            const response = await fetch(`/api/v1/triggers/bindings/${bindingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: !trigger.enabled,
                }),
            });

            if (!response.ok) throw new Error('Failed to update binding');

            const { data } = await response.json();
            setTriggers(triggers.map(t => t.id === bindingId ? data : t));
        } catch (error) {
            console.error('Failed to toggle binding:', error);
        }
    };

    const deleteBinding = async (bindingId: number) => {
        if (!window.confirm('Remove this trigger binding?')) return;

        try {
            const response = await fetch(`/api/v1/triggers/bindings/${bindingId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete binding');

            setTriggers(triggers.filter(t => t.id !== bindingId));
            if (selectedTrigger?.id === bindingId) {
                setSelectedTrigger(null);
            }
        } catch (error) {
            console.error('Failed to delete binding:', error);
        }
    };

    // Group triggers by event type
    const triggersByEvent = triggers.reduce((acc, trigger) => {
        if (!acc[trigger.trigger_event]) {
            acc[trigger.trigger_event] = [];
        }
        acc[trigger.trigger_event].push(trigger);
        return acc;
    }, {} as Record<string, EntityTrigger[]>);

    const eventTypes = Object.keys(triggersByEvent).sort();

    if (loading) {
        return <div className="crm-triggers-container">Loading triggers...</div>;
    }

    return (
        <div className="crm-entity-triggers">
            <div className="triggers-header">
                <h3>⚡ {entityType} Triggers</h3>
                <span className="count-badge">{triggers.length}</span>
            </div>

            {triggers.length === 0 ? (
                <div className="empty-state-triggers">
                    <div className="empty-icon">⚡</div>
                    <p>No triggers configured</p>
                    <p className="empty-hint">Create a process trigger to auto-execute when {entityType} events occur</p>
                </div>
            ) : (
                <div className="triggers-grid">
                    {eventTypes.map(event => (
                        <div key={event} className="event-group">
                            <div className="event-title">
                                {event}
                                <span className="event-count">{triggersByEvent[event].length}</span>
                            </div>
                            <div className="triggers-list">
                                {triggersByEvent[event].map(trigger => (
                                    <div
                                        key={trigger.id}
                                        className={`trigger-card ${selectedTrigger?.id === trigger.id ? 'active' : ''} ${!trigger.enabled ? 'disabled' : ''}`}
                                        onClick={() => setSelectedTrigger(trigger)}
                                    >
                                        <div className="trigger-card-header">
                                            <span className="trigger-status" title={trigger.enabled ? 'Enabled' : 'Disabled'}>
                                                {trigger.enabled ? '✓' : '○'}
                                            </span>
                                            <span className="trigger-process">{trigger.process_name}</span>
                                            <span className="trigger-priority">P{trigger.priority}</span>
                                        </div>

                                        {trigger.field_value_conditions && (
                                            <div className="trigger-conditions">
                                                {Object.entries(trigger.field_value_conditions).map(([field, value]) => (
                                                    <div key={field} className="condition-badge">
                                                        {field} = {String(value)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {trigger.entity_field && (
                                            <div className="trigger-field">
                                                Field: {trigger.entity_field}
                                            </div>
                                        )}

                                        <div className="trigger-card-actions">
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleTrigger(trigger.id);
                                                }}
                                                title={trigger.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {trigger.enabled ? '⊗' : '✓'}
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteBinding(trigger.id);
                                                }}
                                                title="Delete"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTrigger && (
                <div className="trigger-details-panel">
                    <div className="panel-header">
                        <h4>Trigger Details</h4>
                        <button className="close-btn" onClick={() => setSelectedTrigger(null)}>×</button>
                    </div>

                    <div className="panel-content">
                        <div className="detail-item">
                            <span className="detail-label">Process:</span>
                            <span className="detail-value">{selectedTrigger.process_name}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Entity:</span>
                            <span className="detail-value">{selectedTrigger.entity_type}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Event:</span>
                            <span className="detail-value">{selectedTrigger.trigger_event}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Status:</span>
                            <span className={`detail-value ${selectedTrigger.enabled ? 'enabled' : 'disabled'}`}>
                                {selectedTrigger.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Priority:</span>
                            <span className="detail-value">{selectedTrigger.priority}</span>
                        </div>

                        {selectedTrigger.field_value_conditions && Object.keys(selectedTrigger.field_value_conditions).length > 0 && (
                            <div className="detail-item full-width">
                                <span className="detail-label">Conditions:</span>
                                <div className="conditions-list">
                                    {Object.entries(selectedTrigger.field_value_conditions).map(([field, value]) => (
                                        <div key={field} className="condition">
                                            {field} = <strong>{String(value)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrmEntityTriggers;
