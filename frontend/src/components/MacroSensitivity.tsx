"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { MacroSensitivity as MacroSensitivityType } from "@/types/api";
import { getPortfolio } from "@/lib/portfolio";

export default function MacroSensitivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensitivities, setSensitivities] = useState<MacroSensitivityType[]>([]);

  useEffect(() => {
    loadMacroSensitivity();
  }, []);

  const loadMacroSensitivity = async () => {
    const portfolio = getPortfolio();

    if (portfolio.holdings.length === 0) {
      setError("No holdings in portfolio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ConsequenceAPI.portfolioMacroSensitivity(portfolio.holdings);
      setSensitivities(result.sensitivities);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to load macro sensitivity:", err);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: number): string => {
    if (Math.abs(impact) >= 5) return "text-red-400";
    if (Math.abs(impact) >= 2) return "text-orange-400";
    return "text-green-400";
  };

  const getImpactBgColor = (impact: number): string => {
    if (Math.abs(impact) >= 5) return "bg-red-500/20 border-red-400/30";
    if (Math.abs(impact) >= 2) return "bg-orange-500/20 border-orange-400/30";
    return "bg-green-500/10 border-green-400/20";
  };

  if (loading) {
    return (
      <Card className="p-6 hud-panel border-green-500/30">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          <span className="ml-3 text-sm font-mono text-green-400">
            Analyzing macro sensitivities...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 hud-panel border-green-500/30">
        <div className="p-3 bg-red-500/10 border border-red-400/30 rounded">
          <p className="text-xs font-mono text-red-400">&gt; ERROR: {error}</p>
        </div>
      </Card>
    );
  }

  if (sensitivities.length === 0) {
    return (
      <Card className="p-6 hud-panel border-green-500/30">
        <div className="text-center py-12">
          <p className="text-sm font-mono text-green-400/60">
            No macro sensitivity data available
          </p>
        </div>
      </Card>
    );
  }

  const holdings = Object.keys(sensitivities[0]?.effects_on_holdings || {});

  // Find most dangerous indicator
  const worstIndicator = sensitivities.length > 0
    ? sensitivities.reduce((worst, s) => Math.abs(s.avg_impact) > Math.abs(worst.avg_impact) ? s : worst)
    : null;

  // Find most exposed holding
  const holdingExposures: Record<string, number[]> = {};
  for (const s of sensitivities) {
    for (const [h, impact] of Object.entries(s.effects_on_holdings)) {
      if (!holdingExposures[h]) holdingExposures[h] = [];
      holdingExposures[h].push(Math.abs(impact as number));
    }
  }
  const mostExposedHolding = Object.entries(holdingExposures).length > 0
    ? Object.entries(holdingExposures).reduce((worst, [h, impacts]) => {
        const avg = impacts.reduce((a, b) => a + b, 0) / impacts.length;
        return avg > worst.avg ? { holding: h, avg } : worst;
      }, { holding: "", avg: 0 })
    : null;

  return (
    <div className="space-y-4">
      {/* Explainer Card */}
      <Card className="p-4 hud-panel border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-green-500/5">
        <h3 className="text-sm military-font text-cyan-400 mb-2">&gt; WHAT IS THIS?</h3>
        <div className="text-xs font-mono text-green-400/70 space-y-2">
          <p>
            <strong className="text-green-400">The big picture:</strong> Your portfolio doesn&apos;t just react to company news —
            macro forces like interest rates, oil prices, and market volatility hit every holding differently.
            This heat map shows your exposure to each macro force at a glance.
          </p>
          <p>
            <strong className="text-green-400">How to read it:</strong> Each cell shows how much a holding would move if that
            macro indicator shifts by its standard shock amount. <span className="text-red-400">Red = high sensitivity</span>,{" "}
            <span className="text-orange-400">orange = moderate</span>,{" "}
            <span className="text-green-400">green = low</span>. A row of red means that indicator is dangerous to your whole portfolio.
          </p>
          <p>
            <strong className="text-green-400">Actionable insight:</strong> If one indicator shows red across most of your holdings,
            you&apos;re over-concentrated on that macro risk. Consider diversifying into holdings that move differently.
          </p>
        </div>
      </Card>

      {/* Key Insights Card */}
      {(worstIndicator || mostExposedHolding) && (
        <Card className="p-4 hud-panel border-yellow-500/30 bg-yellow-500/5">
          <h3 className="text-xs military-font text-yellow-400 mb-2">&gt; KEY FINDINGS</h3>
          <div className="space-y-1.5">
            {worstIndicator && Math.abs(worstIndicator.avg_impact) > 0 && (
              <div className="text-xs font-mono text-green-400/80">
                <span className="text-yellow-400">Biggest macro risk:</span>{" "}
                <strong className="text-red-400">{worstIndicator.indicator_name}</strong> — a{" "}
                {(worstIndicator.shock_magnitude * 100).toFixed(1)}% move would shift your portfolio{" "}
                <span className={worstIndicator.avg_impact < 0 ? "text-red-400" : "text-green-400"}>
                  {worstIndicator.avg_impact > 0 ? "+" : ""}{worstIndicator.avg_impact.toFixed(2)}%
                </span> on average
              </div>
            )}
            {mostExposedHolding && mostExposedHolding.holding && (
              <div className="text-xs font-mono text-green-400/80">
                <span className="text-yellow-400">Most macro-sensitive holding:</span>{" "}
                <strong className="text-cyan-400">{mostExposedHolding.holding}</strong> — reacts to macro shocks by{" "}
                <span className="text-orange-400">{mostExposedHolding.avg.toFixed(2)}%</span> on average
              </div>
            )}
          </div>
        </Card>
      )}

    <Card className="p-6 hud-panel border-green-500/30">
      <div className="mb-4">
        <h2 className="text-lg military-font text-green-400 mb-1">
          &gt; MACRO SENSITIVITY HEAT MAP
        </h2>
        <p className="text-xs text-green-400/60 font-mono">
          Each cell = predicted price move when that indicator shifts by a standard shock
        </p>
      </div>

      {/* Heat Map */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-green-500/30">
              <th className="text-left py-2 px-3 text-green-400/70 sticky left-0 bg-black z-10">
                INDICATOR
              </th>
              <th className="text-center py-2 px-2 text-green-400/70">
                SHOCK
              </th>
              {holdings.map((holding) => (
                <th
                  key={holding}
                  className="text-center py-2 px-2 text-green-400/70"
                >
                  {holding}
                </th>
              ))}
              <th className="text-center py-2 px-2 text-green-400/70">
                AVG
              </th>
            </tr>
          </thead>
          <tbody>
            {sensitivities.map((sensitivity) => (
              <tr
                key={sensitivity.indicator_id}
                className="border-b border-green-500/10 hover:bg-green-500/5 transition"
              >
                <td className="py-2 px-3 text-green-400 font-bold sticky left-0 bg-black">
                  {sensitivity.indicator_name}
                </td>
                <td className="text-center py-2 px-2 text-cyan-400">
                  {sensitivity.shock_magnitude > 0 ? "+" : ""}
                  {(sensitivity.shock_magnitude * 100).toFixed(1)}%
                </td>
                {holdings.map((holding) => {
                  const impact = sensitivity.effects_on_holdings[holding] || 0;
                  return (
                    <td
                      key={holding}
                      className="text-center py-2 px-2"
                    >
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${getImpactBgColor(impact)}`}>
                        {impact < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : impact > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : null}
                        <span className={`font-bold ${getImpactColor(impact)}`}>
                          {impact > 0 ? "+" : ""}
                          {impact.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="text-center py-2 px-2">
                  <span className={`font-bold ${getImpactColor(sensitivity.avg_impact)}`}>
                    {sensitivity.avg_impact > 0 ? "+" : ""}
                    {sensitivity.avg_impact.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-green-500/5 border border-green-400/20 rounded">
        <div className="text-[10px] font-mono text-green-400/60 space-y-1">
          <div>
            <strong className="text-green-400">SHOCK COLUMN:</strong> The standard move simulated for each indicator (e.g., Fed Rate +50bps, VIX +20%)
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-green-400">LOW (&lt;2%) — minimal risk</span>
            <span className="text-orange-400">MEDIUM (2-5%) — watch closely</span>
            <span className="text-red-400">HIGH (≥5%) — significant exposure</span>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}
