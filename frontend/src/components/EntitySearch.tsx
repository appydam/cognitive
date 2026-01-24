"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsequenceAPI } from "@/lib/api";
import { SearchResult, EntityInfo, EntityConnection } from "@/types/api";
import { Search } from "lucide-react";

export default function EntitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityInfo | null>(null);
  const [connections, setConnections] = useState<{
    outgoing: EntityConnection[];
    incoming: EntityConnection[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 2) {
      const data = await ConsequenceAPI.searchEntities(q);
      setResults(data.results || []);
    } else {
      setResults([]);
    }
  };

  const handleSelectEntity = async (ticker: string) => {
    setLoading(true);
    try {
      const [entity, conns] = await Promise.all([
        ConsequenceAPI.getEntity(ticker),
        ConsequenceAPI.getEntityConnections(ticker),
      ]);
      setSelectedEntity(entity);
      setConnections(conns);
    } catch (error) {
      console.error("Failed to load entity:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search entities (e.g., AAPL, NVDA)..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {results.length > 0 && (
        <div className="grid gap-2">
          {results.map((result) => (
            <Card
              key={result.id}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSelectEntity(result.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{result.id}</span>
                  <span className="text-gray-600 ml-2">{result.name}</span>
                </div>
                <Badge>{result.sector}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      )}

      {selectedEntity && connections && !loading && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">{selectedEntity.id}</h3>
            <p className="text-gray-600 mb-4">{selectedEntity.name}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-semibold">
                  {selectedEntity.type}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Sector:</span>
                <span className="ml-2 font-semibold">
                  {selectedEntity.sector || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Connections:</span>
                <span className="ml-2 font-semibold">
                  {selectedEntity.connections}
                </span>
              </div>
            </div>
          </Card>

          {connections.outgoing.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                Outgoing Connections ({connections.outgoing.length})
              </h4>
              <div className="space-y-2">
                {connections.outgoing.map((conn, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{conn.target}</span>
                        <Badge variant="outline" className="ml-2">
                          {conn.relationship}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Strength: {(conn.strength * 100).toFixed(0)}%
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {connections.incoming.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                Incoming Connections ({connections.incoming.length})
              </h4>
              <div className="space-y-2">
                {connections.incoming.map((conn, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{conn.source}</span>
                        <Badge variant="outline" className="ml-2">
                          {conn.relationship}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Strength: {(conn.strength * 100).toFixed(0)}%
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
