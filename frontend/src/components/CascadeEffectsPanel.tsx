"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronRight, X, TrendingDown, TrendingUp, Download, FileImage, FileText } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { CascadeResponse, EffectResponse } from "@/types/api";
import { downloadAsPNG, downloadAsPDF } from "@/lib/download";

interface GraphNode {
  id: string;
  name: string;
  type: string;
  sector?: string;
  val: number;
  color: string;
}

interface CascadeEffectsPanelProps {
  entity: GraphNode;
  onHighlight: (nodeIds: Set<string>, orderMap: Map<string, number>) => void;
  onClose: () => void;
}

export default function CascadeEffectsPanel({
  entity,
  onHighlight,
  onClose,
}: CascadeEffectsPanelProps) {
  const [magnitude, setMagnitude] = useState(-5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cascade, setCascade] = useState<CascadeResponse | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(1);
  const [downloading, setDownloading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const analyzeCascade = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ConsequenceAPI.predictEarningsCascade({
        entity_id: entity.id,
        surprise_percent: magnitude,
        description: `${Math.abs(magnitude)}% ${magnitude > 0 ? 'positive' : 'negative'} event`,
        horizon_days: 14,
      });
      setCascade(result);

      // Build highlight data for graph
      const nodeIds = new Set<string>([entity.id]);
      const orderMap = new Map<string, number>([[entity.id, 0]]);

      Object.values(result.timeline).flat().forEach((effect: EffectResponse) => {
        nodeIds.add(effect.entity);
        orderMap.set(effect.entity, effect.order);
      });

      onHighlight(nodeIds, orderMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced magnitude change
  useEffect(() => {
    if (cascade) {
      const timer = setTimeout(() => {
        analyzeCascade();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [magnitude]);

  const groupEffectsByOrder = (): Map<number, EffectResponse[]> => {
    if (!cascade) return new Map();

    const byOrder = new Map<number, EffectResponse[]>();
    Object.values(cascade.timeline).flat().forEach((effect: EffectResponse) => {
      if (!byOrder.has(effect.order)) {
        byOrder.set(effect.order, []);
      }
      byOrder.get(effect.order)!.push(effect);
    });

    // Sort effects within each order by magnitude (absolute value)
    byOrder.forEach((effects) => {
      effects.sort((a, b) => Math.abs(b.magnitude_percent) - Math.abs(a.magnitude_percent));
    });

    return byOrder;
  };

  const getOrderLabel = (order: number): string => {
    if (order === 1) return "1ST ORDER";
    if (order === 2) return "2ND ORDER";
    if (order === 3) return "3RD ORDER";
    return `${order}TH ORDER`;
  };

  const getOrderColor = (order: number): string => {
    const colors = [
      "rgb(252, 211, 77)",  // Yellow/gold for trigger
      "rgb(136, 212, 152)", // Bright green for 1st
      "rgb(134, 239, 172)", // Medium green for 2nd
      "rgb(187, 247, 208)", // Pale green for 3rd+
    ];
    return colors[Math.min(order, colors.length - 1)];
  };

  const effectsByOrder = groupEffectsByOrder();

  // Preset magnitude values
  const PRESETS = [
    { label: "Large Miss", value: -10, color: "text-red-400" },
    { label: "Miss", value: -5, color: "text-orange-400" },
    { label: "Beat", value: 5, color: "text-green-400" },
    { label: "Large Beat", value: 10, color: "text-emerald-400" },
  ];

  // Check if entity type is company (case-insensitive check)
  const isCompany = entity.type?.toLowerCase() === "company";

  const handleDownloadPNG = async () => {
    if (!panelRef.current) return;
    setDownloading(true);
    try {
      const filename = `cascade-${entity.id}-${magnitude.toFixed(1)}pct.png`;
      await downloadAsPNG(panelRef.current, filename);
    } catch (err) {
      console.error('Failed to download PNG:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!panelRef.current) return;
    setDownloading(true);
    try {
      const filename = `cascade-${entity.id}-${magnitude.toFixed(1)}pct.pdf`;
      await downloadAsPDF(panelRef.current, filename, 'portrait');
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card ref={panelRef} className="mt-4 p-4 hud-panel border-green-500/30 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="military-font text-green-400 text-sm">
          &gt; CASCADE ANALYSIS
        </div>
        <div className="flex items-center gap-2">
          {cascade && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownloadPNG}
                disabled={downloading}
                className="text-cyan-400/60 hover:text-cyan-400 transition p-1 border border-cyan-400/30 rounded hover:bg-cyan-400/10 disabled:opacity-50"
                title="Download as PNG"
              >
                <FileImage className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="text-blue-400/60 hover:text-blue-400 transition p-1 border border-blue-400/30 rounded hover:bg-blue-400/10 disabled:opacity-50"
                title="Download as PDF"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-green-400/60 hover:text-green-400 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Entity Type Check */}
      {!isCompany && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded">
          <p className="text-xs font-mono text-yellow-400">
            &gt; CASCADE ANALYSIS ONLY AVAILABLE FOR COMPANIES
          </p>
          <p className="text-[10px] font-mono text-yellow-400/60 mt-1">
            ETFs and sectors represent aggregates, not individual earnings events.
          </p>
        </div>
      )}

      {/* Magnitude Slider */}
      {isCompany && (
        <>
          {/* Preset Buttons */}
          <div className="mb-3">
            <span className="text-[10px] font-mono text-green-400/50 mb-1 block">QUICK PRESETS</span>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  onClick={() => setMagnitude(preset.value)}
                  variant="outline"
                  size="sm"
                  className={`text-[10px] px-2 py-1 h-auto font-mono border-green-500/30 hover:bg-green-500/10 ${
                    magnitude === preset.value ? 'bg-green-500/20 border-green-400' : ''
                  } ${preset.color}`}
                  disabled={loading}
                >
                  {preset.value > 0 ? '+' : ''}{preset.value}%
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-green-400/70">EVENT MAGNITUDE</span>
              <span className="text-sm font-bold military-font text-green-400">
                {magnitude > 0 ? '+' : ''}{magnitude.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[magnitude]}
              onValueChange={(value) => setMagnitude(value[0])}
              min={-20}
              max={20}
              step={0.5}
              className="w-full"
              disabled={loading}
            />
            <div className="flex justify-between text-[10px] font-mono text-green-400/50 mt-1">
              <span>-20%</span>
              <span>0%</span>
              <span>+20%</span>
            </div>
          </div>
        </>
      )}

      {/* Analyze Button */}
      {isCompany && !cascade && (
        <Button
          onClick={analyzeCascade}
          disabled={loading}
          className="w-full tactical-button military-font text-xs"
        >
          {loading ? "ANALYZING..." : "ANALYZE CASCADE"}
        </Button>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded">
          <p className="text-xs font-mono text-red-400">&gt; ERROR: {error}</p>
        </div>
      )}

      {/* Cascade Results */}
      {cascade && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono text-green-400/60">
              TOTAL EFFECTS: {cascade.total_effects} | HORIZON: {cascade.horizon_days} DAYS
            </div>
            <button
              onClick={() => onHighlight(new Set(), new Map())}
              className="text-[10px] font-mono text-yellow-400/70 hover:text-yellow-400 transition px-2 py-1 border border-yellow-400/30 rounded hover:bg-yellow-400/10"
            >
              CLEAR HIGHLIGHTS
            </button>
          </div>

          {/* Helpful tip if no 2nd/3rd order effects */}
          {effectsByOrder.size === 1 && Math.abs(magnitude) < 8 && (
            <div className="mb-3 p-2 bg-blue-500/10 border border-blue-400/30 rounded">
              <p className="text-[10px] font-mono text-blue-400">
                💡 TIP: Increase magnitude to ±8% or higher to see 2nd and 3rd order cascade effects
              </p>
            </div>
          )}

          {/* Show cascade depth summary */}
          {effectsByOrder.size > 1 && (
            <div className="mb-3 p-2 bg-green-500/10 border border-green-400/30 rounded flex items-center justify-between">
              <p className="text-[10px] font-mono text-green-400">
                📊 CASCADE DEPTH: {effectsByOrder.size} levels detected
              </p>
              <p className="text-[9px] font-mono text-green-400/60">
                Click sections below to expand
              </p>
            </div>
          )}

          {Array.from(effectsByOrder.entries())
            .sort(([a], [b]) => a - b)
            .map(([order, effects]) => {
              const isExpanded = expandedOrder === order;
              const totalImpact = effects.reduce((sum, e) => sum + e.magnitude_percent, 0);
              const avgConfidence = effects.reduce((sum, e) => sum + e.confidence, 0) / effects.length;

              return (
                <div key={order} className="border border-green-500/20 rounded">
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order)}
                    className="w-full p-3 flex items-center justify-between hover:bg-green-500/5 transition"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-green-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-green-400" />
                      )}
                      <span className="military-font text-xs text-green-400">
                        {getOrderLabel(order)} EFFECTS ({effects.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className={totalImpact < 0 ? "text-red-400" : "text-green-400"}>
                        Impact: {totalImpact > 0 ? '+' : ''}{totalImpact.toFixed(2)}%
                      </span>
                      <span className="text-green-400/60">
                        Conf: {(avgConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </button>

                  {/* Effect List */}
                  {isExpanded && (
                    <div className="border-t border-green-500/20 p-2 space-y-1">
                      {effects.slice(0, 10).map((effect, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-black/20 rounded hover:bg-black/40 transition cursor-pointer group"
                          onClick={() => {
                            // Highlight the causal chain for this effect
                            const chainNodeIds = new Set<string>([entity.id, ...effect.cause_path]);
                            const chainOrderMap = new Map<string, number>();

                            // Set order for trigger entity
                            chainOrderMap.set(entity.id, 0);

                            // Set order for entities in the causal path
                            effect.cause_path.forEach((entityId, pathIdx) => {
                              // The order increases as we go through the path
                              chainOrderMap.set(entityId, pathIdx + 1);
                            });

                            onHighlight(chainNodeIds, chainOrderMap);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1">
                              <div className="text-xs font-bold text-green-400 group-hover:text-green-300 transition-colors flex items-center gap-2">
                                {effect.entity}
                                <span className="text-[9px] font-mono text-green-400/40 group-hover:text-green-400/60">
                                  [CLICK TO HIGHLIGHT CHAIN]
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-green-400/50">
                                {effect.relationship_type.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                {effect.magnitude_percent < 0 ? (
                                  <TrendingDown className="h-3 w-3 text-red-400" />
                                ) : (
                                  <TrendingUp className="h-3 w-3 text-green-400" />
                                )}
                                <span className={effect.magnitude_percent < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                                  {effect.magnitude_percent > 0 ? '+' : ''}{effect.magnitude_percent.toFixed(2)}%
                                </span>
                              </div>
                              <span className="text-green-400/60 font-mono text-[10px]">
                                {(effect.confidence * 100).toFixed(0)}%
                              </span>
                              <span className="text-green-400/50 font-mono text-[10px]">
                                {effect.day.toFixed(0)}d
                              </span>
                            </div>
                          </div>
                          {/* Explanation text */}
                          {effect.explanation && (
                            <div className="text-[9px] font-mono text-green-400/40 leading-relaxed border-t border-green-500/10 pt-1 mt-1">
                              {effect.explanation.split(' | ').map((part, i) => (
                                <div key={i}>{part}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {effects.length > 10 && (
                        <div className="text-center text-[10px] font-mono text-green-400/50 pt-2">
                          ... {effects.length - 10} more effects
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}
