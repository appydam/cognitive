"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Download,
  RefreshCw,
  Activity,
  TrendingUp,
  Globe,
  Building2,
  Layers,
  Eye,
  EyeOff,
  Briefcase,
} from "lucide-react";
import { downloadGraphCanvasAsPNG } from "@/lib/download";
import { ConsequenceAPI } from "@/lib/api";
import CascadeEffectsPanel from "@/components/CascadeEffectsPanel";
import { getPortfolio, hasPortfolio } from "@/lib/portfolio";

interface GraphNode {
  id: string;
  name: string;
  type: string;
  sector?: string;
  val: number;
  color: string;
  connectionCount: number;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
  relationship: string;
  delay_days: number;
  confidence: number;
  color: string;
  width: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Color palette
const TYPE_COLORS: Record<string, string> = {
  indicator: "#f59e0b",
  company: "#22c55e",
  etf: "#3b82f6",
  sector: "#a855f7",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  customer_of: "#60a5fa",
  in_sector: "#c084fc",
  competes_with: "#f87171",
  correlated: "#fbbf24",
  inverse_correlated: "#fb923c",
};

export default function GraphVisualization() {
  // All graph data (including orphans)
  const [allGraphData, setAllGraphData] = useState<GraphData | null>(null);
  // Currently displayed graph data (filtered)
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showOrphans, setShowOrphans] = useState(false);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [showCascadePanel, setShowCascadePanel] = useState(false);
  const [cascadeHighlight, setCascadeHighlight] = useState<Set<string>>(new Set());
  const [cascadeOrderMap, setCascadeOrderMap] = useState<Map<string, number>>(new Map());
  const [cascadeLinks, setCascadeLinks] = useState<Set<string>>(new Set());
  const [cacheInfo, setCacheInfo] = useState<{ isCached: boolean; ageMinutes: number | null } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showPortfolioHighlight, setShowPortfolioHighlight] = useState(false);
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 700 });
  const layoutDoneRef = useRef(false);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!allGraphData) return null;
    const companies = allGraphData.nodes.filter(n => n.type === "company").length;
    const etfs = allGraphData.nodes.filter(n => n.type === "etf").length;
    const sectors = allGraphData.nodes.filter(n => n.type === "sector").length;
    const indicators = allGraphData.nodes.filter(n => n.type === "indicator").length;
    const connected = allGraphData.nodes.filter(n => n.connectionCount > 0).length;
    const orphans = allGraphData.nodes.filter(n => n.connectionCount === 0).length;
    return {
      companies, etfs, sectors, indicators, connected, orphans,
      total: allGraphData.nodes.length,
      totalLinks: allGraphData.links.length,
      displayedNodes: graphData?.nodes.length || 0,
    };
  }, [allGraphData, graphData]);

  useEffect(() => {
    loadGraphData();
    updateCacheInfo();
  }, []);

  const updateCacheInfo = async () => {
    try {
      const { getCacheInfo } = await import('@/lib/graphCache');
      const info = getCacheInfo();
      setCacheInfo(info);
    } catch (err) {
      console.error('Failed to get cache info:', err);
    }
  };

  useEffect(() => {
    if (loading || !graphData) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) setDimensions({ width, height: 700 });
      }
    };
    const timer = setTimeout(updateDimensions, 50);
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        const { width } = entries[0].contentRect;
        if (width > 0) setDimensions({ width, height: 700 });
      });
      resizeObserver.observe(containerRef.current);
    }
    return () => { clearTimeout(timer); resizeObserver?.disconnect(); };
  }, [loading, graphData]);

  // Configure d3 forces
  useEffect(() => {
    if (!fgRef.current || !graphData) return;
    layoutDoneRef.current = false;
    const fg = fgRef.current;

    const nodeCount = graphData.nodes.length;
    // Adjust forces based on graph density
    const chargeStrength = nodeCount > 300 ? -800 : nodeCount > 100 ? -1200 : -1800;

    fg.d3Force('charge')?.strength(chargeStrength).distanceMax(600);
    fg.d3Force('link')?.distance(120).strength(0.6);
    fg.d3Force('center')?.strength(0.05);

    const d3 = require('d3-force');
    fg.d3Force('collision', d3.forceCollide().radius((node: any) => {
      return Math.sqrt(node.val) * 2 + 8;
    }));

    // Freeze after settling
    setTimeout(() => {
      if (fgRef.current && graphData) {
        fgRef.current.zoomToFit(800, 60);
        graphData.nodes.forEach((node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        });
        fgRef.current.d3Force('charge', null);
        fgRef.current.d3Force('link', null);
        fgRef.current.d3Force('center', null);
        fgRef.current.d3Force('collision', null);
        fgRef.current.cooldownTime(0);
        layoutDoneRef.current = true;
      }
    }, 4000);
  }, [graphData]);

  const loadGraphData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ConsequenceAPI.getFullGraph({ forceRefresh });

      // Calculate connection counts
      const connectionCounts: Record<string, number> = {};
      data.links.forEach((link) => {
        connectionCounts[link.source] = (connectionCounts[link.source] || 0) + 1;
        connectionCounts[link.target] = (connectionCounts[link.target] || 0) + 1;
      });

      // Build sector groups for clustering
      const sectorGroups: Record<string, number> = {};
      let sectorIndex = 0;
      data.nodes.forEach((node) => {
        const group = node.type === "indicator" ? "__indicators__" :
                      node.type === "etf" ? "__etfs__" :
                      node.type === "sector" ? "__sectors__" :
                      (node.sector || "__other__");
        if (!(group in sectorGroups)) {
          sectorGroups[group] = sectorIndex++;
        }
      });
      const totalGroups = Object.keys(sectorGroups).length;

      const allNodes: GraphNode[] = data.nodes.map((node) => {
        const connCount = connectionCounts[node.id] || 0;
        const type = node.type?.toLowerCase() || "company";

        // Size proportional to connections, with type-based minimums
        let baseSize: number;
        if (type === "indicator") {
          baseSize = 30 + connCount * 1.5;
        } else if (type === "sector") {
          baseSize = 25 + connCount * 1.2;
        } else if (type === "etf") {
          baseSize = 15 + connCount * 1;
        } else {
          // Companies: scale by connections, min size for visible dot
          baseSize = 8 + Math.min(connCount, 50) * 1.5;
        }

        // Cluster by sector
        const group = type === "indicator" ? "__indicators__" :
                      type === "etf" ? "__etfs__" :
                      type === "sector" ? "__sectors__" :
                      (node.sector || "__other__");
        const groupIdx = sectorGroups[group] || 0;
        const groupAngle = (groupIdx / totalGroups) * Math.PI * 2;
        const groupRadius = 350;
        const jitter = 80 + Math.random() * 120;
        const jitterAngle = Math.random() * Math.PI * 2;

        return {
          id: node.id,
          name: node.name,
          type: type,
          sector: node.sector || undefined,
          val: baseSize,
          color: TYPE_COLORS[type] || TYPE_COLORS.company,
          connectionCount: connCount,
          x: Math.cos(groupAngle) * groupRadius + Math.cos(jitterAngle) * jitter,
          y: Math.sin(groupAngle) * groupRadius + Math.sin(jitterAngle) * jitter,
        } as any;
      });

      const allLinks: GraphLink[] = data.links.map((link) => ({
        source: link.source,
        target: link.target,
        strength: link.strength,
        relationship: link.relationship,
        delay_days: link.delay_days,
        confidence: link.confidence,
        color: RELATIONSHIP_COLORS[link.relationship] || "#4ade80",
        width: 1 + link.strength * 2,
      }));

      const all: GraphData = { nodes: allNodes, links: allLinks };
      setAllGraphData(all);

      // Default: only show connected nodes (nodes with at least 1 connection)
      applyView(all, false);
      setLoading(false);
      updateCacheInfo();
    } catch (err: any) {
      setError(err.message || "Failed to load graph");
      setLoading(false);
    }
  };

  // Apply connected-only or all-nodes view
  const applyView = (data: GraphData, includeOrphans: boolean) => {
    if (includeOrphans) {
      setGraphData(data);
    } else {
      // Only nodes that have at least 1 connection
      const connectedNodeIds = new Set<string>();
      data.links.forEach((link) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        connectedNodeIds.add(sourceId);
        connectedNodeIds.add(targetId);
      });

      setGraphData({
        nodes: data.nodes.filter(n => connectedNodeIds.has(n.id)),
        links: data.links,
      });
    }
  };

  const toggleOrphans = () => {
    if (!allGraphData) return;
    const newShow = !showOrphans;
    setShowOrphans(newShow);
    applyView(allGraphData, newShow);
  };

  const handleRefreshGraph = async () => {
    setIsRefreshing(true);
    try { await loadGraphData(true); } finally { setIsRefreshing(false); }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setShowCascadePanel(false);
    setCascadeHighlight(new Set());
    setCascadeOrderMap(new Map());
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  const handleCascadeHighlight = (nodeIds: Set<string>, orderMap: Map<string, number>) => {
    setCascadeHighlight(nodeIds);
    setCascadeOrderMap(orderMap);
    const linkIds = new Set<string>();
    if (graphData) {
      graphData.links.forEach((link) => {
        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
          const sO = orderMap.get(sourceId);
          const tO = orderMap.get(targetId);
          if (sO !== undefined && tO !== undefined && Math.abs(sO - tO) === 1) {
            linkIds.add(`${sourceId}-${targetId}`);
          }
        }
      });
    }
    setCascadeLinks(linkIds);
  };

  const handleZoomIn = () => { fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 500); };
  const handleZoomOut = () => { fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 500); };
  const handleFitView = () => { fgRef.current?.zoomToFit(800, 50); };

  const handleDownloadGraph = async () => {
    if (!fgRef.current) return;
    try {
      const canvas = fgRef.current.renderer().domElement;
      if (canvas instanceof HTMLCanvasElement) {
        await downloadGraphCanvasAsPNG(canvas, `causal-graph-${new Date().toISOString().split('T')[0]}.png`);
      }
    } catch (err) { console.error('Download failed:', err); }
  };

  const handleViewConnections = () => {
    if (!selectedNode || !graphData) return;
    const connected = new Set<string>([selectedNode.id]);
    const linkIds = new Set<string>();

    graphData.links.forEach((link) => {
      const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      if (sId === selectedNode.id) { connected.add(tId); linkIds.add(`${sId}-${tId}`); }
      else if (tId === selectedNode.id) { connected.add(sId); linkIds.add(`${sId}-${tId}`); }
    });

    setHighlightNodes(connected);
    setHighlightLinks(linkIds);
    fgRef.current?.zoomToFit(800, 80, (node: any) => connected.has(node.id));
  };

  const handleRunPrediction = () => {
    if (!selectedNode) return;
    window.location.href = `/predict?ticker=${selectedNode.id}`;
  };

  // Search/filter
  const filteredData = useMemo(() => {
    if (!graphData) return null;
    if (searchQuery === "" && filterType === "all") return null;

    const matchedNodes = graphData.nodes.filter((node) => {
      const matchesSearch = searchQuery === "" ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || node.type === filterType;
      return matchesSearch && matchesType;
    });
    const matchedIds = new Set(matchedNodes.map(n => n.id));

    return {
      nodes: matchedNodes,
      links: graphData.links.filter((link) => {
        const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        return matchedIds.has(sId) && matchedIds.has(tId);
      }),
    };
  }, [graphData, searchQuery, filterType]);

  const handleZoomChange = useCallback((transform: any) => {
    if (transform?.k !== undefined) setCurrentZoom(transform.k);
  }, []);

  const displayData = filteredData || graphData;

  if (loading) {
    return (
      <Card className="p-6 hud-panel">
        <div className="text-center py-8">
          <div className="military-font text-green-400 text-lg mb-4">
            &gt; {cacheInfo?.isCached ? 'LOADING FROM CACHE' : 'BUILDING CAUSAL GRAPH'}_
          </div>
          <div className="text-xs text-green-400/60 font-mono mb-6">
            COMPUTING LAYOUT FOR CONNECTED ENTITIES...
          </div>
          <Skeleton className="h-[500px] w-full bg-green-500/10" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 hud-panel border-red-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-red-400 text-lg military-font">&gt; GRAPH LOAD FAILED</p>
            <p className="text-sm text-red-400/70 mt-2 font-mono">{error}</p>
            <button onClick={() => loadGraphData()} className="mt-4 tactical-button px-4 py-2 text-sm">&gt; RETRY</button>
          </div>
        </div>
      </Card>
    );
  }

  if (!graphData) return null;

  return (
    <div className="space-y-4">
      {/* Summary Dashboard */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
          <Card className="p-3 hud-panel border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-3.5 w-3.5 text-green-400" />
              <span className="text-[10px] military-font text-green-400/60">COMPANIES</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{summaryStats.companies}</div>
          </Card>
          <Card className="p-3 hud-panel border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] military-font text-blue-400/60">ETFs</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{summaryStats.etfs}</div>
          </Card>
          <Card className="p-3 hud-panel border-purple-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] military-font text-purple-400/60">SECTORS</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{summaryStats.sectors}</div>
          </Card>
          <Card className="p-3 hud-panel border-amber-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] military-font text-amber-400/60">MACRO INDICATORS</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{summaryStats.indicators}</div>
          </Card>
          <Card className="p-3 hud-panel border-cyan-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] military-font text-cyan-400/60">RELATIONSHIPS</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{summaryStats.totalLinks}</div>
          </Card>
        </div>
      )}

      {/* Search, Filter & View Toggle */}
      <Card className="p-4 hud-panel border-green-500/30 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticker or name..."
              className="w-full bg-black/50 border border-green-500/30 text-green-400 px-4 py-2 rounded font-mono text-sm focus:border-green-500 focus:outline-none placeholder:text-green-400/30"
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {[
              { value: "all", label: "ALL", bg: "rgba(34,197,94,0.2)", border: "rgb(34,197,94)", text: "rgb(74,222,128)" },
              { value: "company", label: "COMPANIES", bg: "rgba(34,197,94,0.2)", border: "rgb(34,197,94)", text: "rgb(74,222,128)" },
              { value: "etf", label: "ETFs", bg: "rgba(59,130,246,0.2)", border: "rgb(59,130,246)", text: "rgb(96,165,250)" },
              { value: "sector", label: "SECTORS", bg: "rgba(168,85,247,0.2)", border: "rgb(168,85,247)", text: "rgb(192,132,252)" },
              { value: "indicator", label: "MACRO", bg: "rgba(245,158,11,0.2)", border: "rgb(245,158,11)", text: "rgb(251,191,35)" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className="px-3 py-1.5 rounded text-[10px] font-mono border transition-all"
                style={filterType === opt.value
                  ? { backgroundColor: opt.bg, borderColor: opt.border, color: opt.text }
                  : { borderColor: "rgba(100,100,100,0.3)", color: "rgb(120,120,120)" }
                }
              >
                {opt.label}
              </button>
            ))}

            <div className="border-l border-green-500/20 pl-2 ml-1 flex gap-2">
              {/* Highlight Portfolio Holdings */}
              {hasPortfolio() && (
                <button
                  onClick={() => setShowPortfolioHighlight(!showPortfolioHighlight)}
                  className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5"
                  style={showPortfolioHighlight
                    ? { backgroundColor: "rgba(251,191,35,0.15)", borderColor: "rgba(251,191,35,0.5)", color: "rgb(251,191,35)" }
                    : {}
                  }
                  title="Highlight your portfolio holdings"
                >
                  <Briefcase className="h-3 w-3" />
                  MY PORTFOLIO
                </button>
              )}

              {/* Toggle orphan nodes */}
              <button
                onClick={toggleOrphans}
                className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5"
                style={showOrphans
                  ? { backgroundColor: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.5)", color: "rgb(251,191,35)" }
                  : {}
                }
                title={showOrphans ? "Hide unconnected entities" : "Show all entities (including unconnected)"}
              >
                {showOrphans ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showOrphans ? "HIDE ORPHANS" : "SHOW ALL"}
              </button>
              <button
                onClick={handleRefreshGraph}
                disabled={isRefreshing}
                className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5 bg-cyan-500/10 border-cyan-500/30 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                REFRESH
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-2 pt-2 border-t border-green-500/15 font-mono text-[10px] text-green-400/50 flex justify-between items-center">
          <span>
            {filteredData
              ? `SHOWING ${filteredData.nodes.length} / ${graphData.nodes.length} ENTITIES`
              : `SHOWING ${graphData.nodes.length} CONNECTED ENTITIES`
            }
            {!showOrphans && summaryStats && summaryStats.orphans > 0 && !filteredData && (
              <span className="text-green-400/30"> ({summaryStats.orphans} unconnected hidden)</span>
            )}
          </span>
          <div className="flex items-center gap-3">
            {cacheInfo?.isCached && cacheInfo.ageMinutes !== null && (
              <span className="text-cyan-400/50">CACHED ({cacheInfo.ageMinutes}m)</span>
            )}
            {(searchQuery || filterType !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setFilterType("all"); }}
                className="text-yellow-400/70 hover:text-yellow-400"
              >
                CLEAR FILTERS
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Graph Container */}
      <div className="relative">
        <Card className="overflow-hidden hud-panel border-green-500/30">
          <div ref={containerRef} className="relative h-[700px] w-full bg-black/60">
            {dimensions.width > 0 && displayData ? (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={displayData}
              nodeLabel={(node: any) => `
                <div style="background: rgba(0,0,0,0.95); color: white; padding: 10px 14px; border-radius: 8px; font-family: system-ui; border: 1px solid ${node.color}40; min-width: 180px;">
                  <div style="font-weight: 700; font-size: 14px; color: ${node.color};">${node.id}</div>
                  <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${node.name}</div>
                  ${node.sector ? `<div style="font-size: 11px; opacity: 0.5; margin-top: 4px;">Sector: ${node.sector}</div>` : ''}
                  <div style="font-size: 10px; opacity: 0.4; margin-top: 4px;">${node.connectionCount} connections &middot; ${node.type}</div>
                </div>
              `}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                if (!node.x || !node.y || !isFinite(node.x) || !isFinite(node.y)) return;

                const type = node.type?.toLowerCase() || "company";
                const nodeColor = node.color || TYPE_COLORS.company;
                const radius = Math.sqrt(node.val) * 1.1;

                // States
                const isSelected = selectedNode?.id === node.id;
                const isHighlighted = highlightNodes.has(node.id);
                const isInCascade = cascadeHighlight.has(node.id);
                const isHovered = hoveredNode?.id === node.id;
                const hasActive = highlightNodes.size > 0 || cascadeHighlight.size > 0;
                const shouldDim = hasActive && !isSelected && !isHighlighted && !isInCascade;

                // Portfolio holdings check
                const isPortfolioHolding = showPortfolioHighlight && hasPortfolio() &&
                  getPortfolio().holdings.some(h => h.entity_id === node.id);

                if (shouldDim) ctx.globalAlpha = 0.12;

                // Cascade color
                let fill = nodeColor;
                if (isInCascade) {
                  const order = cascadeOrderMap.get(node.id) || 0;
                  fill = ["#fcd34d", "#4ade80", "#86efac", "#bbf7d0"][Math.min(order, 3)];
                }

                ctx.save();

                // Shape by type
                if (type === "indicator") {
                  // Diamond
                  const r = radius * 1.3;
                  ctx.beginPath();
                  ctx.moveTo(node.x, node.y - r);
                  ctx.lineTo(node.x + r, node.y);
                  ctx.lineTo(node.x, node.y + r);
                  ctx.lineTo(node.x - r, node.y);
                  ctx.closePath();

                  // Glow
                  const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
                  glow.addColorStop(0, fill + "40");
                  glow.addColorStop(1, "transparent");
                  const glowPath = new Path2D();
                  glowPath.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
                  ctx.fillStyle = glow;
                  ctx.fill(glowPath);

                  // Fill diamond
                  ctx.beginPath();
                  ctx.moveTo(node.x, node.y - r);
                  ctx.lineTo(node.x + r, node.y);
                  ctx.lineTo(node.x, node.y + r);
                  ctx.lineTo(node.x - r, node.y);
                  ctx.closePath();
                  ctx.fillStyle = fill;
                  ctx.fill();
                  ctx.strokeStyle = fill;
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();

                } else if (type === "sector") {
                  // Hexagon
                  const r = radius * 1.2;
                  ctx.beginPath();
                  for (let i = 0; i < 6; i++) {
                    const a = (Math.PI / 3) * i - Math.PI / 6;
                    const px = node.x + Math.cos(a) * r;
                    const py = node.y + Math.sin(a) * r;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                  }
                  ctx.closePath();
                  ctx.fillStyle = fill + "DD";
                  ctx.fill();
                  ctx.strokeStyle = fill;
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.stroke();

                } else {
                  // Circle for company/etf
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                  ctx.fillStyle = fill + "DD";
                  ctx.fill();
                  ctx.strokeStyle = fill;
                  ctx.lineWidth = 1 / globalScale;
                  ctx.stroke();
                }

                // Selection ring
                if (isSelected) {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius * 2.2, 0, 2 * Math.PI);
                  ctx.strokeStyle = "#fbbf24";
                  ctx.lineWidth = 2.5 / globalScale;
                  ctx.setLineDash([5 / globalScale, 3 / globalScale]);
                  ctx.stroke();
                  ctx.setLineDash([]);
                }

                // Highlight ring
                if (isHighlighted && !isSelected && cascadeHighlight.size === 0) {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius * 1.8, 0, 2 * Math.PI);
                  ctx.strokeStyle = "#10b981";
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();
                }

                // Portfolio holding ring (golden ring overlay)
                if (isPortfolioHolding) {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius * 2.5, 0, 2 * Math.PI);
                  ctx.strokeStyle = "#fbbf24"; // Golden yellow
                  ctx.lineWidth = 3 / globalScale;
                  ctx.stroke();

                  // Add a second inner ring for emphasis
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius * 2.1, 0, 2 * Math.PI);
                  ctx.strokeStyle = "#fbbf2480"; // Semi-transparent golden
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.stroke();
                }

                ctx.restore();
                if (shouldDim) ctx.globalAlpha = 1.0;

                // Label logic: progressive disclosure
                // Always: selected, hovered, cascade, indicators
                // At medium zoom: highly connected, sectors
                // At high zoom: everything
                const showLabel =
                  isSelected || isHovered || isInCascade ||
                  (isHighlighted && !shouldDim) ||
                  type === "indicator" ||
                  (type === "sector" && globalScale > 0.35) ||
                  (node.connectionCount >= 20 && globalScale > 0.4) ||
                  (node.connectionCount >= 8 && globalScale > 0.7) ||
                  (node.connectionCount >= 3 && globalScale > 1.0) ||
                  globalScale > 1.5;

                if (showLabel) {
                  const label = node.id;
                  const fontSize = Math.min(13, Math.max(8, 11 / globalScale));
                  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
                  const textWidth = ctx.measureText(label).width;
                  const labelY = node.y + radius + fontSize + 3;
                  const pad = 3;

                  // Background
                  ctx.fillStyle = "rgba(0,0,0,0.8)";
                  ctx.fillRect(node.x - textWidth / 2 - pad, labelY - fontSize + 1, textWidth + pad * 2, fontSize + 3);

                  // Text
                  ctx.fillStyle = fill;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(label, node.x, labelY - fontSize / 2 + 3);
                }
              }}
              linkCurvature={0.1}
              linkCanvasObjectMode={() => 'replace'}
              linkCanvasObject={(link: any, ctx, globalScale) => {
                const source = link.source;
                const target = link.target;
                if (!source?.x || !source?.y || !target?.x || !target?.y ||
                    !isFinite(source.x) || !isFinite(source.y) || !isFinite(target.x) || !isFinite(target.y)) return;

                const sId = typeof source === 'object' ? source.id : source;
                const tId = typeof target === 'object' ? target.id : target;
                const linkId = `${sId}-${tId}`;

                const isCascade = cascadeLinks.has(linkId);
                const cascadeActive = cascadeHighlight.size > 0;
                const isConnSel = selectedNode && (sId === selectedNode.id || tId === selectedNode.id);
                const isHL = highlightLinks.has(linkId);

                let opacity: number, lw: number;
                let color = link.color || '#4ade80';

                if (isCascade) {
                  opacity = 0.9;
                  lw = Math.max(link.width * 2.5, 3) / globalScale;
                  const order = Math.max(cascadeOrderMap.get(sId) || 0, cascadeOrderMap.get(tId) || 0);
                  color = ["#fbbf24", "#4ade80", "#34d399", "#6ee7b7"][Math.min(order, 3)];
                } else if (cascadeActive) {
                  opacity = 0.03;
                  lw = 0.3 / globalScale;
                } else if (isConnSel || isHL) {
                  opacity = 0.7;
                  lw = Math.max(link.width * 1.5, 2) / globalScale;
                } else if (highlightNodes.size > 0) {
                  opacity = 0.05;
                  lw = 0.3 / globalScale;
                } else {
                  // Default: visible but subtle
                  opacity = 0.35;
                  lw = Math.max(link.width * 0.7, 0.6) / globalScale;
                }

                const mx = (source.x + target.x) / 2;
                const my = (source.y + target.y) / 2;
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const curv = 0.1;
                const cpX = mx - dy * curv;
                const cpY = my + dx * curv;

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = lw;
                ctx.stroke();

                if (isCascade) {
                  ctx.globalAlpha = 0.2;
                  ctx.lineWidth = lw * 3;
                  ctx.stroke();
                }

                // Arrow
                if (opacity > 0.1) {
                  const aLen = 5 / globalScale;
                  const angle = Math.atan2(target.y - cpY, target.x - cpX);
                  ctx.globalAlpha = opacity;
                  ctx.beginPath();
                  ctx.moveTo(target.x, target.y);
                  ctx.lineTo(target.x - aLen * Math.cos(angle - Math.PI / 7), target.y - aLen * Math.sin(angle - Math.PI / 7));
                  ctx.lineTo(target.x - aLen * Math.cos(angle + Math.PI / 7), target.y - aLen * Math.sin(angle + Math.PI / 7));
                  ctx.closePath();
                  ctx.fillStyle = color;
                  ctx.fill();
                }

                ctx.restore();
              }}
              linkLabel={(link: any) => `
                <div style="background: rgba(0,0,0,0.95); color: ${link.color}; padding: 8px 12px; border-radius: 6px; font-family: system-ui; font-size: 11px; border: 1px solid ${link.color}40;">
                  <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px;">${link.relationship.replace(/_/g, ' ').toUpperCase()}</div>
                  <div style="color: #999; font-size: 10px; line-height: 1.6;">
                    <div>Strength: <b style="color:#fff">${(link.strength * 100).toFixed(0)}%</b></div>
                    <div>Delay: <b style="color:#fff">${link.delay_days ? link.delay_days.toFixed(1) : '0.0'} days</b></div>
                    <div>Confidence: <b style="color:#fff">${link.confidence ? (link.confidence * 100).toFixed(0) : '0'}%</b></div>
                  </div>
                </div>
              `}
              onNodeClick={handleNodeClick}
              onNodeHover={(node: any) => setHoveredNode(node || null)}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              enablePointerInteraction={true}
              backgroundColor="transparent"
              autoPauseRedraw={false}
              minZoom={0.1}
              maxZoom={8}
              onZoom={handleZoomChange}
              linkDirectionalParticles={(link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                return cascadeLinks.has(`${sId}-${tId}`) ? 4 : 0;
              }}
              linkDirectionalParticleSpeed={() => 0.006}
              linkDirectionalParticleWidth={(link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                return cascadeLinks.has(`${sId}-${tId}`) ? 3 : 2;
              }}
              linkDirectionalParticleColor={(link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                return cascadeLinks.has(`${sId}-${tId}`) ? '#fbbf24' : link.color;
              }}
              d3VelocityDecay={0.3}
              d3AlphaDecay={0.012}
              cooldownTicks={250}
              warmupTicks={100}
              onNodeDragEnd={(node: any) => { node.fx = node.x; node.fy = node.y; }}
              onEngineStop={() => {}}
            />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-green-400/60 military-font text-sm">&gt; INITIALIZING_</div>
              </div>
            )}

            {/* Controls */}
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-2.5 rounded-lg border border-green-500/20">
              <div className="flex flex-col gap-1.5">
                <button onClick={handleZoomIn} className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5"><ZoomIn className="h-3 w-3" /> IN</button>
                <button onClick={handleZoomOut} className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5"><ZoomOut className="h-3 w-3" /> OUT</button>
                <button onClick={handleFitView} className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5"><Maximize2 className="h-3 w-3" /> FIT</button>
                <div className="border-t border-green-500/20 my-0.5"></div>
                <button onClick={handleDownloadGraph} className="tactical-button px-3 py-1.5 text-[10px] flex items-center gap-1.5 bg-cyan-500/10 border-cyan-500/30"><Download className="h-3 w-3" /> PNG</button>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-green-500/20">
              <div className="text-[10px] military-font text-green-400/50 mb-2">ENTITY TYPES</div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: TYPE_COLORS.company}}></div>
                  <span style={{color: TYPE_COLORS.company}}>Company ({summaryStats?.companies || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: TYPE_COLORS.etf}}></div>
                  <span style={{color: TYPE_COLORS.etf}}>ETF ({summaryStats?.etfs || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{backgroundColor: TYPE_COLORS.sector, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"}}></div>
                  <span style={{color: TYPE_COLORS.sector}}>Sector ({summaryStats?.sectors || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{backgroundColor: TYPE_COLORS.indicator, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"}}></div>
                  <span style={{color: TYPE_COLORS.indicator}}>Macro ({summaryStats?.indicators || 0})</span>
                </div>
              </div>
              <div className="border-t border-green-500/15 mt-2 pt-2 text-[9px] text-green-400/30 font-mono">
                Node size = connection count<br/>
                Scroll to zoom &middot; Click to inspect
              </div>
            </div>

            {/* Zoom hint */}
            {currentZoom < 0.5 && !selectedNode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full border border-green-500/20">
                <span className="text-[10px] font-mono text-green-400/50">Scroll to zoom &middot; Labels appear as you zoom in</span>
              </div>
            )}
          </div>
        </Card>

        {/* Selected Node */}
        {selectedNode && (
          <Card className="mt-4 p-5 hud-panel border-green-500/30 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold" style={{color: selectedNode.color}}>{selectedNode.id}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono border"
                    style={{ backgroundColor: selectedNode.color + "20", borderColor: selectedNode.color + "60", color: selectedNode.color }}>
                    {selectedNode.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 font-mono">{selectedNode.name}</p>
                {selectedNode.sector && <p className="text-xs text-gray-500 font-mono mt-1">Sector: {selectedNode.sector}</p>}
                <p className="text-[10px] text-gray-600 font-mono mt-1">{selectedNode.connectionCount} connections</p>
              </div>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setHighlightNodes(new Set());
                  setHighlightLinks(new Set());
                  setCascadeHighlight(new Set());
                  setCascadeOrderMap(new Map());
                  setCascadeLinks(new Set());
                }}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowCascadePanel(!showCascadePanel)}
                className={`tactical-button px-4 py-2 text-xs flex-1 transition-colors ${showCascadePanel ? 'bg-amber-500/20 border-amber-500 text-amber-400' : ''}`}
              >
                {showCascadePanel ? 'HIDE CASCADE' : 'ANALYZE CASCADE'}
              </button>
              <button onClick={handleViewConnections} className="tactical-button px-4 py-2 text-xs flex-1">VIEW CONNECTIONS</button>
              <button onClick={handleRunPrediction} className="tactical-button px-4 py-2 text-xs flex-1">RUN PREDICTION</button>
            </div>
            {showCascadePanel && (
              <CascadeEffectsPanel entity={selectedNode} onHighlight={handleCascadeHighlight} onClose={() => setShowCascadePanel(false)} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
