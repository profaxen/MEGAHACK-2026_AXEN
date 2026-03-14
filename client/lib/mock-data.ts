import {
  WasteBurnEvent,
  Cluster,
  SystemStats,
  WasteClassification
} from "./types";

interface CitySpec {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
}

const indiaCities: CitySpec[] = [
  { name: "Delhi NCR", state: "Delhi", country: "India", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai Suburbs", state: "Maharashtra", country: "India", lat: 19.076, lon: 72.8777 },
  { name: "Kanpur", state: "Uttar Pradesh", country: "India", lat: 26.4499, lon: 80.3319 },
  { name: "Patna", state: "Bihar", country: "India", lat: 25.5941, lon: 85.1376 },
  { name: "Kolkata Outskirts", state: "West Bengal", country: "India", lat: 22.5726, lon: 88.3639 },
  { name: "Ludhiana Industrial", state: "Punjab", country: "India", lat: 30.901, lon: 75.8573 },
  { name: "Chennai Peri-urban", state: "Tamil Nadu", country: "India", lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad Landfills", state: "Telangana", country: "India", lat: 17.385, lon: 78.4867 }
];

const bangladeshCities: CitySpec[] = [
  { name: "Dhaka Outskirts", state: "Dhaka", country: "Bangladesh", lat: 23.8103, lon: 90.4125 },
  { name: "Chittagong Industrial", state: "Chattogram", country: "Bangladesh", lat: 22.3569, lon: 91.7832 },
  { name: "Narayanganj", state: "Dhaka", country: "Bangladesh", lat: 23.6238, lon: 90.5003 }
];

const pakistanCities: CitySpec[] = [
  { name: "Karachi", state: "Sindh", country: "Pakistan", lat: 24.8607, lon: 67.0011 },
  { name: "Lahore", state: "Punjab", country: "Pakistan", lat: 31.5204, lon: 74.3587 },
  { name: "Faisalabad Industrial", state: "Punjab", country: "Pakistan", lat: 31.418, lon: 73.079 }
];

const myanmarCities: CitySpec[] = [
  { name: "Yangon Peri-urban", state: "Yangon", country: "Myanmar", lat: 16.8409, lon: 96.1735 },
  { name: "Mandalay", state: "Mandalay", country: "Myanmar", lat: 21.9588, lon: 96.0891 }
];

const allCities: CitySpec[] = [
  ...indiaCities,
  ...bangladeshCities,
  ...pakistanCities,
  ...myanmarCities
];

const classificationPool: WasteClassification[] = [
  "illegal_waste_burning",
  "agricultural_fire",
  "industrial_flare",
  "natural_fire"
];

const landUsePool = [
  "landfill",
  "industrial",
  "agricultural",
  "urban",
  "forest",
  "unknown"
] as const;

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function pickRandom<T>(rand: () => number, arr: readonly T[]): T {
  const idx = Math.floor(rand() * arr.length);
  return arr[idx];
}

function jitter(rand: () => number, base: number, delta: number): number {
  return base + (rand() * 2 - 1) * delta;
}

const baseTimestamp = Date.now();

function createEvent(
  index: number,
  city: CitySpec,
  clusterId: string
): WasteBurnEvent {
  const rand = seededRandom(1000 + index);
  // Weighted distribution: ~42% illegal, ~24% agriculture, ~19% industrial, ~15% natural
  const classWeights = [0.42, 0.66, 0.85, 1.0];
  const classRoll = ((index * 7 + 3) % 100) / 100;
  const classIdx = classWeights.findIndex((w) => classRoll < w);
  const classification = classificationPool[classIdx >= 0 ? classIdx : 0];
  const landUse = pickRandom(rand, landUsePool);
  const confidence = 0.5 + rand() * 0.5;
  const smokeProb = 0.4 + rand() * 0.6;
  const thermalScore = 0.3 + rand() * 0.7;
  const brightness = 280 + rand() * 80;
  const ndvi = 0.05 + rand() * 0.6;
  const nbr = -0.2 + rand() * 0.6;
  const bai = 300 + rand() * 900;
  const swirRatio = 0.7 + rand() * 0.8;
  const nowOffsetHours = rand() * 24 * 120; // Spread over ~120 days
  const createdAt = new Date(
    baseTimestamp - nowOffsetHours * 3600 * 1000
  ).toISOString();
  const updatedAt =
    rand() > 0.7
      ? new Date(
          baseTimestamp - (nowOffsetHours - 1) * 3600 * 1000
        ).toISOString()
      : undefined;

  const statusRoll = rand();
  let status: "pending" | "verified" | "rejected" = "pending";
  if (statusRoll > 0.75) status = "verified";
  else if (statusRoll < 0.1) status = "rejected";

  const probs: Record<WasteClassification, number> = {
    illegal_waste_burning: 0.1 + rand() * 0.9,
    agricultural_fire: 0.1 + rand() * 0.9,
    industrial_flare: 0.1 + rand() * 0.9,
    natural_fire: 0.1 + rand() * 0.9
  };
  const totalProb =
    probs.illegal_waste_burning +
    probs.agricultural_fire +
    probs.industrial_flare +
    probs.natural_fire;

  const normalizedProbs: Record<WasteClassification, number> = {
    illegal_waste_burning: probs.illegal_waste_burning / totalProb,
    agricultural_fire: probs.agricultural_fire / totalProb,
    industrial_flare: probs.industrial_flare / totalProb,
    natural_fire: probs.natural_fire / totalProb
  };

  const id = `evt_${`${index + 1}`.padStart(3, "0")}`;

  return {
    id,
    lat: jitter(rand, city.lat, 0.08),
    lon: jitter(rand, city.lon, 0.08),
    timestamp: createdAt,
    confidence,
    classification,
    status,
    smoke_probability: smokeProb,
    smoke_detected: smokeProb > 0.55,
    thermal_score: thermalScore,
    brightness,
    cluster_id: clusterId,
    land_use: landUse,
    satellite_source: pickRandom(rand, [
      "Sentinel-2",
      "Landsat 8",
      "Landsat 9",
      "VIIRS",
      "MODIS",
      "GOES-16"
    ]),
    spectral_indices: {
      ndvi,
      nbr,
      bai,
      swir_ratio: swirRatio
    },
    class_probabilities: normalizedProbs,
    notes: "",
    created_at: createdAt,
    updated_at: updatedAt,
    location_name: `${city.name}, ${city.state}, ${city.country}`,
    city: city.name,
    state: city.state,
    country: city.country
  };
}

const events: WasteBurnEvent[] = [];

const clusterIds = Array.from({ length: 12 }, (_, i) => `cluster_${`${i + 1}`.padStart(2, "0")}`);

function distributeEvents(): void {
  // India: 78 events
  let idx = 0;
  for (let i = 0; i < 78; i += 1) {
    const city = indiaCities[i % indiaCities.length];
    const clusterId = clusterIds[idx % clusterIds.length];
    events.push(createEvent(idx, city, clusterId));
    idx += 1;
  }

  // Bangladesh: 27
  for (let i = 0; i < 27; i += 1) {
    const city = bangladeshCities[i % bangladeshCities.length];
    const clusterId = clusterIds[idx % clusterIds.length];
    events.push(createEvent(idx, city, clusterId));
    idx += 1;
  }

  // Pakistan: 24
  for (let i = 0; i < 24; i += 1) {
    const city = pakistanCities[i % pakistanCities.length];
    const clusterId = clusterIds[idx % clusterIds.length];
    events.push(createEvent(idx, city, clusterId));
    idx += 1;
  }

  // Myanmar: 18
  for (let i = 0; i < 18; i += 1) {
    const city = myanmarCities[i % myanmarCities.length];
    const clusterId = clusterIds[idx % clusterIds.length];
    events.push(createEvent(idx, city, clusterId));
    idx += 1;
  }
}

distributeEvents();

export const MOCK_EVENTS: WasteBurnEvent[] = events;

export function getMockStats(): SystemStats {
  const total = events.length;
  const highRisk = events.filter((e) => e.confidence > 0.75).length;
  const verified = events.filter((e) => e.status === "verified").length;
  const pending = events.filter((e) => e.status === "pending").length;

  // Approximate coverage across South Asia region in km^2
  const coverageKm2 = 3_500_000;

  return {
    total,
    high_risk: highRisk,
    verified,
    pending,
    coverage_km2: coverageKm2
  };
}

export function getMockTrends(
  days: number
): { date: string; count: number; illegal_count: number }[] {
  const result: { date: string; count: number; illegal_count: number }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const targetDate = new Date(baseTimestamp - offset * 24 * 3600 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const eventsForDay = events.filter(
      (e) => e.timestamp.slice(0, 10) === dateStr
    );
    const illegalCount = eventsForDay.filter(
      (e) => e.classification === "illegal_waste_burning"
    ).length;

    result.push({
      date: dateStr,
      count: eventsForDay.length,
      illegal_count: illegalCount
    });
  }

  return result;
}

export function getMockClusters(): Cluster[] {
  const clusters: Cluster[] = clusterIds.map((id) => {
    const clusterEvents = events.filter((e) => e.cluster_id === id);
    if (clusterEvents.length === 0) {
      const fallbackCity =
        allCities[Math.floor(Math.random() * allCities.length)];
      return {
        id,
        centroid_lat: fallbackCity.lat,
        centroid_lon: fallbackCity.lon,
        event_count: 0,
        avg_confidence: 0,
        risk_score: 0,
        first_seen: new Date(baseTimestamp).toISOString(),
        last_seen: new Date(baseTimestamp).toISOString(),
        is_active: false
      };
    }

    const sumLat = clusterEvents.reduce((sum, e) => sum + e.lat, 0);
    const sumLon = clusterEvents.reduce((sum, e) => sum + e.lon, 0);
    const avgConfidence =
      clusterEvents.reduce((sum, e) => sum + e.confidence, 0) /
      clusterEvents.length;

    const sortedByTime = [...clusterEvents].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    const riskScore = Math.min(
      100,
      Math.round(avgConfidence * 80 + clusterEvents.length * 1.2)
    );

    return {
      id,
      centroid_lat: sumLat / clusterEvents.length,
      centroid_lon: sumLon / clusterEvents.length,
      event_count: clusterEvents.length,
      avg_confidence: avgConfidence,
      risk_score: riskScore,
      first_seen: sortedByTime[0].timestamp,
      last_seen: sortedByTime[sortedByTime.length - 1].timestamp,
      is_active: sortedByTime[sortedByTime.length - 1].status === "pending"
    };
  });

  return clusters;
}

