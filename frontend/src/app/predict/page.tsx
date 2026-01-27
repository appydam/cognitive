"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PredictionForm from "@/components/PredictionForm";
import CascadeTimeline from "@/components/CascadeTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 slide-up">
          <div className="inline-block bg-purple-500/10 border border-purple-500 text-purple-400 px-4 py-1 military-font text-xs mb-4">
            ⬢ CASCADE PREDICTION ENGINE ⬢
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 terminal-text military-font">
            &gt; CASCADE PREDICTION
          </h1>
          <p className="text-sm text-green-400/70 font-mono">
            PREDICT <span className="text-cyan-400">MULTI-HOP EFFECTS</span> ACROSS SUPPLY CHAINS AND SECTORS<br />
            REAL-TIME SIMULATION | CAUSAL PROPAGATION ANALYSIS
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="slide-up stagger-1">
            <PredictionForm onSubmit={handlePredict} loading={loading} />
            {error && (
              <div className="mt-4 p-4 hud-panel bg-red-500/10 border-red-400/30 rounded animate-fade-in">
                <p className="font-semibold text-red-400 military-font">&gt; ERROR</p>
                <p className="text-sm text-red-400/70 font-mono">{error}</p>
              </div>
            )}
          </div>

          <div className="slide-up stagger-2">
            {cascade && (
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 hud-panel border-green-500/30">
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-2 military-font text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                  >
                    <Clock className="h-4 w-4" />
                    TIMELINE
                  </TabsTrigger>
                  <TabsTrigger
                    value="simulation"
                    className="flex items-center gap-2 military-font text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                  >
                    <Network className="h-4 w-4" />
                    SIMULATION
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
              <div className="text-center mt-16 hud-panel p-12 border-green-500/30">
                <p className="text-green-400/60 mb-2 military-font">&gt; AWAITING INPUT</p>
                <p className="text-sm text-green-400/40 font-mono">
                  Enter an earnings event to see <span className="text-cyan-400">cascade predictions</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
