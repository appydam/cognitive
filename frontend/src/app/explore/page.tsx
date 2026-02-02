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
      <Card className="p-6 hud-panel">
        <div className="text-center py-8">
          <div className="military-font text-green-400 text-lg mb-4">
            &gt; LOADING GRAPH ENGINE_
          </div>
          <Skeleton className="h-[600px] w-full bg-green-500/10" />
        </div>
      </Card>
    ),
  }
);

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-6">
        {/* Compact header */}
        <div className="mb-6 slide-up">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 terminal-text military-font">
            &gt; CAUSAL GRAPH EXPLORER
          </h1>
          <p className="text-xs text-green-400/50 font-mono">
            Interactive map of companies, ETFs, sectors, and macro indicators with causal relationships.
            Click any node to inspect. Scroll to zoom. Hover for details.
          </p>
        </div>

        <Tabs defaultValue="visualization" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto hud-panel border-green-500/30">
            <TabsTrigger value="visualization" className="flex items-center gap-2 military-font text-xs text-green-400/60 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">GRAPH</span>
              <span className="sm:hidden">GRAPH</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 military-font text-xs text-cyan-400/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <BarChart3 className="h-4 w-4" />
              <span>STATS</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2 military-font text-xs text-yellow-400/60 data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
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
