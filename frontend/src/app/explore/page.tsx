"use client";

import dynamic from "next/dynamic";
import GraphStats from "@/components/GraphStats";
import EntitySearch from "@/components/EntitySearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, BarChart3, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Dynamically import GraphVisualization to avoid SSR issues with ForceGraph2D
const GraphVisualization = dynamic(
  () => import("@/components/GraphVisualization"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <Skeleton className="h-[600px] w-full" />
      </Card>
    ),
  }
);

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 slide-up">
          <div className="inline-block bg-cyan-500/10 border border-cyan-500 text-cyan-400 px-4 py-1 military-font text-xs mb-4">
            ⬢ GRAPH DATABASE ACCESS ⬢
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 terminal-text military-font">
            &gt; EXPLORE CAUSAL GRAPH
          </h1>
          <p className="text-sm text-green-400/70 font-mono">
            INTERACTIVE VISUALIZATION OF <span className="text-cyan-400">ENTITY RELATIONSHIPS</span> AND CASCADE EFFECTS<br />
            REAL-TIME NETWORK ANALYSIS | FORCE-DIRECTED LAYOUT ENABLED
          </p>
        </div>

      <Tabs defaultValue="visualization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto hud-panel border-green-500/30">
            <TabsTrigger value="visualization" className="flex items-center gap-2 military-font text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">VISUALIZATION</span>
              <span className="sm:hidden">GRAPH</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 military-font text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">STATISTICS</span>
              <span className="sm:hidden">STATS</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2 military-font text-xs data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Search className="h-4 w-4" />
              <span>SEARCH</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="visualization" className="animate-fade-in">
          <GraphVisualization />
        </TabsContent>

        <TabsContent value="stats" className="animate-fade-in">
          <GraphStats />
        </TabsContent>

        <TabsContent value="search" className="animate-fade-in">
          <EntitySearch />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
