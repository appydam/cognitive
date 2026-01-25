"use client";

import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Info,
} from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";

interface GraphNode {
  id: string;
  name: string;
  type: string;
  sector?: string;
  val: number; // Size
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
  relationship: string;
  color: string;
  width: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function GraphVisualization() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const fgRef = useRef<any>(null);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[GraphVisualization] Fetching graph data...");

      // Fetch actual graph data from backend
      const data = await ConsequenceAPI.getFullGraph();
      console.log(`[GraphVisualization] Received ${data.nodes.length} nodes and ${data.links.length} links`);

      // Helper functions for colors
      const getColorForType = (type: string): string => {
        const colors: Record<string, string> = {
          company: "#00ff00",    // Military green for companies
          etf: "#00ffff",        // Cyan for ETFs
          sector: "#ffff00",     // Yellow for sectors
        };
        return colors[type.toLowerCase()] || "#00ff00";
      };

      const getColorForRelationship = (relationship: string): string => {
        const colors: Record<string, string> = {
          customer_of: "#00ffff",      // Cyan
          in_sector: "#ffff00",        // Yellow
          competes_with: "#ff0000",    // Red
        };
        return colors[relationship] || "#00ff00";
      };

      // Transform data for visualization
      const nodes: GraphNode[] = data.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        sector: node.sector || undefined,
        val: 15 + Math.random() * 15, // Size variation
        color: getColorForType(node.type),
      }));

      const links: GraphLink[] = data.links.map((link) => ({
        source: link.source,
        target: link.target,
        strength: link.strength,
        relationship: link.relationship,
        color: getColorForRelationship(link.relationship),
        width: 1 + link.strength * 3,
      }));

      setGraphData({ nodes, links });
      console.log("[GraphVisualization] Graph data loaded successfully");
      setLoading(false);
    } catch (err: any) {
      console.error("[GraphVisualization] Error loading graph:", err);
      setError(err.message || "Failed to load graph");
      setLoading(false);
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    // Zoom to node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.5, 500);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.5, 500);
    }
  };

  const handleFitView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 50);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 hud-panel">
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="military-font text-green-400 text-lg mb-4">
              &gt; LOADING GRAPH DATABASE_
            </div>
            <div className="text-xs text-green-400/60 font-mono mb-6">
              FETCHING 105 ENTITIES | 160 CAUSAL LINKS | STANDBY...
            </div>
            <Skeleton className="h-[500px] w-full bg-green-500/10" />
          </div>
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
            <p className="font-semibold text-red-400 text-lg military-font">
              &gt; CRITICAL ERROR: GRAPH LOAD FAILED
            </p>
            <p className="text-sm text-red-400/70 mt-2 font-mono">{error}</p>
            <button
              onClick={loadGraphData}
              className="mt-4 tactical-button px-4 py-2 text-sm"
            >
              &gt; RETRY CONNECTION
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!graphData) return null;

  // Filter and search functionality
  const filteredData = graphData
    ? {
        nodes: graphData.nodes.filter((node) => {
          const matchesSearch = searchQuery === "" ||
            node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesType = filterType === "all" || node.type === filterType;
          return matchesSearch && matchesType;
        }),
        links: graphData.links.filter((link) => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
          const sourceNode = graphData.nodes.find((n) => n.id === sourceId);
          const targetNode = graphData.nodes.find((n) => n.id === targetId);
          const sourceMatches = searchQuery === "" ||
            sourceId.toLowerCase().includes(searchQuery.toLowerCase());
          const targetMatches = searchQuery === "" ||
            targetId.toLowerCase().includes(searchQuery.toLowerCase());
          const typeMatches = filterType === "all" ||
            sourceNode?.type === filterType ||
            targetNode?.type === filterType;
          return (sourceMatches || targetMatches) && typeMatches;
        }),
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card className="p-4 hud-panel border-green-500/30 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="military-font text-green-400 text-xs mb-2 block">&gt; SEARCH ENTITIES</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter ticker or name..."
              className="w-full bg-black/50 border border-green-500/30 text-green-400 px-4 py-2 rounded font-mono text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          <div className="md:w-48">
            <label className="military-font text-green-400 text-xs mb-2 block">&gt; FILTER TYPE</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-black/50 border border-green-500/30 text-green-400 px-4 py-2 rounded font-mono text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="all">ALL TYPES</option>
              <option value="company">COMPANIES</option>
              <option value="etf">ETFs</option>
              <option value="sector">SECTORS</option>
            </select>
          </div>
          {(searchQuery || filterType !== "all") && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                }}
                className="tactical-button px-4 py-2 text-xs whitespace-nowrap"
              >
                CLEAR FILTERS
              </button>
            </div>
          )}
        </div>
        {(searchQuery || filterType !== "all") && filteredData && (
          <div className="mt-3 pt-3 border-t border-green-500/20 font-mono text-xs text-green-400/70">
            SHOWING {filteredData.nodes.length} / {graphData?.nodes.length || 0} ENTITIES
          </div>
        )}
      </Card>

      {/* Interactive Instructions - Military Style */}
      <Card className="p-6 hud-panel border-green-500/30 animate-fade-in">
        <div className="mb-4">
          <h3 className="military-font text-green-400 text-sm mb-2">&gt; GRAPH CONTROLS</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 border border-green-500 p-2 rounded">
              <span className="text-green-400 font-bold">CLICK</span>
            </div>
            <span className="text-green-400/70">Select entity & view connections</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/20 border border-cyan-500 p-2 rounded">
              <span className="text-cyan-400 font-bold">DRAG</span>
            </div>
            <span className="text-cyan-400/70">Move entities & reposition graph</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500/20 border border-yellow-500 p-2 rounded">
              <span className="text-yellow-400 font-bold">SCROLL</span>
            </div>
            <span className="text-yellow-400/70">Zoom in/out for detail view</span>
          </div>
        </div>
      </Card>

      {/* Graph Container */}
      <div className="relative">
        <Card className="overflow-hidden hud-panel border-green-500/30">
          <div className="relative h-[600px] w-full bg-black/40">
            <ForceGraph2D
              ref={fgRef}
              graphData={filteredData || graphData}
              nodeLabel={(node: any) => `
                <div style="background: rgba(0, 0, 0, 0.9); color: white; padding: 8px 12px; border-radius: 8px; font-family: sans-serif;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${node.id}</div>
                  <div style="font-size: 12px; opacity: 0.8;">${node.name}</div>
                  ${node.sector ? `<div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">${node.sector}</div>` : ''}
                </div>
              `}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                // Safety check for node position
                if (!node.x || !node.y || !isFinite(node.x) || !isFinite(node.y)) {
                  return;
                }

                const label = node.id;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Courier New, monospace`;

                // Pulsing animation effect
                const time = Date.now() / 1000;
                const pulseScale = 1 + Math.sin(time * 2) * 0.15;

                // Draw outer glow (pulsing) - Military radar style
                const outerGlow = ctx.createRadialGradient(
                  node.x,
                  node.y,
                  0,
                  node.x,
                  node.y,
                  node.val * 3 * pulseScale
                );
                outerGlow.addColorStop(0, node.color + "40");
                outerGlow.addColorStop(0.5, node.color + "20");
                outerGlow.addColorStop(1, "transparent");
                ctx.fillStyle = outerGlow;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val * 3 * pulseScale, 0, 2 * Math.PI);
                ctx.fill();

                // Draw pulsing ring - Radar sweep effect
                const pulseRadius = node.val * (1 + Math.sin(time * 2) * 0.2);
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseRadius * 1.3, 0, 2 * Math.PI);
                ctx.strokeStyle = node.color + "80";
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                // Draw hexagonal outline for military/tech feel
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                  const angle = (Math.PI / 3) * i;
                  const x = node.x + Math.cos(angle) * node.val * 1.5;
                  const y = node.y + Math.sin(angle) * node.val * 1.5;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = node.color + "40";
                ctx.lineWidth = 1 / globalScale;
                ctx.stroke();

                // Draw inner glow - Core
                const innerGlow = ctx.createRadialGradient(
                  node.x,
                  node.y,
                  0,
                  node.x,
                  node.y,
                  node.val
                );
                innerGlow.addColorStop(0, node.color);
                innerGlow.addColorStop(0.7, node.color);
                innerGlow.addColorStop(1, node.color + "CC");
                ctx.fillStyle = innerGlow;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
                ctx.fill();

                // Draw bright border with scan line
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 3 / globalScale;
                ctx.stroke();

                // Draw crosshair in center
                ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                ctx.lineWidth = 1.5 / globalScale;
                ctx.beginPath();
                ctx.moveTo(node.x - node.val * 0.5, node.y);
                ctx.lineTo(node.x + node.val * 0.5, node.y);
                ctx.moveTo(node.x, node.y - node.val * 0.5);
                ctx.lineTo(node.x, node.y + node.val * 0.5);
                ctx.stroke();

                // Draw label with military-style background
                const labelY = node.y + node.val + fontSize + 6;
                const labelWidth = ctx.measureText(label).width;

                // Label background
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillRect(
                  node.x - labelWidth / 2 - 4,
                  labelY - fontSize,
                  labelWidth + 8,
                  fontSize + 4
                );

                // Label border
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 1 / globalScale;
                ctx.strokeRect(
                  node.x - labelWidth / 2 - 4,
                  labelY - fontSize,
                  labelWidth + 8,
                  fontSize + 4
                );

                // Draw label text
                ctx.fillStyle = "#00ff00"; // Military green terminal color
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = `bold ${fontSize}px Courier New, monospace`;
                ctx.fillText(label, node.x, labelY - fontSize / 2 + 2);
              }}
              linkDirectionalArrowLength={8}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              linkWidth={(link: any) => link.width}
              linkColor={(link: any) => link.color}
              linkLabel={(link: any) => `${link.relationship} (${(link.strength * 100).toFixed(0)}%)`}
              linkCanvasObject={(link: any, ctx: any, globalScale: number) => {
                // Draw relationship label on link
                const start = link.source;
                const end = link.target;

                if (!start.x || !start.y || !end.x || !end.y) return;

                // Calculate midpoint
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;

                // Draw label background
                const label = link.relationship.replace(/_/g, ' ');
                const fontSize = 10 / globalScale;
                ctx.font = `${fontSize}px Courier New, monospace`;
                const textWidth = ctx.measureText(label).width;

                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(
                  midX - textWidth / 2 - 2,
                  midY - fontSize / 2 - 1,
                  textWidth + 4,
                  fontSize + 2
                );

                // Draw label text
                ctx.fillStyle = link.color || "#00ffff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, midX, midY);
              }}
              onNodeClick={handleNodeClick}
              onNodeHover={(node: any) => setHoveredNode(node)}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              backgroundColor="transparent"
              linkDirectionalParticles={4}
              linkDirectionalParticleSpeed={0.008}
              linkDirectionalParticleWidth={3}
              linkDirectionalParticleColor={() => 'rgba(0, 255, 255, 0.6)'}
              d3VelocityDecay={0.7}
              d3AlphaDecay={0.01}
              cooldownTicks={200}
              onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
            />

            {/* Controls Overlay - Military Style */}
            <div className="absolute top-4 right-4 hud-panel p-3 border-green-500/30">
              <div className="military-font text-green-400 text-[10px] mb-2">&gt; VIEW CONTROLS</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleZoomIn}
                  className="tactical-button px-3 py-2 text-xs flex items-center gap-2"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3 w-3" />
                  <span>ZOOM IN</span>
                </button>
                <button
                  onClick={handleZoomOut}
                  className="tactical-button px-3 py-2 text-xs flex items-center gap-2"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3 w-3" />
                  <span>ZOOM OUT</span>
                </button>
                <button
                  onClick={handleFitView}
                  className="tactical-button px-3 py-2 text-xs flex items-center gap-2"
                  title="Fit to Screen"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>FIT VIEW</span>
                </button>
              </div>
            </div>

            {/* Legend - Military Style */}
            <div className="absolute bottom-4 left-4 hud-panel p-4 border-green-500/30">
              <div className="military-font text-green-400 text-xs mb-3">&gt; ENTITY TYPES</div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-400 pulse-dot"></div>
                  <div>
                    <div className="text-green-400 font-bold">COMPANY</div>
                    <div className="text-green-400/50 text-[10px]">Individual securities</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 pulse-dot"></div>
                  <div>
                    <div className="text-cyan-400 font-bold">ETF</div>
                    <div className="text-cyan-400/50 text-[10px]">Exchange traded funds</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-400 pulse-dot"></div>
                  <div>
                    <div className="text-yellow-400 font-bold">SECTOR</div>
                    <div className="text-yellow-400/50 text-[10px]">Market sectors</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-green-500/20 military-font text-green-400 text-xs">
                &gt; RELATIONSHIPS
              </div>
              <div className="space-y-2 mt-2 font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-cyan-400"></div>
                  <span className="text-cyan-400">CUSTOMER OF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-yellow-400"></div>
                  <span className="text-yellow-400">IN SECTOR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-red-400"></div>
                  <span className="text-red-400">COMPETES WITH</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Node Info - Military Style */}
        {selectedNode && (
          <Card className="mt-4 p-6 hud-panel border-green-500/30 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="military-font text-green-400 text-xs mb-2">&gt; ENTITY SELECTED</div>
                <h3 className="text-3xl font-bold terminal-text">{selectedNode.id}</h3>
                <p className="text-green-400/70 text-base font-mono mt-1">{selectedNode.name}</p>
              </div>
              <div className={`px-3 py-1 border-2 rounded military-font text-xs ${
                selectedNode.type === 'company' ? 'bg-green-500/20 border-green-500 text-green-400' :
                selectedNode.type === 'etf' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' :
                'bg-yellow-500/20 border-yellow-500 text-yellow-400'
              }`}>
                {selectedNode.type.toUpperCase()}
              </div>
            </div>
            {selectedNode.sector && (
              <div className="mt-4 pt-4 border-t border-green-500/20">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-400/60">SECTOR:</span>
                  <span className="text-green-400 font-bold">{selectedNode.sector}</span>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <div className="text-xs military-font text-green-400/60 mb-2">&gt; ACTIONS</div>
              <div className="flex gap-2">
                <button className="tactical-button px-4 py-2 text-xs flex-1">
                  VIEW CONNECTIONS
                </button>
                <button className="tactical-button px-4 py-2 text-xs flex-1">
                  RUN PREDICTION
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Stats - Military Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 hud-panel border-green-500/30 slide-up stagger-1">
          <div className="military-font text-green-400/60 text-[10px] mb-1">TOTAL_ENTITIES</div>
          <div className="text-3xl font-bold terminal-text">
            {graphData.nodes.length}
          </div>
          <div className="text-xs text-green-400/50 font-mono mt-1">NODES</div>
        </Card>
        <Card className="p-4 hud-panel border-cyan-500/30 slide-up stagger-2">
          <div className="military-font text-cyan-400/60 text-[10px] mb-1">TOTAL_LINKS</div>
          <div className="text-3xl font-bold text-cyan-400">
            {graphData.links.length}
          </div>
          <div className="text-xs text-cyan-400/50 font-mono mt-1">RELATIONSHIPS</div>
        </Card>
        <Card className="p-4 hud-panel border-yellow-500/30 slide-up stagger-3">
          <div className="military-font text-yellow-400/60 text-[10px] mb-1">AVG_CONNECTIONS</div>
          <div className="text-3xl font-bold text-yellow-400">
            {(graphData.links.length / graphData.nodes.length).toFixed(1)}
          </div>
          <div className="text-xs text-yellow-400/50 font-mono mt-1">PER ENTITY</div>
        </Card>
        <Card className="p-4 hud-panel border-red-500/30 slide-up stagger-4">
          <div className="military-font text-red-400/60 text-[10px] mb-1">NETWORK_DENSITY</div>
          <div className="text-3xl font-bold text-red-400">
            {(
              (graphData.links.length /
                (graphData.nodes.length * (graphData.nodes.length - 1))) *
              100
            ).toFixed(1)}%
          </div>
          <div className="text-xs text-red-400/50 font-mono mt-1">CONNECTIVITY</div>
        </Card>
      </div>
    </div>
  );
}
