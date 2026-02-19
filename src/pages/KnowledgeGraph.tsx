import { useEffect, useRef, useState, useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import {
  ArrowLeft, Network, Info, Maximize, Plus, Minus, X,
  Filter, Map as MapIcon, BookOpen, Key, MapPin, GitBranch, ExternalLink, BookOpenCheck,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types for graph data ──

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: 'fundamentals' | 'advanced' | 'practical' | 'theory';
  definition: string;
  keypoints: string[];
  waypoints: string[]; // waypoint titles this concept appears in
  waypointIds: string[]; // waypoint IDs for navigation
  tags: string[];
  isCharted: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: 'prerequisite' | 'related';
  sharedTags: string[];
}

const categoryColors = {
  fundamentals: '#60a5fa',
  advanced: '#d4a953',
  practical: '#4ade80',
  theory: '#f472b6',
};

const categoryLabels = {
  fundamentals: 'Fundamentals',
  advanced: 'Advanced',
  practical: 'Practical',
  theory: 'Theory',
};

// ── Helpers ──

/** Infer a category from key takeaways text */
function inferCategory(takeawaysJson?: string): GraphNode['category'] {
  if (!takeawaysJson) return 'practical';
  const text = takeawaysJson.toLowerCase();
  if (text.includes('fundamental') || text.includes('basic') || text.includes('introduction') || text.includes('beginner'))
    return 'fundamentals';
  if (text.includes('advanced') || text.includes('complex') || text.includes('optimization') || text.includes('architecture'))
    return 'advanced';
  if (text.includes('theory') || text.includes('concept') || text.includes('abstract') || text.includes('principle'))
    return 'theory';
  return 'practical';
}

export default function KnowledgeGraph() {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Batch graph data state to avoid multiple re-renders
  type GraphState = {
    isLoading: boolean;
    graphNodes: GraphNode[];
    graphLinks: GraphLink[];
  };
  type GraphAction =
    | { type: 'LOADING' }
    | { type: 'LOADED'; nodes: GraphNode[]; links: GraphLink[] }
    | { type: 'ERROR' };

  const [graphState, dispatchGraph] = useReducer(
    (state: GraphState, action: GraphAction): GraphState => {
      switch (action.type) {
        case 'LOADING':
          return { ...state, isLoading: true };
        case 'LOADED':
          return { isLoading: false, graphNodes: action.nodes, graphLinks: action.links };
        case 'ERROR':
          return { ...state, isLoading: false };
        default:
          return state;
      }
    },
    { isLoading: true, graphNodes: [], graphLinks: [] }
  );

  const { isLoading, graphNodes, graphLinks } = graphState;

  const [filters, setFilters] = useState({
    fundamentals: true,
    advanced: true,
    practical: true,
    theory: true,
  });

  // Load real data from database
  const loadGraphData = useCallback(async () => {
    if (!window.atlased) return;
    dispatchGraph({ type: 'LOADING' });
    try {
      const data = await window.atlased.knowledgeGraph.getData();

      // Build a tag map: waypointId → tag names
      const tagsByWaypoint = new Map<string, string[]>();
      for (const wt of data.waypointTags) {
        const tags = tagsByWaypoint.get(wt.waypoint_id) || [];
        tags.push(wt.tag_name);
        tagsByWaypoint.set(wt.waypoint_id, tags);
      }

      // Build nodes — one per waypoint that has a field guide
      const nodes: GraphNode[] = data.waypoints.map(wp => {
        let keypoints: string[] = [];
        try {
          if (wp.key_takeaways) {
            const raw = JSON.parse(wp.key_takeaways);
            // key_takeaways can be strings[] or {title, explanation, tags}[]
            keypoints = (Array.isArray(raw) ? raw : []).map((item: any) =>
              typeof item === 'string' ? item : (item?.title || item?.explanation || String(item))
            );
          }
        } catch { /* ignore */ }

        return {
          id: wp.id,
          name: wp.title.replace(/^\d+[\.\)\-\s]+/, '').substring(0, 40) + (wp.title.length > 40 ? '…' : ''),
          category: inferCategory(wp.key_takeaways),
          definition: wp.executive_summary || 'No summary available.',
          keypoints,
          waypoints: [wp.title],
          waypointIds: [wp.id],
          tags: tagsByWaypoint.get(wp.id) || [],
          isCharted: wp.is_charted === 1,
        };
      });

      // Build links — connect waypoints that share tags
      const links: GraphLink[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const sharedTags = nodes[i].tags.filter(t => nodes[j].tags.includes(t));
          if (sharedTags.length > 0) {
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              type: sharedTags.length >= 2 ? 'prerequisite' : 'related',
              sharedTags,
            });
          }
        }
      }

      dispatchGraph({ type: 'LOADED', nodes, links });
    } catch (error) {
      console.error('Failed to load knowledge graph data:', error);
      dispatchGraph({ type: 'ERROR' });
    }
  }, []);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Render D3 graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphNodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Preserve current zoom transform before clearing
    const previousTransform = d3.zoomTransform(svgRef.current);

    // Clear existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Main group — created before zoom so the handler can reference it
    const g = svg.append("g");

    // Apply previous transform to g immediately so it renders at the right position
    if (previousTransform.k !== 1 || previousTransform.x !== 0 || previousTransform.y !== 0) {
      g.attr("transform", previousTransform.toString());
    }

    // Create zoom behavior and store in ref
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(Math.round(event.transform.k * 100));
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Restore previous transform into the zoom behavior so subsequent
    // zoom/pan operations continue from the correct baseline
    if (previousTransform.k !== 1 || previousTransform.x !== 0 || previousTransform.y !== 0) {
      svg.call(zoom.transform, previousTransform);
    }

    // Deep-clone nodes and links so D3 doesn't mutate React state
    const filteredNodes: GraphNode[] = graphNodes
      .filter(node => filters[node.category])
      .map(n => ({ ...n }));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks: GraphLink[] = graphLinks
      .filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      })
      .map(l => ({ ...l }));

    // Create simulation
    const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Draw links
    const link = g.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("class", "graph-link")
      .attr("stroke", (d: any) => d.type === 'prerequisite' ? '#737373' : '#d4a953')
      .attr("stroke-width", (d: any) => d.type === 'prerequisite' ? 2 : 1.5)
      .attr("stroke-dasharray", (d: any) => d.type === 'related' ? '5,5' : null);

    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node glow for charted nodes
    node.filter((d: GraphNode) => d.isCharted)
      .append("circle")
      .attr("r", 26)
      .attr("fill", "none")
      .attr("stroke", (d: GraphNode) => categoryColors[d.category])
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    // Node circles
    node.append("circle")
      .attr("r", 22)
      .attr("fill", (d: GraphNode) => categoryColors[d.category])
      .attr("fill-opacity", (d: GraphNode) => d.isCharted ? 1 : 0.5)
      .attr("stroke", "#1a1a1a")
      .attr("stroke-width", 3)
      .attr("class", "node-circle");

    // Node labels
    node.append("text")
      .attr("class", "node-label")
      .attr("dy", 38)
      .attr("text-anchor", "middle")
      .style("fill", "#a3a3a3")
      .style("font-size", "11px")
      .style("font-family", "Satoshi, sans-serif")
      .text((d: GraphNode) => d.name);

    // Node interactions
    node.on("click", function (_event: any, d: GraphNode) {
      _event.stopPropagation();
      setSelectedNode(d);
    });

    // Click background to deselect
    svg.on("click", () => {
      setSelectedNode(null);
    });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [filters, graphNodes, graphLinks]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svgRef.current);
    const newScale = direction === 'in'
      ? Math.min(currentTransform.k * 1.3, 3)
      : Math.max(currentTransform.k / 1.3, 0.3);

    svg.transition().duration(300).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale)
    );
  };

  const handleResetView = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity
    );
  };

  const toggleFilter = (category: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="h-screen bg-atlas-bg-primary flex flex-col overflow-hidden">
      {/* Title Bar */}
      <header className="h-14 bg-atlas-bg-secondary border-b border-atlas-border flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-atlas-gold flex items-center justify-center">
            <Network className="w-[18px] h-[18px] text-atlas-bg-primary" />
          </div>
          {/* Divider */}
          <div className="w-px h-5 bg-atlas-border" />
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-atlas-text-secondary hover:text-atlas-text-primary transition-colors duration-200"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            <span className="font-body text-sm">Back to Expedition</span>
          </button>
        </div>

        {/* Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Network className="w-[18px] h-[18px] text-atlas-gold" />
          <h1 className="font-display font-bold text-atlas-text-primary text-base tracking-wide">The Atlas</h1>
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={cn(
              "w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-200",
              showLegend
                ? "bg-atlas-gold/10 border-atlas-gold/50 text-atlas-gold"
                : "bg-atlas-bg-tertiary border-atlas-border hover:border-atlas-gold/50 text-atlas-text-secondary"
            )}
            title="Toggle Legend"
          >
            <Info className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={handleResetView}
            className="w-9 h-9 rounded-lg bg-atlas-bg-tertiary border border-atlas-border hover:border-atlas-gold/50 flex items-center justify-center transition-all duration-200"
            title="Reset View"
          >
            <Maximize className="w-[18px] h-[18px] text-atlas-text-secondary" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Area */}
        <main className="flex-1 relative graph-container">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-atlas-bg-primary/80">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-atlas-gold animate-spin" />
                <p className="text-sm text-atlas-text-secondary">Loading knowledge graph...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && graphNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center mx-auto mb-4">
                  <Network className="w-8 h-8 text-atlas-gold" />
                </div>
                <h3 className="font-display font-bold text-atlas-text-primary text-lg mb-2">No Knowledge Yet</h3>
                <p className="text-sm text-atlas-text-secondary leading-relaxed">
                  The Atlas will populate as you generate Field Guides for your waypoints.
                  Start watching videos and creating guides to see your knowledge graph grow!
                </p>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          {graphNodes.length > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <div className="glass-panel rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-atlas-gold" />
                  <span className="font-display font-semibold text-atlas-text-primary text-sm">Filters</span>
                </div>
                <div className="space-y-2">
                  {(Object.keys(filters) as Array<keyof typeof filters>).map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters[category]}
                        onChange={() => toggleFilter(category)}
                        className="w-4 h-4 rounded border-atlas-border bg-atlas-bg-tertiary text-atlas-gold focus:ring-atlas-gold/50"
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: categoryColors[category] }}
                      />
                      <span className="font-body text-sm text-atlas-text-secondary group-hover:text-atlas-text-primary transition-colors">
                        {categoryLabels[category]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legend Panel */}
          {showLegend && (
            <div className="absolute top-4 right-4 z-10 animate-slide-in">
              <div className="glass-panel rounded-xl p-4 shadow-xl w-64">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-atlas-gold" />
                    <span className="font-display font-semibold text-atlas-text-primary text-sm">Legend</span>
                  </div>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="text-atlas-text-muted hover:text-atlas-text-primary transition-colors"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-body text-xs text-atlas-text-muted uppercase tracking-wider mb-2">Node Types</p>
                    <div className="space-y-2">
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: categoryColors[key as keyof typeof categoryColors] }}
                          />
                          <span className="font-body text-xs text-atlas-text-secondary">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-atlas-border pt-3">
                    <p className="font-body text-xs text-atlas-text-muted uppercase tracking-wider mb-2">Connection Types</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-px bg-atlas-text-muted/40" />
                        <span className="font-body text-xs text-atlas-text-secondary">Strong (2+ shared tags)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-px bg-atlas-gold/60 border-t border-dashed border-atlas-gold/60" />
                        <span className="font-body text-xs text-atlas-text-secondary">Related (1 shared tag)</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-atlas-border pt-3">
                    <p className="font-body text-xs text-atlas-text-muted uppercase tracking-wider mb-2">Interactions</p>
                    <div className="space-y-1.5">
                      <p className="font-body text-xs text-atlas-text-muted">• Click node to view details</p>
                      <p className="font-body text-xs text-atlas-text-muted">• Drag nodes to rearrange</p>
                      <p className="font-body text-xs text-atlas-text-muted">• Scroll to zoom, drag to pan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => handleZoom('in')}
              className="w-10 h-10 rounded-xl bg-atlas-bg-tertiary border border-atlas-border hover:border-atlas-gold/50 hover:bg-atlas-bg-secondary flex items-center justify-center transition-all duration-200 shadow-lg"
            >
              <Plus className="w-[18px] h-[18px] text-atlas-text-secondary" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="w-10 h-10 rounded-xl bg-atlas-bg-tertiary border border-atlas-border hover:border-atlas-gold/50 hover:bg-atlas-bg-secondary flex items-center justify-center transition-all duration-200 shadow-lg"
            >
              <Minus className="w-[18px] h-[18px] text-atlas-text-secondary" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center">
              <span className="font-mono text-xs text-atlas-text-muted">{zoomLevel}%</span>
            </div>
          </div>

          {/* Graph Stats */}
          {graphNodes.length > 0 && (
            <div className="absolute bottom-4 left-20 z-10">
              <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-atlas-gold" />
                  <span className="font-body text-xs text-atlas-text-secondary">
                    <span className="text-atlas-text-primary font-medium">{graphNodes.length}</span> waypoints
                  </span>
                </div>
                <div className="w-px h-4 bg-atlas-border" />
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-atlas-text-muted" />
                  <span className="font-body text-xs text-atlas-text-secondary">
                    <span className="text-atlas-text-primary font-medium">{graphLinks.length}</span> connections
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* D3 Graph Container */}
          <div ref={containerRef} className="w-full h-full">
            <svg ref={svgRef} className="w-full h-full" />
          </div>
        </main>

        {/* Sidebar - Node Details */}
        {selectedNode && (
          <aside className="w-80 bg-atlas-bg-secondary border-l border-atlas-border flex flex-col shrink-0 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-atlas-border">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-atlas-bg-tertiary border border-atlas-border text-xs font-medium">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: categoryColors[selectedNode.category] }}
                    />
                    <span className="text-atlas-text-secondary">{categoryLabels[selectedNode.category]}</span>
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-atlas-text-muted hover:text-atlas-text-primary transition-colors"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                </div>
                <h2 className="font-display font-bold text-xl text-atlas-text-primary leading-tight mb-2">{selectedNode.name}</h2>
                {selectedNode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedNode.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-atlas-gold/10 text-atlas-gold border border-atlas-gold/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Summary */}
                <section>
                  <h3 className="font-display font-semibold text-atlas-text-primary text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-atlas-gold" />
                    Summary
                  </h3>
                  <p className="font-body text-sm text-atlas-text-secondary leading-relaxed">
                    {selectedNode.definition}
                  </p>
                </section>

                {/* Key Points */}
                {selectedNode.keypoints.length > 0 && (
                  <section>
                    <h3 className="font-display font-semibold text-atlas-text-primary text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4 text-atlas-gold" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-2">
                      {selectedNode.keypoints.slice(0, 5).map((point) => (
                        <li key={point.slice(0, 60)} className="flex items-start gap-2 text-sm">
                          <span className="text-atlas-gold mt-1.5">•</span>
                          <span className="font-body text-atlas-text-secondary">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-atlas-border space-y-2">
                <button
                  onClick={() => {
                    if (selectedNode.waypointIds[0]) {
                      navigate(`/player/${selectedNode.waypointIds[0]}`);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-display font-semibold text-sm transition-all duration-200"
                >
                  Go to Waypoint
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
