import React, { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, MessageSquare, UserCheck, LogOut, Database, Code, Settings } from 'lucide-react';

// --- Custom Node Components ---

const getNodeColor = (type) => {
    switch (type) {
        case 'start': return '#0ea5e9';
        case 'api': return '#8b5cf6';
        case 'menu': return '#f59e0b';
        case 'finish': return '#ef4444';
        case 'transfer': return '#d97706';
        case 'input': return '#059669';
        default: return '#64748b';
    }
};

const getNodeIcon = (type) => {
    switch (type) {
        case 'start': return <GitBranch size={16} />;
        case 'api': return <Database size={16} />;
        case 'menu': return <Code size={16} />;
        case 'finish': return <LogOut size={16} />;
        case 'transfer': return <UserCheck size={16} />;
        case 'input': return <Settings size={16} />;
        default: return <MessageSquare size={16} />;
    }
};

const CustomNode = ({ data, selected }) => {
    const { label, type, content, isMenu } = data;
    const color = getNodeColor(type);

    return (
        <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'white',
            border: `1px solid ${selected ? color : '#e2e8f0'}`,
            borderLeft: `5px solid ${color}`,
            boxShadow: selected ? `0 0 0 4px ${color}33` : '0 1px 3px rgba(0,0,0,0.1)',
            minWidth: '200px',
            maxWidth: '250px',
            transition: 'all 0.2s'
        }}>
            {/* Input Handle (Target) */}
            {type !== 'start' && (
                <Handle type="target" position={Position.Top} style={{ background: '#94a3b8' }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: color, fontWeight: 'bold', fontSize: '12px' }}>
                {getNodeIcon(type)}
                {type.toUpperCase()}
            </div>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#1e293b' }}>
                {label}
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {content || (type === 'api' ? 'Integração API' : '...')}
            </div>

            {/* Output Handle (Source) for non-menu nodes or general flow */}
            {!isMenu && type !== 'finish' && (
                <Handle type="source" position={Position.Bottom} id="main" style={{ background: color }} />
            )}

            {isMenu && (
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
                    (Conexões visíveis nas arestas)
                    <Handle type="source" position={Position.Bottom} id="menu-out" style={{ background: color }} />
                </div>
            )}
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// --- Main Component ---

const FlowVisualizer = ({ flow, onNodeClick, onNodeMove, onConnectionCreate }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Convert Backend Flow to React Flow Format
    useEffect(() => {
        if (!flow?.nodes) return;

        const rfNodes = flow.nodes.map(n => {
            // Resolve Position: Try root fields (if schema has them) -> config.position -> Default 0,0
            const x = n.positionX || n.config?.position?.x || 0;
            const y = n.positionY || n.config?.position?.y || 0;

            return {
                id: String(n.id),
                type: 'custom',
                position: { x, y },
                data: {
                    label: n.name || `Nó #${n.id}`,
                    type: n.type,
                    content: n.content,
                    isMenu: n.type === 'menu'
                },
            };
        });

        // If all 0,0, apply simple layout
        const allZero = rfNodes.every(n => n.position.x === 0 && n.position.y === 0);
        if (allZero && rfNodes.length > 0) {
            applyAutoLayout(rfNodes, flow.nodes);
        }

        const rfEdges = [];
        flow.nodes.forEach(n => {
            if (n.nextNodeId) {
                rfEdges.push({
                    id: `e${n.id}-${n.nextNodeId}`,
                    source: String(n.id),
                    target: String(n.nextNodeId),
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    animated: true
                });
            }
            if (n.options) {
                n.options.forEach(opt => {
                    if (opt.nextNodeId) {
                        rfEdges.push({
                            id: `e${n.id}-${opt.nextNodeId}-opt${opt.id}`,
                            source: String(n.id),
                            target: String(opt.nextNodeId),
                            label: opt.value, // Label on the line
                            type: 'smoothstep',
                            markerEnd: { type: MarkerType.ArrowClosed },
                            style: { strokeDasharray: 5 }
                        });
                    }
                });
            }
        });

        setNodes(rfNodes);
        setEdges(rfEdges);
    }, [flow, setNodes, setEdges]);

    // Simple Auto Layout
    const applyAutoLayout = (rfNodes, rawNodes) => {
        const nodeMap = new Map();
        rfNodes.forEach(n => nodeMap.set(n.id, { ...n, level: 0 }));

        const rawMap = new Map();
        rawNodes.forEach(rn => rawMap.set(String(rn.id), rn));

        // BFS for Levels
        const startNode = rawNodes.find(n => n.type === 'start') || rawNodes[0];
        if (startNode) {
            const queue = [{ id: String(startNode.id), level: 0 }];
            const visited = new Set([String(startNode.id)]);

            while (queue.length) {
                const { id, level } = queue.shift();
                const rfNode = nodeMap.get(id);
                if (rfNode) rfNode.level = level;

                const raw = rawMap.get(id);
                if (raw) {
                    const children = [];
                    if (raw.nextNodeId) children.push(String(raw.nextNodeId));
                    if (raw.options) raw.options.forEach(o => {
                        if (o.nextNodeId) children.push(String(o.nextNodeId));
                    });

                    children.forEach(childId => {
                        if (!visited.has(childId)) {
                            visited.add(childId);
                            queue.push({ id: childId, level: level + 1 });
                        }
                    });
                }
            }
        }

        // Position
        const levels = {};
        Array.from(nodeMap.values()).forEach(n => {
            if (!levels[n.level]) levels[n.level] = [];
            levels[n.level].push(n);
        });

        const NODE_WIDTH = 250;
        const NODE_HEIGHT = 100;
        const GAP_X = 50;
        const GAP_Y = 100;

        Object.keys(levels).forEach(lvl => {
            const levelNodes = levels[lvl];
            levelNodes.forEach((n, idx) => {
                n.position = {
                    x: Number(lvl) * (NODE_WIDTH + GAP_Y) + 50,
                    y: idx * (NODE_HEIGHT + GAP_X) + 50
                }
            });
        });
    };


    const onConnect = useCallback((params) => {
        // Callback to parent to handle logic (e.g., updating backend node 'nextNodeId')
        if (onConnectionCreate) {
            onConnectionCreate(params.source, params.target);
        }
        setEdges((eds) => addEdge(params, eds));
    }, [onConnectionCreate, setEdges]);

    const handleNodeDragStop = (event, node) => {
        if (onNodeMove) {
            onNodeMove(node.id, node.position);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#f8fafc' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => {
                    onNodeClick(node.id);
                }}
                onNodeDragStop={handleNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export default FlowVisualizer;
