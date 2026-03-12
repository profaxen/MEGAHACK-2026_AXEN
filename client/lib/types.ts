export type Classification =
  | "illegal_waste_burning"
  | "agricultural_fire"
  | "industrial_flare"
  | "natural_fire";

export type EventStatus = "pending" | "verified" | "rejected";

export type LandUse =
  | "landfill"
  | "industrial"
  | "agricultural"
  | "urban"
  | "forest"
  | "unknown";

export interface WasteBurnEvent {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
  classification: Classification;
  status: EventStatus;
  smoke_probability: number;
  smoke_detected: boolean;
  thermal_score: number;
  brightness: number;
  cluster_id: string | null;
  land_use: LandUse;
  satellite_source: string;
  spectral_indices: {
    ndvi: number;
    nbr: number;
    bai: number;
    swir_ratio: number;
  };
  class_probabilities: {
    illegal_waste_burning: number;
    agricultural_fire: number;
    industrial_flare: number;
    natural_fire: number;
  };
  notes: string;
  created_at: string;
  updated_at?: string;
}

export interface Cluster {
  id: string;
  centroid_lat: number;
  centroid_lon: number;
  event_count: number;
  avg_confidence: number;
  risk_score: number;
  first_seen: string;
  last_seen: string;
  is_active: boolean;
}

export interface SystemStats {
  total: number;
  high_risk: number;
  verified: number;
  pending: number;
  coverage_km2: number;
}

export interface FilterState {
  classification: string;
  status: string;
  confidence_min: number;
}

export interface ReportConfig {
  type: "summary" | "detailed" | "cluster" | "regional";
  date_from: string;
  date_to: string;
  region: string;
  classifications: string[];
  confidence_min: number;
  sections: string[];
}

export interface TrendPoint {
  date: string;
  count: number;
  illegal_count: number;
}
