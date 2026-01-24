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
  const periods = Object.keys(cascade.timeline).sort((a, b) => {
    const order: Record<string, number> = {
      immediate: 0,
      short_term: 1,
      medium_term: 2,
    };
    return order[a] - order[b];
  });

  const periodLabels: Record<string, string> = {
    immediate: "Immediate (0-2 days)",
    short_term: "Short Term (3-7 days)",
    medium_term: "Medium Term (8-14 days)",
  };

  const periodIcons: Record<string, any> = {
    immediate: Zap,
    short_term: Clock,
    medium_term: Target,
  };

  const periodColors: Record<string, string> = {
    immediate: "from-red-50 to-orange-50 border-red-200",
    short_term: "from-yellow-50 to-amber-50 border-yellow-200",
    medium_term: "from-blue-50 to-cyan-50 border-blue-200",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Trigger */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-purple-200 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-bold">Trigger Event</h3>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-bold text-purple-900">
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
          <p className="text-gray-700 mt-2 text-base">
            {cascade.trigger.description}
          </p>
        )}
      </Card>

      {/* Timeline */}
      {periods.map((period, periodIdx) => {
        const Icon = periodIcons[period];
        return (
          <div
            key={period}
            className="animate-fade-in"
            style={{ animationDelay: `${periodIdx * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold">{periodLabels[period]}</h3>
              <Badge variant="secondary" className="ml-2">
                {cascade.timeline[period].length} effects
              </Badge>
            </div>
            <div className="space-y-3">
              {cascade.timeline[period].map((effect, idx) => (
                <EffectCard
                  key={idx}
                  effect={effect}
                  periodColor={periodColors[period]}
                  delay={idx * 50}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-700" />
          <h3 className="font-semibold text-lg">Cascade Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-gray-600 text-sm mb-1">Total Effects</div>
            <div className="text-2xl font-bold text-gray-900">
              {cascade.total_effects}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-gray-600 text-sm mb-1">Horizon</div>
            <div className="text-2xl font-bold text-gray-900">
              {cascade.horizon_days} days
            </div>
          </div>
          {Object.entries(cascade.effects_by_order).map(([order, count]) => (
            <div key={order} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-gray-600 text-sm mb-1 capitalize">
                {order.replace(/_/g, " ")}
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
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
    if (conf >= 70) return "text-green-600";
    if (conf >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card
      className={`p-5 bg-gradient-to-br ${periodColor} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-bold text-xl text-gray-900">
              {effect.entity}
            </span>
            <Badge variant="outline" className="font-semibold">
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

          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {effect.explanation}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white/50 rounded-md px-3 py-2">
              <div className="text-xs text-gray-600 mb-0.5">Timing</div>
              <div className="font-semibold text-gray-900">
                Day {effect.day.toFixed(1)}
              </div>
            </div>
            <div className="bg-white/50 rounded-md px-3 py-2">
              <div className="text-xs text-gray-600 mb-0.5">Confidence</div>
              <div className={`font-semibold ${getConfidenceColor(confidencePercent)}`}>
                {confidencePercent.toFixed(0)}%
              </div>
            </div>
            <div className="bg-white/50 rounded-md px-3 py-2 col-span-2">
              <div className="text-xs text-gray-600 mb-0.5">
                Expected Range
              </div>
              <div className="font-semibold text-gray-900">
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
