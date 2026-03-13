import { Router } from "express";
import { z } from "zod";
import type { WasteBurnEvent } from "../../client/lib/types";

const router = Router();

const FiltersSchema = z.object({
  classification: z.string().optional(),
  status: z.string().optional(),
  confidence_min: z.coerce.number().optional()
});

const VerifySchema = z.object({
  status: z.enum(["pending", "verified", "rejected"]),
  notes: z.string().optional()
});

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

router.get("/events", async (req, res) => {
  try {
    const filters = FiltersSchema.parse(req.query);
    const db = await getAdminFirestore();

    if (!db) {
      const events = await loadMockEvents();
      res.json(
        events.filter((e) => {
          const cls = filters.classification;
          const st = filters.status;
          const confMin =
            typeof filters.confidence_min === "number"
              ? filters.confidence_min / 100
              : 0;
          const matchesClass =
            !cls || cls === "all" || e.classification === cls;
          const matchesStatus = !st || st === "all" || e.status === st;
          return matchesClass && matchesStatus && e.confidence >= confMin;
        })
      );
      return;
    }

    let query: any = db.collection("events");
    if (filters.classification && filters.classification !== "all") {
      query = query.where("classification", "==", filters.classification);
    }
    if (filters.status && filters.status !== "all") {
      query = query.where("status", "==", filters.status);
    }
    if (typeof filters.confidence_min === "number" && filters.confidence_min > 0) {
      query = query.where("confidence", ">=", filters.confidence_min / 100);
    }

    const snap = await query.get();
    const events: WasteBurnEvent[] = snap.docs.map((d: any) => d.data());
    res.json(events);
  } catch (err) {
    safeJsonError(res, 400, "Failed to fetch events");
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const db = await getAdminFirestore();
    if (!db) {
      const events = await loadMockEvents();
      const e = events.find((x) => x.id === id);
      if (!e) {
        safeJsonError(res, 404, "Not found");
        return;
      }
      res.json(e);
      return;
    }
    const docRef = db.collection("events").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      safeJsonError(res, 404, "Not found");
      return;
    }
    res.json(snap.data());
  } catch {
    safeJsonError(res, 400, "Failed to fetch event");
  }
});

router.get("/events/stats", async (_req, res) => {
  try {
    const db = await getAdminFirestore();
    if (!db) {
      const mod = await import("../../client/lib/mock-data");
      res.json(mod.getMockStats());
      return;
    }

    const snap = await db.collection("events").get();
    let total = 0;
    let high_risk = 0;
    let verified = 0;
    let pending = 0;
    snap.forEach((d: any) => {
      const e = d.data() as WasteBurnEvent;
      total += 1;
      if (e.confidence > 0.75) high_risk += 1;
      if (e.status === "verified") verified += 1;
      if (e.status === "pending") pending += 1;
    });
    res.json({
      total,
      high_risk,
      verified,
      pending,
      coverage_km2: 3_500_000
    });
  } catch {
    safeJsonError(res, 500, "Failed to compute stats");
  }
});

router.get("/events/trends", async (_req, res) => {
  try {
    const db = await getAdminFirestore();
    if (!db) {
      const mod = await import("../../client/lib/mock-data");
      res.json(mod.getMockTrends(30));
      return;
    }

    const snap = await db.collection("events").get();
    const map = new Map<string, { date: string; count: number; illegal_count: number }>();
    snap.forEach((d: any) => {
      const e = d.data() as WasteBurnEvent;
      const date = (e.timestamp ?? "").slice(0, 10);
      if (!date) return;
      const cur = map.get(date) ?? { date, count: 0, illegal_count: 0 };
      cur.count += 1;
      if (e.classification === "illegal_waste_burning") cur.illegal_count += 1;
      map.set(date, cur);
    });
    const trends = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    res.json(trends);
  } catch {
    safeJsonError(res, 500, "Failed to fetch trends");
  }
});

router.post("/events/:id/verify", async (req, res) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = VerifySchema.parse(req.body);
    const db = await getAdminFirestore();

    if (!db) {
      res.json({ ok: true, demo_mode: true });
      return;
    }

    await db.collection("events").doc(id).set(
      {
        status: body.status,
        notes: body.notes ?? "",
        updated_at: new Date().toISOString()
      },
      { merge: true }
    );
    res.json({ ok: true });
  } catch {
    safeJsonError(res, 400, "Failed to update status");
  }
});

router.get("/events/clusters", async (_req, res) => {
  try {
    const db = await getAdminFirestore();
    if (!db) {
      const mod = await import("../../client/lib/mock-data");
      res.json(mod.getMockClusters());
      return;
    }
    const snap = await db.collection("clusters").get();
    if (snap.empty) {
      const mod = await import("../../client/lib/mock-data");
      res.json(mod.getMockClusters());
      return;
    }
    const clusters = snap.docs.map((d: any) => d.data());
    res.json(clusters);
  } catch {
    safeJsonError(res, 500, "Failed to fetch clusters");
  }
});

export default router;

