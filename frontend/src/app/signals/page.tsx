"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { TradeSignal, SignalPerformance } from "@/types/api";
import SignalCard from "@/components/SignalCard";
import SignalScoreboard from "@/components/SignalScoreboard";

export default function SignalsPage() {
  const [activeSignals, setActiveSignals] = useState<TradeSignal[]>([]);
  const [historySignals, setHistorySignals] = useState<TradeSignal[]>([]);
  const [performance, setPerformance] = useState<SignalPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState<"active" | "history">("active");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes, perfRes] = await Promise.all([
        ConsequenceAPI.getActiveSignals(),
        ConsequenceAPI.getSignalHistory(30),
        ConsequenceAPI.getSignalPerformance(),
      ]);
      setActiveSignals(activeRes.signals);
      setHistorySignals(historyRes.signals);
      setPerformance(perfRes);
    } catch (err) {
      console.error("Failed to load signals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrices = async () => {
    setUpdating(true);
    try {
      await ConsequenceAPI.updateSignalPrices();
      await loadData(); // Reload after update
    } catch (err) {
      console.error("Failed to update prices:", err);
    } finally {
      setUpdating(false);
    }
  };

  const closedSignals = historySignals.filter(s => s.status !== "active");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold military-font text-green-400 mb-2">
          &gt; TRADE SIGNALS
        </h1>
        <p className="text-sm text-green-400/60 font-mono">
          Actionable BUY/SELL signals generated from cascade predictions — with entry, target, stop, and conviction scores
        </p>
      </div>

      {/* Explainer */}
      <Card className="p-4 hud-panel border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-green-500/5 mb-6">
        <h3 className="text-sm military-font text-cyan-400 mb-2">&gt; HOW SIGNALS WORK</h3>
        <div className="text-xs font-mono text-green-400/70 space-y-2">
          <p>
            <strong className="text-green-400">From prediction to action:</strong> When you run a cascade prediction
            on the Predict page, the engine identifies which stocks will move. Signals turn those predictions into
            concrete trades with entry prices, profit targets, stop losses, and conviction ratings.
          </p>
          <p>
            <strong className="text-green-400">Conviction stars:</strong>{" "}
            <span className="text-yellow-400">5 stars</span> = high confidence, 1st-order effect, large magnitude.{" "}
            <span className="text-yellow-400">1 star</span> = lower confidence, distant cascade, smaller move.
            Higher conviction = larger suggested position size.
          </p>
          <p>
            <strong className="text-green-400">P&L tracking:</strong> Every signal is tracked against real prices.
            When price hits the target or stop, the signal closes and P&L is calculated. The scoreboard shows your
            cumulative edge.
          </p>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          <span className="ml-3 text-sm font-mono text-green-400">Loading signals...</span>
        </div>
      ) : (
        <>
          {/* Scoreboard */}
          {performance && performance.total_signals > 0 && (
            <SignalScoreboard performance={performance} />
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTab("active")}
                className={`text-xs font-mono border-green-500/30 ${
                  tab === "active"
                    ? "bg-green-500/20 !text-green-400 border-green-400"
                    : "!text-green-400/60 hover:!text-green-400/80"
                }`}
              >
                <Zap className="h-3 w-3 mr-1" />
                ACTIVE ({activeSignals.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTab("history")}
                className={`text-xs font-mono border-green-500/30 ${
                  tab === "history"
                    ? "bg-green-500/20 !text-green-400 border-green-400"
                    : "!text-green-400/60 hover:!text-green-400/80"
                }`}
              >
                HISTORY ({closedSignals.length})
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdatePrices}
              disabled={updating}
              className="text-xs font-mono border-green-500/30 !text-green-400/60 hover:!text-green-400"
            >
              {updating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              UPDATE PRICES
            </Button>
          </div>

          {/* Active Signals */}
          {tab === "active" && (
            <div className="space-y-3">
              {activeSignals.length === 0 ? (
                <Card className="p-8 hud-panel border-green-500/30 text-center">
                  <Zap className="h-12 w-12 text-green-400/20 mx-auto mb-3" />
                  <p className="text-sm font-mono text-green-400/60 mb-2">
                    No active signals yet
                  </p>
                  <p className="text-xs font-mono text-green-400/40">
                    Go to the <strong>Predict</strong> page, run a cascade, and signals will be generated automatically.
                    Or use the <strong>Calendar</strong> to see upcoming earnings events.
                  </p>
                </Card>
              ) : (
                activeSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))
              )}
            </div>
          )}

          {/* History */}
          {tab === "history" && (
            <div className="space-y-3">
              {closedSignals.length === 0 ? (
                <Card className="p-8 hud-panel border-green-500/30 text-center">
                  <p className="text-sm font-mono text-green-400/60">
                    No closed signals yet. Active signals close when price hits target, stop, or expires.
                  </p>
                </Card>
              ) : (
                closedSignals
                  .sort((a, b) => (b.exit_date || "").localeCompare(a.exit_date || ""))
                  .map((signal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
