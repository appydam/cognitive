"use client";

import { Card } from "@/components/ui/card";
import { PortfolioAnalysis } from "@/types/api";
import { Shield, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HedgeSuggestionsProps {
  analysis: PortfolioAnalysis;
}

interface HedgeSuggestion {
  reason: string;
  severity: "high" | "medium" | "low";
  suggestions: { ticker: string; name: string; rationale: string }[];
}

// Hardcoded hedge lookup table based on common macro/sector risks
const MACRO_HEDGES: Record<string, { ticker: string; name: string; rationale: string }[]> = {
  "VIX": [
    { ticker: "GLD", name: "SPDR Gold Trust", rationale: "Gold tends to rise when volatility spikes" },
    { ticker: "TLT", name: "iShares 20+ Year Treasury", rationale: "Flight to safety during volatility" },
    { ticker: "XLU", name: "Utilities Select Sector", rationale: "Defensive sector, low beta" },
  ],
  "FED_RATE": [
    { ticker: "XLU", name: "Utilities Select Sector", rationale: "Utilities benefit from rate cuts, hedge against hikes" },
    { ticker: "TLT", name: "iShares 20+ Year Treasury", rationale: "Bond prices move inverse to rates" },
  ],
  "OIL_PRICE": [
    { ticker: "XLE", name: "Energy Select Sector", rationale: "Direct oil exposure as hedge" },
    { ticker: "XLU", name: "Utilities Select Sector", rationale: "Low oil correlation, defensive" },
  ],
  "USD_INDEX": [
    { ticker: "GLD", name: "SPDR Gold Trust", rationale: "Gold typically moves inverse to USD" },
    { ticker: "EFA", name: "iShares MSCI EAFE", rationale: "International diversification benefits from weak USD" },
  ],
  "CPI": [
    { ticker: "TIP", name: "iShares TIPS Bond", rationale: "Inflation-protected treasuries" },
    { ticker: "GLD", name: "SPDR Gold Trust", rationale: "Traditional inflation hedge" },
  ],
  "GDP_GROWTH": [
    { ticker: "XLV", name: "Health Care Select Sector", rationale: "Defensive sector during slowdowns" },
    { ticker: "XLP", name: "Consumer Staples Select Sector", rationale: "Non-cyclical, recession resistant" },
  ],
};

const SECTOR_DIVERSIFICATION: Record<string, { ticker: string; name: string }[]> = {
  "Technology": [
    { ticker: "XLF", name: "Financial Select Sector" },
    { ticker: "XLV", name: "Health Care Select Sector" },
    { ticker: "XLE", name: "Energy Select Sector" },
  ],
  "Financial Services": [
    { ticker: "XLK", name: "Technology Select Sector" },
    { ticker: "XLV", name: "Health Care Select Sector" },
  ],
  "Healthcare": [
    { ticker: "XLK", name: "Technology Select Sector" },
    { ticker: "XLF", name: "Financial Select Sector" },
  ],
  "Energy": [
    { ticker: "XLK", name: "Technology Select Sector" },
    { ticker: "XLV", name: "Health Care Select Sector" },
  ],
  "Consumer Cyclical": [
    { ticker: "XLP", name: "Consumer Staples Select Sector" },
    { ticker: "XLV", name: "Health Care Select Sector" },
  ],
};

function generateHedgeSuggestions(analysis: PortfolioAnalysis): HedgeSuggestion[] {
  const suggestions: HedgeSuggestion[] = [];

  // 1. Check sector concentration
  const sectorBreakdown = analysis.concentration_risk.sector_breakdown;
  const topSectors = Object.entries(sectorBreakdown).sort(([, a], [, b]) => b - a);
  if (topSectors.length > 0 && topSectors[0][1] > 0.4) {
    const topSector = topSectors[0][0];
    const weight = topSectors[0][1];
    const diversifiers = SECTOR_DIVERSIFICATION[topSector] || [
      { ticker: "VTI", name: "Vanguard Total Stock Market" },
      { ticker: "VXUS", name: "Vanguard Total International" },
    ];
    suggestions.push({
      reason: `${(weight * 100).toFixed(0)}% concentrated in ${topSector}`,
      severity: weight > 0.6 ? "high" : "medium",
      suggestions: diversifiers.map(d => ({
        ...d,
        rationale: `Diversify away from ${topSector} concentration`,
      })),
    });
  }

  // 2. Check HHI concentration
  if (analysis.concentration_risk.herfindahl_index > 0.25) {
    suggestions.push({
      reason: `High portfolio concentration (HHI: ${(analysis.concentration_risk.herfindahl_index * 100).toFixed(0)})`,
      severity: "high",
      suggestions: [
        { ticker: "VTI", name: "Vanguard Total Stock Market", rationale: "Broad market exposure reduces single-stock risk" },
        { ticker: "VXUS", name: "Vanguard Total International", rationale: "Geographic diversification" },
      ],
    });
  }

  // 3. Check cascade exposure
  if (analysis.cascade_exposure_score > 70) {
    suggestions.push({
      reason: `High cascade exposure (score: ${analysis.cascade_exposure_score.toFixed(0)})`,
      severity: "high",
      suggestions: [
        { ticker: "GLD", name: "SPDR Gold Trust", rationale: "Uncorrelated to equity cascades" },
        { ticker: "TLT", name: "iShares 20+ Year Treasury", rationale: "Flight-to-safety during cascade events" },
        { ticker: "XLU", name: "Utilities Select Sector", rationale: "Low cascade connectivity, defensive" },
      ],
    });
  }

  // 4. Check macro risk factors
  for (const risk of analysis.top_macro_risks.slice(0, 3)) {
    const hedges = MACRO_HEDGES[risk.indicator_id];
    if (hedges && risk.avg_sensitivity > 0.3) {
      suggestions.push({
        reason: `Exposed to ${risk.indicator_name} (affects ${risk.affected_holdings.length} holdings, avg ${(risk.avg_sensitivity * 100).toFixed(0)}% sensitivity)`,
        severity: risk.avg_sensitivity > 0.5 ? "high" : "medium",
        suggestions: hedges.slice(0, 2).map(h => ({ ...h })),
      });
    }
  }

  return suggestions;
}

export default function HedgeSuggestions({ analysis }: HedgeSuggestionsProps) {
  const suggestions = generateHedgeSuggestions(analysis);

  if (suggestions.length === 0) {
    return (
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-sm military-font text-green-400">&gt; HEDGE SUGGESTIONS</span>
        </div>
        <p className="text-xs font-mono text-green-400/60">
          Your portfolio looks well-balanced. No urgent hedges needed right now.
        </p>
      </Card>
    );
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...suggestions].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const severityColors = {
    high: { border: "border-red-400/30", bg: "bg-red-500/5", text: "text-red-400", badge: "bg-red-500/20 text-red-400" },
    medium: { border: "border-orange-400/30", bg: "bg-orange-500/5", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400" },
    low: { border: "border-yellow-400/30", bg: "bg-yellow-500/5", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400" },
  };

  return (
    <Card className="p-4 hud-panel border-green-500/30">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-4 w-4 text-green-400" />
        <span className="text-sm military-font text-green-400">&gt; HEDGE SUGGESTIONS</span>
      </div>
      <p className="text-[10px] font-mono text-green-400/50 mb-4">
        Based on your portfolio&apos;s concentration, cascade exposure, and macro risk factors.
        These are starting points for research, not financial advice.
      </p>

      <div className="space-y-3">
        {sorted.map((suggestion, idx) => {
          const colors = severityColors[suggestion.severity];
          return (
            <div key={idx} className={`p-3 rounded border ${colors.border} ${colors.bg}`}>
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 ${colors.text}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-green-400">
                      {suggestion.reason}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${colors.badge}`}>
                      {suggestion.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-5 space-y-1.5">
                {suggestion.suggestions.map((hedge) => (
                  <div key={hedge.ticker} className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-green-400/30" />
                    <Link
                      href={`/predict?entity=${hedge.ticker}&surprise=5`}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {hedge.ticker}
                    </Link>
                    <span className="text-[10px] font-mono text-green-400/50">
                      {hedge.name}
                    </span>
                    <span className="text-[10px] font-mono text-green-400/30 hidden md:inline">
                      — {hedge.rationale}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
