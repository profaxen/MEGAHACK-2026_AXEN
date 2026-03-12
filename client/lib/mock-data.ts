import type { WasteBurnEvent, Cluster, SystemStats, TrendPoint } from "./types";

const classifications = [
  "illegal_waste_burning",
  "agricultural_fire",
  "industrial_flare",
  "natural_fire",
] as const;

const landUses = [
  "landfill",
  "industrial",
  "agricultural",
  "urban",
  "forest",
  "unknown",
] as const;

const satelliteSources = [
  "Sentinel-2",
  "Landsat-8",
  "VIIRS/FIRMS",
  "MODIS",
  "Sentinel-1",
  "GOES-16",
];

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function createEvent(
  id: string,
  lat: number,
  lon: number,
  clusterId: string | null,
  rand: () => number
): WasteBurnEvent {
  const classification =
    classifications[Math.floor(rand() * classifications.length)];
  const status =
    rand() > 0.4 ? "pending" : rand() > 0.5 ? "verified" : "rejected";
  const confidence = 0.45 + rand() * 0.5;
  const smokeProb = 0.3 + rand() * 0.65;
  const thermalScore = 0.35 + rand() * 0.6;

  const classProbs = {
    illegal_waste_burning:
      classification === "illegal_waste_burning" ? 0.6 + rand() * 0.3 : rand() * 0.3,
    agricultural_fire:
      classification === "agricultural_fire" ? 0.6 + rand() * 0.3 : rand() * 0.3,
    industrial_flare:
      classification === "industrial_flare" ? 0.6 + rand() * 0.3 : rand() * 0.3,
    natural_fire:
      classification === "natural_fire" ? 0.6 + rand() * 0.3 : rand() * 0.3,
  };
  const sum = Object.values(classProbs).reduce((a, b) => a + b, 0);
  (Object.keys(classProbs) as (keyof typeof classProbs)[]).forEach(
    (k) => (classProbs[k] /= sum)
  );

  const daysAgo = Math.floor(rand() * 30);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + Math.floor(rand() * 12), Math.floor(rand() * 60));

  return {
    id,
    lat: lat + (rand() - 0.5) * 0.1,
    lon: lon + (rand() - 0.5) * 0.1,
    timestamp: date.toISOString(),
    confidence,
    classification,
    status,
    smoke_probability: smokeProb,
    smoke_detected: smokeProb > 0.5,
    thermal_score: thermalScore,
    brightness: 300 + rand() * 200,
    cluster_id: clusterId,
    land_use: landUses[Math.floor(rand() * landUses.length)],
    satellite_source: satelliteSources[Math.floor(rand() * satelliteSources.length)],
    spectral_indices: {
      ndvi: -0.2 + rand() * 0.8,
      nbr: -0.3 + rand() * 0.9,
      bai: rand() * 0.5,
      swir_ratio: 0.2 + rand() * 0.8,
    },
    class_probabilities: classProbs,
    notes: "",
    created_at: date.toISOString(),
    updated_at: status !== "pending" ? date.toISOString() : undefined,
  };
}

const indiaCoords: [number, number][] = [
  [28.6, 77.2],
  [28.65, 77.25],
  [28.55, 77.15],
  [19.0, 72.8],
  [19.05, 72.85],
  [18.95, 72.75],
  [26.4, 80.3],
  [26.45, 80.35],
  [26.35, 80.25],
  [25.6, 85.1],
  [25.65, 85.15],
  [25.55, 85.05],
  [22.5, 88.3],
  [22.55, 88.35],
  [22.45, 88.25],
  [30.9, 75.8],
  [30.85, 75.75],
  [30.95, 75.85],
  [13.0, 80.2],
  [13.05, 80.25],
  [12.95, 80.15],
  [17.3, 78.4],
  [17.35, 78.45],
  [17.25, 78.35],
];

const bangladeshCoords: [number, number][] = [
  [23.8, 90.4],
  [23.75, 90.45],
  [23.85, 90.35],
  [22.3, 91.8],
  [22.35, 91.85],
  [23.6, 90.5],
  [23.65, 90.55],
  [23.55, 90.45],
];

const pakistanCoords: [number, number][] = [
  [24.8, 67.0],
  [24.85, 67.05],
  [24.75, 66.95],
  [31.5, 74.3],
  [31.55, 74.35],
  [31.45, 74.25],
  [31.4, 73.0],
  [31.45, 73.05],
  [31.35, 72.95],
];

const myanmarCoords: [number, number][] = [
  [16.8, 96.1],
  [16.85, 96.15],
  [16.75, 96.05],
  [21.9, 96.0],
  [21.95, 96.05],
  [21.85, 95.95],
  [16.82, 96.12],
  [21.92, 96.02],
  [16.78, 96.08],
  [21.88, 95.98],
];

const clusterSizes = [8, 12, 6, 10, 5, 15, 7, 9, 4, 11, 7, 6];
const clusterAssignments: string[] = [];
let clusterIdx = 0;
for (const size of clusterSizes) {
  for (let j = 0; j < size; j++) {
    clusterAssignments.push(
      `cluster_${String(clusterIdx + 1).padStart(2, "0")}`
    );
  }
  clusterIdx++;
}

const allCoords: [number, number][] = [
  ...Array(60)
    .fill(null)
    .map((_, i) => indiaCoords[i % indiaCoords.length]),
  ...Array(15)
    .fill(null)
    .map((_, i) => bangladeshCoords[i % bangladeshCoords.length]),
  ...Array(15)
    .fill(null)
    .map((_, i) => pakistanCoords[i % pakistanCoords.length]),
  ...myanmarCoords.slice(0, 10),
];

export const MOCK_EVENTS: WasteBurnEvent[] = (() => {
  const events: WasteBurnEvent[] = [];
  for (let i = 0; i < 100; i++) {
    const idx = i % allCoords.length;
    const [lat, lon] = allCoords[idx];
    const seed = (i + 1) * 12345;
    const rand = seededRandom(seed);
    events.push(
      createEvent(
        `evt_${String(i + 1).padStart(3, "0")}`,
        lat,
        lon,
        clusterAssignments[i],
        rand
      )
    );
  }
  return events;
})();

export function getMockStats(): SystemStats {
  const highRisk = MOCK_EVENTS.filter((e) => e.confidence > 0.75).length;
  const verified = MOCK_EVENTS.filter((e) => e.status === "verified").length;
  const pending = MOCK_EVENTS.filter((e) => e.status === "pending").length;
  return {
    total: MOCK_EVENTS.length,
    high_risk: highRisk,
    verified,
    pending,
    coverage_km2: 125000,
  };
}

export function getMockTrends(days: number): TrendPoint[] {
  const result: TrendPoint[] = [];
  const illegalCount = MOCK_EVENTS.filter(
    (e) => e.classification === "illegal_waste_burning"
  ).length;
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    const baseCount = Math.floor(MOCK_EVENTS.length / days);
    const variance = Math.floor((Math.random() - 0.5) * 8);
    const count = Math.max(5, baseCount + variance);
    const illegal = Math.floor((illegalCount / MOCK_EVENTS.length) * count);
    result.push({ date: dateStr, count, illegal_count: illegal });
  }
  return result;
}

export function getMockClusters(): Cluster[] {
  const clusterMap = new Map<
    string,
    { lats: number[]; lons: number[]; events: WasteBurnEvent[] }
  >();
  for (const e of MOCK_EVENTS) {
    if (!e.cluster_id) continue;
    const c = clusterMap.get(e.cluster_id) || {
      lats: [],
      lons: [],
      events: [],
    };
    c.lats.push(e.lat);
    c.lons.push(e.lon);
    c.events.push(e);
    clusterMap.set(e.cluster_id, c);
  }

  return Array.from(clusterMap.entries()).map(([id, data]) => {
    const centroid_lat =
      data.lats.reduce((a, b) => a + b, 0) / data.lats.length;
    const centroid_lon =
      data.lons.reduce((a, b) => a + b, 0) / data.lons.length;
    const avgConf =
      data.events.reduce((a, e) => a + e.confidence, 0) / data.events.length;
    const riskScore = avgConf > 0.75 ? 85 : avgConf > 0.5 ? 55 : 25;
    const timestamps = data.events.map((e) => new Date(e.timestamp).getTime());
    return {
      id,
      centroid_lat,
      centroid_lon,
      event_count: data.events.length,
      avg_confidence: Math.round(avgConf * 100) / 100,
      risk_score: riskScore,
      first_seen: new Date(Math.min(...timestamps)).toISOString(),
      last_seen: new Date(Math.max(...timestamps)).toISOString(),
      is_active: true,
    };
  });
}
