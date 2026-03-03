import React, { useState } from 'react';
import './PropertyPanel.css';

interface Node {
    id: string;
    type: string;
    label: string;
    config?: Record<string, any>;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    label?: string;
    condition?: string;
}

interface PropertyPanelProps {
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    nodes: Node[];
    onUpdateNodeConfig: (config: Record<string, any>) => void;
    onConnectNodes: (source: string, target: string) => void;
}

export default function PropertyPanel({
    selectedNode,
    selectedEdge,
    nodes,
    onUpdateNodeConfig,
    onConnectNodes,
}: PropertyPanelProps) {
    const [targetNodeId, setTargetNodeId] = useState('');

    if (!selectedNode && !selectedEdge) {
        return (
            <div className="property-panel">
                <div className="empty-state">
                    <div className="empty-state-icon">⚙️</div>
                    <div className="empty-state-text">
                        Select a node or connection to view properties
                    </div>
                </div>
            </div>
        );
    }

    if (selectedEdge) {
        return (
            <div className="property-panel">
                <div className="panel-header">
                    <h3>Connection Properties</h3>
                    <p>Edit connection</p>
                </div>

                <div className="property-group">
                    <label className="property-label">Label</label>
                    <input
                        type="text"
                        className="property-input"
                        placeholder="e.g., 'Yes', 'No'"
                        defaultValue={selectedEdge.label || ''}
                    />
                </div>

                <div className="property-group">
                    <label className="property-label">Condition</label>
                    <textarea
                        className="property-input property-textarea"
                        placeholder="e.g., status == 'approved'"
                        defaultValue={selectedEdge.condition || ''}
                    />
                    <p className="property-help">
                        Use process variables in expressions
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="property-panel">
            <div className="panel-header">
                <h3>{selectedNode.label}</h3>
                <p>{selectedNode.type.replace(/_/g, ' ')}</p>
            </div>

            {/* Node ID */}
            <div className="property-group">
                <label className="property-label">Node ID</label>
                <input
                    type="text"
                    className="property-input"
                    value={selectedNode.id}
                    disabled
                />
            </div>

            {/* Label */}
            <div className="property-group">
                <label className="property-label">Label</label>
                <input
                    type="text"
                    className="property-input"
                    placeholder="Enter a label"
                    defaultValue={selectedNode.label}
                    onChange={(e) =>
                        onUpdateNodeConfig({
                            ...selectedNode.config,
                            label: e.target.value,
                        })
                    }
                />
            </div>

            {/* Type-specific properties */}
            {selectedNode.type === 'service_task' && (
                <>
                    <div className="property-group">
                        <label className="property-label">Service URL</label>
                        <input
                            type="text"
                            className="property-input"
                            placeholder="https://api.example.com/endpoint"
                            defaultValue={selectedNode.config?.serviceUrl || ''}
                            onChange={(e) =>
                                onUpdateNodeConfig({
                                    ...selectedNode.config,
                                    serviceUrl: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="property-group">
                        <label className="property-label">HTTP Method</label>
                        <select
                            className="property-select"
                            defaultValue={selectedNode.config?.method || 'POST'}
                            onChange={(e) =>
                                onUpdateNodeConfig({
                                    ...selectedNode.config,
                                    method: e.target.value,
                                })
                            }
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                </>
            )}

            {selectedNode.type === 'script_task' && (
                <div className="property-group">
                    <label className="property-label">Script Code</label>
                    <textarea
                        className="property-input property-textarea"
                        placeholder="Enter JavaScript code"
                        defaultValue={selectedNode.config?.script || ''}
                        onChange={(e) =>
                            onUpdateNodeConfig({
                                ...selectedNode.config,
                                script: e.target.value,
                            })
                        }
                    />
                </div>
            )}

            {selectedNode.type === 'human_task' && (
                <>
                    <div className="property-group">
                        <label className="property-label">Assignee</label>
                        <input
                            type="text"
                            className="property-input"
                            placeholder="User email or role"
                            defaultValue={selectedNode.config?.assignee || ''}
                            onChange={(e) =>
                                onUpdateNodeConfig({
                                    ...selectedNode.config,
                                    assignee: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="property-group">
                        <label className="property-label">Due Date (days)</label>
                        <input
                            type="number"
                            className="property-input"
                            placeholder="e.g., 5"
                            defaultValue={selectedNode.config?.dueDate || ''}
                            onChange={(e) =>
                                onUpdateNodeConfig({
                                    ...selectedNode.config,
                                    dueDate: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="property-group">
                        <label className="property-label">Form (Optional)</label>
                        <select
                            className="property-select"
                            defaultValue={selectedNode.config?.formId || ''}
                            onChange={(e) =>
                                onUpdateNodeConfig({
                                    ...selectedNode.config,
                                    formId: e.target.value,
                                })
                            }
                        >
                            <option value="">No form</option>
                            <option value="form_1">Form 1</option>
                            <option value="form_2">Form 2</option>
                        </select>
                    </div>
                </>
            )}

            {selectedNode.type === 'decision' && (
                <div className="property-group">
                    <label className="property-label">Default Path</label>
                    <input
                        type="text"
                        className="property-input"
                        placeholder="Default condition"
                        defaultValue={selectedNode.config?.defaultPath || ''}
                        onChange={(e) =>
                            onUpdateNodeConfig({
                                ...selectedNode.config,
                                defaultPath: e.target.value,
                            })
                        }
                    />
                </div>
            )}

            {/* Connect to another node */}
            {selectedNode.type !== 'end' && (
                <div className="property-group">
                    <label className="property-label">Connect To</label>
                    <div className="connect-section">
                        <select
                            className="property-select"
                            value={targetNodeId}
                            onChange={(e) => setTargetNodeId(e.target.value)}
                        >
                            <option value="">Select a node...</option>
                            {nodes
                                .filter(n => n.id !== selectedNode.id)
                                .map(node => (
                                    <option key={node.id} value={node.id}>
                                        {node.label} ({node.type})
                                    </option>
                                ))}
                        </select>
                        <button
                            className="btn-connect"
                            onClick={() => {
                                if (targetNodeId) {
                                    onConnectNodes(selectedNode.id, targetNodeId);
                                    setTargetNodeId('');
                                }
                            }}
                            disabled={!targetNodeId}
                        >
                            Connect
                        </button>
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="property-group">
                <label className="property-label">Description</label>
                <textarea
                    className="property-input property-textarea"
                    placeholder="Add a description"
                    defaultValue={selectedNode.config?.description || ''}
                    onChange={(e) =>
                        onUpdateNodeConfig({
                            ...selectedNode.config,
                            description: e.target.value,
                        })
                    }
                />
            </div>
        </div>
    );
}
