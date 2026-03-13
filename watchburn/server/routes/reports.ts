import { Router } from "express";
import { getEventsFromFirestore } from "../firebase-admin";
import { MOCK_EVENTS } from "../../client/lib/mock-data";
import type { WasteBurnEvent } from "../../client/lib/types";

export const reportsRouter = Router();

reportsRouter.get("/reports/csv", async (req, res) => {
  try {
    const events = await getEventsFromFirestore({
      classification: req.query.classification as string | undefined,
      status: req.query.status as string | undefined,
      confidence_min: req.query.confidence_min ? Number(req.query.confidence_min) : undefined,
    });
    const data = events.length > 0 ? events : (MOCK_EVENTS as WasteBurnEvent[]);
    const headers = ["id", "lat", "lon", "timestamp", "confidence", "classification", "status", "land_use", "satellite_source"];
    const rows = data.map((e) =>
      headers.map((h) => String((e as Record<string, unknown>)[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=watchburn-events.csv");
    res.send(csv);
  } catch {
    const data = MOCK_EVENTS as WasteBurnEvent[];
    const headers = ["id", "lat", "lon", "timestamp", "confidence", "classification", "status", "land_use", "satellite_source"];
    const rows = data.map((e) =>
      headers.map((h) => String((e as Record<string, unknown>)[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=watchburn-events.csv");
    res.send(csv);
  }
});

reportsRouter.get("/reports/geojson", async (req, res) => {
  try {
    const events = await getEventsFromFirestore({
      classification: req.query.classification as string | undefined,
      status: req.query.status as string | undefined,
      confidence_min: req.query.confidence_min ? Number(req.query.confidence_min) : undefined,
    });
    const data = events.length > 0 ? events : (MOCK_EVENTS as WasteBurnEvent[]);
    const fc = {
      type: "FeatureCollection",
      features: data.map((e) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [e.lon, e.lat] },
        properties: {
          id: e.id,
          confidence: e.confidence,
          classification: e.classification,
          timestamp: e.timestamp,
        },
      })),
    };
    res.setHeader("Content-Type", "application/geo+json");
    res.setHeader("Content-Disposition", "attachment; filename=watchburn-events.geojson");
    res.json(fc);
  } catch {
    const data = MOCK_EVENTS as WasteBurnEvent[];
    const fc = {
      type: "FeatureCollection",
      features: data.map((e) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [e.lon, e.lat] },
        properties: {
          id: e.id,
          confidence: e.confidence,
          classification: e.classification,
          timestamp: e.timestamp,
        },
      })),
    };
    res.setHeader("Content-Type", "application/geo+json");
    res.setHeader("Content-Disposition", "attachment; filename=watchburn-events.geojson");
    res.json(fc);
  }
});
