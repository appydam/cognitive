"use client";

import { Card } from "@/components/ui/card";
import { PortfolioAnalysis } from "@/types/api";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";

interface PortfolioOverviewProps {
  analysis: PortfolioAnalysis;
}

export default function PortfolioOverview({ analysis }: PortfolioOverviewProps) {
  const formatCurrency = (value: number | null): string => {
    if (value === null) return "—";
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getConcentrationColor = (hhi: number): string => {
    if (hhi >= 0.25) return "text-red-400";
    if (hhi >= 0.15) return "text-orange-400";
    return "text-green-400";
  };

  const getConcentrationLabel = (hhi: number): string => {
    if (hhi >= 0.25) return "HIGH";
    if (hhi >= 0.15) return "MODERATE";
    return "LOW";
  };

  const getExposureColor = (score: number): string => {
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-orange-400";
    return "text-green-400";
  };

  const getExposureLabel = (score: number): string => {
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Value */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono text-green-400/60">
            TOTAL VALUE
          </div>
          <DollarSign className="h-4 w-4 text-green-400/40" />
        </div>
        <div className="text-2xl military-font text-green-400">
          {formatCurrency(analysis.total_value)}
        </div>
        <div className="text-[9px] font-mono text-green-400/50 mt-1">
          Based on {analysis.total_holdings} holdings &times; shares &times; market price
        </div>
      </Card>

      {/* Holdings Count */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono text-green-400/60">
            HOLDINGS
          </div>
          <Package className="h-4 w-4 text-green-400/40" />
        </div>
        <div className="text-2xl military-font text-green-400">
          {analysis.total_holdings}
        </div>
        <div className="text-[9px] font-mono text-green-400/50 mt-1">
          Top: {(analysis.concentration_risk.top_holding_weight * 100).toFixed(1)}% of portfolio
        </div>
      </Card>

      {/* Cascade Exposure */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono text-green-400/60">
            CASCADE EXPOSURE
          </div>
          <TrendingUp className="h-4 w-4 text-green-400/40" />
        </div>
        <div className={`text-2xl military-font ${getExposureColor(analysis.cascade_exposure_score)}`}>
          {analysis.cascade_exposure_score.toFixed(0)}
        </div>
        <div className={`text-[9px] font-mono mt-1 ${getExposureColor(analysis.cascade_exposure_score)}`}>
          {getExposureLabel(analysis.cascade_exposure_score)} — how many things can cascade into your holdings
        </div>
      </Card>

      {/* Concentration Risk */}
      <Card className="p-4 hud-panel border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono text-green-400/60">
            CONCENTRATION
          </div>
          <AlertTriangle className="h-4 w-4 text-green-400/40" />
        </div>
        <div className={`text-2xl military-font ${getConcentrationColor(analysis.concentration_risk.herfindahl_index)}`}>
          {(analysis.concentration_risk.herfindahl_index * 100).toFixed(1)}
        </div>
        <div className={`text-[9px] font-mono mt-1 ${getConcentrationColor(analysis.concentration_risk.herfindahl_index)}`}>
          {getConcentrationLabel(analysis.concentration_risk.herfindahl_index)} — are you too concentrated in few stocks?
        </div>
      </Card>

      {/* Sector Breakdown (full width) */}
      <Card className="p-4 hud-panel border-green-500/30 md:col-span-4">
        <div className="text-[10px] font-mono text-green-400/60 mb-1">
          SECTOR BREAKDOWN
        </div>
        <div className="text-[9px] font-mono text-green-400/40 mb-2">
          Heavy sector concentration = correlated risk during sector-wide downturns
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(analysis.concentration_risk.sector_breakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([sector, weight]) => (
              <div
                key={sector}
                className="px-2 py-1 bg-green-500/10 border border-green-400/30 rounded"
              >
                <span className="text-xs font-mono text-green-400">
                  {sector || "Unknown"}
                </span>
                <span className="text-xs font-mono text-green-400/60 ml-2">
                  {(weight * 100).toFixed(1)}%
                </span>
              </div>
            ))}
        </div>
      </Card>

      {/* Top Macro Risks (full width) */}
      {analysis.top_macro_risks.length > 0 && (
        <Card className="p-4 hud-panel border-orange-500/30 md:col-span-4">
          <div className="text-[10px] font-mono text-orange-400/60 mb-1">
            TOP MACRO RISKS
          </div>
          <div className="text-[9px] font-mono text-orange-400/40 mb-2">
            Macro indicators with the strongest causal connections to your holdings — go to Macro Risk tab for full breakdown
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {analysis.top_macro_risks.slice(0, 6).map((risk) => (
              <div
                key={risk.indicator_id}
                className="px-3 py-2 bg-orange-500/5 border border-orange-400/20 rounded"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-orange-400 font-bold">
                    {risk.indicator_name}
                  </span>
                  <span className="text-xs font-mono text-orange-400/70">
                    {risk.direction === "positive" ? "↑" : "↓"}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-orange-400/50 mt-1">
                  Affects {risk.affected_holdings.length} holdings
                  <span className="ml-2">
                    Avg: {(risk.avg_sensitivity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
