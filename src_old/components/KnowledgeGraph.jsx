import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './KnowledgeGraph.css';

function KnowledgeGraph() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [filter, setFilter] = useState({
        fundamentals: true,
        advanced: true,
        practical: true,
        theory: true
    });

    // Mock data for the knowledge graph
    const [nodes] = useState([
        { id: 1, label: 'React', category: 'fundamentals', x: 50, y: 50, connections: [2, 3, 4], description: 'A JavaScript library for building user interfaces' },
        { id: 2, label: 'useState', category: 'fundamentals', x: 30, y: 30, connections: [5], description: 'Hook for managing state in functional components' },
        { id: 3, label: 'useEffect', category: 'fundamentals', x: 70, y: 30, connections: [6], description: 'Hook for side effects in functional components' },
        { id: 4, label: 'Components', category: 'fundamentals', x: 50, y: 80, connections: [7, 8], description: 'Reusable building blocks of React applications' },
        { id: 5, label: 'State Management', category: 'advanced', x: 20, y: 15, connections: [9], description: 'Patterns for managing application state' },
        { id: 6, label: 'Lifecycle', category: 'advanced', x: 80, y: 15, connections: [], description: 'Component lifecycle methods and hooks' },
        { id: 7, label: 'Props', category: 'fundamentals', x: 35, y: 95, connections: [], description: 'Data passed from parent to child components' },
        { id: 8, label: 'JSX', category: 'fundamentals', x: 65, y: 95, connections: [], description: 'JavaScript XML syntax for React' },
        { id: 9, label: 'Redux', category: 'advanced', x: 10, y: 5, connections: [], description: 'Predictable state container for JavaScript apps' }
    ]);

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 800);
    }, []);

    const getCategoryColor = (category) => {
        switch (category) {
            case 'fundamentals': return '#4ade80';
            case 'advanced': return '#d4a953';
            case 'practical': return '#60a5fa';
            case 'theory': return '#f472b6';
            default: return '#a3a3a3';
        }
    };

    const filteredNodes = nodes.filter(node => filter[node.category]);

    function handleNodeClick(node) {
        setSelectedNode(node);
    }

    if (isLoading) {
        return (
            <div className="knowledge-graph">
                <div className="kg-loading">
                    <div className="kg-loading-spinner"></div>
                    <p>Loading knowledge graph...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="knowledge-graph">
            {/* Header */}
            <header className="kg-header drag-region">
                <div className="kg-header-left no-drag">
                    <button className="kg-back-btn" onClick={() => navigate('/')}>
                        <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                    </button>
                    <div className="kg-logo">
                        <div className="kg-logo-icon">
                            <iconify-icon icon="lucide:compass"></iconify-icon>
                        </div>
                        <span className="kg-logo-text">AtlasED</span>
                    </div>
                </div>
                <div className="kg-header-title no-drag">
                    <iconify-icon icon="lucide:network"></iconify-icon>
                    <span>The Atlas - Knowledge Graph</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="kg-main">
                {/* Sidebar - Filters */}
                <aside className="kg-sidebar">
                    <div className="kg-sidebar-section">
                        <h3 className="kg-sidebar-title">
                            <iconify-icon icon="lucide:filter"></iconify-icon>
                            Filter Concepts
                        </h3>
                        
                        <div className="kg-filters">
                            <label className="kg-filter-item">
                                <input 
                                    type="checkbox" 
                                    checked={filter.fundamentals}
                                    onChange={(e) => setFilter({...filter, fundamentals: e.target.checked})}
                                />
                                <span className="kg-filter-color" style={{background: '#4ade80'}}></span>
                                <span>Fundamentals</span>
                            </label>
                            
                            <label className="kg-filter-item">
                                <input 
                                    type="checkbox" 
                                    checked={filter.advanced}
                                    onChange={(e) => setFilter({...filter, advanced: e.target.checked})}
                                />
                                <span className="kg-filter-color" style={{background: '#d4a953'}}></span>
                                <span>Advanced</span>
                            </label>
                            
                            <label className="kg-filter-item">
                                <input 
                                    type="checkbox" 
                                    checked={filter.practical}
                                    onChange={(e) => setFilter({...filter, practical: e.target.checked})}
                                />
                                <span className="kg-filter-color" style={{background: '#60a5fa'}}></span>
                                <span>Practical</span>
                            </label>
                            
                            <label className="kg-filter-item">
                                <input 
                                    type="checkbox" 
                                    checked={filter.theory}
                                    onChange={(e) => setFilter({...filter, theory: e.target.checked})}
                                />
                                <span className="kg-filter-color" style={{background: '#f472b6'}}></span>
                                <span>Theory</span>
                            </label>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="kg-sidebar-section">
                        <h3 className="kg-sidebar-title">
                            <iconify-icon icon="lucide:info"></iconify-icon>
                            About
                        </h3>
                        <p className="kg-about-text">
                            The Atlas visualizes connections between concepts you've learned. 
                            Nodes represent key ideas, and lines show relationships.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="kg-sidebar-section">
                        <h3 className="kg-sidebar-title">
                            <iconify-icon icon="lucide:bar-chart-2"></iconify-icon>
                            Statistics
                        </h3>
                        <div className="kg-stats">
                            <div className="kg-stat">
                                <span className="kg-stat-value">{nodes.length}</span>
                                <span className="kg-stat-label">Total Nodes</span>
                            </div>
                            <div className="kg-stat">
                                <span className="kg-stat-value">{filteredNodes.length}</span>
                                <span className="kg-stat-label">Visible</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Graph Area */}
                <div className="kg-graph-area">
                    <div className="kg-graph-container">
                        <svg className="kg-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                            {/* Connection Lines */}
                            {filteredNodes.map(node => 
                                node.connections.map(targetId => {
                                    const target = nodes.find(n => n.id === targetId);
                                    if (!target || !filter[target.category]) return null;
                                    return (
                                        <line
                                            key={`${node.id}-${targetId}`}
                                            x1={node.x}
                                            y1={node.y}
                                            x2={target.x}
                                            y2={target.y}
                                            stroke="#2a2a2a"
                                            strokeWidth="0.3"
                                        />
                                    );
                                })
                            )}
                            
                            {/* Nodes */}
                            {filteredNodes.map(node => (
                                <g 
                                    key={node.id}
                                    className={`kg-node ${selectedNode?.id === node.id ? 'kg-node-selected' : ''}`}
                                    onClick={() => handleNodeClick(node)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="4"
                                        fill={getCategoryColor(node.category)}
                                        stroke="#0f0f0f"
                                        strokeWidth="0.5"
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y + 7}
                                        textAnchor="middle"
                                        fill="#a3a3a3"
                                        fontSize="3"
                                        fontFamily="Satoshi, sans-serif"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Node Details Panel */}
                    {selectedNode && (
                        <div className="kg-details-panel">
                            <div className="kg-details-header">
                                <h3 className="kg-details-title">{selectedNode.label}</h3>
                                <button 
                                    className="kg-details-close"
                                    onClick={() => setSelectedNode(null)}
                                >
                                    <iconify-icon icon="lucide:x"></iconify-icon>
                                </button>
                            </div>
                            <div className="kg-details-content">
                                <div 
                                    className="kg-details-category"
                                    style={{ color: getCategoryColor(selectedNode.category) }}
                                >
                                    {selectedNode.category.charAt(0).toUpperCase() + selectedNode.category.slice(1)}
                                </div>
                                <p className="kg-details-description">{selectedNode.description}</p>
                                <div className="kg-details-connections">
                                    <span className="kg-details-label">Connections:</span>
                                    <span className="kg-details-value">{selectedNode.connections.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default KnowledgeGraph;
