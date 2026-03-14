import {
  MapContainer,
  TileLayer,
  useMap,
  Popup,
  Polygon
} from "react-leaflet";
import L, { type DivIcon, type LatLngExpression } from "leaflet";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOMServer from "react-dom/server";
import "leaflet.markercluster";
import type { WasteBurnEvent, Cluster } from "../lib/types";
import { getDisplayClassification } from "../lib/classification-utils";
import ClassificationIcon, {
  getClassificationLabel,
  getClassificationColor
} from "./ClassificationIcon";

interface MapProps {
  events: WasteBurnEvent[];
  clusters: Cluster[];
  onSelectEvent: (id: string) => void;
  fullscreen?: boolean;
}

function createMarkerIcon(event: WasteBurnEvent): DivIcon {
  const displayClass = getDisplayClassification(event);
  const color = getClassificationColor(displayClass);
  const high = event.confidence > 0.8;

  const svg = ReactDOMServer.renderToString(
    <div className="wb-map-marker" style={{ ["--wb-marker-color" as any]: color }}>
      {high && (
        <span
          className="wb-map-marker-pulse"
          style={{ borderColor: color }}
        />
      )}
      <span className="wb-map-marker-badge">
        <ClassificationIcon classification={displayClass} size={24} />
      </span>
    </div>
  );

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function computeConvexHull(
  points: LatLngExpression[]
): LatLngExpression[] {
  if (points.length <= 3) return points;
  const pts = points.map((p) => {
    const [lat, lon] = Array.isArray(p) ? p : [p.lat, p.lng];
    return { x: lon, y: lat };
  });
  pts.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of pts) {
    while (lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  const hull = lower.concat(upper);
  return hull.map((h) => [h.y, h.x]);
}

function MapContent({
  events,
  clusters,
  onSelectEvent
}: MapProps): JSX.Element | null {
  const map = useMap();

  useEffect(() => {
    if (!events.length) return;
    const lats = events.map((e) => e.lat);
    const lons = events.map((e) => e.lon);
    let south = Math.min(...lats);
    let north = Math.max(...lats);
    let west = Math.min(...lons);
    let east = Math.max(...lons);

    if (south === north) {
      south -= 0.05;
      north += 0.05;
    }
    if (west === east) {
      west -= 0.05;
      east += 0.05;
    }
    map.fitBounds(
      [
        [south, west],
        [north, east]
      ],
      { padding: [20, 20] }
    );
  }, [events, map]);

  useEffect(() => {
    const useClustering = events.length > 200;
    const layer = useClustering
      ? (L as any).markerClusterGroup({
          chunkedLoading: true,
          removeOutsideVisibleBounds: true,
          showCoverageOnHover: false,
          maxClusterRadius: 50
        })
      : L.layerGroup();

    layer.addTo(map);

    events.forEach((event) => {
      const marker = L.marker([event.lat, event.lon], {
        icon: createMarkerIcon(event)
      }).addTo(layer);

      marker.on("click", () => {
        onSelectEvent(event.id);
      });

      const location =
        event.location_name ||
        [event.city, event.country].filter(Boolean).join(", ") ||
        `${(event.lat || 0).toFixed(3)}, ${(event.lon || 0).toFixed(3)}`;
      const displayClass = getDisplayClassification(event);
      const classLabel = getClassificationLabel(displayClass);
      const classColor = getClassificationColor(displayClass);
      const confPct = Math.round(event.confidence * 100);
      const statusLabel = event.status === "verified" ? "✓ Verified" : event.status === "rejected" ? "✗ Rejected" : "⏳ Pending";
      const timeAgo = (() => {
        const diff = Date.now() - new Date(event.timestamp || Date.now()).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return `${Math.max(1, Math.floor(diff / 60000))} min ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })();

      const confBarColor = confPct > 80 ? "#ef4444" : confPct > 60 ? "#f59e0b" : "#22c55e";

      marker.bindTooltip(
        `<div style="
          background:rgba(13,20,33,0.96);
          border:1px solid rgba(148,163,184,0.15);
          border-radius:12px;
          padding:12px 14px;
          min-width:200px;
          max-width:260px;
          box-shadow:0 8px 32px rgba(0,0,0,0.5);
          font-family:Inter,system-ui,sans-serif;
        ">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="
              display:inline-flex;align-items:center;justify-content:center;
              width:28px;height:28px;border-radius:8px;
              background:${classColor}22;border:1px solid ${classColor}44;
              font-size:14px;
            ">🔥</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:#e2e8f0;">${classLabel}</div>
              <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">${statusLabel}</div>
            </div>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">
            📍 ${location}
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden;">
              <div style="width:${confPct}%;height:100%;border-radius:2px;background:${confBarColor};"></div>
            </div>
            <span style="font-size:11px;font-weight:600;color:${confBarColor};font-family:'JetBrains Mono',monospace;min-width:32px;text-align:right;">${confPct}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#475569;">
            <span>🛰 ${event.satellite_source || "Unknown"}</span>
            <span>🕐 ${timeAgo}</span>
          </div>
          <div style="margin-top:8px;text-align:center;font-size:10px;color:#64748b;border-top:1px solid rgba(148,163,184,0.1);padding-top:6px;">
            Click to view details →
          </div>
        </div>`,
        {
          direction: "right",
          offset: [12, 0],
          opacity: 1,
          className: "wb-map-tooltip",
          sticky: false
        }
      );
    });

    return () => {
      layer.removeFrom(map);
    };
  }, [events, map, onSelectEvent]);

  const clusterPolygons = useMemo(() => {
    const byCluster: Record<string, LatLngExpression[]> = {};
    events.forEach((e) => {
      if (!e.cluster_id) return;
      if (!byCluster[e.cluster_id]) byCluster[e.cluster_id] = [];
      byCluster[e.cluster_id].push([e.lat, e.lon]);
    });
    const result: {
      id: string;
      hull: LatLngExpression[];
      risk: number;
    }[] = [];
    clusters.forEach((cluster) => {
      const pts = byCluster[cluster.id];
      if (!pts || pts.length < 3) return;
      const hull = computeConvexHull(pts);
      result.push({ id: cluster.id, hull, risk: cluster.risk_score });
    });
    return result;
  }, [events, clusters]);

  return (
    <>
      {clusterPolygons.map((c) => {
        const risk = c.risk;
        const fillColor =
          risk < 30
            ? "rgba(0,255,136,0.2)"
            : risk < 70
            ? "rgba(245,158,11,0.2)"
            : "rgba(239,68,68,0.2)";
        const strokeColor =
          risk < 30
            ? "rgba(0,255,136,0.5)"
            : risk < 70
            ? "rgba(245,158,11,0.5)"
            : "rgba(239,68,68,0.6)";
        return (
          <Polygon
            key={c.id}
            positions={c.hull}
            pathOptions={{
              fillColor,
              fillOpacity: 0.12,
              color: strokeColor,
              opacity: 0.5,
              weight: 1.5
            }}
          >
            <Popup>
              <div className="text-xs text-slate-200">
                <div className="font-semibold">Cluster {c.id}</div>
                <div>Risk score: {risk}</div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

export function EventMap({
  events,
  clusters,
  onSelectEvent,
  fullscreen = false
}: MapProps): JSX.Element {
  const center: LatLngExpression = [23.5, 80];
  const navigate = useNavigate();

  return (
    <div className={`wb-card relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] ${fullscreen ? "h-full rounded-none border-0" : "h-[620px]"}`}>
      <MapContainer
        center={center}
        zoom={5}
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapContent
          events={events}
          clusters={clusters}
          onSelectEvent={onSelectEvent}
        />
      </MapContainer>

      {!fullscreen && (
        <button
          type="button"
          onClick={() => navigate("/map")}
          className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[rgba(13,20,33,0.92)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] shadow-wb-level-2 backdrop-blur transition-all hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] hover:shadow-wb-glow-green"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Full View
        </button>
      )}

      <div className={`pointer-events-none absolute bottom-4 left-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(15,23,42,0.92)] px-4 py-3 text-xs text-[var(--text-secondary)] shadow-wb-level-2 ${fullscreen ? "z-[1000]" : ""}`}>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Event Types
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="illegal_waste_burning" size={18} />
            <span>Illegal Waste Burning</span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="agricultural_fire" size={18} />
            <span>Agricultural Fire</span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="industrial_flare" size={18} />
            <span>Industrial Flare</span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="natural_fire" size={18} />
            <span>Natural Fire</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventMap;

