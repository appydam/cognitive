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
      <h1 className="text-4xl font-bold mb-8">Cascade Prediction</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <PredictionForm onSubmit={handlePredict} loading={loading} />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
        </div>

        <div>
          {cascade && <CascadeTimeline cascade={cascade} />}
          {!cascade && !error && (
            <div className="text-center text-gray-500 mt-16">
              Enter an earnings event to see cascade predictions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
