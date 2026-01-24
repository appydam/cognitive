"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsequenceAPI } from "@/lib/api";
import { GraphStats as GraphStatsType } from "@/types/api";
import {
  Network,
  Users,
  Link2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function GraphStats() {
  const [stats, setStats] = useState<GraphStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ConsequenceAPI.getGraphStats()
      .then(setStats)
      .catch((err) => {
        setError(err.message || "Failed to load graph statistics");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </Card>
        <Card className="p-6 md:col-span-2">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid md:grid-cols-2 gap-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-lg">
              Failed to Load Statistics
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-12 text-center bg-gray-50">
        <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No graph data available</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
      {/* Graph Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Graph Overview</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Total Entities</span>
              </div>
              <Badge className="text-lg px-3 py-1 bg-blue-600">
                {stats.num_entities}
              </Badge>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Total Links</span>
              </div>
              <Badge className="text-lg px-3 py-1 bg-cyan-600">
                {stats.num_links}
              </Badge>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Avg. Connections</span>
              </div>
              <Badge className="text-lg px-3 py-1 bg-purple-600">
                {(stats.num_links / stats.num_entities).toFixed(1)}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Entity Types */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold">Entity Types</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(stats.entity_types).map(([type, count], idx) => (
            <div
              key={type}
              className="bg-white p-3 rounded-lg shadow-sm animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-700 capitalize font-medium">
                  {type}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{
                        width: `${(count / stats.num_entities) * 100}%`,
                      }}
                    />
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {count}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Relationship Types */}
      <Card className="p-6 md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold">Relationship Types</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stats.relationship_types).map(
            ([type, count], idx) => (
              <div
                key={type}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize font-medium text-sm">
                    {type.replace(/_/g, " ")}
                  </span>
                  <Badge variant="outline" className="font-semibold">
                    {count}
                  </Badge>
                </div>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${(count / stats.num_links) * 100}%` }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
