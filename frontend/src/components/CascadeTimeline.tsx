"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CascadeResponse, EffectResponse } from "@/types/api";
import {
  TrendingDown,
  TrendingUp,
  Zap,
  Clock,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CascadeTimelineProps {
  cascade: CascadeResponse;
}

export default function CascadeTimeline({ cascade }: CascadeTimelineProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  // Sort periods by time (backend returns "Hour 0-4", "Day 1", "Day 2-3", etc.)
  const periods = Object.keys(cascade.timeline).sort((a, b) => {
    // Extract numeric value for sorting
    const getNumeric = (str: string) => {
      if (str.includes("Hour")) return 0;
      const match = str.match(/Day (\d+)/);
      return match ? parseInt(match[1]) : 999;
    };
    return getNumeric(a) - getNumeric(b);
  });

  // Helper to get icon based on period
  const getIconForPeriod = (period: string) => {
    if (period.includes("Hour")) return Zap;
    if (period.includes("Day 1")) return Clock;
    return Target;
  };

  // Helper to get color based on period
  const getPeriodColor = (period: string) => {
    if (period.includes("Hour")) return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" };
    if (period.includes("Day 1")) return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" };
    return { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" };
  };

  const togglePeriod = (period: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(period)) {
      newExpanded.delete(period);
    } else {
      newExpanded.add(period);
    }
    setExpandedPeriods(newExpanded);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Trigger - Compact */}
      <Card className="p-4 bg-gradient-to-br from-purple-950/30 via-blue-950/30 to-cyan-950/30 border-purple-500/30 shadow-lg shadow-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-400/70 military-font">TRIGGER</span>
            <span className="text-xl font-bold text-purple-300 military-font">
              {cascade.trigger.entity}
            </span>
            <Badge variant={cascade.trigger.magnitude_percent < 0 ? "destructive" : "default"} className="text-sm px-2 py-0.5">
              {cascade.trigger.magnitude_percent > 0 ? "+" : ""}
              {cascade.trigger.magnitude_percent.toFixed(1)}%
            </Badge>
          </div>
        </div>
        {cascade.trigger.description && (
          <p className="text-xs text-green-400/70 mt-2 font-mono ml-8">
            {cascade.trigger.description}
          </p>
        )}
      </Card>

      {/* Compact Timeline Table */}
      <Card className="bg-black/50 border-green-500/30 overflow-hidden">
        <div className="p-4 border-b border-green-500/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-400" />
            <h3 className="font-semibold text-base text-green-400 military-font">CASCADE EFFECTS</h3>
            <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/50 text-xs">
              {cascade.total_effects} total
            </Badge>
          </div>
        </div>

        {/* Compact effect list */}
        <div className="divide-y divide-green-500/20">
          {periods.map((period) => {
            const Icon = getIconForPeriod(period);
            const colors = getPeriodColor(period);
            const isExpanded = expandedPeriods.has(period);
            const effects = cascade.timeline[period];

            return (
              <div key={period} className="animate-fade-in">
                {/* Period Header - Clickable */}
                <button
                  onClick={() => togglePeriod(period)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                    <span className={`text-sm font-semibold ${colors.text} font-mono`}>{period}</span>
                    <Badge variant="secondary" className={`${colors.bg} ${colors.text} border ${colors.border} text-xs`}>
                      {effects.length} effects
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-green-400" />
                  )}
                </button>

                {/* Effects - Compact rows */}
                {!isExpanded && (
                  <div className="px-4 pb-2 space-y-1">
                    {effects.slice(0, 3).map((effect, idx) => (
                      <CompactEffectRow key={idx} effect={effect} />
                    ))}
                    {effects.length > 3 && (
                      <div className="text-xs text-green-400/50 font-mono pl-8 pt-1">
                        + {effects.length - 3} more effects (click to expand)
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {effects.map((effect, idx) => (
                      <ExpandedEffectCard key={idx} effect={effect} colors={colors} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Summary - Compact */}
      <Card className="p-4 bg-gradient-to-br from-gray-950/30 to-slate-950/30 border-green-500/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg">
            <div className="text-green-400/70 text-xs mb-0.5 font-mono">Total Effects</div>
            <div className="text-xl font-bold text-green-400">{cascade.total_effects}</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-lg">
            <div className="text-cyan-400/70 text-xs mb-0.5 font-mono">Horizon</div>
            <div className="text-xl font-bold text-cyan-400">{cascade.horizon_days} days</div>
          </div>
          {Object.entries(cascade.effects_by_order).map(([order, count]) => (
            <div key={order} className="bg-purple-500/10 border border-purple-500/30 px-3 py-2 rounded-lg">
              <div className="text-purple-400/70 text-xs mb-0.5 capitalize font-mono">
                {order.replace(/_/g, " ")}
              </div>
              <div className="text-xl font-bold text-purple-400">{count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Compact single-line effect display
function CompactEffectRow({ effect }: { effect: EffectResponse }) {
  const isNegative = effect.magnitude_percent < 0;
  const confidencePercent = effect.confidence * 100;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-green-500/5 rounded-md transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-bold text-sm text-green-400 military-font truncate">
          {effect.entity}
        </span>
        <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono text-cyan-400 border-cyan-500/50 shrink-0">
          O{effect.order}
        </Badge>
        <Badge
          variant={isNegative ? "destructive" : "default"}
          className="text-xs font-bold px-1.5 py-0 shrink-0"
        >
          {isNegative ? (
            <TrendingDown className="h-3 w-3 mr-0.5" />
          ) : (
            <TrendingUp className="h-3 w-3 mr-0.5" />
          )}
          {effect.magnitude_percent > 0 ? "+" : ""}
          {effect.magnitude_percent.toFixed(2)}%
        </Badge>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-green-400/60 font-mono">
          D{effect.day.toFixed(0)}
        </span>
        <span className={`text-xs font-mono ${confidencePercent >= 70 ? "text-green-400" : confidencePercent >= 50 ? "text-yellow-400" : "text-red-400"}`}>
          {confidencePercent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// Expanded effect card with full details
function ExpandedEffectCard({
  effect,
  colors
}: {
  effect: EffectResponse;
  colors: { bg: string; border: string; text: string };
}) {
  const isNegative = effect.magnitude_percent < 0;
  const confidencePercent = effect.confidence * 100;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return "text-green-400";
    if (conf >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={`p-3 ${colors.bg} border ${colors.border} rounded-lg hover:shadow-md transition-all`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-bold text-base text-green-400 military-font">
          {effect.entity}
        </span>
        <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono text-cyan-400 border-cyan-500/50">
          Order {effect.order}
        </Badge>
        <Badge
          variant={isNegative ? "destructive" : "default"}
          className="text-sm font-bold px-2 py-0.5"
        >
          <div className="flex items-center gap-1">
            {isNegative ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )}
            {effect.magnitude_percent > 0 ? "+" : ""}
            {effect.magnitude_percent.toFixed(2)}%
          </div>
        </Badge>
      </div>

      <p className="text-xs text-green-400/80 mb-2 leading-relaxed font-mono">
        {effect.explanation}
      </p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-black/30 border border-green-500/20 rounded px-2 py-1.5">
          <div className="text-green-400/60 mb-0.5 font-mono">Timing</div>
          <div className="font-semibold text-green-400 font-mono">
            Day {effect.day.toFixed(1)}
          </div>
        </div>
        <div className="bg-black/30 border border-cyan-500/20 rounded px-2 py-1.5">
          <div className="text-cyan-400/60 mb-0.5 font-mono">Confidence</div>
          <div className={`font-semibold font-mono ${getConfidenceColor(confidencePercent)}`}>
            {confidencePercent.toFixed(0)}%
          </div>
        </div>
        <div className="bg-black/30 border border-purple-500/20 rounded px-2 py-1.5">
          <div className="text-purple-400/60 mb-0.5 font-mono">Range</div>
          <div className="font-semibold text-purple-400 font-mono text-[10px]">
            {effect.magnitude_range[0].toFixed(1)}% to {effect.magnitude_range[1].toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
