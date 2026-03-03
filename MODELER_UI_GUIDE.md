# Process Modeler UI - Implementation Guide

## Overview

The Process Modeler is a visual process definition editor that allows users to:
1. Create process flows using drag-and-drop nodes
2. Define variables and their types
3. Configure node properties (service calls, conditions, etc)
4. Validate process graphs (end reachability, proper joins)
5. Publish processes for execution

This guide covers the React component architecture and implementation details.

## UI Architecture

```
ModelerPage
├─ ProcessModeler.tsx (main container)
│  ├─ Canvas (50%)
│  │  ├─ Nodes (selected node highlighted)
│  │  ├─ Edges (connections between nodes)
│  │  └─ Grid (snapping, scale)
│  │
│  ├─ PropertyPanel (30%)
│  │  ├─ NodeProperties
│  │  ├─ EdgeProperties
│  │  └─ VariablePanel
│  │
│  └─ Toolbar & Status (20%)
│     ├─ Node Palette (add nodes)
│     ├─ Validation Status
│     ├─ Publish Button
│     └─ Version History
```

## Core Components

### 1. ProcessModeler.tsx (Main Container)

```tsx
interface ProcessDefinition {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'deprecated';
  version: number;
  nodes: Node[];
  edges: Edge[];
  variables: Variable[];
  config: Record<string, any>;
}

interface Node {
  id: string;
  type: 'start' | 'end' | 'service_task' | 'script_task' | 'decision' | 'parallel_fork' | 'parallel_join' | 'human_task';
  label: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
  incoming: string[]; // edge IDs
  outgoing: string[]; // edge IDs
}

interface Edge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: any;
  description?: string;
}

export const ProcessModeler: React.FC<{ processId?: string }> = ({ processId }) => {
  const [process, setProcess] = useState<ProcessDefinition>();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load process
  useEffect(() => {
    if (processId) {
      loadProcess(processId);
    }
  }, [processId]);

  // Validate process on changes
  useEffect(() => {
    if (process) {
      validateProcess();
    }
  }, [process]);

  const validateProcess = async () => {
    try {
      const response = await axios.post('/api/v1/processes/validate', process);
      setValidationErrors(response.data.errors || []);
    } catch (error) {
      setValidationErrors(['Validation failed']);
    }
  };

  const addNode = (type: string, x: number, y: number) => {
    if (!process) return;

    const nodeId = `node_${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: type as any,
      label: type,
      position: { x, y },
      properties: getDefaultPropertiesForType(type),
      incoming: [],
      outgoing: [],
    };

    setProcess({
      ...process,
      nodes: [...process.nodes, newNode],
    });
  };

  const addEdge = (sourceId: string, targetId: string) => {
    if (!process) return;

    const edgeId = `edge_${Date.now()}`;
    const source = process.nodes.find(n => n.id === sourceId);
    const target = process.nodes.find(n => n.id === targetId);

    if (!source || !target) return;

    const newEdge: Edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
    };

    // Update node's incoming/outgoing refs
    source.outgoing.push(edgeId);
    target.incoming.push(edgeId);

    setProcess({
      ...process,
      edges: [...process.edges, newEdge],
    });
  };

  const updateNode = (nodeId: string, updates: Partial<Node>) => {
    if (!process) return;

    setProcess({
      ...process,
      nodes: process.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    });
  };

  const deleteNode = (nodeId: string) => {
    if (!process) return;

    // Remove associated edges
    const edgesToRemove = process.edges.filter(
      e => e.source === nodeId || e.target === nodeId
    );

    setProcess({
      ...process,
      nodes: process.nodes.filter(n => n.id !== nodeId),
      edges: process.edges.filter(e => !edgesToRemove.includes(e)),
    });
  };

  const canConnect = (sourceId: string, targetId: string): boolean => {
    if (!process) return false;
    const source = process.nodes.find(n => n.id === sourceId);
    const target = process.nodes.find(n => n.id === targetId);

    if (!source || !target) return false;
    if (source.type === 'end') return false;
    if (target.type === 'start') return false;

    return true;
  };

  return (
    <div className="process-modeler flex h-screen bg-gray-100">
      {/* Left Toolbar */}
      <div className="w-20 bg-white shadow-lg p-2 flex flex-col items-center gap-2">
        <button
          onClick={() => addNode('start', 100, 100)}
          title="Start Node"
          className="p-3 bg-green-100 rounded hover:bg-green-200"
        >
          <i className="fas fa-play text-green-600"></i>
        </button>
        <button
          onClick={() => addNode('service_task', 100, 200)}
          title="Service Task"
          className="p-3 bg-blue-100 rounded hover:bg-blue-200"
        >
          <i className="fas fa-cog text-blue-600"></i>
        </button>
        <button
          onClick={() => addNode('script_task', 100, 300)}
          title="Script Task"
          className="p-3 bg-purple-100 rounded hover:bg-purple-200"
        >
          <i className="fas fa-code text-purple-600"></i>
        </button>
        <button
          onClick={() => addNode('decision', 100, 400)}
          title="Decision"
          className="p-3 bg-orange-100 rounded hover:bg-orange-200"
        >
          <i className="fas fa-code-branch text-orange-600"></i>
        </button>
        <button
          onClick={() => addNode('human_task', 100, 500)}
          title="Human Task"
          className="p-3 bg-pink-100 rounded hover:bg-pink-200"
        >
          <i className="fas fa-user-check text-pink-600"></i>
        </button>
        <button
          onClick={() => addNode('parallel_fork', 100, 600)}
          title="Parallel Fork"
          className="p-3 bg-cyan-100 rounded hover:bg-cyan-200"
        >
          <i className="fas fa-code-fork text-cyan-600"></i>
        </button>
        <button
          onClick={() => addNode('end', 100, 700)}
          title="End Node"
          className="p-3 bg-red-100 rounded hover:bg-red-200"
        >
          <i className="fas fa-stop text-red-600"></i>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ProcessCanvas
          process={process}
          selectedNodeId={selectedNode?.id}
          selectedEdgeId={selectedEdge?.id}
          onNodeSelect={setSelectedNode}
          onEdgeSelect={setSelectedEdge}
          onNodeMove={(nodeId, x, y) => updateNode(nodeId, { position: { x, y } })}
          onNodeDelete={deleteNode}
          onAddEdge={addEdge}
          canConnect={canConnect}
        />

        {/* Validation Banner */}
        {validationErrors.length > 0 && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 rounded p-3">
            <h3 className="font-bold text-red-800 mb-2">Validation Errors:</h3>
            <ul className="text-red-700">
              {validationErrors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        {selectedNode ? (
          <NodePropertyPanel
            node={selectedNode}
            variables={process?.variables || []}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        ) : selectedEdge ? (
          <EdgePropertyPanel
            edge={selectedEdge}
            variables={process?.variables || []}
            onUpdate={(updates) => {
              setProcess({
                ...process!,
                edges: process!.edges.map(e =>
                  e.id === selectedEdge.id ? { ...e, ...updates } : e
                ),
              });
            }}
          />
        ) : (
          <ProcessPropertyPanel
            process={process}
            onUpdate={(updates) => setProcess({ ...process!, ...updates })}
            onPublish={() => publishProcess()}
            validationErrors={validationErrors}
          />
        )}

        {/* Variables Panel */}
        <div className="border-t p-4">
          <h3 className="font-bold mb-3">Variables</h3>
          <VariablesPanel
            variables={process?.variables || []}
            onAddVariable={(variable) =>
              setProcess({
                ...process!,
                variables: [...(process?.variables || []), variable],
              })
            }
            onUpdateVariable={(name, updates) =>
              setProcess({
                ...process!,
                variables: process!.variables.map(v =>
                  v.name === name ? { ...v, ...updates } : v
                ),
              })
            }
            onDeleteVariable={(name) =>
              setProcess({
                ...process!,
                variables: process!.variables.filter(v => v.name !== name),
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
```

### 2. ProcessCanvas.tsx (SVG Canvas)

```tsx
export const ProcessCanvas: React.FC<{
  process?: ProcessDefinition;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  onNodeSelect: (node: Node) => void;
  onEdgeSelect: (edge: Edge) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeDelete: (nodeId: string) => void;
  onAddEdge: (sourceId: string, targetId: string) => void;
  canConnect: (sourceId: string, targetId: string) => boolean;
}> = ({
  process,
  selectedNodeId,
  selectedEdgeId,
  onNodeSelect,
  onEdgeSelect,
  onNodeMove,
  onNodeDelete,
  onAddEdge,
  canConnect,
}) => {
  const [connectionMode, setConnectionMode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    // Handle drag to move node
  };

  const handleNodeRightClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const node = process?.nodes.find(n => n.id === nodeId);
    if (node) {
      onNodeSelect(node);
      // Show context menu
    }
  };

  const handleNodeOutputClick = (nodeId: string) => {
    if (connectionMode === nodeId) {
      setConnectionMode(null);
    } else {
      setConnectionMode(nodeId);
    }
  };

  const handleNodeInputClick = (targetId: string) => {
    if (connectionMode && canConnect(connectionMode, targetId)) {
      onAddEdge(connectionMode, targetId);
      setConnectionMode(null);
    }
  };

  if (!process) return null;

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Draw edges */}
      {process.edges.map((edge) => {
        const source = process.nodes.find(n => n.id === edge.source);
        const target = process.nodes.find(n => n.id === edge.target);
        if (!source || !target) return null;

        const isSelected = selectedEdgeId === edge.id;
        const path = calculatePath(source.position, target.position);

        return (
          <g key={edge.id}>
            <path
              d={path}
              stroke={isSelected ? '#2563eb' : '#d1d5db'}
              strokeWidth={isSelected ? 3 : 2}
              fill="none"
              markerEnd="url(#arrowhead)"
              onClick={() => onEdgeSelect(edge)}
              className="cursor-pointer hover:stroke-blue-500"
            />
            {edge.condition && (
              <text
                x={(source.position.x + target.position.x) / 2}
                y={(source.position.y + target.position.y) / 2 - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600 bg-white"
              >
                {edge.condition}
              </text>
            )}
          </g>
        );
      })}

      {/* Draw nodes */}
      {process.nodes.map((node) => (
        <g key={node.id}>
          <NodeComponent
            node={node}
            isSelected={selectedNodeId === node.id}
            isConnecting={connectionMode === node.id}
            onSelect={() => onNodeSelect(node)}
            onRightClick={(e) => handleNodeRightClick(e, node.id)}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onOutputClick={() => handleNodeOutputClick(node.id)}
            onInputClick={() => handleNodeInputClick(node.id)}
            onDelete={() => onNodeDelete(node.id)}
          />
        </g>
      ))}

      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#d1d5db" />
        </marker>
      </defs>
    </svg>
  );
};
```

### 3. NodeComponent.tsx (Individual Node)

```tsx
export const NodeComponent: React.FC<{
  node: Node;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onOutputClick: () => void;
  onInputClick: () => void;
  onDelete: () => void;
}> = ({
  node,
  isSelected,
  isConnecting,
  onSelect,
  onRightClick,
  onMouseDown,
  onOutputClick,
  onInputClick,
  onDelete,
}) => {
  const nodeConfig = getNodeConfig(node.type);
  const x = node.position.x;
  const y = node.position.y;
  const width = 120;
  const height = 60;

  return (
    <g>
      {/* Node body */}
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx="4"
        fill={isSelected ? nodeConfig.colorSelected : nodeConfig.color}
        stroke={isSelected ? '#2563eb' : '#ccc'}
        strokeWidth={isSelected ? 2 : 1}
        onClick={onSelect}
        onContextMenu={onRightClick}
        onMouseDown={onMouseDown}
        className="cursor-move hover:opacity-80 transition"
      />

      {/* Node icon */}
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        className="text-lg"
        pointerEvents="none"
      >
        {nodeConfig.icon}
      </text>

      {/* Node label */}
      <text
        x={x}
        y={y + 15}
        textAnchor="middle"
        className="text-xs font-semibold"
        pointerEvents="none"
      >
        {node.label}
      </text>

      {/* Input port (except start node) */}
      {node.type !== 'start' && (
        <circle
          cx={x}
          cy={y - height / 2}
          r="5"
          fill="#9ca3af"
          onClick={onInputClick}
          className="cursor-pointer hover:fill-blue-500"
        />
      )}

      {/* Output port (except end node) */}
      {node.type !== 'end' && (
        <circle
          cx={x}
          cy={y + height / 2}
          r="5"
          fill={isConnecting ? '#2563eb' : '#9ca3af'}
          onClick={onOutputClick}
          className="cursor-pointer hover:fill-blue-500"
        />
      )}
    </g>
  );
};

function getNodeConfig(type: string) {
  const configs: Record<string, any> = {
    start: { icon: '▶', color: '#dcfce7', colorSelected: '#bbf7d0', label: 'Start' },
    end: { icon: '⏹', color: '#fee2e2', colorSelected: '#fecaca', label: 'End' },
    service_task: { icon: '⚙', color: '#dbeafe', colorSelected: '#bfdbfe', label: 'Service Task' },
    script_task: { icon: '<>', color: '#e9d5ff', colorSelected: '#d8b4fe', label: 'Script Task' },
    decision: { icon: '◇', color: '#fed7aa', colorSelected: '#fdba74', label: 'Decision' },
    human_task: { icon: '👤', color: '#fbcfe8', colorSelected: '#f9a8d4', label: 'Human Task' },
    parallel_fork: { icon: '⊢', color: '#cffafe', colorSelected: '#a5f3fc', label: 'Fork' },
    parallel_join: { icon: '⊣', color: '#cffafe', colorSelected: '#a5f3fc', label: 'Join' },
  };

  return configs[type] || configs.service_task;
}
```

### 4. NodePropertyPanel.tsx (Node Configuration)

```tsx
export const NodePropertyPanel: React.FC<{
  node: Node;
  variables: Variable[];
  onUpdate: (updates: Partial<Node>) => void;
}> = ({ node, variables, onUpdate }) => {
  const [label, setLabel] = useState(node.label);
  const [nodeType, setNodeType] = useState(node.type);

  return (
    <div className="p-4">
      <h3 className="font-bold mb-4">Node Properties</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={nodeType}
            onChange={(e) => {
              setNodeType(e.target.value);
              onUpdate({ type: e.target.value as any });
            }}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="start">Start</option>
            <option value="end">End</option>
            <option value="service_task">Service Task</option>
            <option value="script_task">Script Task</option>
            <option value="decision">Decision</option>
            <option value="human_task">Human Task</option>
            <option value="parallel_fork">Parallel Fork</option>
            <option value="parallel_join">Parallel Join</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              onUpdate({ label: e.target.value });
            }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Type-specific properties */}
        {nodeType === 'service_task' && (
          <ServiceTaskProperties node={node} onUpdate={onUpdate} />
        )}
        {nodeType === 'script_task' && (
          <ScriptTaskProperties node={node} variables={variables} onUpdate={onUpdate} />
        )}
        {nodeType === 'decision' && (
          <DecisionProperties node={node} variables={variables} onUpdate={onUpdate} />
        )}
        {nodeType === 'human_task' && (
          <HumanTaskProperties node={node} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
};

// Service Task Properties
const ServiceTaskProperties: React.FC<any> = ({ node, onUpdate }) => {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Service</label>
        <select
          value={node.properties.service || ''}
          onChange={(e) =>
            onUpdate({
              properties: { ...node.properties, service: e.target.value },
            })
          }
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- Select Service --</option>
          <option value="crm.sendEmail">Send Email</option>
          <option value="crm.createTask">Create Task</option>
          <option value="crm.updateProperty">Update Property</option>
          <option value="crm.notifyAgent">Notify Agent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Input Parameters</label>
        <textarea
          value={JSON.stringify(node.properties.inputParams || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate({
                properties: { ...node.properties, inputParams: JSON.parse(e.target.value) },
              });
            } catch {}
          }}
          className="w-full px-3 py-2 border rounded font-mono text-xs"
          rows={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Output Variable</label>
        <input
          type="text"
          value={node.properties.outputVar || ''}
          onChange={(e) =>
            onUpdate({
              properties: { ...node.properties, outputVar: e.target.value },
            })
          }
          placeholder="e.g., taskId"
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </>
  );
};

// Script Task Properties
const ScriptTaskProperties: React.FC<any> = ({ node, variables, onUpdate }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Script (JavaScript)</label>
      <textarea
        value={node.properties.script || ''}
        onChange={(e) =>
          onUpdate({
            properties: { ...node.properties, script: e.target.value },
          })
        }
        placeholder="// JavaScript code here&#10;return {result: true};"
        className="w-full px-3 py-2 border rounded font-mono text-xs"
        rows={8}
      />
      <p className="text-xs text-gray-500 mt-2">
        Available variables: {variables.map(v => `${v.name} (${v.type})`).join(', ')}
      </p>
    </div>
  );
};

// Decision Properties
const DecisionProperties: React.FC<any> = ({ node, variables, onUpdate }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Condition (Expression Language)</label>
      <textarea
        value={node.properties.condition || ''}
        onChange={(e) =>
          onUpdate({
            properties: { ...node.properties, condition: e.target.value },
          })
        }
        placeholder="${approvalStatus} == 'approved'"
        className="w-full px-3 py-2 border rounded font-mono text-xs"
        rows={6}
      />
      <p className="text-xs text-gray-500 mt-2">
        Use ${'{variableName}'} syntax. Variables: {variables.map(v => v.name).join(', ')}
      </p>
    </div>
  );
};

// Human Task Properties
const HumanTaskProperties: React.FC<any> = ({ node, onUpdate }) => {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Task Name</label>
        <input
          type="text"
          value={node.properties.taskName || ''}
          onChange={(e) =>
            onUpdate({
              properties: { ...node.properties, taskName: e.target.value },
            })
          }
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assigned To</label>
        <select
          value={node.properties.assignUser || ''}
          onChange={(e) =>
            onUpdate({
              properties: { ...node.properties, assignUser: e.target.value },
            })
          }
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- Select User --</option>
          <option value="current_user">Current User</option>
          <option value="agent">Related Agent</option>
          <option value="role:manager">Manager (by role)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Form (Optional)</label>
        <select
          value={node.properties.formId || ''}
          onChange={(e) =>
            onUpdate({
              properties: { ...node.properties, formId: e.target.value },
            })
          }
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- No Form --</option>
          <option value="form_1">Approval Form</option>
          <option value="form_2">Feedback Form</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Due Date (days)</label>
        <input
          type="number"
          value={node.properties.dueDays || 1}
          onChange={(e) =>
            onUpdate({
              properties: { ...node.properties, dueDays: parseInt(e.target.value) },
            })
          }
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </>
  );
};
```

### 5. VariablesPanel.tsx (Variable Management)

```tsx
export const VariablesPanel: React.FC<{
  variables: Variable[];
  onAddVariable: (variable: Variable) => void;
  onUpdateVariable: (name: string, updates: Partial<Variable>) => void;
  onDeleteVariable: (name: string) => void;
}> = ({ variables, onAddVariable, onUpdateVariable, onDeleteVariable }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<'string' | 'number' | 'boolean'>('string');

  const handleAdd = () => {
    if (newVarName.trim()) {
      onAddVariable({
        name: newVarName,
        type: newVarType,
      });
      setNewVarName('');
      setShowAdd(false);
    }
  };

  return (
    <div>
      {variables.length === 0 ? (
        <p className="text-xs text-gray-500 mb-3">No variables defined</p>
      ) : (
        <div className="space-y-2 mb-3">
          {variables.map((variable) => (
            <div key={variable.name} className="p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm">{variable.name}</div>
                  <div className="text-xs text-gray-500">{variable.type}</div>
                </div>
                <button
                  onClick={() => onDeleteVariable(variable.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full text-blue-600 text-sm py-2 border-t text-center hover:bg-gray-50"
        >
          + Add Variable
        </button>
      ) : (
        <div className="p-2 border-t space-y-2">
          <input
            type="text"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            placeholder="Variable name"
            className="w-full px-2 py-1 text-sm border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={newVarType}
            onChange={(e) => setNewVarType(e.target.value as any)}
            className="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 bg-gray-300 text-sm py-1 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## Process Validation

### Backend Validation (Orchestrator/Validators)

```php
class ProcessValidator
{
    /**
     * Validate process definition
     */
    public function validate(ProcessDefinition $process): ValidationResult
    {
        $errors = [];

        // 1. Check start node exists and is unique
        $startNodes = $process->nodes->where('type', 'start');
        if ($startNodes->count() !== 1) {
            $errors[] = "Process must have exactly one start node";
        }

        // 2. Check end node exists and is reachable from start
        $endNodes = $process->nodes->where('type', 'end');
        if ($endNodes->count() === 0) {
            $errors[] = "Process must have at least one end node";
        }

        foreach ($endNodes as $endNode) {
            if (!$this->isReachable($process, $startNodes[0], $endNode)) {
                $errors[] = "End node '{$endNode->id}' is not reachable from start node";
            }
        }

        // 3. Check no orphaned nodes
        foreach ($process->nodes as $node) {
            if ($node->type !== 'start' && !$this->hasIncomingEdge($process, $node)) {
                $errors[] = "Node '{$node->id}' is unreachable (no incoming edges)";
            }
            if ($node->type !== 'end' && !$this->hasOutgoingEdge($process, $node)) {
                $errors[] = "Node '{$node->id}' is a dead end (no outgoing edges)";
            }
        }

        // 4. Check decision nodes have conditions
        foreach ($process->nodes->where('type', 'decision') as $decision) {
            $outgoing = $process->edges->where('source', $decision->id);
            if ($outgoing->count() < 2) {
                $errors[] = "Decision node '{$decision->id}' must have at least 2 branches";
            }
            foreach ($outgoing as $edge) {
                if (empty($edge->condition)) {
                    $errors[] = "Edge '{$edge->id}' from decision must have a condition";
                }
            }
        }

        // 5. Check variable types in expressions
        foreach ($process->nodes as $node) {
            if ($node->type === 'decision' || $node->type === 'script_task') {
                $result = $this->validateExpression($node->properties['condition'] ?? $node->properties['script'], $process->variables);
                if (!$result->isValid) {
                    $errors[] = "Node '{$node->id}': {$result->error}";
                }
            }
        }

        // 6. Check join nodes have multiple incoming edges
        foreach ($process->nodes->where('type', 'parallel_join') as $join) {
            $incoming = $process->edges->where('target', $join->id);
            if ($incoming->count() < 2) {
                $errors[] = "Join node '{$join->id}' must have at least 2 incoming edges";
            }
        }

        return new ValidationResult(empty($errors), $errors);
    }

    private function isReachable(ProcessDefinition $process, Node $start, Node $end): bool
    {
        $visited = [];
        return $this->dfs($process, $start, $end, $visited);
    }

    private function dfs(ProcessDefinition $process, Node $current, Node $target, array &$visited): bool
    {
        if ($current->id === $target->id) {
            return true;
        }

        $visited[] = $current->id;
        $outgoing = $process->edges->where('source', $current->id);

        foreach ($outgoing as $edge) {
            $next = $process->nodes->find('id', $edge->target);
            if ($next && !in_array($next->id, $visited)) {
                if ($this->dfs($process, $next, $target, $visited)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function hasIncomingEdge(ProcessDefinition $process, Node $node): bool
    {
        return $process->edges->where('target', $node->id)->isNotEmpty();
    }

    private function hasOutgoingEdge(ProcessDefinition $process, Node $node): bool
    {
        return $process->edges->where('source', $node->id)->isNotEmpty();
    }

    private function validateExpression(string $expr, array $variables): ExpressionValidationResult
    {
        // Use ExpressionLanguage to validate
        // Check if all referenced variables exist and have correct types
    }
}
```

## Process Publishing Workflow

```
Draft → [USER PUBLISHES] → Published → [USER CREATES NEW VERSION] → Draft (v2)
                                           ↓
                                      [CAN DEPRECATE] → Deprecated

Only Published processes can be:
- Executed by orchestrator
- Used in incident flows
- Referenced in decision trees

Draft processes:
- Can be edited freely
- Cannot be executed
- Cannot be referenced

Deprecated processes:
- Locked (no edits)
- Cannot be executed
- Visible in history/archive
```

## Next Steps

1. Complete ProcessCanvas React component with drag-and-drop
2. Implement edge drawing algorithm (Bezier curves)
3. Add process validation UI with error highlighting
4. Implement process persistence (save/load)
5. Add undo/redo support
6. Create versioning UI
7. Add expression language editor with autocomplete
8. Integrate with orchestrator runtime
