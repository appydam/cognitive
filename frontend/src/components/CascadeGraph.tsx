"use client";

import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CascadeResponse, EffectResponse } from "@/types/api";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface CascadeGraphProps {
  cascade: CascadeResponse;
}

interface CascadeNode {
  id: string;
  name: string;
  order: number;
  magnitude: number;
  color: string;
  val: number;
}

interface CascadeLink {
  source: string;
  target: string;
  strength: number;
  color: string;
  width: number;
}

export default function CascadeGraph({ cascade }: CascadeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 500 });
  const [selectedNode, setSelectedNode] = useState<CascadeNode | null>(null);

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setDimensions({ width, height: 500 });
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({ width, height: 500 });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Build graph data from cascade response
  const buildGraphData = () => {
    const nodes: CascadeNode[] = [];
    const links: CascadeLink[] = [];
    const nodeIds = new Set<string>();

    // Add trigger node (center)
    const triggerColor = cascade.trigger.magnitude_percent < 0 ? "#ff4444" : "#44ff44";
    nodes.push({
      id: cascade.trigger.entity,
      name: cascade.trigger.entity,
      order: 0,
      magnitude: cascade.trigger.magnitude_percent,
      color: triggerColor,
      val: 35,
    });
    nodeIds.add(cascade.trigger.entity);

    // Track effects by entity to avoid duplicates and find best path
    const effectsByEntity = new Map<string, EffectResponse>();

    Object.values(cascade.timeline).flat().forEach((effect: EffectResponse) => {
      if (!effectsByEntity.has(effect.entity) ||
          effectsByEntity.get(effect.entity)!.order > effect.order) {
        effectsByEntity.set(effect.entity, effect);
      }
    });

    // Add effect nodes
    effectsByEntity.forEach((effect, entityId) => {
      if (!nodeIds.has(entityId)) {
        const isNegative = effect.magnitude_percent < 0;
        const orderColors: Record<number, string> = {
          1: isNegative ? "#ff6666" : "#66ff66",
          2: isNegative ? "#ff9999" : "#99ff99",
          3: isNegative ? "#ffcccc" : "#ccffcc",
        };

        nodes.push({
          id: entityId,
          name: entityId,
          order: effect.order,
          magnitude: effect.magnitude_percent,
          color: orderColors[effect.order] || "#aaaaaa",
          val: 20 + Math.min(Math.abs(effect.magnitude_percent) * 2, 15),
        });
        nodeIds.add(entityId);

        // Create link from trigger
        links.push({
          source: cascade.trigger.entity,
          target: entityId,
          strength: effect.confidence,
          color: isNegative ? "rgba(255,100,100,0.6)" : "rgba(100,255,100,0.6)",
          width: 1 + effect.confidence * 3,
        });
      }
    });

    return { nodes, links };
  };

  const graphData = buildGraphData();

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
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

  return (
    <div className="space-y-4">
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="military-font text-green-400 text-sm mb-4">
          &gt; CASCADE PROPAGATION MAP
        </div>
        <div className="text-xs text-green-400/60 font-mono mb-4">
          TRIGGER: {cascade.trigger.entity} | EFFECTS: {cascade.total_effects} | HORIZON: {cascade.horizon_days} DAYS
        </div>

        <div ref={containerRef} className="relative h-[500px] w-full bg-black/40 rounded border border-green-500/20">
          {dimensions.width > 0 && (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel={(node: any) => `
                <div style="background: rgba(0, 0, 0, 0.9); color: white; padding: 8px 12px; border-radius: 8px; font-family: monospace;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${node.id}</div>
                  <div style="font-size: 12px; opacity: 0.8;">Impact: ${node.magnitude > 0 ? '+' : ''}${node.magnitude.toFixed(2)}%</div>
                  <div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">Order: ${node.order === 0 ? 'Trigger' : node.order}</div>
                </div>
              `}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                if (!node.x || !node.y || !isFinite(node.x) || !isFinite(node.y)) {
                  return;
                }

                const label = node.id;
                const fontSize = 11 / globalScale;
                ctx.font = `${fontSize}px Courier New, monospace`;

                // Pulsing animation for trigger
                const time = Date.now() / 1000;
                const pulseScale = node.order === 0 ? 1 + Math.sin(time * 3) * 0.2 : 1;

                // Draw outer glow
                const outerGlow = ctx.createRadialGradient(
                  node.x, node.y, 0,
                  node.x, node.y, node.val * 2.5 * pulseScale
                );
                outerGlow.addColorStop(0, node.color + "60");
                outerGlow.addColorStop(0.5, node.color + "30");
                outerGlow.addColorStop(1, "transparent");
                ctx.fillStyle = outerGlow;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val * 2.5 * pulseScale, 0, 2 * Math.PI);
                ctx.fill();

                // Draw ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val * 1.2, 0, 2 * Math.PI);
                ctx.strokeStyle = node.color + "80";
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                // Draw inner node
                const innerGlow = ctx.createRadialGradient(
                  node.x, node.y, 0,
                  node.x, node.y, node.val
                );
                innerGlow.addColorStop(0, node.color);
                innerGlow.addColorStop(0.7, node.color);
                innerGlow.addColorStop(1, node.color + "CC");
                ctx.fillStyle = innerGlow;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
                ctx.fill();

                // Draw border
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 3 / globalScale;
                ctx.stroke();

                // Draw order indicator for trigger
                if (node.order === 0) {
                  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                  ctx.lineWidth = 2 / globalScale;
                  ctx.beginPath();
                  ctx.moveTo(node.x - node.val * 0.6, node.y);
                  ctx.lineTo(node.x + node.val * 0.6, node.y);
                  ctx.moveTo(node.x, node.y - node.val * 0.6);
                  ctx.lineTo(node.x, node.y + node.val * 0.6);
                  ctx.stroke();
                }

                // Draw label
                const labelY = node.y + node.val + fontSize + 6;
                const labelWidth = ctx.measureText(label).width;

                ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
                ctx.fillRect(
                  node.x - labelWidth / 2 - 4,
                  labelY - fontSize,
                  labelWidth + 8,
                  fontSize + 4
                );

                ctx.strokeStyle = node.color;
                ctx.lineWidth = 1 / globalScale;
                ctx.strokeRect(
                  node.x - labelWidth / 2 - 4,
                  labelY - fontSize,
                  labelWidth + 8,
                  fontSize + 4
                );

                ctx.fillStyle = node.order === 0 ? "#ffffff" : "#00ff00";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = `bold ${fontSize}px Courier New, monospace`;
                ctx.fillText(label, node.x, labelY - fontSize / 2 + 2);
              }}
              linkDirectionalArrowLength={8}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.2}
              linkWidth={(link: any) => link.width}
              linkColor={(link: any) => link.color}
              onNodeClick={handleNodeClick}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              backgroundColor="transparent"
              linkDirectionalParticles={3}
              linkDirectionalParticleSpeed={0.01}
              linkDirectionalParticleWidth={3}
              linkDirectionalParticleColor={(link: any) => link.color}
              d3VelocityDecay={0.6}
              d3AlphaDecay={0.02}
              cooldownTicks={150}
              onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
            />
          )}

          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 hud-panel p-2 border-green-500/30">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleZoomIn}
                className="tactical-button px-2 py-1 text-xs flex items-center gap-1"
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
              <button
                onClick={handleZoomOut}
                className="tactical-button px-2 py-1 text-xs flex items-center gap-1"
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <button
                onClick={handleFitView}
                className="tactical-button px-2 py-1 text-xs flex items-center gap-1"
                title="Fit View"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 hud-panel p-3 border-green-500/30">
            <div className="military-font text-green-400 text-[10px] mb-2">&gt; LEGEND</div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-green-400">TRIGGER</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-green-400/70">POSITIVE EFFECT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-red-400/70">NEGATIVE EFFECT</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Node Info */}
      {selectedNode && (
        <Card className="p-4 hud-panel border-green-500/30 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <div className="military-font text-green-400 text-xs mb-1">&gt; SELECTED ENTITY</div>
              <h3 className="text-2xl font-bold terminal-text">{selectedNode.id}</h3>
              <div className="flex items-center gap-4 mt-2 font-mono text-sm">
                <span className="text-green-400/60">
                  ORDER: <span className={selectedNode.order === 0 ? "text-yellow-400" : "text-green-400"}>
                    {selectedNode.order === 0 ? "TRIGGER" : selectedNode.order}
                  </span>
                </span>
                <span className="text-green-400/60">
                  IMPACT: <span className={selectedNode.magnitude < 0 ? "text-red-400" : "text-green-400"}>
                    {selectedNode.magnitude > 0 ? "+" : ""}{selectedNode.magnitude.toFixed(2)}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
