"use client";

import GraphStats from "@/components/GraphStats";
import EntitySearch from "@/components/EntitySearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Explore Causal Graph</h1>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="search">Search Entities</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <GraphStats />
        </TabsContent>

        <TabsContent value="search">
          <EntitySearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
