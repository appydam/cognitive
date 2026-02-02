"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { PortfolioSubgraph } from "@/types/api";
import { getPortfolio } from "@/lib/portfolio";

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function PortfolioGraph() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<PortfolioSubgraph | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSubgraph();
  }, []);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) setDimensions({ width, height: 600 });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [loading]);

  const loadSubgraph = async () => {
    const portfolio = getPortfolio();

    if (portfolio.holdings.length === 0) {
      setError("No holdings in portfolio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ConsequenceAPI.portfolioSubgraph(portfolio.holdings, true);
      setGraphData(result);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to load portfolio subgraph:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 hud-panel border-green-500/30">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          <span className="ml-3 text-sm font-mono text-green-400">
            Loading portfolio subgraph...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 hud-panel border-green-500/30">
        <div className="p-3 bg-red-500/10 border border-red-400/30 rounded">
          <p className="text-xs font-mono text-red-400">&gt; ERROR: {error}</p>
        </div>
      </Card>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card className="p-6 hud-panel border-green-500/30">
        <div className="text-center py-12">
          <p className="text-sm font-mono text-green-400/60">
            No connections between holdings
          </p>
        </div>
      </Card>
    );
  }

  const TYPE_COLORS: Record<string, string> = {
    indicator: "#f59e0b",
    company: "#22c55e",
    etf: "#3b82f6",
    sector: "#a855f7",
  };

  // Count holdings vs intermediaries
  const holdingNodes = graphData.nodes.filter(n => n.is_holding).length;
  const intermediaryNodes = graphData.nodes.length - holdingNodes;

  return (
    <div className="space-y-4">
      {/* Explainer Card */}
      <Card className="p-4 hud-panel border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-green-500/5">
        <h3 className="text-sm military-font text-cyan-400 mb-2">&gt; WHY THIS MATTERS</h3>
        <div className="text-xs font-mono text-green-400/70 space-y-2">
          <p>
            <strong className="text-green-400">The question:</strong> Are your holdings more connected than you think?
            Two stocks in &quot;different&quot; sectors might both depend on the same supplier or react to the same indicator.
          </p>
          <p>
            <strong className="text-green-400">How to read it:</strong> Your holdings have <span className="text-yellow-400">golden rings</span>.
            The other nodes are intermediary entities that connect your holdings — they&apos;re the hidden bridges
            through which shocks travel. More bridges between holdings = more correlated risk.
          </p>
          {intermediaryNodes > 0 && (
            <p className="text-yellow-400/80">
              Found <strong>{intermediaryNodes} shared connections</strong> between your {holdingNodes} holdings — these
              are the entities that could cause your holdings to move together during a shock.
            </p>
          )}
        </div>
      </Card>

    <Card className="p-6 hud-panel border-green-500/30">
      <div className="mb-4">
        <h2 className="text-lg military-font text-green-400 mb-1">
          &gt; PORTFOLIO CONNECTION GRAPH
        </h2>
        <p className="text-xs text-green-400/60 font-mono">
          {holdingNodes} holdings • {intermediaryNodes} shared connections • {graphData.links.length} links
        </p>
      </div>

      <div ref={containerRef} className="relative bg-black/60 rounded border border-green-500/20">
        {dimensions.width > 0 && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={{
              nodes: graphData.nodes.map(n => ({
                ...n,
                val: n.is_holding ? 20 : 10,
                color: TYPE_COLORS[n.type] || "#22c55e",
              })),
              links: graphData.links.map(l => ({
                ...l,
                color: "#22c55e40",
              })),
            }}
            nodeLabel={(node: any) => `
              <div style="background: rgba(0,0,0,0.95); color: white; padding: 10px; border-radius: 8px; font-family: monospace; border: 1px solid ${node.color}40;">
                <div style="font-weight: 700; font-size: 14px; color: ${node.color};">${node.id}</div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${node.name}</div>
                ${node.sector ? `<div style="font-size: 11px; opacity: 0.5; margin-top: 4px;">Sector: ${node.sector}</div>` : ''}
                <div style="font-size: 10px; opacity: 0.4; margin-top: 4px;">${node.type}${node.is_holding ? ' • YOUR HOLDING' : ''}</div>
              </div>
            `}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const radius = Math.sqrt(node.val) * 1.5;
              const isHolding = node.is_holding;

              // Draw node
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = node.color + "DD";
              ctx.fill();
              ctx.strokeStyle = node.color;
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();

              // Holding ring
              if (isHolding) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius * 2, 0, 2 * Math.PI);
                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 3 / globalScale;
                ctx.stroke();
              }

              // Label
              if (isHolding || globalScale > 0.8) {
                ctx.font = `${12 / globalScale}px monospace`;
                ctx.fillStyle = node.color;
                ctx.textAlign = "center";
                ctx.fillText(node.id, node.x, node.y + radius + 12 / globalScale);
              }
            }}
            linkWidth={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-green-500/5 border border-green-400/20 rounded">
        <div className="text-[10px] font-mono text-green-400/60 space-y-1">
          <div>
            <strong className="text-green-400">PORTFOLIO SUBGRAPH:</strong> Shows connections between your holdings and intermediary entities
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#fbbf24" }}></div>
              <span>Your Holdings (Golden Ring)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Companies</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>ETFs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Sectors</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Indicators</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}
