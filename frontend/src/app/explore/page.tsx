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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 slide-up">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 holographic-text neon-glow">
          Explore Causal Graph
        </h1>
        <p className="text-lg text-gray-700">
          Interactive visualization of <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">entity relationships</span> and cascade effects
        </p>
      </div>

      <Tabs defaultValue="visualization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Visualization</span>
            <span className="sm:hidden">Graph</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search</span>
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
  );
}
