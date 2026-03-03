import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
    onAddNode: (type: 'start' | 'end' | 'service_task' | 'script_task' | 'decision' | 'human_task' | 'parallel_fork' | 'parallel_join') => void;
}

const nodeTypes = [
    {
        id: 'start',
        label: 'Start',
        description: 'Begin the process',
        icon: '▶',
        group: 'Basic',
    },
    {
        id: 'end',
        label: 'End',
        description: 'End the process',
        icon: '⏹',
        group: 'Basic',
    },
    {
        id: 'service_task',
        label: 'Service Task',
        description: 'API or system call',
        icon: '⚙',
        group: 'Tasks',
    },
    {
        id: 'script_task',
        label: 'Script Task',
        description: 'Execute code',
        icon: '{}',
        group: 'Tasks',
    },
    {
        id: 'human_task',
        label: 'Human Task',
        description: 'Manual action required',
        icon: '👤',
        group: 'Tasks',
    },
    {
        id: 'decision',
        label: 'Decision',
        description: 'Choose a path',
        icon: '◆',
        group: 'Control',
    },
    {
        id: 'parallel_fork',
        label: 'Parallel Fork',
        description: 'Split into parallel',
        icon: '⊲⊲',
        group: 'Control',
    },
    {
        id: 'parallel_join',
        label: 'Parallel Join',
        description: 'Merge parallel paths',
        icon: '⊳⊳',
        group: 'Control',
    },
];

const groups = [...new Set(nodeTypes.map(t => t.group))];

export default function Toolbar({ onAddNode }: ToolbarProps) {
    const [expandedGroup, setExpandedGroup] = React.useState<string | null>('Basic');

    return (
        <div className="toolbar">
            <div className="toolbar-header">
                <h3>Node Palette</h3>
                <p>Drag or click to add</p>
            </div>

            {groups.map(group => (
                <div key={group} className="toolbar-group">
                    <button
                        className={`toolbar-group-header ${expandedGroup === group ? 'expanded' : ''}`}
                        onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                    >
                        <span className="group-toggle">▸</span>
                        <span className="group-name">{group}</span>
                        <span className="group-count">
                            {nodeTypes.filter(t => t.group === group).length}
                        </span>
                    </button>

                    {expandedGroup === group && (
                        <div className="toolbar-nodes">
                            {nodeTypes
                                .filter(t => t.group === group)
                                .map(nodeType => (
                                    <button
                                        key={nodeType.id}
                                        className="toolbar-node-button"
                                        onClick={() => onAddNode(nodeType.id as any)}
                                        title={nodeType.description}
                                    >
                                        <div className="node-button-icon">
                                            {nodeType.icon}
                                        </div>
                                        <div className="node-button-content">
                                            <div className="node-button-label">
                                                {nodeType.label}
                                            </div>
                                            <div className="node-button-description">
                                                {nodeType.description}
                                            </div>
                                        </div>
                                        <span className="node-button-plus">+</span>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            ))}

            <div className="toolbar-footer">
                <p>💡 Tip: Drag nodes to arrange them</p>
            </div>
        </div>
    );
}
