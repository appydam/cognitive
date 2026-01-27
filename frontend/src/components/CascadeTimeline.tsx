"use client";

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
} from "lucide-react";

interface CascadeTimelineProps {
  cascade: CascadeResponse;
}

export default function CascadeTimeline({ cascade }: CascadeTimelineProps) {
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
  const getColorForPeriod = (period: string) => {
    if (period.includes("Hour")) return "from-red-950/30 to-orange-950/30 border-red-500/30 bg-black/50";
    if (period.includes("Day 1")) return "from-yellow-950/30 to-amber-950/30 border-yellow-500/30 bg-black/50";
    return "from-blue-950/30 to-cyan-950/30 border-cyan-500/30 bg-black/50";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Trigger */}
      <Card className="p-6 bg-gradient-to-br from-purple-950/30 via-blue-950/30 to-cyan-950/30 border-purple-500/30 shadow-lg shadow-purple-500/10 bg-black/50">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-bold text-purple-400 military-font">TRIGGER EVENT</h3>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-bold text-purple-300">
            {cascade.trigger.entity}
          </span>
          <Badge
            variant={
              cascade.trigger.magnitude_percent < 0 ? "destructive" : "default"
            }
            className="text-base px-3 py-1"
          >
            {cascade.trigger.magnitude_percent > 0 ? "+" : ""}
            {cascade.trigger.magnitude_percent.toFixed(1)}%
          </Badge>
        </div>
        {cascade.trigger.description && (
          <p className="text-green-400/70 mt-2 text-base font-mono">
            {cascade.trigger.description}
          </p>
        )}
      </Card>

      {/* Timeline */}
      {periods.map((period, periodIdx) => {
        const Icon = getIconForPeriod(period);
        const periodColor = getColorForPeriod(period);
        return (
          <div
            key={period}
            className="animate-fade-in"
            style={{ animationDelay: `${periodIdx * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className="h-5 w-5 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-200">{period}</h3>
              <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/50">
                {cascade.timeline[period].length} effects
              </Badge>
            </div>
            <div className="space-y-3">
              {cascade.timeline[period].map((effect, idx) => (
                <EffectCard
                  key={idx}
                  effect={effect}
                  periodColor={periodColor}
                  delay={idx * 50}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-br from-gray-950/30 to-slate-950/30 border-green-500/30 animate-fade-in bg-black/50">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-lg text-green-400 military-font">CASCADE SUMMARY</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg shadow-sm">
            <div className="text-green-400/70 text-sm mb-1 font-mono">Total Effects</div>
            <div className="text-2xl font-bold text-green-400">
              {cascade.total_effects}
            </div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-lg shadow-sm">
            <div className="text-cyan-400/70 text-sm mb-1 font-mono">Horizon</div>
            <div className="text-2xl font-bold text-cyan-400">
              {cascade.horizon_days} days
            </div>
          </div>
          {Object.entries(cascade.effects_by_order).map(([order, count]) => (
            <div key={order} className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg shadow-sm">
              <div className="text-purple-400/70 text-sm mb-1 capitalize font-mono">
                {order.replace(/_/g, " ")}
              </div>
              <div className="text-2xl font-bold text-purple-400">{count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EffectCard({
  effect,
  periodColor,
  delay,
}: {
  effect: EffectResponse;
  periodColor: string;
  delay: number;
}) {
  const isNegative = effect.magnitude_percent < 0;
  const confidencePercent = effect.confidence * 100;

  // Determine confidence color
  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return "text-green-400";
    if (conf >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card
      className={`p-5 bg-gradient-to-br ${periodColor} hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-bold text-xl text-green-400 military-font">
              {effect.entity}
            </span>
            <Badge variant="outline" className="font-semibold font-mono text-cyan-400 border-cyan-500/50">
              Order {effect.order}
            </Badge>
            <Badge
              variant={isNegative ? "destructive" : "default"}
              className="text-base font-bold px-2 py-1"
            >
              <div className="flex items-center gap-1">
                {isNegative ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {effect.magnitude_percent > 0 ? "+" : ""}
                {effect.magnitude_percent.toFixed(2)}%
              </div>
            </Badge>
          </div>

          <p className="text-sm text-green-400/80 mb-3 leading-relaxed font-mono">
            {effect.explanation}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-black/30 border border-green-500/20 rounded-md px-3 py-2">
              <div className="text-xs text-green-400/60 mb-0.5 font-mono">Timing</div>
              <div className="font-semibold text-green-400 font-mono">
                Day {effect.day.toFixed(1)}
              </div>
            </div>
            <div className="bg-black/30 border border-cyan-500/20 rounded-md px-3 py-2">
              <div className="text-xs text-cyan-400/60 mb-0.5 font-mono">Confidence</div>
              <div className={`font-semibold font-mono ${getConfidenceColor(confidencePercent)}`}>
                {confidencePercent.toFixed(0)}%
              </div>
            </div>
            <div className="bg-black/30 border border-purple-500/20 rounded-md px-3 py-2 col-span-2">
              <div className="text-xs text-purple-400/60 mb-0.5 font-mono">
                Expected Range
              </div>
              <div className="font-semibold text-purple-400 font-mono">
                {effect.magnitude_range[0].toFixed(2)}% to{" "}
                {effect.magnitude_range[1].toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
