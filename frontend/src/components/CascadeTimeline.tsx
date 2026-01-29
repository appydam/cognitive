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
import { CausalChainModal } from "./CausalChainModal";

interface CascadeTimelineProps {
  cascade: CascadeResponse;
}

export default function CascadeTimeline({ cascade }: CascadeTimelineProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [selectedChainEffect, setSelectedChainEffect] = useState<EffectResponse | null>(null);

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
    if (period.includes("Hour")) return { bg: "bg-orange-900/10", border: "border-orange-700/30", text: "text-orange-400" };
    if (period.includes("Day 1")) return { bg: "bg-amber-900/10", border: "border-amber-700/30", text: "text-amber-400" };
    return { bg: "bg-blue-900/10", border: "border-blue-700/30", text: "text-blue-400" };
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
      <Card className="p-4 bg-slate-900/40 border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-400">Trigger</span>
            <span className="text-lg font-semibold text-slate-200">
              {cascade.trigger.entity}
            </span>
            <Badge
              variant={cascade.trigger.magnitude_percent < 0 ? "destructive" : "default"}
              className={`text-xs px-2 py-0.5 font-semibold ${cascade.trigger.magnitude_percent < 0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
            >
              {cascade.trigger.magnitude_percent > 0 ? "+" : ""}
              {cascade.trigger.magnitude_percent.toFixed(1)}%
            </Badge>
          </div>
        </div>
        {cascade.trigger.description && (
          <p className="text-xs text-slate-400 mt-2 ml-7">
            {cascade.trigger.description}
          </p>
        )}
      </Card>

      {/* Compact Timeline Table */}
      <Card className="bg-slate-900/40 border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-300" />
            <h3 className="font-medium text-sm text-slate-200">Cascade Effects</h3>
            <Badge variant="secondary" className="ml-2 bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
              {cascade.total_effects} total
            </Badge>
          </div>
        </div>

        {/* Compact effect list */}
        <div className="divide-y divide-slate-700/30">
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
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                    <span className={`text-sm font-medium ${colors.text}`}>{period}</span>
                    <Badge variant="secondary" className={`${colors.bg} ${colors.text} border ${colors.border} text-xs`}>
                      {effects.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {/* Effects - Compact rows */}
                {!isExpanded && (
                  <div className="px-4 pb-2 space-y-1">
                    {effects.slice(0, 3).map((effect, idx) => (
                      <CompactEffectRow key={idx} effect={effect} />
                    ))}
                    {effects.length > 3 && (
                      <div className="text-xs text-slate-500 pl-8 pt-1">
                        + {effects.length - 3} more effects (click to expand)
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {effects.map((effect, idx) => (
                      <ExpandedEffectCard
                        key={idx}
                        effect={effect}
                        colors={colors}
                        onViewChain={() => setSelectedChainEffect(effect)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Summary - Compact */}
      <Card className="p-4 bg-slate-900/40 border-slate-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/40 border border-slate-700/50 px-3 py-2 rounded-lg">
            <div className="text-slate-400 text-xs mb-0.5">Total Effects</div>
            <div className="text-xl font-semibold text-slate-200">{cascade.total_effects}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 px-3 py-2 rounded-lg">
            <div className="text-slate-400 text-xs mb-0.5">Horizon</div>
            <div className="text-xl font-semibold text-slate-200">{cascade.horizon_days} days</div>
          </div>
          {Object.entries(cascade.effects_by_order).map(([order, count]) => (
            <div key={order} className="bg-slate-800/40 border border-slate-700/50 px-3 py-2 rounded-lg">
              <div className="text-slate-400 text-xs mb-0.5 capitalize">
                {order.replace(/_/g, " ")}
              </div>
              <div className="text-xl font-semibold text-slate-200">{count}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Causal Chain Modal */}
      {selectedChainEffect && (
        <CausalChainModal
          effect={selectedChainEffect}
          triggerParams={{
            ticker: cascade.trigger.entity,
            surprise_percent: cascade.trigger.magnitude_percent,
            horizon_days: cascade.horizon_days,
          }}
          onClose={() => setSelectedChainEffect(null)}
        />
      )}
    </div>
  );
}

// Compact single-line effect display
function CompactEffectRow({ effect }: { effect: EffectResponse }) {
  const isNegative = effect.magnitude_percent < 0;
  const confidencePercent = effect.confidence * 100;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-800/20 rounded-md transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium text-sm text-slate-200 truncate">
          {effect.entity}
        </span>
        <Badge variant="outline" className="text-xs px-1.5 py-0 text-slate-400 border-slate-600 shrink-0">
          O{effect.order}
        </Badge>
        <Badge
          variant={isNegative ? "destructive" : "default"}
          className={`text-xs font-semibold px-1.5 py-0 shrink-0 ${isNegative ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
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
        <span className="text-xs text-slate-400">
          D{effect.day.toFixed(0)}
        </span>
        <span className={`text-xs ${confidencePercent >= 70 ? "text-emerald-400" : confidencePercent >= 50 ? "text-amber-400" : "text-orange-400"}`}>
          {confidencePercent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// Expanded effect card with full details
function ExpandedEffectCard({
  effect,
  colors,
  onViewChain
}: {
  effect: EffectResponse;
  colors: { bg: string; border: string; text: string };
  onViewChain: () => void;
}) {
  const isNegative = effect.magnitude_percent < 0;
  const confidencePercent = effect.confidence * 100;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return "text-emerald-400";
    if (conf >= 50) return "text-amber-400";
    return "text-orange-400";
  };

  return (
    <div className={`p-3 ${colors.bg} border ${colors.border} rounded-lg hover:shadow-sm transition-all`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-semibold text-sm text-slate-200">
          {effect.entity}
        </span>
        <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-slate-400 border-slate-600">
          Order {effect.order}
        </Badge>
        <Badge
          variant={isNegative ? "destructive" : "default"}
          className={`text-xs font-semibold px-2 py-0.5 ${isNegative ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
        >
          <div className="flex items-center gap-1">
            {isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {effect.magnitude_percent > 0 ? "+" : ""}
            {effect.magnitude_percent.toFixed(2)}%
          </div>
        </Badge>
      </div>

      {/* Detailed Explanation - Split by pipe for better readability */}
      <div className="mb-2 space-y-1">
        {effect.explanation.split(' | ').map((part, idx) => (
          <p key={idx} className="text-xs text-slate-400 leading-relaxed">
            {part}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded px-2 py-1.5">
          <div className="text-slate-500 mb-0.5">Timing</div>
          <div className="font-medium text-slate-300">
            Day {effect.day.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded px-2 py-1.5">
          <div className="text-slate-500 mb-0.5">Confidence</div>
          <div className={`font-medium ${getConfidenceColor(confidencePercent)}`}>
            {confidencePercent.toFixed(0)}%
          </div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded px-2 py-1.5">
          <div className="text-slate-500 mb-0.5">Range</div>
          <div className="font-medium text-slate-300 text-[10px]">
            {effect.magnitude_range[0].toFixed(1)}% to {effect.magnitude_range[1].toFixed(1)}%
          </div>
        </div>
      </div>

      {/* View Chain Button */}
      <button
        onClick={onViewChain}
        className="mt-3 w-full px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-400/30 rounded-lg text-sm font-medium text-green-400 transition-all hover:border-green-400/50 flex items-center justify-center gap-2"
      >
        <span>View Full Causal Chain</span>
        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
      </button>
    </div>
  );
}
