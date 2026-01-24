"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CascadeResponse, EffectResponse } from "@/types/api";
import { TrendingDown, TrendingUp } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Trigger */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-xl font-bold mb-2">Trigger Event</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{cascade.trigger.entity}</span>
          <Badge
            variant={
              cascade.trigger.magnitude_percent < 0 ? "destructive" : "default"
            }
          >
            {cascade.trigger.magnitude_percent > 0 ? "+" : ""}
            {cascade.trigger.magnitude_percent.toFixed(1)}%
          </Badge>
        </div>
        <p className="text-gray-600 mt-2">{cascade.trigger.description}</p>
      </Card>

      {/* Timeline */}
      {periods.map((period) => (
        <div key={period}>
          <h3 className="text-lg font-semibold mb-3">{periodLabels[period]}</h3>
          <div className="space-y-3">
            {cascade.timeline[period].map((effect, idx) => (
              <EffectCard key={idx} effect={effect} />
            ))}
          </div>
        </div>
      ))}

      {/* Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Effects:</span>
            <span className="ml-2 font-semibold">{cascade.total_effects}</span>
          </div>
          <div>
            <span className="text-gray-600">Horizon:</span>
            <span className="ml-2 font-semibold">
              {cascade.horizon_days} days
            </span>
          </div>
          {Object.entries(cascade.effects_by_order).map(([order, count]) => (
            <div key={order}>
              <span className="text-gray-600">
                {order.replace("_", " ")}:
              </span>
              <span className="ml-2 font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EffectCard({ effect }: { effect: EffectResponse }) {
  const isNegative = effect.magnitude_percent < 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-lg">{effect.entity}</span>
            <Badge variant="outline">Order {effect.order}</Badge>
            <Badge variant={isNegative ? "destructive" : "default"}>
              {isNegative ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1" />
              )}
              {effect.magnitude_percent > 0 ? "+" : ""}
              {effect.magnitude_percent.toFixed(2)}%
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-2">{effect.explanation}</p>

          <div className="flex gap-4 text-xs text-gray-500">
            <span>Day {effect.day.toFixed(1)}</span>
            <span>Confidence: {(effect.confidence * 100).toFixed(0)}%</span>
            <span>
              Range: [{effect.magnitude_range[0].toFixed(2)}%,{" "}
              {effect.magnitude_range[1].toFixed(2)}%]
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
