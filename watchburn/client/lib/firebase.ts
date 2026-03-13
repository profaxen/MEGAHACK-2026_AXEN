import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  updateDoc,
  Timestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import type { WasteBurnEvent, Cluster, SystemStats, FilterState, TrendPoint } from "./types";
import { MOCK_EVENTS, getMockStats, getMockTrends, getMockClusters } from "./mock-data";

const firebaseConfig = {
  apiKey: "AIzaSyACMezbzpQ3zVeGFothsvRKcDjrgN4YwpQ",
  authDomain: "new-proj-for-ai.firebaseapp.com",
  databaseURL: "https://new-proj-for-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "new-proj-for-ai",
  storageBucket: "new-proj-for-ai.firebasestorage.app",
  messagingSenderId: "411257714840",
  appId: "1:411257714840:web:78bbf51966819385abf8ed",
  measurementId: "G-X1EXMJJ878",
};

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let isDemoMode = false;

export { isDemoMode };

function initFirebase(): boolean {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      if (typeof window !== "undefined") {
        getAnalytics(app);
      }
    }
    return true;
  } catch {
    isDemoMode = true;
    return false;
  }
}

export async function initializeData(): Promise<void> {
  if (!initFirebase() || !db) return;

  try {
    const eventsRef = collection(db, "events");
    const snapshot = await getDocs(eventsRef);
    if (snapshot.empty) {
      const batch = writeBatch(db);
      for (const event of MOCK_EVENTS) {
        const docRef = doc(db, "events", event.id);
        batch.set(docRef, {
          ...event,
          created_at: Timestamp.fromDate(new Date(event.created_at)),
          updated_at: event.updated_at
            ? Timestamp.fromDate(new Date(event.updated_at))
            : null,
        });
      }
      await batch.commit();
    }
  } catch {
    isDemoMode = true;
  }
}

function docToEvent(d: DocumentSnapshot): WasteBurnEvent {
  const data = d.data() as Record<string, unknown>;
  if (!data) throw new Error("No data");
  const created_at = (data.created_at as { toDate?: () => Date })?.toDate?.();
  const updated_at = (data.updated_at as { toDate?: () => Date })?.toDate?.();
  return {
    ...data,
    created_at: created_at ? created_at.toISOString() : (data.created_at as string),
    updated_at: updated_at ? updated_at.toISOString() : (data.updated_at as string | undefined),
  } as WasteBurnEvent;
}

export function subscribeToEvents(
  filters: FilterState,
  callback: (events: WasteBurnEvent[]) => void
): () => void {
  if (isDemoMode || !db) {
    let filtered = [...MOCK_EVENTS];
    if (filters.classification && filters.classification !== "all") {
      filtered = filtered.filter((e) => e.classification === filters.classification);
    }
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((e) => e.status === filters.status);
    }
    if (filters.confidence_min > 0) {
      filtered = filtered.filter((e) => e.confidence >= filters.confidence_min / 100);
    }
    callback(filtered);
    return () => {};
  }

  try {
    const eventsRef = collection(db, "events");
    let q = query(eventsRef);

    if (filters.classification && filters.classification !== "all") {
      q = query(q, where("classification", "==", filters.classification));
    }
    if (filters.status && filters.status !== "all") {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters.confidence_min > 0) {
      q = query(
        q,
        where("confidence", ">=", filters.confidence_min / 100)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((d) => docToEvent(d));
        callback(events);
      },
      () => {
        isDemoMode = true;
        callback(MOCK_EVENTS);
      }
    );
    return unsubscribe;
  } catch {
    isDemoMode = true;
    callback(MOCK_EVENTS);
    return () => {};
  }
}

export async function getEventById(id: string): Promise<WasteBurnEvent | null> {
  if (isDemoMode || !db) {
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  }

  try {
    const docRef = doc(db, "events", id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    return docToEvent(d);
  } catch {
    isDemoMode = true;
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  }
}

export async function updateEventStatus(
  id: string,
  status: "pending" | "verified" | "rejected",
  notes: string
): Promise<void> {
  if (isDemoMode || !db) {
    const idx = MOCK_EVENTS.findIndex((e) => e.id === id);
    if (idx >= 0) {
      MOCK_EVENTS[idx].status = status;
      MOCK_EVENTS[idx].notes = notes;
      MOCK_EVENTS[idx].updated_at = new Date().toISOString();
    }
    return;
  }

  try {
    const docRef = doc(db, "events", id);
    await updateDoc(docRef, {
      status,
      notes,
      updated_at: Timestamp.fromDate(new Date()),
    });
  } catch {
    isDemoMode = true;
  }
}

export async function getClusters(): Promise<Cluster[]> {
  if (isDemoMode || !db) {
    return getMockClusters();
  }

  try {
    const clustersRef = collection(db, "clusters");
    const snapshot = await getDocs(clustersRef);
    if (snapshot.empty) return getMockClusters();
    return snapshot.docs.map((d) => d.data() as Cluster);
  } catch {
    isDemoMode = true;
    return getMockClusters();
  }
}

export async function getStats(): Promise<SystemStats> {
  if (isDemoMode || !db) {
    return getMockStats();
  }

  try {
    const eventsRef = collection(db, "events");
    const snapshot = await getDocs(eventsRef);
    const events = snapshot.docs.map((d) => d.data() as WasteBurnEvent);
    const highRisk = events.filter((e) => e.confidence > 0.75).length;
    const verified = events.filter((e) => e.status === "verified").length;
    const pending = events.filter((e) => e.status === "pending").length;
    return {
      total: events.length,
      high_risk: highRisk,
      verified,
      pending,
      coverage_km2: 125000,
    };
  } catch {
    isDemoMode = true;
    return getMockStats();
  }
}

export function getTrends(days: number): TrendPoint[] {
  return getMockTrends(days);
}
