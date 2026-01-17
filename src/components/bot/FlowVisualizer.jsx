import React, { useMemo, useState } from 'react';
import { GitBranch, MessageSquare, UserCheck, LogOut, Database, Code, ArrowRight, Search } from 'lucide-react';

const FlowVisualizer = ({ flow, onNodeClick, theme }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Calculate Layout
    const layout = useMemo(() => {
        if (!flow?.nodes) return { nodes: [], links: [] };

        const nodes = [...flow.nodes];
        const links = [];
        const nodeMap = new Map();

        // Initialize positions
        nodes.forEach(n => nodeMap.set(n.id, { ...n, x: 0, y: 0, level: 0 }));

        // Identify Levels (BFS)
        // Start nodes are those with type 'start' or no incoming connections (simplified)
        const startNode = nodes.find(n => n.type === 'start') || nodes[0];

        if (startNode) {
            const queue = [{ id: startNode.id, level: 0 }];
            const visited = new Set();
            visited.add(startNode.id);

            while (queue.length > 0) {
                const { id, level } = queue.shift();
                const node = nodeMap.get(id);
                if (node) {
                    node.level = level;

                    // Find children
                    const childrenIds = [];
                    if (node.nextNodeId) childrenIds.push(node.nextNodeId);
                    if (node.options) {
                        node.options.forEach(opt => {
                            if (opt.nextNodeId) childrenIds.push(Number(opt.nextNodeId));
                        });
                    }

                    childrenIds.forEach(childId => {
                        links.push({ source: id, target: childId });
                        if (!visited.has(childId)) {
                            visited.add(childId);
                            queue.push({ id: childId, level: level + 1 });
                        }
                    });
                }
            }
        }

        // Assign X positions based on level groups
        const levels = {};
        nodeMap.forEach(n => {
            if (!levels[n.level]) levels[n.level] = [];
            levels[n.level].push(n);
        });

        const NODE_WIDTH = 180;
        const NODE_HEIGHT = 80;
        const GAP_X = 50;
        const GAP_Y = 100;

        let maxY = 0;

        Object.keys(levels).sort((a, b) => a - b).forEach(level => {
            const levelNodes = levels[level];
            const levelHeight = levelNodes.length * (NODE_HEIGHT + GAP_X);
            const startY = (window.innerHeight / 2) - (levelHeight / 2); // Center vertically? No, simpler to just stack

            levelNodes.forEach((n, idx) => {
                n.x = Number(level) * (NODE_WIDTH + GAP_Y) + 50;
                n.y = idx * (NODE_HEIGHT + GAP_X) + 50;

                // Simple collision avoidance for same level
                // Better: keep track of Y per level
            });
        });

        return {
            nodes: Array.from(nodeMap.values()),
            links
        };

    }, [flow]);

    // Simple Render
    const styles = {
        container: {
            width: '100%',
            height: '100%',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #eee',
            position: 'relative',
            overflow: 'auto',
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        },
        node: {
            position: 'absolute',
            width: '180px',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: '0.2s',
            fontSize: '12px',
            zIndex: 10
        }
    };

    const getNodeColor = (type) => {
        switch (type) {
            case 'start': return '#0ea5e9';
            case 'api': return '#8b5cf6';
            case 'menu': return '#f59e0b';
            case 'finish': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getNodeIcon = (type) => {
        switch (type) {
            case 'start': return <GitBranch size={16} />;
            case 'api': return <Database size={16} />;
            case 'menu': return <Code size={16} />;
            case 'finish': return <LogOut size={16} />;
            default: return <MessageSquare size={16} />;
        }
    };

    return (
        <div style={styles.container}>
            {/* Search Bar */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 100,
                backgroundColor: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #e2e8f0'
            }}>
                <Search size={16} color="#64748b" />
                <input
                    type="text"
                    placeholder="Buscar nó..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '13px',
                        width: '150px',
                        color: '#334155'
                    }}
                />
            </div>

            <svg style={{ position: 'absolute', top: 0, left: 0, width: '2000px', height: '2000px', pointerEvents: 'none' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                    </marker>
                </defs>
                {layout.links.map((link, i) => {
                    const source = layout.nodes.find(n => n.id === link.source);
                    const target = layout.nodes.find(n => n.id === link.target);
                    if (!source || !target) return null;

                    return (
                        <path
                            key={i}
                            d={`M ${source.x + 180} ${source.y + 40} C ${source.x + 230} ${source.y + 40}, ${target.x - 50} ${target.y + 40}, ${target.x} ${target.y + 40}`}
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}
            </svg>

            {layout.nodes.map(node => {
                const matches = searchTerm && (
                    (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (node.content && node.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    String(node.id).includes(searchTerm)
                );

                return (
                    <div
                        key={node.id}
                        style={{
                            ...styles.node,
                            left: node.x,
                            top: node.y,
                            borderLeft: `4px solid ${getNodeColor(node.type)}`,
                            border: matches ? '2px solid #0084ff' : styles.node.border,
                            boxShadow: matches ? '0 0 0 4px rgba(0,132,255,0.2)' : styles.node.boxShadow,
                            transform: matches ? 'scale(1.05)' : 'scale(1)',
                            zIndex: matches ? 20 : 10
                        }}
                        onClick={() => onNodeClick(node)}
                        onMouseEnter={e => {
                            if (!matches) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!matches) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: getNodeColor(node.type), fontWeight: 'bold' }}>
                            {getNodeIcon(node.type)}
                            {node.type.toUpperCase()}
                        </div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {node.name || `Nó #${node.id}`}
                        </div>
                        <div style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {node.content || (node.type === 'api' ? 'Integração API' : 'Sem conteúdo')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FlowVisualizer;
