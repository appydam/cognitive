"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ConsequenceAPI } from "@/lib/api";
import { GraphStats as GraphStatsType } from "@/types/api";

export default function GraphStats() {
  const [stats, setStats] = useState<GraphStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ConsequenceAPI.getGraphStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!stats) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Graph Overview</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Entities:</span>
            <span className="font-semibold">{stats.num_entities}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Links:</span>
            <span className="font-semibold">{stats.num_links}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Entity Types</h3>
        <div className="space-y-2">
          {Object.entries(stats.entity_types).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span className="text-gray-600 capitalize">{type}:</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Relationship Types</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {Object.entries(stats.relationship_types).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span className="text-gray-600 capitalize">
                {type.replace(/_/g, " ")}:
              </span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
