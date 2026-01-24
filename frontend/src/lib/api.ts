import type {
  GraphStats,
  EntityInfo,
  EntityConnection,
  CascadeResponse,
  SearchResult,
  EarningsEventRequest,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://cognitive-production.up.railway.app";

export class ConsequenceAPI {
  // Get graph statistics
  static async getGraphStats(): Promise<GraphStats> {
    const res = await fetch(`${API_BASE_URL}/graph/stats`);
    if (!res.ok) throw new Error("Failed to fetch graph stats");
    return res.json();
  }

  // Get entity details
  static async getEntity(ticker: string): Promise<EntityInfo> {
    const res = await fetch(`${API_BASE_URL}/graph/entity/${ticker}`);
    if (!res.ok) throw new Error(`Entity ${ticker} not found`);
    return res.json();
  }

  // Get entity connections
  static async getEntityConnections(ticker: string): Promise<{
    entity: string;
    outgoing: EntityConnection[];
    incoming: EntityConnection[];
  }> {
    const res = await fetch(
      `${API_BASE_URL}/graph/entity/${ticker}/connections`
    );
    if (!res.ok)
      throw new Error(`Failed to fetch connections for ${ticker}`);
    return res.json();
  }

  // Search entities
  static async searchEntities(
    query: string,
    limit = 10
  ): Promise<{ query: string; results: SearchResult[] }> {
    const res = await fetch(
      `${API_BASE_URL}/entities/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  }

  // Predict earnings cascade
  static async predictEarningsCascade(
    request: EarningsEventRequest
  ): Promise<CascadeResponse> {
    const res = await fetch(`${API_BASE_URL}/predict/earnings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Prediction failed");
    }
    return res.json();
  }

  // Get cascade explanation
  static async explainCascade(
    request: EarningsEventRequest
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/explain/cascade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Failed to get explanation");
    return res.json();
  }
}
