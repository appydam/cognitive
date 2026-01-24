"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface PredictionFormProps {
  onSubmit: (data: {
    ticker: string;
    surprise_percent: number;
    description: string;
    horizon_days: number;
  }) => void;
  loading: boolean;
}

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

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Earnings Event Simulator</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="ticker">Stock Ticker</Label>
          <Input
            id="ticker"
            placeholder="AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="surprise">Earnings Surprise (%)</Label>
          <Input
            id="surprise"
            type="number"
            step="0.1"
            placeholder="-8.0"
            value={surprise}
            onChange={(e) => setSurprise(e.target.value)}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Negative for miss, positive for beat
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder="Q4 2024 earnings miss"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="horizon">Prediction Horizon (days)</Label>
          <Input
            id="horizon"
            type="number"
            min="1"
            max="90"
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Predicting..." : "Predict Cascade"}
        </Button>
      </form>
    </Card>
  );
}
