---
name: stabilize-hackathon-platform
overview: Stabilize the hackathon project across dashboard icons, event selection, filters, analytics, ML pipeline proxy, Firebase integration, and backend server behavior so it runs reliably for the demo.
todos: []
isProject: false
---

## Goals

- **Fix event icon rendering** so the correct classification icon is always shown without requiring refresh.
- **Guarantee correct event selection and location display** when clicking from the map or event list.
- **Make filters reliable** on the events/dashboard and analytics pages (classification/type and date ranges behave as expected).
- **Verify ML pipeline proxy behavior** and ensure it fails gracefully without breaking the UI.
- **Verify and harden Firebase integration and fallbacks** so the app behaves predictably in both real and demo/mock modes.
- **Improve backend/server robustness** to avoid crashes and confusing responses during the hackathon demo.

## High-level Approach

- **Understand & verify current flows** for events, filters, analytics, ML, and Firebase using the existing React + Vite frontend and Express backend setup.
- **Tighten data contracts** between frontend components, Firebase/Firestore documents, and backend routes, ensuring consistent event IDs, coordinates, and classifications.
- **Harden demo vs real Firebase behavior**, so UI features (filters, analytics) remain consistent regardless of whether Firestore is available.
- **Add defensive checks and error handling** around ML proxying and Firestore access to prevent runtime crashes and make failure modes obvious but non-blocking.

## Detailed Steps

### 1. Fix Dashboard Icon Issues

- **Inspect icon mapping logic** in `[client/components/ClassificationIcon.tsx](client/components/ClassificationIcon.tsx)` and its usage in `[client/components/Map.tsx](client/components/Map.tsx)` and `[client/components/EventCard.tsx](client/components/EventCard.tsx)` to understand how classifications map to icons and colors.
- **Compare expected vs actual classification values** stored in mock events and Firestore by checking `classification` in `WasteBurnEvent` type (`[client/lib/types.ts](client/lib/types.ts)`), mock data (`[client/lib/mock-data.ts](client/lib/mock-data.ts)`), and any seed/ML-generated events.
- **Align classification enum and icons**:
  - Ensure all possible `classification` strings coming from data have a corresponding, deterministic icon in `ClassificationIcon` (including a clear default for unknown values).
  - If the "industrial flare" icon comes from an external map or default marker, adjust `createMarkerIcon` in `Map.tsx` so custom SVG icons are always used, not library defaults.
- **Normalize classification values on read** (if needed): add a small normalization helper (e.g., map legacy or alternate strings to canonical classification keys) before passing events into UI components.

### 2. Fix Wrong Location on Event Click

- **Trace the click-to-detail flow**:
  - Map markers in `[client/components/Map.tsx](client/components/Map.tsx)` → `onSelectEvent(id)` in `[client/pages/Dashboard.tsx](client/pages/Dashboard.tsx)` → route `/events/:eventId` → `EventDetail` in `[client/pages/EventDetail.tsx](client/pages/EventDetail.tsx)`.
  - Event cards in `[client/components/EventCard.tsx](client/components/EventCard.tsx)` follow the same `onSelectEvent(id)` path.
- **Verify ID and coordinate consistency**:
  - Confirm that `event.id` passed from `Map`/`EventCard` matches the Firestore document ID or mock ID used by `getEventById(id)` in `[client/lib/firebase.ts](client/lib/firebase.ts)`.
  - Ensure `EventDetail` always uses the selected event's own `lat`/`lon` for both map center and marker, and that no cached or fallback event is used when ID is missing.
- **Harden the selection logic**:
  - Add explicit guards in `EventDetail` to handle "event not found" cases (show a clear error instead of defaulting to the wrong event or location).
  - Where clusters or aggregated views are used, verify that any click on a cluster or summary item resolves to the correct underlying event ID.

### 3. Make Events/Dashboard Filters Work Reliably

- **Review `useEvents` and filter state** in `[client/hooks/useEvents.ts](client/hooks/useEvents.ts)` and `FilterState` in `[client/lib/types.ts](client/lib/types.ts)`.
- **Fix demo-mode filter behavior**:
  - If `isDemoMode` is true, adjust `useEvents` so it still applies client-side filtering over `MOCK_EVENTS` (reusing the same logic as `subscribeToEvents` uses when `db` is unavailable) instead of always returning the full mock list.
  - Ensure classification bar (`[client/components/ClassificationBar.tsx](client/components/ClassificationBar.tsx)`) and any additional filters (status, confidence) update `filters` and trigger a re-computation of the filtered dataset.
- **Unify filtering paths** so the behavior is similar whether data comes from Firestore via `onSnapshot` or from mock data:
  - Make sure `subscribeToEvents` and `useEvents` share a common filtering helper to avoid divergence.
  - Confirm that filter changes do not reset selection or break map/list synchronization.

### 4. Fix Analytics Page Date Range Filter

- **Inspect range logic** in `[client/pages/Analytics.tsx](client/pages/Analytics.tsx)`, especially the `range` state and `clampEventsByRange(events, range)`.
- **Verify timestamp parsing**:
  - Confirm events use a consistent `timestamp` format (ISO string or seconds) in `WasteBurnEvent` and in stored data.
  - Ensure `clampEventsByRange` correctly interprets this format (e.g., no mix of milliseconds vs seconds that would cause all events to fall into all ranges).
- **Make the range selector visibly effective**:
  - Adjust `clampEventsByRange` so `"7D"`, `"30D"`, `"ALL"` (and any other ranges such as `"90D"`) yield clearly different subsets when appropriate.
  - Optionally log or visually expose the actual date window (e.g., "Showing events from 2026‑03‑07 to 2026‑03‑14") to make correct behavior obvious during the demo.
- **(Optional extension)**: if time allows and you want backend-backed analytics, wire the Analytics page to call `/api/events/trends` with a range parameter and align the charts with backend aggregation; otherwise, keep it purely client-side but correct.

### 5. Verify ML Pipeline Proxy Behavior

- **Confirm ML proxy endpoint contract** at `[server/routes/inference.ts](server/routes/inference.ts)` and client usage in `[client/lib/api-client.ts](client/lib/api-client.ts)` and `[client/components/layout/Navbar.tsx](client/components/layout/Navbar.tsx)`.
- **Harden error handling and timeouts**:
  - Ensure the Express route continues to gracefully fall back to a static demo result when the external ML service at `http://localhost:5000/full-pipeline` is unreachable or slow.
  - Verify that the client always displays a clear, non-breaking message when fallback is used (e.g., via toasts), and that the UI does not depend on any missing fields.
- **(If real ML is desired)**: document or slightly adjust the proxy to accept configurable ML service URL via environment variable and verify that successful responses are simply passed through to the frontend without schema mismatch.

### 6. Verify Firebase Integration & Demo Mode Behavior

- **Review Firebase client initialization and seeding** in `[client/lib/firebase.ts](client/lib/firebase.ts)`:
  - Confirm `ensureFirebase()`, `initializeData()`, and `isDemoMode` semantics.
  - Make sure `initializeData()` handles both empty and pre-populated Firestore collections without throwing.
- **Align Firestore schema with `WasteBurnEvent`**:
  - Verify that required fields (`id`, `lat`, `lon`, `classification`, `timestamp`, `confidence`, status fields, and optional `location_name`/`city`/`state`) are present in both mock data and real documents.
  - Ensure `subscribeToEvents` consistently sets `id: data.id ?? docSnap.id` to prevent mismatches.
- **Check reverse geocoding enrichment** via `maybeEnrichLocation(event)` and its use inside `subscribeToEvents`:
  - Confirm it cannot corrupt event coordinates or IDs when writing enriched location fields back to Firestore.
- **Ensure safe fallbacks**:
  - Where Firestore or credentials are missing, verify that all callers gracefully fall back to mock data without leaving the UI in a partially initialized state.

### 7. Harden Backend/Server Stability

- **Audit `server/index.ts` and all routers** in `[server/routes/events.ts](server/routes/events.ts)`, `[server/routes/reports.ts](server/routes/reports.ts)`, `[server/routes/inference.ts](server/routes/inference.ts)` for error handling and fallbacks.
- **Stabilize Firestore Admin usage**:
  - Ensure `getAdminFirestore()` handles misconfigured credentials cleanly and that all routes check for `null` Firestore and fall back to mock data, returning consistent response shapes.
  - Where appropriate, log errors (without leaking secrets) and return clear error messages or demo-mode flags so you can see issues during the hackathon without crashing the server.
- **Verify health & readiness**:
  - Confirm `GET /api/health` returns reliably and consider extending it with a lightweight Firestore connectivity check (optional) to know whether you’re in real-data or demo mode.
- **Smoke-test key endpoints**:
  - Exercise `/api/events`, `/api/events/:id`, `/api/events/stats`, `/api/events/trends`, `/api/reports/`*, and `/api/inference/full-pipeline` (with and without ML service running) to ensure all respond quickly and with valid JSON/CSV/GeoJSON.

## Todos

- **icons-filters**: Verify and align classification → icon mapping and ensure consistent filtering behavior even in demo mode.
- **event-selection-location**: Audit and harden the click-to-detail flow so event IDs and coordinates always match between map, list, and detail views.
- **analytics-range**: Fix and validate Analytics date range filtering so 7-day/30-day/all-time views clearly differ.
- **ml-proxy**: Confirm ML proxy route behavior and ensure UI gracefully handles both real and fallback inference results.
- **firebase-integration**: Verify Firebase/Firestore client integration, schema alignment, and demo-mode fallbacks.
- **server-stability**: Review and harden Express server and Firestore Admin usage for stable behavior during the demo.

