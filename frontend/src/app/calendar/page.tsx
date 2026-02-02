"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Calendar, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { UpcomingEarning } from "@/types/api";
import { getPortfolio, hasPortfolio } from "@/lib/portfolio";
import Link from "next/link";

export default function CalendarPage() {
  const [earnings, setEarnings] = useState<UpcomingEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioTickers, setPortfolioTickers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCalendar();
    if (hasPortfolio()) {
      const portfolio = getPortfolio();
      setPortfolioTickers(new Set(portfolio.holdings.map(h => h.entity_id.toUpperCase())));
    }
  }, []);

  const loadCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ConsequenceAPI.getUpcomingEarnings(14);
      setEarnings(res.earnings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await ConsequenceAPI.refreshEarningsCalendar(14);
      setEarnings(res.earnings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBD";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysUntil = (dateStr: string | null): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "TODAY";
      if (diff === 1) return "TOMORROW";
      if (diff < 0) return `${Math.abs(diff)}d ago`;
      return `in ${diff}d`;
    } catch {
      return "";
    }
  };

  const isInPortfolio = (ticker: string) => portfolioTickers.has(ticker.toUpperCase());

  // Sort: portfolio holdings first, then by date
  const sortedEarnings = [...earnings].sort((a, b) => {
    const aInPortfolio = isInPortfolio(a.ticker) ? 0 : 1;
    const bInPortfolio = isInPortfolio(b.ticker) ? 0 : 1;
    if (aInPortfolio !== bInPortfolio) return aInPortfolio - bInPortfolio;
    return (a.earnings_date || "").localeCompare(b.earnings_date || "");
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold military-font text-green-400 mb-2">
          &gt; EARNINGS CALENDAR
        </h1>
        <p className="text-sm text-green-400/60 font-mono">
          Upcoming earnings reports — know what cascades might fire before they happen
        </p>
      </div>

      {/* Explainer */}
      <Card className="p-4 hud-panel border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-green-500/5 mb-6">
        <h3 className="text-sm military-font text-cyan-400 mb-2">&gt; WHY THIS MATTERS</h3>
        <div className="text-xs font-mono text-green-400/70 space-y-2">
          <p>
            <strong className="text-green-400">Be positioned before the move:</strong> Every earnings report can
            trigger cascade effects through the causal graph. This calendar shows you which companies report soon,
            so you can prepare — not react.
          </p>
          <p>
            <strong className="text-green-400">How to use it:</strong> Companies highlighted in{" "}
            <span className="text-yellow-400">gold</span> are in your portfolio or connected to it.
            Click any company to run a What-If cascade on the Predict page. Think about both scenarios:
            what if they beat? What if they miss?
          </p>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-green-400/60">
          {earnings.length} upcoming earnings in next 14 days
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs font-mono border-green-500/30 !text-green-400/60 hover:!text-green-400"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          REFRESH FROM YFINANCE
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded">
          <p className="text-xs font-mono text-red-400">&gt; ERROR: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          <span className="ml-3 text-sm font-mono text-green-400">Loading earnings calendar...</span>
        </div>
      ) : sortedEarnings.length === 0 ? (
        <Card className="p-8 hud-panel border-green-500/30 text-center">
          <Calendar className="h-12 w-12 text-green-400/20 mx-auto mb-3" />
          <p className="text-sm font-mono text-green-400/60 mb-2">
            No upcoming earnings found
          </p>
          <p className="text-xs font-mono text-green-400/40">
            Click &quot;Refresh from yfinance&quot; to fetch the latest earnings calendar.
            This may take a moment as it checks each company.
          </p>
        </Card>
      ) : (
        <Card className="p-6 hud-panel border-green-500/30">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-green-500/30">
                  <th className="text-left py-2 px-3 text-green-400/70">TICKER</th>
                  <th className="text-left py-2 px-3 text-green-400/70">COMPANY</th>
                  <th className="text-center py-2 px-3 text-green-400/70">REPORT DATE</th>
                  <th className="text-center py-2 px-3 text-green-400/70">COUNTDOWN</th>
                  <th className="text-center py-2 px-3 text-green-400/70">EPS EST.</th>
                  <th className="text-center py-2 px-3 text-green-400/70">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedEarnings.map((earning, idx) => {
                  const inPortfolio = isInPortfolio(earning.ticker);
                  const daysUntil = getDaysUntil(earning.earnings_date);
                  const isUrgent = daysUntil === "TODAY" || daysUntil === "TOMORROW";

                  return (
                    <tr
                      key={`${earning.ticker}-${idx}`}
                      className={`border-b border-green-500/10 transition ${
                        inPortfolio
                          ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                          : "hover:bg-green-500/5"
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${inPortfolio ? "text-yellow-400" : "text-green-400"}`}>
                            {earning.ticker}
                          </span>
                          {inPortfolio && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-400/30 text-yellow-400">
                              YOUR HOLDING
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-green-400/70">
                        {earning.company_name}
                      </td>
                      <td className="py-3 px-3 text-center text-green-400/80">
                        {formatDate(earning.earnings_date)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUrgent
                            ? "bg-red-500/20 border border-red-400/30 text-red-400"
                            : "bg-green-500/10 border border-green-400/20 text-green-400/70"
                        }`}>
                          {daysUntil}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-cyan-400">
                        {earning.eps_estimate !== null ? `$${earning.eps_estimate.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/predict?entity=${earning.ticker}&surprise=-5`}
                            className="px-2 py-1 rounded text-[9px] bg-red-500/10 border border-red-400/20 text-red-400 hover:bg-red-500/20 transition"
                            title="Simulate earnings miss"
                          >
                            <TrendingDown className="h-3 w-3 inline mr-0.5" />
                            MISS
                          </Link>
                          <Link
                            href={`/predict?entity=${earning.ticker}&surprise=5`}
                            className="px-2 py-1 rounded text-[9px] bg-green-500/10 border border-green-400/20 text-green-400 hover:bg-green-500/20 transition"
                            title="Simulate earnings beat"
                          >
                            <TrendingUp className="h-3 w-3 inline mr-0.5" />
                            BEAT
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="mt-4 p-3 bg-green-500/5 border border-green-400/20 rounded">
        <div className="text-[10px] font-mono text-green-400/60 space-y-1">
          <div>
            <strong className="text-green-400">PRE-EARNINGS STRATEGY:</strong> Before a company reports,
            use the MISS/BEAT buttons to simulate cascades. If a miss would hurt your portfolio badly,
            consider hedging. If a beat would boost it, consider adding.
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-yellow-400">Gold = in your portfolio</span>
            <span className="text-red-400">Red countdown = reports today/tomorrow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
