import axios from "axios";
import type {
  WasteBurnEvent,
  SystemStats,
  FilterState,
  TrendPoint,
  ReportConfig,
} from "./types";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export async function getEvents(
  filters: FilterState
): Promise<WasteBurnEvent[]> {
  const params = new URLSearchParams();
  if (filters.classification && filters.classification !== "all") {
    params.set("classification", filters.classification);
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.confidence_min > 0) {
    params.set("confidence_min", String(filters.confidence_min));
  }
  const { data } = await api.get<WasteBurnEvent[]>(`/events?${params}`);
  return data;
}

export async function getEventById(id: string): Promise<WasteBurnEvent | null> {
  try {
    const { data } = await api.get<WasteBurnEvent>(`/events/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function getStats(): Promise<SystemStats> {
  const { data } = await api.get<SystemStats>("/events/stats");
  return data;
}

export async function getTrends(days: number): Promise<TrendPoint[]> {
  const { data } = await api.get<TrendPoint[]>(`/events/trends?days=${days}`);
  return data;
}

export async function verifyEvent(
  id: string,
  status: "pending" | "verified" | "rejected",
  notes: string
): Promise<void> {
  await api.post(`/events/${id}/verify`, { status, notes });
}

export async function runPipeline(): Promise<unknown> {
  const { data } = await api.post("/inference/full-pipeline");
  return data;
}

export async function getReportCSV(config: ReportConfig): Promise<Blob> {
  const { data } = await api.get("/reports/csv", {
    params: config,
    responseType: "blob",
  });
  return data;
}

export async function getReportGeoJSON(config: ReportConfig): Promise<Blob> {
  const { data } = await api.get("/reports/geojson", {
    params: config,
    responseType: "blob",
  });
  return data;
}
