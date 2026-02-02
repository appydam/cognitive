"use client";

import { useState } from "react";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { PortfolioAnalysis } from "@/types/api";
import { removeHolding } from "@/lib/portfolio";

interface HoldingsTableProps {
  analysis: PortfolioAnalysis;
  onHoldingRemoved: () => void;
}

type SortField = "name" | "shares" | "value" | "weight" | "exposure";
type SortDirection = "asc" | "desc";

export default function HoldingsTable({ analysis, onHoldingRemoved }: HoldingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("weight");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleRemove = (entity_id: string) => {
    if (confirm(`Remove ${entity_id} from portfolio?`)) {
      removeHolding(entity_id);
      onHoldingRemoved();
    }
  };

  const sortedHoldings = [...analysis.holdings].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case "name":
        return sortDirection === "asc"
          ? a.entity_id.localeCompare(b.entity_id)
          : b.entity_id.localeCompare(a.entity_id);
      case "shares":
        aValue = a.portfolio_weight; // We don't have shares in the response, use weight
        bValue = b.portfolio_weight;
        break;
      case "value":
        aValue = a.market_value || 0;
        bValue = b.market_value || 0;
        break;
      case "weight":
        aValue = a.portfolio_weight;
        bValue = b.portfolio_weight;
        break;
      case "exposure":
        aValue = a.cascade_exposure_score;
        bValue = b.cascade_exposure_score;
        break;
      default:
        return 0;
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    );
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
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-green-500/30">
            <th
              className="text-left py-2 px-2 text-green-400/70 cursor-pointer hover:text-green-400 transition"
              onClick={() => handleSort("name")}
            >
              TICKER <SortIcon field="name" />
            </th>
            <th className="text-left py-2 px-2 text-green-400/70">
              NAME
            </th>
            <th className="text-left py-2 px-2 text-green-400/70">
              TYPE
            </th>
            <th className="text-left py-2 px-2 text-green-400/70">
              SECTOR
            </th>
            <th
              className="text-right py-2 px-2 text-green-400/70 cursor-pointer hover:text-green-400 transition"
              onClick={() => handleSort("value")}
            >
              VALUE <SortIcon field="value" />
            </th>
            <th
              className="text-right py-2 px-2 text-green-400/70 cursor-pointer hover:text-green-400 transition"
              onClick={() => handleSort("weight")}
            >
              WEIGHT <SortIcon field="weight" />
            </th>
            <th
              className="text-right py-2 px-2 text-green-400/70 cursor-pointer hover:text-green-400 transition"
              onClick={() => handleSort("exposure")}
            >
              CASCADE EXPOSURE <SortIcon field="exposure" />
            </th>
            <th className="text-center py-2 px-2 text-green-400/70">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedHoldings.map((holding) => (
            <tr
              key={holding.entity_id}
              className="border-b border-green-500/10 hover:bg-green-500/5 transition"
            >
              <td className="py-2 px-2 text-green-400 font-bold">
                {holding.entity_id}
              </td>
              <td className="py-2 px-2 text-green-400/70">
                {holding.name}
              </td>
              <td className="py-2 px-2 text-green-400/60 uppercase text-[10px]">
                {holding.entity_type}
              </td>
              <td className="py-2 px-2 text-green-400/60 text-[10px]">
                {holding.sector || "—"}
              </td>
              <td className="py-2 px-2 text-right text-green-400">
                {holding.market_value !== null
                  ? `$${holding.market_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </td>
              <td className="py-2 px-2 text-right text-green-400">
                {(holding.portfolio_weight * 100).toFixed(1)}%
              </td>
              <td className="py-2 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className={`font-bold ${getExposureColor(holding.cascade_exposure_score)}`}>
                    {holding.cascade_exposure_score.toFixed(0)}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    holding.cascade_exposure_score >= 70
                      ? "bg-red-500/10 border-red-400/30 text-red-400"
                      : holding.cascade_exposure_score >= 40
                      ? "bg-orange-500/10 border-orange-400/30 text-orange-400"
                      : "bg-green-500/10 border-green-400/30 text-green-400"
                  }`}>
                    {getExposureLabel(holding.cascade_exposure_score)}
                  </span>
                </div>
              </td>
              <td className="py-2 px-2 text-center">
                <button
                  onClick={() => handleRemove(holding.entity_id)}
                  className="text-red-400/60 hover:text-red-400 transition p-1"
                  title="Remove holding"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedHoldings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm font-mono text-green-400/40">
            No holdings in portfolio
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 p-3 bg-green-500/5 border border-green-400/20 rounded">
        <div className="text-[10px] font-mono text-green-400/60 space-y-1">
          <div>
            <strong className="text-green-400">CASCADE EXPOSURE SCORE (0-100):</strong> Measures how many other entities in the causal graph can affect this holding through supply chains, sector links, and correlations. A score of 70 means many things can cascade into it — high exposure to second-order effects.
          </div>
          <div>
            <strong className="text-green-400">WHY IT MATTERS:</strong> A stock with high cascade exposure isn&apos;t necessarily bad — but if most of your portfolio is high-exposure, you&apos;re vulnerable to chain reactions. Use the What If tab to stress-test specific scenarios.
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-green-400">LOW (&lt;40) — few upstream risks</span>
            <span className="text-orange-400">MED (40-69) — moderate chain risk</span>
            <span className="text-red-400">HIGH (≥70) — many cascading inputs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
