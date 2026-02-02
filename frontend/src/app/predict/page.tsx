"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";
import CascadeTimeline from "@/components/CascadeTimeline";
import SignalCard from "@/components/SignalCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Network, Clock, Sparkles, Briefcase, TrendingUp, TrendingDown, Zap, Loader2 } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { CascadeResponse, TradeSignal } from "@/types/api";
import { getPortfolio, hasPortfolio } from "@/lib/portfolio";

// Dynamic import for CascadeGraph to avoid SSR issues with ForceGraph2D
const CascadeGraph = dynamic(
  () => import("@/components/CascadeGraph"),
  { ssr: false }
);

export default function PredictPage() {
  const [cascade, setCascade] = useState<CascadeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState<string | null>(null);
  const [lastTrigger, setLastTrigger] = useState<{ entity: string; magnitude: number } | null>(null);

  // Check portfolio impact
  const portfolioExists = hasPortfolio();
  const getPortfolioImpact = () => {
    if (!cascade || !portfolioExists) return null;

    const portfolio = getPortfolio();
    const portfolioHoldingIds = new Set(portfolio.holdings.map(h => h.entity_id));

    // Filter cascade effects to only portfolio holdings
    const affectedHoldings = Object.values(cascade.timeline)
      .flat()
      .filter(effect => portfolioHoldingIds.has(effect.entity));

    if (affectedHoldings.length === 0) return null;

    // Calculate aggregate impact
    const totalImpact = affectedHoldings.reduce((sum, effect) => sum + effect.magnitude_percent, 0);
    const avgImpact = totalImpact / affectedHoldings.length;

    return {
      affectedCount: affectedHoldings.length,
      totalHoldings: portfolio.holdings.length,
      avgImpact,
      effects: affectedHoldings,
    };
  };

  const portfolioImpact = getPortfolioImpact();

  const handlePredict = async (data: any) => {
    setLoading(true);
    setError(null);
    setSignals([]);
    setSignalsError(null);
    try {
      const result = await ConsequenceAPI.predictEarningsCascade(data);
      setCascade(result);
      setLastTrigger({
        entity: data.entity_id || data.ticker,
        magnitude: data.surprise_percent,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSignals = async () => {
    if (!lastTrigger) return;
    setSignalsLoading(true);
    setSignalsError(null);
    try {
      const description = cascade?.trigger?.description || "";
      const res = await ConsequenceAPI.generateSignals(
        lastTrigger.entity,
        lastTrigger.magnitude,
        description
      );
      setSignals(res.signals);
    } catch (err: any) {
      setSignalsError(err.message);
    } finally {
      setSignalsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black tactical-grid">
      <div className="container mx-auto px-4 py-10 max-w-[1600px]">
        {/* Hero Header */}
        <div className="mb-10 slide-up">
          <div className="inline-flex items-center gap-2 bg-slate-800/30 border border-slate-700/50 text-slate-300 px-4 py-1.5 text-xs mb-4 rounded-md">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            Cascade Prediction Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-100 military-font">
            Cascade Prediction
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Predict multi-hop effects across supply chains and sectors with quantified confidence and timing
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Form - 2 columns */}
          <div className="lg:col-span-2 slide-up stagger-1">
            <PredictionForm onSubmit={handlePredict} loading={loading} />
            {error && (
              <div className="mt-4 p-4 bg-red-950/20 border border-red-800/40 rounded-lg animate-fade-in">
                <p className="font-medium text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            )}
          </div>

          {/* Results Panel - 3 columns */}
          <div className="lg:col-span-3 slide-up stagger-2">
            {cascade && (
              <>
                {/* Portfolio Impact Banner */}
                {portfolioImpact && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-400/30 rounded-lg animate-fade-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-bold military-font text-cyan-400">
                            IMPACT ON YOUR PORTFOLIO
                          </span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <div className={`text-2xl military-font ${
                            portfolioImpact.avgImpact < 0 ? "text-red-400" : "text-green-400"
                          }`}>
                            {portfolioImpact.avgImpact > 0 ? "+" : ""}
                            {portfolioImpact.avgImpact.toFixed(2)}%
                          </div>
                          <div className="text-xs font-mono text-cyan-400/70">
                            {portfolioImpact.affectedCount} of {portfolioImpact.totalHoldings} holdings affected
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-cyan-400/60">
                          Affected: {portfolioImpact.effects.slice(0, 5).map(e => e.entity).join(", ")}
                          {portfolioImpact.effects.length > 5 && ` +${portfolioImpact.effects.length - 5} more`}
                        </div>
                      </div>
                      <Link
                        href="/portfolio"
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded text-xs font-mono text-cyan-400 transition whitespace-nowrap"
                      >
                        VIEW PORTFOLIO →
                      </Link>
                    </div>
                  </div>
                )}

                <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-700/50 p-1 rounded-lg">
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-2 text-sm data-[state=active]:bg-slate-700/70 data-[state=active]:text-white data-[state=inactive]:text-slate-300 transition-all"
                  >
                    <Clock className="h-4 w-4" />
                    Timeline View
                  </TabsTrigger>
                  <TabsTrigger
                    value="simulation"
                    className="flex items-center gap-2 text-sm data-[state=active]:bg-slate-700/70 data-[state=active]:text-white data-[state=inactive]:text-slate-300 transition-all"
                  >
                    <Network className="h-4 w-4" />
                    Graph View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="animate-fade-in">
                  <CascadeTimeline cascade={cascade} />
                </TabsContent>

                <TabsContent value="simulation" className="animate-fade-in">
                  <CascadeGraph cascade={cascade} />
                </TabsContent>
              </Tabs>

                {/* Trade Signals Section */}
                <div className="mt-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-bold military-font text-yellow-400">
                        TRADE SIGNALS
                      </span>
                    </div>
                    {signals.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSignals}
                        disabled={signalsLoading}
                        className="text-xs font-mono border-yellow-500/30 !text-yellow-400/80 hover:!text-yellow-400 hover:border-yellow-400/50"
                      >
                        {signalsLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3 mr-1" />
                        )}
                        GENERATE SIGNALS
                      </Button>
                    )}
                    {signals.length > 0 && (
                      <Link
                        href="/signals"
                        className="text-xs font-mono text-yellow-400/60 hover:text-yellow-400 transition"
                      >
                        VIEW ALL SIGNALS →
                      </Link>
                    )}
                  </div>

                  {signalsError && (
                    <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-lg mb-3">
                      <p className="text-xs font-mono text-red-400">{signalsError}</p>
                    </div>
                  )}

                  {signals.length === 0 && !signalsLoading && !signalsError && (
                    <div className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-lg">
                      <p className="text-xs font-mono text-slate-400">
                        Convert this cascade into actionable BUY/SELL signals with entry prices, targets, and stop losses.
                      </p>
                    </div>
                  )}

                  {signals.length > 0 && (
                    <div className="space-y-2">
                      {signals.slice(0, 8).map((signal) => (
                        <SignalCard key={signal.id || signal.ticker} signal={signal} compact />
                      ))}
                      {signals.length > 8 && (
                        <Link
                          href="/signals"
                          className="block text-center py-2 text-xs font-mono text-yellow-400/60 hover:text-yellow-400 transition"
                        >
                          +{signals.length - 8} more signals — view all →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            {!cascade && !error && (
              <div className="text-center mt-20 bg-slate-900/30 border border-slate-700/50 p-12 rounded-xl backdrop-blur-sm">
                <div className="mb-5">
                  <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                    <Sparkles className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
                <p className="text-slate-300 mb-2 font-medium">Awaiting Input</p>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Enter an earnings event to see multi-hop cascade predictions with quantified effects and confidence scores
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
