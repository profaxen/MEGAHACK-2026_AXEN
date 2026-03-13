import admin from "firebase-admin";
import type { WasteBurnEvent, SystemStats } from "../client/lib/types";
import { MOCK_EVENTS, getMockStats } from "../client/lib/mock-data";

let db: admin.firestore.Firestore | null = null;

function getDb(): admin.firestore.Firestore | null {
  if (db) return db;
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: "new-proj-for-ai",
      });
    }
    db = admin.firestore();
    return db;
  } catch {
    return null;
  }
}

export async function getEventsFromFirestore(filters: {
  classification?: string;
  status?: string;
  confidence_min?: number;
}): Promise<WasteBurnEvent[]> {
  const firestore = getDb();
  if (!firestore) return MOCK_EVENTS as WasteBurnEvent[];

  let q = firestore.collection("events") as admin.firestore.Query;
  if (filters.classification && filters.classification !== "all") {
    q = q.where("classification", "==", filters.classification);
  }
  if (filters.status && filters.status !== "all") {
    q = q.where("status", "==", filters.status);
  }
  if (filters.confidence_min && filters.confidence_min > 0) {
    q = q.where("confidence", ">=", filters.confidence_min / 100);
  }

  const snapshot = await q.get();
  return snapshot.docs.map((d) => d.data() as WasteBurnEvent);
}

export async function getEventByIdFromFirestore(id: string): Promise<WasteBurnEvent | null> {
  const firestore = getDb();
  if (!firestore) return null;

  const doc = await firestore.collection("events").doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as WasteBurnEvent;
}

export async function getStatsFromFirestore(): Promise<SystemStats> {
  const firestore = getDb();
  if (!firestore) return getMockStats();

  const snapshot = await firestore.collection("events").get();
  const events = snapshot.docs.map((d) => d.data() as WasteBurnEvent);
  return {
    total: events.length,
    high_risk: events.filter((e) => e.confidence > 0.75).length,
    verified: events.filter((e) => e.status === "verified").length,
    pending: events.filter((e) => e.status === "pending").length,
    coverage_km2: 125000,
  };
}

export async function verifyEventInFirestore(
  id: string,
  status: "pending" | "verified" | "rejected",
  notes: string
): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;

  await firestore.collection("events").doc(id).update({
    status,
    notes,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
