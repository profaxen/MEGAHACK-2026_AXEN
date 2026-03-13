import axios from "axios";
import type {
  WasteBurnEvent,
  SystemStats,
  Cluster,
  ReportConfig
} from "./types";
import { MOCK_EVENTS, getMockClusters, getMockStats } from "./mock-data";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000
});

export interface TrendsPoint {
  date: string;
  count: number;
  illegal_count: number;
}

export interface InferenceResult {
  classification: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  smoke_probability: number;
  thermal_probability: number;
  ndvi: number;
  nbr: number;
  bai: number;
}

export async function fetchEventsViaApi(): Promise<WasteBurnEvent[]> {
  try {
    const res = await api.get<WasteBurnEvent[]>("/events");
    return res.data;
  } catch {
    return MOCK_EVENTS;
  }
}

export async function fetchStatsViaApi(): Promise<SystemStats> {
  try {
    const res = await api.get<SystemStats>("/events/stats");
    return res.data;
  } catch {
    return getMockStats();
  }
}

export async function fetchTrendsViaApi(): Promise<TrendsPoint[]> {
  try {
    const res = await api.get<TrendsPoint[]>("/events/trends");
    return res.data;
  } catch {
    return [];
  }
}

export async function fetchClustersViaApi(): Promise<Cluster[]> {
  try {
    const res = await api.get<Cluster[]>("/events/clusters");
    return res.data;
  } catch {
    return getMockClusters();
  }
}

export async function runFullPipeline(
  payload: Record<string, unknown>
): Promise<InferenceResult> {
  try {
    const res = await api.post<InferenceResult>(
      "/inference/full-pipeline",
      payload
    );
    return res.data;
  } catch {
    return {
      classification: "illegal_waste_burning",
      confidence: 0.82,
      class_probabilities: {
        illegal_waste_burning: 0.82,
        agricultural_fire: 0.06,
        industrial_flare: 0.07,
        natural_fire: 0.05
      },
      smoke_probability: 0.87,
      thermal_probability: 0.79,
      ndvi: 0.21,
      nbr: 0.12,
      bai: 430
    };
  }
}

export async function downloadCsv(
  config: ReportConfig
): Promise<Blob> {
  try {
    const res = await api.get("/reports/csv", {
      params: config,
      responseType: "blob"
    });
    return res.data;
  } catch {
    const header =
      "id,lat,lon,classification,confidence,status,timestamp,location_name\n";
    const rows = MOCK_EVENTS.map(
      (e) =>
        `${e.id},${e.lat},${e.lon},${e.classification},${e.confidence.toFixed(
          2
        )},${e.status},${e.timestamp},${JSON.stringify(e.location_name)}`
    );
    const csv = header + rows.join("\n");
    return new Blob([csv], { type: "text/csv" });
  }
}

export async function downloadGeoJson(
  config: ReportConfig
): Promise<Blob> {
  try {
    const res = await api.get("/reports/geojson", {
      params: config,
      responseType: "blob"
    });
    return res.data;
  } catch {
    const features = MOCK_EVENTS.map((e) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [e.lon, e.lat]
      },
      properties: {
        id: e.id,
        classification: e.classification,
        confidence: e.confidence,
        status: e.status,
        timestamp: e.timestamp,
        location_name: e.location_name
      }
    }));
    const geojson = {
      type: "FeatureCollection",
      features
    };
    return new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json"
    });
  }
}

