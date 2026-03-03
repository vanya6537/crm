import React, { useCallback, useState } from 'react';
import { Plus, Trash2, Download, Save, Settings } from 'lucide-react';
import ProcessNode from './ProcessNode';
import PropertyPanel from './PropertyPanel';
import Toolbar from './Toolbar';
import './ProcessCanvas.css';

interface Node {
    id: string;
    type: 'start' | 'end' | 'service_task' | 'script_task' | 'decision' | 'human_task' | 'parallel_fork' | 'parallel_join';
    label: string;
    x: number;
    y: number;
    config?: Record<string, any>;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    label?: string;
    condition?: string;
}

export default function ProcessCanvas() {
    const [nodes, setNodes] = useState<Node[]>([
        {
            id: 'start-1',
            type: 'start',
            label: 'Start',
            x: 100,
            y: 100,
        },
        {
            id: 'end-1',
            type: 'end',
            label: 'End',
            x: 600,
            y: 100,
        },
    ]);

    const [edges, setEdges] = useState<Edge[]>([
        {
            id: 'edge-1',
            source: 'start-1',
            target: 'end-1',
        },
    ]);

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);

    // Canvas ref for drawing
    const canvasRef = React.useRef<HTMLDivElement>(null);

    // Add new node
    const addNode = useCallback((type: Node['type']) => {
        const newId = `${type}-${Date.now()}`;
        const newNode: Node = {
            id: newId,
            type,
            label: type.replace(/_/g, ' ').toUpperCase(),
            x: 300 + Math.random() * 200,
            y: 200 + Math.random() * 200,
            config: {},
        };
        setNodes([...nodes, newNode]);
    }, [nodes]);

    // Delete node
    const deleteNode = useCallback((id: string) => {
        setNodes(nodes.filter(n => n.id !== id));
        setEdges(edges.filter(e => e.source !== id && e.target !== id));
        setSelectedNode(null);
    }, [nodes, edges]);

    // Update node position
    const updateNodePosition = useCallback((id: string, x: number, y: number) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
    }, [nodes]);

    // Update node config
    const updateNodeConfig = useCallback((id: string, config: Record<string, any>) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, config } : n));
    }, [nodes]);

    // Handle node drag
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        setDraggedNode(nodeId);
        setIsDragging(true);
        setSelectedNode(nodes.find(n => n.id === nodeId) || null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedNode || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        updateNodePosition(draggedNode, x, y);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggedNode(null);
    };

    // Connect nodes
    const connectNodes = useCallback((sourceId: string, targetId: string) => {
        const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: sourceId,
            target: targetId,
        };
        setEdges([...edges, newEdge]);
    }, [edges]);

    // Save process
    const saveProcess = useCallback(() => {
        const process = {
            nodes,
            edges,
            metadata: {
                name: 'Process',
                version: 1,
                createdAt: new Date().toISOString(),
            },
        };
        console.log('Process saved:', process);
        // TODO: Send to API
    }, [nodes, edges]);

    return (
        <div className="process-canvas-container">
            {/* Header */}
            <div className="process-header">
                <div className="process-title">
                    <h1>Process Designer</h1>
                    <p>Drag nodes to arrange, click to configure</p>
                </div>
                <div className="process-actions">
                    <button className="btn-primary" onClick={saveProcess}>
                        <Save size={16} />
                        Save Process
                    </button>
                    <button className="btn-secondary">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            <div className="process-content">
                {/* Toolbar */}
                <Toolbar onAddNode={addNode} />

                {/* Canvas */}
                <div
                    className="process-canvas"
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Grid background */}
                    <svg className="canvas-grid" width="100%" height="100%">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Edges */}
                    <svg className="canvas-edges" width="100%" height="100%">
                        {edges.map(edge => {
                            const sourceNode = nodes.find(n => n.id === edge.source);
                            const targetNode = nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;

                            const x1 = sourceNode.x + 40;
                            const y1 = sourceNode.y + 40;
                            const x2 = targetNode.x + 40;
                            const y2 = targetNode.y + 40;

                            return (
                                <g key={edge.id}>
                                    <line
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        className="edge-line"
                                        onClick={() => setSelectedEdge(edge)}
                                    />
                                    {/* Arrowhead */}
                                    <defs>
                                        <marker
                                            id="arrowhead"
                                            markerWidth="10"
                                            markerHeight="10"
                                            refX="9"
                                            refY="3"
                                            orient="auto"
                                        >
                                            <polygon points="0 0, 10 3, 0 6" fill="#999" />
                                        </marker>
                                    </defs>
                                    <line
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke="#999"
                                        strokeWidth="2"
                                        markerEnd="url(#arrowhead)"
                                        fill="none"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Nodes */}
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            style={{
                                position: 'absolute',
                                left: node.x,
                                top: node.y,
                                cursor: isDragging && draggedNode === node.id ? 'grabbing' : 'grab',
                                userSelect: 'none',
                            }}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        >
                            <ProcessNode
                                node={node}
                                isSelected={selectedNode?.id === node.id}
                                onSelect={() => setSelectedNode(node)}
                                onDelete={() => deleteNode(node.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Property Panel */}
                <PropertyPanel
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                    nodes={nodes}
                    onUpdateNodeConfig={(config) => {
                        if (selectedNode) {
                            updateNodeConfig(selectedNode.id, config);
                        }
                    }}
                    onConnectNodes={connectNodes}
                />
            </div>
        </div>
    );
}
