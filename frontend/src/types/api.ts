export interface GraphStats {
  num_entities: number;
  num_links: number;
  entity_types: Record<string, number>;
  relationship_types: Record<string, number>;
}

export interface EntityInfo {
  id: string;
  type: string;
  name: string;
  sector: string | null;
  connections: number;
}

export interface EntityConnection {
  target?: string;
  source?: string;
  relationship: string;
  strength: number;
  delay_days: number;
  confidence: number;
}

export interface EffectResponse {
  entity: string;
  magnitude_percent: number;
  magnitude_range: [number, number];
  day: number;
  confidence: number;
  order: number;
  relationship_type: string;
  explanation: string;
  cause_path: string[];  // Entity IDs in causal chain from trigger to this effect
}

export interface CascadeResponse {
  trigger: {
    entity: string;
    magnitude_percent: number;
    event_type: string;
    description: string;
  };
  horizon_days: number;
  total_effects: number;
  effects_by_order: Record<string, number>;
  timeline: Record<string, EffectResponse[]>;
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  sector: string;
}

export interface EarningsEventRequest {
  entity_id?: string;        // Preferred: supports any entity type
  ticker?: string;           // Legacy: backward compatibility
  surprise_percent: number;
  description?: string;
  horizon_days?: number;
}

export interface CausalStep {
  from: string;
  to: string;
  relationship: string;
  strength: number;
  delay_days: number;
  confidence: number;
  evidence: string[];
  explanation: string;
}

export interface ExplainedEffect {
  effect: EffectResponse;
  trigger: {
    entity: string;
    magnitude_percent: number;
    event_type: string;
    description: string;
  };
  steps: CausalStep[];
  narrative: string;
  confidence_factors: {
    base_confidence: number;
    chain_length_penalty: number;
    relationship_confidence: number;
    final_confidence: number;
  };
}

export interface ExplainCascadeResponse {
  trigger: {
    entity: string;
    magnitude_percent: number;
    event_type: string;
    description: string;
  };
  summary: {
    total_effects: number;
    first_order: number;
    second_order: number;
    third_order: number;
  };
  top_effects: ExplainedEffect[];
}

// Portfolio types
export interface PortfolioHolding {
  entity_id: string;
  shares: number;
  cost_basis?: number;
}

export interface HoldingExposure {
  entity_id: string;
  name: string;
  entity_type: string;
  sector: string | null;
  current_price: number | null;
  market_value: number | null;
  portfolio_weight: number;
  incoming_cascade_count: number;
  outgoing_cascade_count: number;
  cascade_exposure_score: number;
}

export interface MacroRiskFactor {
  indicator_id: string;
  indicator_name: string;
  affected_holdings: string[];
  avg_sensitivity: number;
  direction: string;
}

export interface PortfolioAnalysis {
  total_value: number | null;
  total_holdings: number;
  holdings: HoldingExposure[];
  concentration_risk: {
    sector_breakdown: Record<string, number>;
    top_holding_weight: number;
    interconnection_score: number;
    herfindahl_index: number;
  };
  top_macro_risks: MacroRiskFactor[];
  cascade_exposure_score: number;
}

export interface PortfolioCascadeResult {
  trigger: {
    entity: string;
    magnitude_percent: number;
    event_type: string;
    description: string;
  };
  portfolio_impact: {
    total_impact_percent: number;
    total_impact_dollars: number | null;
    affected_holdings: number;
    unaffected_holdings: number;
  };
  holding_effects: Array<{
    entity_id: string;
    name: string;
    portfolio_weight: number;
    magnitude_percent: number;
    magnitude_range: [number, number];
    day: number;
    confidence: number;
    order: number;
    relationship_type: string;
    cause_path: string[];
    dollar_impact: number | null;
  }>;
  unaffected_holdings: string[];
}

export interface MacroSensitivity {
  indicator_id: string;
  indicator_name: string;
  shock_magnitude: number;
  effects_on_holdings: Record<string, number>;
  avg_impact: number;
}

export interface PortfolioSubgraph {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    sector: string | null;
    is_holding: boolean;
  }>;
  links: Array<{
    source: string;
    target: string;
    relationship: string;
    strength: number;
    delay_days: number;
    confidence: number;
  }>;
}

// Trade Signal types
export interface TradeSignal {
  id: number;
  ticker: string;
  name: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  target_price: number;
  stop_price: number;
  conviction: number; // 1-5
  confidence: number;
  cascade_order: number;
  magnitude_percent: number;
  day: number;
  horizon_days: number;
  relationship_type: string;
  cause_chain: string[];
  trigger_event: string;
  reward_risk_ratio: number;
  max_loss_dollars: number | null;
  max_gain_dollars: number | null;
  position_size_pct: number;
  created_at: string;
  status: "active" | "target_hit" | "stopped" | "expired";
  exit_price?: number;
  exit_date?: string;
  pnl_percent?: number;
  pnl_dollars?: number;
}

export interface SignalPerformance {
  total_pnl_pct: number;
  total_pnl_dollars: number;
  win_rate: number;
  avg_return_pct: number;
  total_signals: number;
  active_signals: number;
  closed_signals: number;
  wins: number;
  losses: number;
  pnl_history: Array<{
    date: string;
    cumulative_pnl_pct: number;
    ticker: string;
    pnl_percent: number;
  }>;
}

export interface UpcomingEarning {
  ticker: string;
  company_name: string;
  earnings_date: string | null;
  eps_estimate: number | null;
}
