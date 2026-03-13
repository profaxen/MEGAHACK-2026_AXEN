import {
  MapContainer,
  TileLayer,
  useMap,
  Popup,
  Polygon
} from "react-leaflet";
import L, { type DivIcon, type LatLngExpression } from "leaflet";
import { useEffect, useMemo } from "react";
import ReactDOMServer from "react-dom/server";
import "leaflet.markercluster";
import type { WasteBurnEvent, Cluster } from "../lib/types";
import ClassificationIcon, {
  getClassificationLabel,
  getClassificationColor
} from "./ClassificationIcon";

interface MapProps {
  events: WasteBurnEvent[];
  clusters: Cluster[];
  onSelectEvent: (id: string) => void;
}

function createMarkerIcon(event: WasteBurnEvent): DivIcon {
  const color = getClassificationColor(event.classification);
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
        <ClassificationIcon classification={event.classification} size={18} />
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
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lons);
    const east = Math.max(...lons);
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
        `${event.lat.toFixed(3)}, ${event.lon.toFixed(3)}`;

      marker.bindPopup(
        `<div class="text-xs">
          <div style="font-weight:600;color:#e5e7eb;margin-bottom:2px;">
            ${getClassificationLabel(event.classification)}
          </div>
          <div style="color:#9ca3af;">📍 ${location}</div>
          <div style="color:#9ca3af;">Confidence: ${(event.confidence * 100).toFixed(0)}%</div>
          <div style="color:#6b7280;">${event.satellite_source}</div>
        </div>`
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
  onSelectEvent
}: MapProps): JSX.Element {
  const center: LatLngExpression = [23.5, 80];

  return (
    <div className="wb-card relative h-[620px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
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

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(15,23,42,0.92)] px-4 py-3 text-xs text-[var(--text-secondary)] shadow-wb-level-2">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Event Types
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="illegal_waste_burning" size={14} />
            <span>Illegal Waste Burning</span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="agricultural_fire" size={14} />
            <span>Agricultural Fire</span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="industrial_flare" size={14} />
            <span>Industrial Flare</span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationIcon classification="natural_fire" size={14} />
            <span>Natural Fire</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventMap;

