import { Router } from "express";
import { z } from "zod";
import type { WasteBurnEvent } from "../../client/lib/types";

const router = Router();

function safeJsonError(res: any, status: number, message: string): void {
  res.status(status).json({ error: true, message });
}

async function getAdminFirestore(): Promise<any | null> {
  try {
    const admin = await import("firebase-admin");
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
    return admin.firestore();
  } catch {
    return null;
  }
}

async function loadMockEvents(): Promise<WasteBurnEvent[]> {
  const mod = await import("../../client/lib/mock-data");
  return mod.MOCK_EVENTS as WasteBurnEvent[];
}

const QuerySchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  confidence_min: z.coerce.number().optional()
});

function inRange(e: WasteBurnEvent, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const t = new Date(e.timestamp).getTime();
  const f = from ? new Date(`${from}T00:00:00.000Z`).getTime() : -Infinity;
  const tt = to ? new Date(`${to}T23:59:59.999Z`).getTime() : Infinity;
  return t >= f && t <= tt;
}

router.get("/reports/csv", async (req, res) => {
  try {
    const q = QuerySchema.parse(req.query);
    const db = await getAdminFirestore();
    const events: WasteBurnEvent[] = db
      ? (await db.collection("events").get()).docs.map((d: any) => d.data())
      : await loadMockEvents();

    const filtered = events
      .filter((e) => inRange(e, q.date_from, q.date_to))
      .filter((e) =>
        typeof q.confidence_min === "number"
          ? e.confidence >= q.confidence_min / 100
          : true
      );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=watchburn-report.csv");

    res.write(
      "id,lat,lon,classification,confidence,status,timestamp,location_name,city,state,country,satellite_source\n"
    );
    filtered.forEach((e) => {
      const row = [
        e.id,
        e.lat,
        e.lon,
        e.classification,
        e.confidence.toFixed(4),
        e.status,
        e.timestamp,
        JSON.stringify(e.location_name ?? ""),
        JSON.stringify(e.city ?? ""),
        JSON.stringify(e.state ?? ""),
        JSON.stringify(e.country ?? ""),
        JSON.stringify(e.satellite_source ?? "")
      ].join(",");
      res.write(`${row}\n`);
    });
    res.end();
  } catch {
    safeJsonError(res, 400, "Failed to export CSV");
  }
});

router.get("/reports/geojson", async (req, res) => {
  try {
    const q = QuerySchema.parse(req.query);
    const db = await getAdminFirestore();
    const events: WasteBurnEvent[] = db
      ? (await db.collection("events").get()).docs.map((d: any) => d.data())
      : await loadMockEvents();

    const filtered = events
      .filter((e) => inRange(e, q.date_from, q.date_to))
      .filter((e) =>
        typeof q.confidence_min === "number"
          ? e.confidence >= q.confidence_min / 100
          : true
      );

    const geojson = {
      type: "FeatureCollection",
      features: filtered.map((e) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [e.lon, e.lat] },
        properties: {
          id: e.id,
          classification: e.classification,
          confidence: e.confidence,
          status: e.status,
          timestamp: e.timestamp,
          location_name: e.location_name,
          city: e.city,
          state: e.state,
          country: e.country,
          satellite_source: e.satellite_source
        }
      }))
    };

    res.setHeader("Content-Type", "application/geo+json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=watchburn-report.geojson"
    );
    res.end(JSON.stringify(geojson, null, 2));
  } catch {
    safeJsonError(res, 400, "Failed to export GeoJSON");
  }
});

export default router;

