import type {
  GraphStats,
  EntityInfo,
  EntityConnection,
  CascadeResponse,
  SearchResult,
  EarningsEventRequest,
  ExplainCascadeResponse,
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
  ): Promise<ExplainCascadeResponse> {
    const res = await fetch(`${API_BASE_URL}/explain/cascade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Failed to get explanation");
    return res.json();
  }

  // Get full graph data (all entities and connections)
  static async getFullGraph(): Promise<{
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      sector: string | null;
    }>;
    links: Array<{
      source: string;
      target: string;
      relationship: string;
      strength: number;
      delay_days: number;
      confidence: number;
    }>;
  }> {
    console.log(`[API] Fetching all entities from ${API_BASE_URL}/entities/search`);

    // Get all entities
    const searchRes = await fetch(
      `${API_BASE_URL}/entities/search?q=&limit=200`
    );
    if (!searchRes.ok) throw new Error("Failed to fetch entities");
    const searchData = await searchRes.json();
    const nodes = searchData.results;
    console.log(`[API] Fetched ${nodes.length} entities`);

    // Get connections for all entities
    const links: any[] = [];
    const seenLinks = new Set<string>();
    let processedCount = 0;

    console.log(`[API] Fetching connections for ${nodes.length} entities...`);

    for (const node of nodes) {
      try {
        const connRes = await fetch(
          `${API_BASE_URL}/graph/entity/${node.id}/connections`
        );
        if (connRes.ok) {
          const connData = await connRes.json();

          // Add outgoing connections
          for (const conn of connData.outgoing || []) {
            const linkId = `${node.id}-${conn.target}-${conn.relationship}`;
            if (!seenLinks.has(linkId)) {
              links.push({
                source: node.id,
                target: conn.target,
                relationship: conn.relationship,
                strength: conn.strength,
                delay_days: conn.delay_days,
                confidence: conn.confidence,
              });
              seenLinks.add(linkId);
            }
          }
        }
        processedCount++;
        if (processedCount % 20 === 0) {
          console.log(`[API] Processed ${processedCount}/${nodes.length} entities (${links.length} links so far)`);
        }
      } catch (err) {
        console.warn(`[API] Failed to fetch connections for ${node.id}:`, err);
      }
    }

    console.log(`[API] Complete! Total: ${nodes.length} nodes, ${links.length} links`);
    return { nodes, links };
  }
}
