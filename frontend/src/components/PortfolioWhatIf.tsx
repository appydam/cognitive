"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { TrendingDown, TrendingUp, ChevronDown, ChevronRight, AlertTriangle, Zap, Loader2 } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { PortfolioCascadeResult, SearchResult, TradeSignal } from "@/types/api";
import { getPortfolio } from "@/lib/portfolio";
import SignalCard from "@/components/SignalCard";
import Link from "next/link";

export default function PortfolioWhatIf() {
  const [entityId, setEntityId] = useState("");
  const [magnitude, setMagnitude] = useState(-5);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioCascadeResult | null>(null);
  const [showAffected, setShowAffected] = useState(true);
  const [showUnaffected, setShowUnaffected] = useState(false);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);

  const searchEntities = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const searchResult = await ConsequenceAPI.searchEntities(query, 10);
      setSearchResults(searchResult.results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleEntityChange = (value: string) => {
    setEntityId(value);
    searchEntities(value);
  };

  const handleSelectEntity = (entity: SearchResult) => {
    setEntityId(entity.id);
    setSearchResults([]);
  };

  const runWhatIf = async () => {
    if (!entityId.trim()) {
      setError("Please select an entity");
      return;
    }

    const portfolio = getPortfolio();
    if (portfolio.holdings.length === 0) {
      setError("No holdings in portfolio. Add holdings first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSignals([]);
    try {
      const cascadeResult = await ConsequenceAPI.portfolioCascade(
        portfolio.holdings,
        entityId.trim().toUpperCase(),
        magnitude,
        14
      );
      setResult(cascadeResult);
      setShowAffected(true);
      setShowUnaffected(false);
    } catch (err: any) {
      setError(err.message);
      console.error("Cascade failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSignals = async () => {
    if (!entityId.trim()) return;
    setSignalsLoading(true);
    try {
      const description = result?.trigger?.description || "";
      const res = await ConsequenceAPI.generateSignals(
        entityId.trim().toUpperCase(),
        magnitude,
        description
      );
      setSignals(res.signals);
    } catch (err) {
      console.error("Failed to generate signals:", err);
    } finally {
      setSignalsLoading(false);
    }
  };

  const PRESETS = [
    { label: "Large Miss", value: -10, color: "text-red-400" },
    { label: "Miss", value: -5, color: "text-orange-400" },
    { label: "Beat", value: 5, color: "text-green-400" },
    { label: "Large Beat", value: 10, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Explainer Card */}
      <Card className="p-4 hud-panel border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-green-500/5">
        <h3 className="text-sm military-font text-cyan-400 mb-2">&gt; HOW TO USE THIS</h3>
        <div className="text-xs font-mono text-green-400/70 space-y-2">
          <p>
            <strong className="text-green-400">The idea:</strong> Markets don&apos;t move in isolation.
            When TSMC misses earnings, it doesn&apos;t just hurt TSMC — it cascades through suppliers,
            competitors, and entire sectors. This tool traces those hidden chains to YOUR holdings.
          </p>
          <p>
            <strong className="text-green-400">How to read results:</strong> Pick any company, ETF,
            or macro indicator and simulate a shock. The engine traces every causal path in our graph
            to find which of your holdings get hit, how hard, and through what chain of events.
          </p>
          <div className="mt-2 p-2 bg-black/30 rounded border border-green-500/10">
            <p className="text-[10px] text-green-400/50">
              <strong className="text-green-400/70">Try this:</strong> Search &quot;VIX&quot; and set +20% to see what a volatility spike does to your portfolio.
              Or try &quot;NVDA&quot; at -10% to simulate a GPU demand miss rippling through tech.
            </p>
          </div>
        </div>
      </Card>

      {/* Input Card */}
      <Card className="p-6 hud-panel border-green-500/30">
        <h2 className="text-lg military-font text-green-400 mb-4">
          &gt; SCENARIO SIMULATION
        </h2>
        <p className="text-xs text-green-400/60 font-mono mb-4">
          Pick any entity in the causal graph — even ones you don&apos;t own — and simulate a price shock
        </p>

        {/* Entity Search */}
        <div className="mb-4 relative">
          <label className="text-[10px] font-mono text-green-400/60 block mb-1">
            TRIGGER ENTITY
          </label>
          <Input
            placeholder="Enter ticker or entity (e.g., TSMC, VIX, TECH_SECTOR)"
            value={entityId}
            onChange={(e) => handleEntityChange(e.target.value.toUpperCase())}
            className="bg-black/40 border-green-500/30 text-green-400 placeholder:text-green-400/30 font-mono text-sm"
          />

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-black/95 border border-green-500/30 rounded shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectEntity(result)}
                  className="w-full px-3 py-2 text-left hover:bg-green-500/10 transition border-b border-green-500/10 last:border-b-0"
                >
                  <div className="text-xs font-mono text-green-400 font-bold">
                    {result.id}
                  </div>
                  <div className="text-[10px] font-mono text-green-400/60">
                    {result.name} • {result.type}
                    {result.sector && ` • ${result.sector}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="mb-4">
          <label className="text-[10px] font-mono text-green-400/60 block mb-1">
            QUICK PRESETS
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.value}
                onClick={() => setMagnitude(preset.value)}
                variant="outline"
                size="sm"
                className={`text-[10px] px-2 py-1 h-auto font-mono border-green-500/30 hover:bg-green-500/10 ${
                  magnitude === preset.value ? "bg-green-500/20 border-green-400" : ""
                } ${preset.color}`}
              >
                {preset.value > 0 ? "+" : ""}
                {preset.value}%
              </Button>
            ))}
          </div>
        </div>

        {/* Magnitude Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-green-400/70">
              EVENT MAGNITUDE
            </label>
            <span className="text-sm font-bold military-font text-green-400">
              {magnitude > 0 ? "+" : ""}
              {magnitude.toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[magnitude]}
            onValueChange={(value) => setMagnitude(value[0])}
            min={-20}
            max={20}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-green-400/50 mt-1">
            <span>-20%</span>
            <span>0%</span>
            <span>+20%</span>
          </div>
        </div>

        {/* Run Button */}
        <Button
          onClick={runWhatIf}
          disabled={loading || !entityId.trim()}
          className="w-full tactical-button military-font text-sm"
        >
          {loading ? "SIMULATING..." : "RUN WHAT-IF ANALYSIS"}
        </Button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded">
            <p className="text-xs font-mono text-red-400">&gt; ERROR: {error}</p>
          </div>
        )}
      </Card>

      {/* Results Card */}
      {result && (
        <Card className="p-6 hud-panel border-green-500/30">
          <h2 className="text-lg military-font text-green-400 mb-4">
            &gt; PORTFOLIO IMPACT
          </h2>

          {/* What This Means */}
          <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-400/20 rounded">
            <p className="text-[11px] font-mono text-yellow-400/80">
              <strong className="text-yellow-400">Reading the results:</strong>{" "}
              The percentage shows the predicted price move for each holding, weighted by how much of your portfolio it represents.
              {result.holding_effects.length > 0 && result.holding_effects[0].cause_path.length > 0 && (
                <span> The &quot;Chain&quot; line shows the causal path — how the shock travels through the market to reach your holding.</span>
              )}
              {" "}Holdings marked &quot;Safe&quot; have no causal connection to the trigger entity in our graph.
            </p>
          </div>

          {/* Summary Box */}
          <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-400/30 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-cyan-400/70">
                TOTAL PORTFOLIO IMPACT
              </span>
              <span className={`text-2xl military-font ${
                result.portfolio_impact.total_impact_percent < 0 ? "text-red-400" : "text-green-400"
              }`}>
                {result.portfolio_impact.total_impact_percent > 0 ? "+" : ""}
                {result.portfolio_impact.total_impact_percent.toFixed(2)}%
              </span>
            </div>
            {result.portfolio_impact.total_impact_dollars !== null && (
              <div className="text-xs font-mono text-cyan-400/60">
                Est. Dollar Impact: {result.portfolio_impact.total_impact_dollars > 0 ? "+" : ""}
                ${result.portfolio_impact.total_impact_dollars.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            )}
            <div className="text-[10px] font-mono text-cyan-400/50 mt-2">
              {result.portfolio_impact.affected_holdings} affected • {result.portfolio_impact.unaffected_holdings} unaffected
            </div>
          </div>

          {/* Affected Holdings */}
          <div className="mb-4">
            <button
              onClick={() => setShowAffected(!showAffected)}
              className="w-full flex items-center justify-between p-2 hover:bg-green-500/5 transition rounded"
            >
              <div className="flex items-center gap-2">
                {showAffected ? (
                  <ChevronDown className="h-4 w-4 text-green-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-green-400" />
                )}
                <span className="military-font text-sm text-green-400">
                  AFFECTED HOLDINGS ({result.holding_effects.length})
                </span>
              </div>
            </button>

            {showAffected && (
              <div className="mt-2 space-y-2">
                {result.holding_effects
                  .sort((a, b) => Math.abs(b.magnitude_percent) - Math.abs(a.magnitude_percent))
                  .map((effect, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-black/20 border border-green-500/20 rounded hover:bg-black/40 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <div className="text-sm font-bold text-green-400">
                            {effect.entity_id}
                          </div>
                          <div className="text-[10px] font-mono text-green-400/50">
                            {effect.name} • Weight: {(effect.portfolio_weight * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold military-font flex items-center gap-1 ${
                            effect.magnitude_percent < 0 ? "text-red-400" : "text-green-400"
                          }`}>
                            {effect.magnitude_percent < 0 ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <TrendingUp className="h-4 w-4" />
                            )}
                            {effect.magnitude_percent > 0 ? "+" : ""}
                            {effect.magnitude_percent.toFixed(2)}%
                          </div>
                          {effect.dollar_impact !== null && (
                            <div className="text-[10px] font-mono text-green-400/60">
                              ${effect.dollar_impact.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-green-400/50">
                        <span>Day {effect.day}</span>
                        <span>Order {effect.order}</span>
                        <span>Conf: {(effect.confidence * 100).toFixed(0)}%</span>
                        <span className="flex-1 truncate">{effect.relationship_type.replace(/_/g, " ")}</span>
                      </div>
                      {effect.cause_path.length > 0 && (
                        <div className="mt-2 text-[9px] font-mono text-cyan-400/40">
                          Chain: {result.trigger.entity} → {effect.cause_path.join(" → ")} → {effect.entity_id}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Unaffected Holdings */}
          {result.unaffected_holdings.length > 0 && (
            <div>
              <button
                onClick={() => setShowUnaffected(!showUnaffected)}
                className="w-full flex items-center justify-between p-2 hover:bg-green-500/5 transition rounded"
              >
                <div className="flex items-center gap-2">
                  {showUnaffected ? (
                    <ChevronDown className="h-4 w-4 text-green-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-green-400" />
                  )}
                  <span className="military-font text-sm text-green-400">
                    SAFE HOLDINGS ({result.unaffected_holdings.length})
                  </span>
                </div>
              </button>

              {showUnaffected && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.unaffected_holdings.map((holdingId) => (
                    <div
                      key={holdingId}
                      className="px-3 py-1.5 bg-green-500/10 border border-green-400/30 rounded text-xs font-mono text-green-400"
                    >
                      {holdingId}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Impact Message */}
          {result.holding_effects.length === 0 && (
            <div className="p-4 bg-green-500/5 border border-green-400/20 rounded text-center">
              <AlertTriangle className="h-8 w-8 text-green-400/40 mx-auto mb-2" />
              <p className="text-sm font-mono text-green-400/60">
                No holdings affected by this cascade
              </p>
              <p className="text-xs font-mono text-green-400/40 mt-1">
                Your portfolio is isolated from {result.trigger.entity}
              </p>
            </div>
          )}

          {/* Trade Signals Section */}
          {result.holding_effects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm military-font text-yellow-400">TRADE SIGNALS</span>
                </div>
                {signals.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSignals}
                    disabled={signalsLoading}
                    className="text-xs font-mono border-yellow-500/30 !text-yellow-400/80 hover:!text-yellow-400"
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
                    VIEW ALL →
                  </Link>
                )}
              </div>

              {signals.length === 0 && !signalsLoading && (
                <p className="text-[10px] font-mono text-green-400/40">
                  Convert these effects into BUY/SELL signals with prices and stops
                </p>
              )}

              {signals.length > 0 && (
                <div className="space-y-2">
                  {signals.slice(0, 6).map((signal) => (
                    <SignalCard key={signal.id || signal.ticker} signal={signal} compact />
                  ))}
                  {signals.length > 6 && (
                    <Link
                      href="/signals"
                      className="block text-center py-2 text-xs font-mono text-yellow-400/60 hover:text-yellow-400"
                    >
                      +{signals.length - 6} more — view all signals →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
