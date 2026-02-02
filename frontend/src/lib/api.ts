import type {
  GraphStats,
  EntityInfo,
  EntityConnection,
  CascadeResponse,
  SearchResult,
  EarningsEventRequest,
  ExplainCascadeResponse,
  PortfolioHolding,
  PortfolioAnalysis,
  PortfolioCascadeResult,
  MacroSensitivity,
  PortfolioSubgraph,
  TradeSignal,
  SignalPerformance,
  UpcomingEarning,
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

  // Backtest operations
  static async getBacktestRuns(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/backtest/runs`);
    if (!res.ok) throw new Error("Failed to fetch backtest runs");
    return res.json();
  }

  static async getBacktestRun(runId: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/backtest/run/${runId}`);
    if (!res.ok) throw new Error("Failed to fetch backtest run");
    return res.json();
  }

  static async createBacktestRun(params: {
    start_date: string;
    end_date: string;
    min_surprise: number;
    max_events: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/backtest/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to create backtest run");
    return res.json();
  }

  // Get full graph data (all entities and connections)
  // With intelligent caching to prevent redundant API calls
  static async getFullGraph(options: { forceRefresh?: boolean } = {}): Promise<{
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
    // Import cache utilities (dynamic import to avoid SSR issues)
    const { getCachedGraphData, setCachedGraphData, getCacheInfo } = await import('./graphCache');

    // Check cache first (unless force refresh requested)
    if (!options.forceRefresh) {
      const cached = getCachedGraphData();
      if (cached) {
        const info = getCacheInfo();
        console.log(`[API] ⚡ Using cached graph data (age: ${info.ageMinutes}m, ${info.nodeCount} nodes, ${info.linkCount} links)`);
        return cached;
      }
    }

    console.log(`[API] 🔄 Fetching full graph data from ${API_BASE_URL}/graph/full`);

    // Fetch entire graph in a single request
    const res = await fetch(`${API_BASE_URL}/graph/full`);
    if (!res.ok) throw new Error("Failed to fetch full graph");
    const graphData = await res.json();

    console.log(`[API] Complete! Total: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);

    // Cache the results
    setCachedGraphData(graphData);

    return graphData;
  }

  // Notification preferences
  static async getNotificationPreferences(userId: string = "default"): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/notifications/preferences?user_id=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch notification preferences");
    return res.json();
  }

  static async saveNotificationPreferences(preferences: any, userId: string = "default"): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/notifications/preferences?user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) throw new Error("Failed to save notification preferences");
    return res.json();
  }

  static async sendTestNotification(userId: string = "default"): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/notifications/test?user_id=${userId}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to send test notification");
    return res.json();
  }

  // Portfolio endpoints
  static async analyzePortfolio(holdings: PortfolioHolding[]): Promise<PortfolioAnalysis> {
    const res = await fetch(`${API_BASE_URL}/portfolio/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings }),
    });
    if (!res.ok) throw new Error("Failed to analyze portfolio");
    return res.json();
  }

  static async portfolioCascade(
    holdings: PortfolioHolding[],
    entity_id: string,
    surprise_percent: number,
    horizon_days: number = 14
  ): Promise<PortfolioCascadeResult> {
    const res = await fetch(`${API_BASE_URL}/portfolio/cascade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings, entity_id, surprise_percent, horizon_days }),
    });
    if (!res.ok) throw new Error("Failed to run portfolio cascade");
    return res.json();
  }

  static async portfolioMacroSensitivity(holdings: PortfolioHolding[]): Promise<{ sensitivities: MacroSensitivity[] }> {
    const res = await fetch(`${API_BASE_URL}/portfolio/macro-sensitivity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings }),
    });
    if (!res.ok) throw new Error("Failed to get macro sensitivity");
    return res.json();
  }

  static async portfolioSubgraph(
    holdings: PortfolioHolding[],
    include_intermediaries: boolean = true
  ): Promise<PortfolioSubgraph> {
    const res = await fetch(`${API_BASE_URL}/portfolio/subgraph`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings, include_intermediaries }),
    });
    if (!res.ok) throw new Error("Failed to get portfolio subgraph");
    return res.json();
  }

  // Signal endpoints
  static async generateSignals(
    triggerEntity: string,
    triggerMagnitude: number,
    triggerDescription?: string,
    portfolioValue?: number,
  ): Promise<{ signals: TradeSignal[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/signals/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger_entity: triggerEntity,
        trigger_magnitude: triggerMagnitude,
        trigger_description: triggerDescription || "",
        portfolio_value: portfolioValue,
      }),
    });
    if (!res.ok) throw new Error("Failed to generate signals");
    return res.json();
  }

  static async getActiveSignals(): Promise<{ signals: TradeSignal[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/signals/active`);
    if (!res.ok) throw new Error("Failed to fetch active signals");
    return res.json();
  }

  static async getSignalHistory(days: number = 30): Promise<{ signals: TradeSignal[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/signals/history?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch signal history");
    return res.json();
  }

  static async getSignalPerformance(): Promise<SignalPerformance> {
    const res = await fetch(`${API_BASE_URL}/signals/performance`);
    if (!res.ok) throw new Error("Failed to fetch signal performance");
    return res.json();
  }

  static async updateSignalPrices(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/signals/update-prices`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to update signal prices");
    return res.json();
  }

  // Calendar endpoints
  static async getUpcomingEarnings(days: number = 7): Promise<{ earnings: UpcomingEarning[]; source: string }> {
    const res = await fetch(`${API_BASE_URL}/calendar/upcoming?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch upcoming earnings");
    return res.json();
  }

  static async refreshEarningsCalendar(days: number = 7): Promise<{ earnings: UpcomingEarning[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/calendar/refresh?days=${days}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to refresh earnings calendar");
    return res.json();
  }
}
