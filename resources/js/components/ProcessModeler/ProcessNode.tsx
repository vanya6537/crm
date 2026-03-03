import React from 'react';
import { Trash2 } from 'lucide-react';
import './ProcessNode.css';

interface Node {
    id: string;
    type: 'start' | 'end' | 'service_task' | 'script_task' | 'decision' | 'human_task' | 'parallel_fork' | 'parallel_join';
    label: string;
    x: number;
    y: number;
    config?: Record<string, any>;
}

interface ProcessNodeProps {
    node: Node;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

const nodeTypeConfig = {
    start: {
        icon: '▶',
        color: 'var(--color-success)',
        shape: 'ellipse',
        description: 'Process start point',
    },
    end: {
        icon: '⏹',
        color: 'var(--color-danger)',
        shape: 'ellipse',
        description: 'Process end point',
    },
    service_task: {
        icon: '⚙',
        color: 'var(--color-primary)',
        shape: 'rectangle',
        description: 'System service or API call',
    },
    script_task: {
        icon: '{}',
        color: 'var(--color-info)',
        shape: 'rectangle',
        description: 'Script or code execution',
    },
    decision: {
        icon: '◆',
        color: 'var(--color-warning)',
        shape: 'diamond',
        description: 'Decision gateway',
    },
    human_task: {
        icon: '👤',
        color: 'var(--color-purple)',
        shape: 'rectangle',
        description: 'Manual task requiring human action',
    },
    parallel_fork: {
        icon: '⊲⊲',
        color: 'var(--color-dark)',
        shape: 'bar',
        description: 'Split into parallel paths',
    },
    parallel_join: {
        icon: '⊳⊳',
        color: 'var(--color-dark)',
        shape: 'bar',
        description: 'Merge parallel paths',
    },
};

export default function ProcessNode({ node, isSelected, onSelect, onDelete }: ProcessNodeProps) {
    const config = nodeTypeConfig[node.type];

    return (
        <div className="process-node-wrapper">
            <div
                className={`process-node ${node.type} ${isSelected ? 'selected' : ''}`}
                onClick={onSelect}
                title={config.description}
                style={{
                    borderColor: config.color,
                    '--node-color': config.color,
                } as React.CSSProperties}
            >
                {/* Icon */}
                <div className="node-icon" style={{ backgroundColor: config.color }}>
                    {config.icon}
                </div>

                {/* Content */}
                <div className="node-content">
                    <div className="node-label">{node.label}</div>
                    <div className="node-type">{node.type.replace(/_/g, ' ')}</div>
                </div>

                {/* Delete button (on hover/select) */}
                {isSelected && (
                    <button
                        className="node-delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title="Delete node"
                    >
                        <Trash2 size={14} />
                    </button>
                )}

                {/* Connection points */}
                <div className="connection-point connection-point-top" />
                <div className="connection-point connection-point-bottom" />
                <div className="connection-point connection-point-left" />
                <div className="connection-point connection-point-right" />
            </div>

            {/* Tooltip on hover */}
            {isSelected && (
                <div className="node-tooltip">
                    {config.description}
                </div>
            )}
        </div>
    );
}
