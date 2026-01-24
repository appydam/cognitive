"use client";

import GraphStats from "@/components/GraphStats";
import EntitySearch from "@/components/EntitySearch";
import GraphVisualization from "@/components/GraphVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, BarChart3, Search } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Explore Causal Graph
        </h1>
        <p className="text-lg text-gray-600">
          Interactive visualization of entity relationships and cascade effects
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
