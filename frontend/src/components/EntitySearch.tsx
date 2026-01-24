"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsequenceAPI } from "@/lib/api";
import { SearchResult, EntityInfo, EntityConnection } from "@/types/api";
import { Search, AlertCircle, ArrowRight } from "lucide-react";

export default function EntitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityInfo | null>(null);
  const [connections, setConnections] = useState<{
    outgoing: EntityConnection[];
    incoming: EntityConnection[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (q: string) => {
    setQuery(q);
    setError(null);

    if (q.length >= 2) {
      setSearching(true);
      try {
        const data = await ConsequenceAPI.searchEntities(q);
        setResults(data.results || []);
        if (data.results.length === 0) {
          setError(`No entities found matching "${q}"`);
        }
      } catch (err) {
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    } else {
      setResults([]);
    }
  };

  const handleSelectEntity = async (ticker: string) => {
    setLoading(true);
    setError(null);
    try {
      const [entity, conns] = await Promise.all([
        ConsequenceAPI.getEntity(ticker),
        ConsequenceAPI.getEntityConnections(ticker),
      ]);
      setSelectedEntity(entity);
      setConnections(conns);
      setResults([]); // Clear search results
    } catch (error: any) {
      setError(error.message || "Failed to load entity details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search entities (e.g., AAPL, NVDA, TSMC)..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 transition-shadow focus:shadow-md"
        />
        {searching && (
          <div className="absolute right-3 top-3">
            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && !error && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-sm text-gray-600">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result, idx) => (
            <Card
              key={result.id}
              className="p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all hover:shadow-md"
              onClick={() => handleSelectEntity(result.id)}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{result.id}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{result.name}</span>
                  </div>
                </div>
                <Badge variant="secondary">{result.sector}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <Card className="p-6">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-6 w-64 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
            </div>
          </Card>
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {/* Selected Entity */}
      {selectedEntity && connections && !loading && (
        <div className="space-y-4 animate-fade-in">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <h3 className="text-2xl font-bold mb-1">{selectedEntity.id}</h3>
            <p className="text-gray-700 mb-4 text-lg">{selectedEntity.name}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-600 text-xs uppercase font-semibold">
                  Type
                </div>
                <div className="mt-1 font-semibold capitalize">
                  {selectedEntity.type}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-600 text-xs uppercase font-semibold">
                  Sector
                </div>
                <div className="mt-1 font-semibold">
                  {selectedEntity.sector || "N/A"}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-600 text-xs uppercase font-semibold">
                  Connections
                </div>
                <div className="mt-1 font-semibold text-blue-600">
                  {selectedEntity.connections}
                </div>
              </div>
            </div>
          </Card>

          {connections.outgoing.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-green-600">→</span>
                Outgoing Connections
                <Badge variant="secondary">{connections.outgoing.length}</Badge>
              </h4>
              <div className="space-y-2">
                {connections.outgoing.map((conn, idx) => (
                  <Card
                    key={idx}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">
                            {conn.target}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {conn.relationship.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>
                            Strength:{" "}
                            <span className="font-semibold text-gray-900">
                              {(conn.strength * 100).toFixed(0)}%
                            </span>
                          </span>
                          <span>
                            Delay:{" "}
                            <span className="font-semibold text-gray-900">
                              {conn.delay_days.toFixed(1)} days
                            </span>
                          </span>
                          <span>
                            Confidence:{" "}
                            <span className="font-semibold text-gray-900">
                              {(conn.confidence * 100).toFixed(0)}%
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {connections.incoming.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-blue-600">←</span>
                Incoming Connections
                <Badge variant="secondary">{connections.incoming.length}</Badge>
              </h4>
              <div className="space-y-2">
                {connections.incoming.map((conn, idx) => (
                  <Card
                    key={idx}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">
                            {conn.source}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {conn.relationship.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>
                            Strength:{" "}
                            <span className="font-semibold text-gray-900">
                              {(conn.strength * 100).toFixed(0)}%
                            </span>
                          </span>
                          <span>
                            Delay:{" "}
                            <span className="font-semibold text-gray-900">
                              {conn.delay_days.toFixed(1)} days
                            </span>
                          </span>
                          <span>
                            Confidence:{" "}
                            <span className="font-semibold text-gray-900">
                              {(conn.confidence * 100).toFixed(0)}%
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {connections.outgoing.length === 0 &&
            connections.incoming.length === 0 && (
              <Card className="p-8 text-center bg-gray-50">
                <p className="text-gray-600">
                  No connections found for {selectedEntity.id}
                </p>
              </Card>
            )}
        </div>
      )}

      {/* Empty State */}
      {!loading &&
        !selectedEntity &&
        results.length === 0 &&
        query.length === 0 && (
          <Card className="p-12 text-center bg-gray-50">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              Search for entities to explore connections
            </p>
            <p className="text-sm text-gray-500">
              Try searching for AAPL, NVDA, TSMC, or other tickers
            </p>
          </Card>
        )}
    </div>
  );
}
