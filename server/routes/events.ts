import { Router } from "express";
import { z } from "zod";
import {
  getEventsFromFirestore,
  getEventByIdFromFirestore,
  getStatsFromFirestore,
  verifyEventInFirestore,
} from "../firebase-admin";
import { MOCK_EVENTS, getMockStats, getMockTrends } from "../../client/lib/mock-data";
import type { WasteBurnEvent, SystemStats, TrendPoint } from "../../client/lib/types";

export const eventsRouter = Router();

const querySchema = z.object({
  classification: z.string().optional(),
  status: z.string().optional(),
  confidence_min: z.coerce.number().optional(),
});

eventsRouter.get("/events", async (req, res) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};
    const events = await getEventsFromFirestore(filters);
    res.json(events);
  } catch {
    let events = MOCK_EVENTS as WasteBurnEvent[];
    const { classification, status, confidence_min } = req.query;
    if (classification && classification !== "all") {
      events = events.filter((e) => e.classification === classification);
    }
    if (status && status !== "all") {
      events = events.filter((e) => e.status === status);
    }
    if (confidence_min && Number(confidence_min) > 0) {
      events = events.filter((e) => e.confidence >= Number(confidence_min) / 100);
    }
    res.json(events);
  }
});

eventsRouter.get("/events/stats", async (req, res) => {
  try {
    const stats = await getStatsFromFirestore();
    res.json(stats);
  } catch {
    res.json(getMockStats());
  }
});

eventsRouter.get("/events/trends", async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const trends = getMockTrends(days) as TrendPoint[];
    res.json(trends);
  } catch {
    res.json(getMockTrends(30));
  }
});

eventsRouter.get("/events/:id", async (req, res) => {
  try {
    const event = await getEventByIdFromFirestore(req.params.id);
    if (!event) {
      const mock = MOCK_EVENTS.find((e) => e.id === req.params.id);
      if (mock) return res.json(mock);
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch {
    const mock = MOCK_EVENTS.find((e) => e.id === req.params.id);
    if (mock) return res.json(mock);
    res.status(404).json({ error: "Event not found" });
  }
});

eventsRouter.post("/events/:id/verify", async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    await verifyEventInFirestore(req.params.id, status, notes || "");
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});
