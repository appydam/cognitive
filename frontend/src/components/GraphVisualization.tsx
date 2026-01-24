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
  const fgRef = useRef<any>(null);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const stats = await ConsequenceAPI.getGraphStats();

      // For now, create sample nodes
      // In production, you'd fetch actual graph data
      const sampleData: GraphData = {
        nodes: [
          { id: "AAPL", name: "Apple Inc.", type: "company", sector: "Technology", val: 30, color: "#3b82f6" },
          { id: "TSM", name: "TSMC", type: "company", sector: "Technology", val: 25, color: "#3b82f6" },
          { id: "NVDA", name: "NVIDIA", type: "company", sector: "Technology", val: 28, color: "#3b82f6" },
          { id: "QCOM", name: "Qualcomm", type: "company", sector: "Technology", val: 20, color: "#3b82f6" },
          { id: "AMD", name: "AMD", type: "company", sector: "Technology", val: 22, color: "#3b82f6" },
          { id: "INTC", name: "Intel", type: "company", sector: "Technology", val: 24, color: "#3b82f6" },
          { id: "SMH", name: "Semiconductor ETF", type: "etf", val: 18, color: "#8b5cf6" },
          { id: "TECH", name: "Technology Sector", type: "sector", val: 15, color: "#10b981" },
        ],
        links: [
          { source: "AAPL", target: "TSM", strength: 0.8, relationship: "supplier", color: "#60a5fa", width: 4 },
          { source: "AAPL", target: "QCOM", strength: 0.6, relationship: "supplier", color: "#60a5fa", width: 3 },
          { source: "NVDA", target: "TSM", strength: 0.9, relationship: "supplier", color: "#60a5fa", width: 5 },
          { source: "AMD", target: "TSM", strength: 0.7, relationship: "supplier", color: "#60a5fa", width: 3.5 },
          { source: "TSM", target: "SMH", strength: 0.5, relationship: "constituent", color: "#a78bfa", width: 2 },
          { source: "NVDA", target: "SMH", strength: 0.6, relationship: "constituent", color: "#a78bfa", width: 2.5 },
          { source: "AMD", target: "SMH", strength: 0.4, relationship: "constituent", color: "#a78bfa", width: 2 },
          { source: "SMH", target: "TECH", strength: 0.3, relationship: "sector", color: "#34d399", width: 2 },
        ],
      };

      setGraphData(sampleData);
      setLoading(false);
    } catch (err: any) {
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
      <Card className="p-6">
        <Skeleton className="h-[600px] w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-lg">
              Failed to Load Graph
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!graphData) return null;

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Card className="p-4 glass-card border-blue-400/30 animate-fade-in">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-800">
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Interactive Causal Graph:
              </span>{" "}
              Click nodes to explore connections, drag to move, scroll to zoom.
              Node size represents importance, link thickness shows strength.
            </p>
          </div>
        </div>
      </Card>

      {/* Graph Container */}
      <div className="relative">
        <Card className="overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 border-gray-700">
          <div className="relative h-[600px] w-full">
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: any) => `
                <div style="background: rgba(0, 0, 0, 0.9); color: white; padding: 8px 12px; border-radius: 8px; font-family: sans-serif;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${node.id}</div>
                  <div style="font-size: 12px; opacity: 0.8;">${node.name}</div>
                  ${node.sector ? `<div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">${node.sector}</div>` : ''}
                </div>
              `}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.id;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;

                // Pulsing animation effect
                const time = Date.now() / 1000;
                const pulseScale = 1 + Math.sin(time * 2) * 0.15;

                // Draw outer glow (pulsing)
                const outerGlow = ctx.createRadialGradient(
                  node.x!,
                  node.y!,
                  0,
                  node.x!,
                  node.y!,
                  node.val * 3 * pulseScale
                );
                outerGlow.addColorStop(0, node.color + "30");
                outerGlow.addColorStop(0.5, node.color + "15");
                outerGlow.addColorStop(1, "transparent");
                ctx.fillStyle = outerGlow;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.val * 3 * pulseScale, 0, 2 * Math.PI);
                ctx.fill();

                // Draw pulsing ring
                const pulseRadius = node.val * (1 + Math.sin(time * 2) * 0.2);
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, pulseRadius * 1.3, 0, 2 * Math.PI);
                ctx.strokeStyle = node.color + "60";
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                // Draw inner glow
                const innerGlow = ctx.createRadialGradient(
                  node.x!,
                  node.y!,
                  0,
                  node.x!,
                  node.y!,
                  node.val
                );
                innerGlow.addColorStop(0, node.color);
                innerGlow.addColorStop(0.7, node.color);
                innerGlow.addColorStop(1, node.color + "CC");
                ctx.fillStyle = innerGlow;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
                ctx.fill();

                // Draw bright border
                ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                ctx.lineWidth = 2.5 / globalScale;
                ctx.stroke();

                // Draw inner highlight
                const highlight = ctx.createRadialGradient(
                  node.x! - node.val * 0.3,
                  node.y! - node.val * 0.3,
                  0,
                  node.x!,
                  node.y!,
                  node.val
                );
                highlight.addColorStop(0, "rgba(255, 255, 255, 0.4)");
                highlight.addColorStop(1, "transparent");
                ctx.fillStyle = highlight;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
                ctx.fill();

                // Draw label with shadow
                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 1;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "white";
                ctx.font = `bold ${fontSize}px Sans-Serif`;
                ctx.fillText(label, node.x!, node.y! + node.val + fontSize + 4);
                ctx.shadowBlur = 0;
              }}
              linkDirectionalArrowLength={8}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              linkWidth={(link: any) => link.width}
              linkColor={(link: any) => link.color}
              onNodeClick={handleNodeClick}
              onNodeHover={(node: any) => setHoveredNode(node)}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              backgroundColor="transparent"
              linkDirectionalParticles={4}
              linkDirectionalParticleSpeed={0.008}
              linkDirectionalParticleWidth={3}
              linkDirectionalParticleColor={() => 'rgba(99, 102, 241, 0.8)'}
              d3VelocityDecay={0.3}
              cooldownTicks={100}
              onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
            />

            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="glass-card interactive-button hover:box-glow-blue border-white/20"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="glass-card interactive-button hover:box-glow-blue border-white/20"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="glass-card interactive-button hover:box-glow-blue border-white/20"
                onClick={handleFitView}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 glass-card-dark rounded-lg p-4 text-white text-sm border border-white/10">
              <div className="font-semibold mb-2 neon-glow">Legend</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 transition-all hover:translate-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 box-glow-blue pulse-dot"></div>
                  <span className="text-xs">Company</span>
                </div>
                <div className="flex items-center gap-2 transition-all hover:translate-x-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500 box-glow-purple pulse-dot"></div>
                  <span className="text-xs">ETF</span>
                </div>
                <div className="flex items-center gap-2 transition-all hover:translate-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 pulse-dot"></div>
                  <span className="text-xs">Sector</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Node Info */}
        {selectedNode && (
          <Card className="mt-4 p-6 glass-card interactive-card border-blue-400/30 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold holographic-text">{selectedNode.id}</h3>
                <p className="text-gray-800 text-lg">{selectedNode.name}</p>
              </div>
              <Badge variant="secondary" className="text-base capitalize neon-border bg-blue-500/10">
                {selectedNode.type}
              </Badge>
            </div>
            {selectedNode.sector && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">Sector:</span>
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
                  {selectedNode.sector}
                </Badge>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 glass-card interactive-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/30 slide-up stagger-1">
          <div className="text-gray-700 text-sm mb-1 font-medium">Total Nodes</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {graphData.nodes.length}
          </div>
        </Card>
        <Card className="p-4 glass-card interactive-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30 slide-up stagger-2">
          <div className="text-gray-700 text-sm mb-1 font-medium">Total Links</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {graphData.links.length}
          </div>
        </Card>
        <Card className="p-4 glass-card interactive-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30 slide-up stagger-3">
          <div className="text-gray-700 text-sm mb-1 font-medium">Avg. Connections</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {(graphData.links.length / graphData.nodes.length).toFixed(1)}
          </div>
        </Card>
        <Card className="p-4 glass-card interactive-card bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-400/30 slide-up stagger-4">
          <div className="text-gray-700 text-sm mb-1 font-medium">Network Density</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
            {(
              (graphData.links.length /
                (graphData.nodes.length * (graphData.nodes.length - 1))) *
              100
            ).toFixed(0)}
            %
          </div>
        </Card>
      </div>
    </div>
  );
}
