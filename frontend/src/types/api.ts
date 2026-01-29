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
