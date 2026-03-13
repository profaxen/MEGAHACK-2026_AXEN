import {
  initializeApp,
  type FirebaseApp,
  getApps
} from "firebase/app";
import {
  getFirestore,
  type Firestore,
  collection,
  getDocs,
  getDoc,
  doc,
  limit,
  onSnapshot,
  query,
  where,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import type {
  WasteBurnEvent,
  Cluster,
  FilterState,
  SystemStats
} from "./types";
import {
  MOCK_EVENTS,
  getMockClusters,
  getMockStats
} from "./mock-data";

const firebaseConfig = {
  apiKey: "AIzaSyACMezbzpQ3zVeGFothsvRKcDjrgN4YwpQ",
  authDomain: "new-proj-for-ai.firebaseapp.com",
  databaseURL:
    "https://new-proj-for-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "new-proj-for-ai",
  storageBucket: "new-proj-for-ai.firebasestorage.app",
  messagingSenderId: "411257714840",
  appId: "1:411257714840:web:78bbf51966819385abf8ed",
  measurementId: "G-X1EXMJJ878"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

export let isDemoMode = false;

function ensureFirebase(): void {
  if (app && db) return;
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0]!;
    }
    db = getFirestore(app);
    void isSupported().then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    });
  } catch {
    isDemoMode = true;
  }
}

async function maybeEnrichLocation(
  event: WasteBurnEvent
): Promise<void> {
  if (!db) return;
  if (event.location_name && event.city && event.country) return;

  const cacheKey = `wb_loc_${event.lat.toFixed(3)}_${event.lon.toFixed(3)}`;
  const cached = typeof window !== "undefined"
    ? window.localStorage.getItem(cacheKey)
    : null;
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as {
        location_name: string;
        city: string;
        state: string;
        country: string;
      };
      await updateDoc(doc(db, "events", event.id), parsed);
      return;
    } catch {
      // ignore cache errors
    }
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(event.lat));
    url.searchParams.set("lon", String(event.lon));
    url.searchParams.set("zoom", "10");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "WatchBurn/1.0 (environmental-monitoring)"
      }
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
      };
    };

    const city =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      "";
    const state = data.address?.state ?? "";
    const country = data.address?.country ?? "";
    const locationName =
      data.display_name ??
      [city, state, country].filter(Boolean).join(", ");

    const payload = {
      location_name: locationName,
      city,
      state,
      country
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(cacheKey, JSON.stringify(payload));
    }

    await updateDoc(doc(db, "events", event.id), payload);
  } catch {
    // suppress geocoding errors
  }
}

export async function initializeData(): Promise<void> {
  ensureFirebase();
  if (!db) {
    isDemoMode = true;
    return;
  }
  const firestore = db;

  try {
    const snapshot = await getDocs(
      query(collection(firestore, "events"), limit(1))
    );
    if (!snapshot.empty) return;

    const batch = writeBatch(firestore);
    MOCK_EVENTS.forEach((event) => {
      const ref = doc(collection(firestore, "events"));
      batch.set(ref, event);
    });
    await batch.commit();

    const clusters = getMockClusters();
    const clusterBatch = writeBatch(firestore);
    clusters.forEach((cluster) => {
      const ref = doc(collection(firestore, "clusters"), cluster.id);
      clusterBatch.set(ref, cluster);
    });
    await clusterBatch.commit();
  } catch {
    isDemoMode = true;
  }
}

export function subscribeToEvents(
  filters: FilterState,
  callback: (events: WasteBurnEvent[]) => void
): () => void {
  ensureFirebase();

  if (!db || isDemoMode) {
    const filtered = MOCK_EVENTS.filter((e) => {
      const matchesClass =
        !filters.classification ||
        filters.classification === "all" ||
        e.classification === filters.classification;
      const matchesStatus =
        !filters.status ||
        filters.status === "all" ||
        e.status === filters.status;
      const matchesConfidence = e.confidence >= filters.confidence_min / 100;
      return matchesClass && matchesStatus && matchesConfidence;
    });
    callback(filtered);
    return () => undefined;
  }

  try {
    const baseRef = collection(db, "events");
    const clauses = [];
    if (filters.classification && filters.classification !== "all") {
      clauses.push(where("classification", "==", filters.classification));
    }
    if (filters.status && filters.status !== "all") {
      clauses.push(where("status", "==", filters.status));
    }
    if (filters.confidence_min > 0) {
      clauses.push(
        where("confidence", ">=", filters.confidence_min / 100)
      );
    }

    const q =
      clauses.length > 0
        ? query(baseRef, ...clauses)
        : query(baseRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: WasteBurnEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as WasteBurnEvent;
          const event: WasteBurnEvent = {
            ...data,
            id: data.id ?? docSnap.id
          };
          list.push(event);
          if (!event.location_name) {
            void maybeEnrichLocation(event);
          }
        });
        callback(list);
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
    return () => undefined;
  }
}

export async function getEventById(
  id: string
): Promise<WasteBurnEvent | null> {
  ensureFirebase();
  if (!db || isDemoMode) {
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  }
  try {
    const ref = doc(db, "events", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as WasteBurnEvent;
    const event: WasteBurnEvent = { ...data, id: data.id ?? id };
    if (!event.location_name) {
      void maybeEnrichLocation(event);
    }
    return event;
  } catch {
    isDemoMode = true;
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  }
}

export async function updateEventStatus(
  id: string,
  status: WasteBurnEvent["status"],
  notes: string
): Promise<void> {
  ensureFirebase();
  if (!db || isDemoMode) {
    return;
  }
  try {
    const ref = doc(db, "events", id);
    await updateDoc(ref, {
      status,
      notes,
      updated_at: new Date().toISOString()
    });
  } catch {
    isDemoMode = true;
  }
}

export async function getClusters(): Promise<Cluster[]> {
  ensureFirebase();
  if (!db || isDemoMode) {
    return getMockClusters();
  }
  try {
    const snapshot = await getDocs(collection(db, "clusters"));
    if (snapshot.empty) {
      return getMockClusters();
    }
    const clusters: Cluster[] = [];
    snapshot.forEach((docSnap) => {
      clusters.push(docSnap.data() as Cluster);
    });
    return clusters;
  } catch {
    isDemoMode = true;
    return getMockClusters();
  }
}

export async function getStats(): Promise<SystemStats> {
  ensureFirebase();
  if (!db || isDemoMode) {
    return getMockStats();
  }
  try {
    const snapshot = await getDocs(collection(db, "events"));
    if (snapshot.empty) {
      return getMockStats();
    }
    let total = 0;
    let highRisk = 0;
    let verified = 0;
    let pending = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as WasteBurnEvent;
      total += 1;
      if (data.confidence > 0.75) highRisk += 1;
      if (data.status === "verified") verified += 1;
      if (data.status === "pending") pending += 1;
    });
    return {
      total,
      high_risk: highRisk,
      verified,
      pending,
      coverage_km2: 3_500_000
    };
  } catch {
    isDemoMode = true;
    return getMockStats();
  }
}

