"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Target, BarChart3, Zap } from "lucide-react";
import { SignalPerformance } from "@/types/api";

interface SignalScoreboardProps {
  performance: SignalPerformance;
}

export default function SignalScoreboard({ performance }: SignalScoreboardProps) {
  const pnlColor = performance.total_pnl_pct >= 0 ? "text-green-400" : "text-red-400";
  const wrColor = performance.win_rate >= 60 ? "text-green-400" : performance.win_rate >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Total P&L */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-mono text-green-400/60">TOTAL P&L</div>
          <TrendingUp className="h-4 w-4 text-green-400/40" />
        </div>
        <div className={`text-2xl military-font ${pnlColor}`}>
          {performance.total_pnl_pct > 0 ? "+" : ""}{performance.total_pnl_pct.toFixed(1)}%
        </div>
        <div className="text-[9px] font-mono text-green-400/50 mt-1">
          If you followed all signals
        </div>
      </Card>

      {/* Win Rate */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-mono text-green-400/60">WIN RATE</div>
          <Target className="h-4 w-4 text-green-400/40" />
        </div>
        <div className={`text-2xl military-font ${wrColor}`}>
          {performance.win_rate.toFixed(0)}%
        </div>
        <div className="text-[9px] font-mono text-green-400/50 mt-1">
          {performance.wins}W / {performance.losses}L
        </div>
      </Card>

      {/* Avg Return */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-mono text-green-400/60">AVG RETURN</div>
          <BarChart3 className="h-4 w-4 text-green-400/40" />
        </div>
        <div className={`text-2xl military-font ${performance.avg_return_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
          {performance.avg_return_pct > 0 ? "+" : ""}{performance.avg_return_pct.toFixed(2)}%
        </div>
        <div className="text-[9px] font-mono text-green-400/50 mt-1">
          Per trade average
        </div>
      </Card>

      {/* Active Signals */}
      <Card className="p-4 hud-panel border-cyan-500/30">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-mono text-cyan-400/60">SIGNALS</div>
          <Zap className="h-4 w-4 text-cyan-400/40" />
        </div>
        <div className="text-2xl military-font text-cyan-400">
          {performance.active_signals}
        </div>
        <div className="text-[9px] font-mono text-cyan-400/50 mt-1">
          Active now / {performance.closed_signals} closed
        </div>
      </Card>
    </div>
  );
}
