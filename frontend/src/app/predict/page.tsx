"use client";

import { useState } from "react";
import PredictionForm from "@/components/PredictionForm";
import CascadeTimeline from "@/components/CascadeTimeline";
import { ConsequenceAPI } from "@/lib/api";
import { CascadeResponse } from "@/types/api";

export default function PredictPage() {
  const [cascade, setCascade] = useState<CascadeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ConsequenceAPI.predictEarningsCascade(data);
      setCascade(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 slide-up">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 holographic-text neon-glow">
          Cascade Prediction
        </h1>
        <p className="text-lg text-gray-700">
          Predict <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">multi-hop effects</span> across supply chains and sectors
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="slide-up stagger-1">
          <PredictionForm onSubmit={handlePredict} loading={loading} />
          {error && (
            <div className="mt-4 p-4 glass-card bg-red-500/10 border-red-400/30 rounded text-red-700 animate-fade-in">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="slide-up stagger-2">
          {cascade && <CascadeTimeline cascade={cascade} />}
          {!cascade && !error && (
            <div className="text-center mt-16 glass-card p-12 border-gray-300/30">
              <p className="text-gray-600 mb-2">No predictions yet</p>
              <p className="text-sm text-gray-500">
                Enter an earnings event to see <span className="font-semibold holographic-text">cascade predictions</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
