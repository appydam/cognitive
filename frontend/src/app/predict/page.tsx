"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PredictionForm from "@/components/PredictionForm";
import CascadeTimeline from "@/components/CascadeTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Clock, Sparkles } from "lucide-react";
import { ConsequenceAPI } from "@/lib/api";
import { CascadeResponse } from "@/types/api";

// Dynamic import for CascadeGraph to avoid SSR issues with ForceGraph2D
const CascadeGraph = dynamic(
  () => import("@/components/CascadeGraph"),
  { ssr: false }
);

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
    <div className="min-h-screen bg-black tactical-grid">
      <div className="container mx-auto px-4 py-10 max-w-[1600px]">
        {/* Hero Header */}
        <div className="mb-10 slide-up">
          <div className="inline-flex items-center gap-2 bg-slate-800/30 border border-slate-700/50 text-slate-300 px-4 py-1.5 text-xs mb-4 rounded-md">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            Cascade Prediction Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-100 military-font">
            Cascade Prediction
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Predict multi-hop effects across supply chains and sectors with quantified confidence and timing
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Form - 2 columns */}
          <div className="lg:col-span-2 slide-up stagger-1">
            <PredictionForm onSubmit={handlePredict} loading={loading} />
            {error && (
              <div className="mt-4 p-4 bg-red-950/20 border border-red-800/40 rounded-lg animate-fade-in">
                <p className="font-medium text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            )}
          </div>

          {/* Results Panel - 3 columns */}
          <div className="lg:col-span-3 slide-up stagger-2">
            {cascade && (
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-700/50 p-1 rounded-lg">
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-slate-700/50 data-[state=active]:text-slate-200 data-[state=inactive]:text-slate-400 transition-all"
                  >
                    <Clock className="h-4 w-4" />
                    Timeline View
                  </TabsTrigger>
                  <TabsTrigger
                    value="simulation"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-slate-700/50 data-[state=active]:text-slate-200 data-[state=inactive]:text-slate-400 transition-all"
                  >
                    <Network className="h-4 w-4" />
                    Graph View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="animate-fade-in">
                  <CascadeTimeline cascade={cascade} />
                </TabsContent>

                <TabsContent value="simulation" className="animate-fade-in">
                  <CascadeGraph cascade={cascade} />
                </TabsContent>
              </Tabs>
            )}
            {!cascade && !error && (
              <div className="text-center mt-20 bg-slate-900/30 border border-slate-700/50 p-12 rounded-xl backdrop-blur-sm">
                <div className="mb-5">
                  <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                    <Sparkles className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
                <p className="text-slate-300 mb-2 font-medium">Awaiting Input</p>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Enter an earnings event to see multi-hop cascade predictions with quantified effects and confidence scores
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
