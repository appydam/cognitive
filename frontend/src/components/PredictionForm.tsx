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
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Earnings Event Simulator</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="ticker" className="text-base font-semibold">
            Stock Ticker
          </Label>
          <Input
            id="ticker"
            placeholder="AAPL, NVDA, TSMC..."
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
            className="mt-1.5 text-lg font-mono uppercase transition-all focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="surprise" className="text-base font-semibold">
            Earnings Surprise (%)
          </Label>
          <div className="relative mt-1.5">
            <Input
              id="surprise"
              type="number"
              step="0.1"
              placeholder="-8.0"
              value={surprise}
              onChange={(e) => setSurprise(e.target.value)}
              required
              className={`text-lg pr-12 transition-all ${
                isMiss
                  ? "border-red-300 focus:ring-red-500"
                  : isPositive
                  ? "border-green-300 focus:ring-green-500"
                  : ""
              }`}
              disabled={loading}
            />
            {isMiss && (
              <TrendingDown className="absolute right-3 top-3 h-5 w-5 text-red-600" />
            )}
            {isPositive && (
              <TrendingUp className="absolute right-3 top-3 h-5 w-5 text-green-600" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600">
              {isMiss && "Earnings miss - negative impact expected"}
              {isPositive && "Earnings beat - positive impact expected"}
              {!isMiss && !isPositive && "Negative for miss, positive for beat"}
            </p>
            {surpriseValue !== 0 && (
              <Badge
                variant={isMiss ? "destructive" : "default"}
                className="ml-2"
              >
                {isPositive ? "+" : ""}
                {surpriseValue.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-semibold">
            Description
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </Label>
          <Input
            id="description"
            placeholder="e.g., Q4 2024 earnings miss due to supply chain"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="horizon" className="text-base font-semibold">
            Prediction Horizon
          </Label>
          <div className="flex items-center gap-3 mt-1.5">
            <Input
              id="horizon"
              type="number"
              min="1"
              max="90"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              required
              className="w-24 text-lg text-center"
              disabled={loading}
            />
            <span className="text-gray-600">days</span>
            <div className="flex-1 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHorizon("7")}
                disabled={loading}
                className={horizon === "7" ? "bg-purple-100" : ""}
              >
                1 Week
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHorizon("14")}
                disabled={loading}
                className={horizon === "14" ? "bg-purple-100" : ""}
              >
                2 Weeks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHorizon("30")}
                disabled={loading}
                className={horizon === "30" ? "bg-purple-100" : ""}
              >
                1 Month
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing cascade effects...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Predict Cascade Effects
            </>
          )}
        </Button>
      </form>

      {/* Example Scenarios */}
      {!loading && (
        <div className="mt-6 pt-6 border-t border-purple-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Try an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SCENARIOS.map((example, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadExample(example)}
                className="text-xs hover:bg-purple-50 hover:border-purple-300"
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
