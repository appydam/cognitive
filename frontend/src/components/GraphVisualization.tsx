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
  const fgRef = useRef<any>();

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
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Interactive Causal Graph:</span>{" "}
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

                // Draw glow
                const gradient = ctx.createRadialGradient(
                  node.x!,
                  node.y!,
                  0,
                  node.x!,
                  node.y!,
                  node.val * 1.5
                );
                gradient.addColorStop(0, node.color + "40");
                gradient.addColorStop(1, "transparent");
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.val * 2, 0, 2 * Math.PI);
                ctx.fill();

                // Draw node
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
                ctx.fill();

                // Draw border
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                // Draw label
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "white";
                ctx.fillText(label, node.x!, node.y! + node.val + fontSize + 2);
              }}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.2}
              linkWidth={(link: any) => link.width}
              linkColor={(link: any) => link.color}
              onNodeClick={handleNodeClick}
              onNodeHover={(node: any) => setHoveredNode(node)}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              backgroundColor="transparent"
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={2}
              d3VelocityDecay={0.3}
            />

            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 backdrop-blur hover:bg-white"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 backdrop-blur hover:bg-white"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 backdrop-blur hover:bg-white"
                onClick={handleFitView}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur rounded-lg p-4 text-white text-sm">
              <div className="font-semibold mb-2">Legend</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Company</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs">ETF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Sector</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Node Info */}
        {selectedNode && (
          <Card className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{selectedNode.id}</h3>
                <p className="text-gray-700 text-lg">{selectedNode.name}</p>
              </div>
              <Badge variant="secondary" className="text-base capitalize">
                {selectedNode.type}
              </Badge>
            </div>
            {selectedNode.sector && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sector:</span>
                <Badge className="bg-blue-600">{selectedNode.sector}</Badge>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="text-gray-600 text-sm mb-1">Total Nodes</div>
          <div className="text-3xl font-bold text-blue-600">
            {graphData.nodes.length}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="text-gray-600 text-sm mb-1">Total Links</div>
          <div className="text-3xl font-bold text-purple-600">
            {graphData.links.length}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="text-gray-600 text-sm mb-1">Avg. Connections</div>
          <div className="text-3xl font-bold text-green-600">
            {(graphData.links.length / graphData.nodes.length).toFixed(1)}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <div className="text-gray-600 text-sm mb-1">Network Density</div>
          <div className="text-3xl font-bold text-orange-600">
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
