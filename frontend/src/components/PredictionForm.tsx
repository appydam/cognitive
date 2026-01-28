"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Sparkles, Loader2 } from "lucide-react";

interface PredictionFormProps {
  onSubmit: (data: {
    ticker: string;
    surprise_percent: number;
    description: string;
    horizon_days: number;
  }) => void;
  loading: boolean;
}

const EXAMPLE_SCENARIOS = [
  { ticker: "AAPL", surprise: -8.0, desc: "iPhone sales miss" },
  { ticker: "NVDA", surprise: 12.0, desc: "AI chip demand surge" },
  { ticker: "TSMC", surprise: -5.0, desc: "Capacity constraints" },
];

export default function PredictionForm({
  onSubmit,
  loading,
}: PredictionFormProps) {
  const [ticker, setTicker] = useState("");
  const [surprise, setSurprise] = useState("");
  const [description, setDescription] = useState("");
  const [horizon, setHorizon] = useState("14");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ticker: ticker.toUpperCase(),
      surprise_percent: parseFloat(surprise),
      description,
      horizon_days: parseInt(horizon),
    });
  };

  const loadExample = (example: typeof EXAMPLE_SCENARIOS[0]) => {
    setTicker(example.ticker);
    setSurprise(example.surprise.toString());
    setDescription(example.desc);
  };

  const surpriseValue = parseFloat(surprise) || 0;
  const isPositive = surpriseValue > 0;
  const isMiss = surpriseValue < 0;

  return (
    <Card className="p-8 bg-gradient-to-br from-slate-900/50 via-gray-900/50 to-black/50 border-slate-700/30 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
          <Sparkles className="h-5 w-5 text-slate-300" />
        </div>
        <h2 className="text-xl font-semibold text-slate-200 military-font">
          Earnings Event Simulator
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="ticker" className="text-sm font-medium text-slate-300 mb-2 block">
            Stock Ticker
          </Label>
          <Input
            id="ticker"
            placeholder="AAPL, NVDA, TSMC..."
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
            className="text-base font-mono uppercase bg-slate-900/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="surprise" className="text-sm font-medium text-slate-300 mb-2 block">
            Earnings Surprise (%)
          </Label>
          <div className="relative">
            <Input
              id="surprise"
              type="number"
              step="0.1"
              placeholder="-8.0"
              value={surprise}
              onChange={(e) => setSurprise(e.target.value)}
              required
              className={`text-base pr-12 font-mono bg-slate-900/50 transition-all ${
                isMiss
                  ? "border-red-500/40 text-red-400 focus:border-red-500/60 focus:ring-red-500/20"
                  : isPositive
                  ? "border-emerald-500/40 text-emerald-400 focus:border-emerald-500/60 focus:ring-emerald-500/20"
                  : "border-slate-700/50 text-slate-300 focus:border-blue-500/50 focus:ring-blue-500/20"
              }`}
              disabled={loading}
            />
            {isMiss && (
              <TrendingDown className="absolute right-3 top-3 h-4 w-4 text-red-400" />
            )}
            {isPositive && (
              <TrendingUp className="absolute right-3 top-3 h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-slate-400">
              {isMiss && "Earnings miss - negative cascade expected"}
              {isPositive && "Earnings beat - positive cascade expected"}
              {!isMiss && !isPositive && "Negative for miss, positive for beat"}
            </p>
            {surpriseValue !== 0 && (
              <Badge
                variant={isMiss ? "destructive" : "default"}
                className="ml-2 text-xs"
              >
                {isPositive ? "+" : ""}
                {surpriseValue.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-slate-300 mb-2 block">
            Description
            <span className="text-slate-500 font-normal ml-1">(optional)</span>
          </Label>
          <Input
            id="description"
            placeholder="e.g., Q4 2024 earnings miss due to supply chain"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-slate-900/50 border-slate-700/50 text-slate-300 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="horizon" className="text-sm font-medium text-slate-300 mb-2 block">
            Prediction Horizon
          </Label>
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              id="horizon"
              type="number"
              min="1"
              max="90"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              required
              className="w-20 text-base text-center bg-slate-900/50 border-slate-700/50 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 font-mono"
              disabled={loading}
            />
            <span className="text-slate-400 text-sm">days</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHorizon("7")}
                disabled={loading}
                className={`text-xs ${
                  horizon === "7"
                    ? "bg-slate-700/50 text-slate-200 border-slate-600"
                    : "bg-slate-900/30 text-slate-400 border-slate-700/50 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
              >
                1 Week
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHorizon("14")}
                disabled={loading}
                className={`text-xs ${
                  horizon === "14"
                    ? "bg-slate-700/50 text-slate-200 border-slate-600"
                    : "bg-slate-900/30 text-slate-400 border-slate-700/50 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
              >
                2 Weeks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHorizon("30")}
                disabled={loading}
                className={`text-xs ${
                  horizon === "30"
                    ? "bg-slate-700/50 text-slate-200 border-slate-600"
                    : "bg-slate-900/30 text-slate-400 border-slate-700/50 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
              >
                1 Month
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full text-sm py-5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing cascade effects...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Predict Cascade Effects
            </>
          )}
        </Button>
      </form>

      {/* Example Scenarios */}
      {!loading && (
        <div className="mt-6 pt-5 border-t border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 mb-2.5">
            Quick start examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SCENARIOS.map((example, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadExample(example)}
                className="text-xs bg-slate-900/30 text-slate-400 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600 hover:text-slate-300 transition-all"
              >
                {example.ticker} {example.surprise > 0 ? "+" : ""}
                {example.surprise}%
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
