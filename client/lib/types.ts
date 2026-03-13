export type WasteClassification =
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

export interface SpectralIndices {
  ndvi: number;
  nbr: number;
  bai: number;
  swir_ratio: number;
}

export interface ClassProbabilities {
  illegal_waste_burning: number;
  agricultural_fire: number;
  industrial_flare: number;
  natural_fire: number;
}

export interface WasteBurnEvent {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
  classification: WasteClassification;
  status: EventStatus;
  smoke_probability: number;
  smoke_detected: boolean;
  thermal_score: number;
  brightness: number;
  cluster_id: string | null;
  land_use: LandUse;
  satellite_source: string;
  spectral_indices: SpectralIndices;
  class_probabilities: ClassProbabilities;
  notes: string;
  created_at: string;
  updated_at?: string;
  location_name: string;
  city: string;
  state: string;
  country: string;
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

export type ReportType = "summary" | "detailed" | "cluster" | "regional";

export interface ReportConfig {
  type: ReportType;
  date_from: string;
  date_to: string;
  region: string;
  classifications: WasteClassification[];
  confidence_min: number;
  sections: string[];
}

