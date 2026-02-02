"use client";

import { TrendingDown, TrendingUp, Star, Clock, Shield, Target, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TradeSignal } from "@/types/api";

interface SignalCardProps {
  signal: TradeSignal;
  compact?: boolean;
}

export default function SignalCard({ signal, compact = false }: SignalCardProps) {
  const isBuy = signal.direction === "BUY";
  const dirColor = isBuy ? "text-green-400" : "text-red-400";
  const dirBg = isBuy ? "bg-green-500/10 border-green-400/30" : "bg-red-500/10 border-red-400/30";
  const dirIcon = isBuy ? TrendingUp : TrendingDown;
  const DirIcon = dirIcon;

  const statusColors: Record<string, string> = {
    active: "text-cyan-400 bg-cyan-500/10 border-cyan-400/30",
    target_hit: "text-green-400 bg-green-500/10 border-green-400/30",
    stopped: "text-red-400 bg-red-500/10 border-red-400/30",
    expired: "text-yellow-400 bg-yellow-500/10 border-yellow-400/30",
  };

  const statusLabels: Record<string, string> = {
    active: "ACTIVE",
    target_hit: "TARGET HIT",
    stopped: "STOPPED OUT",
    expired: "EXPIRED",
  };

  const pnlColor = (signal.pnl_percent || 0) >= 0 ? "text-green-400" : "text-red-400";

  if (compact) {
    return (
      <div className={`p-3 rounded border ${dirBg} hover:bg-opacity-20 transition`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DirIcon className={`h-4 w-4 ${dirColor}`} />
            <span className={`text-sm font-bold military-font ${dirColor}`}>
              {signal.direction} {signal.ticker}
            </span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < signal.conviction ? "text-yellow-400 fill-yellow-400" : "text-green-400/20"}`}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold military-font ${dirColor}`}>
              {signal.magnitude_percent > 0 ? "+" : ""}{signal.magnitude_percent}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-green-400/50">
          <span>Entry: ${signal.entry_price}</span>
          <span>Target: ${signal.target_price}</span>
          <span>Stop: ${signal.stop_price}</span>
          <span>{signal.horizon_days}d horizon</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-4 hud-panel border ${isBuy ? "border-green-500/30" : "border-red-500/30"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-bold military-font ${dirBg} border`}>
            <DirIcon className={`h-3 w-3 inline mr-1 ${dirColor}`} />
            <span className={dirColor}>{signal.direction} {signal.ticker}</span>
          </div>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < signal.conviction ? "text-yellow-400 fill-yellow-400" : "text-green-400/20"}`}
              />
            ))}
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded border text-[10px] font-mono ${statusColors[signal.status] || statusColors.active}`}>
          {statusLabels[signal.status] || signal.status}
        </div>
      </div>

      {/* Price Levels */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-2 bg-black/30 rounded border border-green-500/10">
          <div className="text-[9px] font-mono text-green-400/50">ENTRY</div>
          <div className="text-sm font-bold military-font text-green-400">${signal.entry_price.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-black/30 rounded border border-green-500/10">
          <div className="text-[9px] font-mono text-green-400/50 flex items-center gap-1">
            <Target className="h-2.5 w-2.5" /> TARGET
          </div>
          <div className={`text-sm font-bold military-font ${dirColor}`}>
            ${signal.target_price.toFixed(2)}
            <span className="text-[10px] ml-1">
              ({signal.magnitude_percent > 0 ? "+" : ""}{signal.magnitude_percent}%)
            </span>
          </div>
        </div>
        <div className="p-2 bg-black/30 rounded border border-green-500/10">
          <div className="text-[9px] font-mono text-green-400/50 flex items-center gap-1">
            <Shield className="h-2.5 w-2.5" /> STOP
          </div>
          <div className="text-sm font-bold military-font text-orange-400">${signal.stop_price.toFixed(2)}</div>
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-4 mb-3 text-[10px] font-mono text-green-400/60">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {signal.horizon_days}d horizon
        </span>
        <span>Day {signal.day}</span>
        <span>R/R: {signal.reward_risk_ratio}:1</span>
        <span>Size: {signal.position_size_pct}%</span>
        <span>Conf: {(signal.confidence * 100).toFixed(0)}%</span>
      </div>

      {/* Why Section */}
      <div className="p-2 bg-cyan-500/5 border border-cyan-400/20 rounded mb-2">
        <div className="text-[10px] font-mono text-cyan-400/80">
          <strong className="text-cyan-400">WHY:</strong> {signal.trigger_event}
          {signal.cause_chain.length > 0 && (
            <span className="block mt-1 text-cyan-400/50">
              Chain: {signal.cause_chain.join(" → ")} → {signal.ticker}
            </span>
          )}
        </div>
      </div>

      {/* Risk/Reward */}
      <div className="flex items-center gap-3 text-[10px] font-mono">
        {signal.max_loss_dollars !== null && signal.max_loss_dollars !== undefined && (
          <span className="text-red-400/70 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Max loss: ${Math.abs(signal.max_loss_dollars).toFixed(0)}
          </span>
        )}
        {signal.max_gain_dollars !== null && signal.max_gain_dollars !== undefined && (
          <span className="text-green-400/70">
            Target gain: ${signal.max_gain_dollars.toFixed(0)}
          </span>
        )}
      </div>

      {/* P&L for closed signals */}
      {signal.status !== "active" && signal.pnl_percent !== undefined && (
        <div className={`mt-3 p-2 rounded border ${(signal.pnl_percent || 0) >= 0 ? "bg-green-500/10 border-green-400/30" : "bg-red-500/10 border-red-400/30"}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-green-400/60">RESULT</span>
            <span className={`text-sm font-bold military-font ${pnlColor}`}>
              {(signal.pnl_percent || 0) > 0 ? "+" : ""}{(signal.pnl_percent || 0).toFixed(2)}%
            </span>
          </div>
          {signal.exit_price && (
            <div className="text-[10px] font-mono text-green-400/50 mt-1">
              Exited at ${signal.exit_price.toFixed(2)} on {signal.exit_date?.split("T")[0]}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
