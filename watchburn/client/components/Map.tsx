import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WasteBurnEvent } from "@/lib/types";

const CARTO_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function getMarkerColor(confidence: number): string {
  if (confidence < 0.5) return "#00ff88";
  if (confidence < 0.75) return "#f59e0b";
  return "#ef4444";
}

function getMarkerRadius(confidence: number): number {
  if (confidence < 0.5) return 7;
  if (confidence < 0.75) return 9;
  return 11;
}

function createPulseIcon(confidence: number) {
  const color = getMarkerColor(confidence);
  const radius = getMarkerRadius(confidence);
  return L.divIcon({
    className: "custom-marker-pulse",
    html: `
      <div class="marker-pulse-outer" style="
        width: ${radius * 4}px;
        height: ${radius * 4}px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.3;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        animation: marker-pulse 2s ease-out infinite;
      "></div>
      <div class="marker-pulse-inner" style="
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        position: relative;
        z-index: 1;
        box-shadow: 0 0 12px ${color}80;
      "></div>
    `,
    iconSize: [radius * 4, radius * 4],
    iconAnchor: [radius * 2, radius * 2],
  });
}

interface MapProps {
  events: WasteBurnEvent[];
  height?: number;
}

function MapLegend() {
  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded-xl px-4 py-3"
      style={{
        background: "var(--bg-glass)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        Confidence Level
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "#00ff88" }}
        />
        <span style={{ color: "var(--text-secondary)" }}>&lt;50%</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: "#f59e0b" }}
        />
        <span style={{ color: "var(--text-secondary)" }}>50–75%</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span
          className="h-3 w-3 rounded-full"
          style={{ background: "#ef4444" }}
        />
        <span style={{ color: "var(--text-secondary)" }}>&gt;75%</span>
      </div>
    </div>
  );
}

export function Map({ events, height = 620 }: MapProps) {
  const navigate = useNavigate();

  const center = useMemo(() => {
    if (events.length === 0) return [22.0, 82.0] as [number, number];
    const lats = events.map((e) => e.lat);
    const lons = events.map((e) => e.lon);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lons) + Math.max(...lons)) / 2,
    ] as [number, number];
  }, [events]);

  const lowConfEvents = events.filter((e) => e.confidence <= 0.8);
  const highConfEvents = events.filter((e) => e.confidence > 0.8);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        height,
        border: "1px solid var(--border-subtle)",
      }}
    >
      <style>{`
        @keyframes marker-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .custom-marker-pulse, .custom-marker { background: none !important; border: none !important; }
        .leaflet-container { font-family: 'Space Grotesk', system-ui, sans-serif; background: #020509; }
      `}</style>
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url={CARTO_DARK} attribution='&copy; CARTO' />
        {lowConfEvents.map((event) => (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lon]}
            radius={getMarkerRadius(event.confidence)}
            pathOptions={{
              color: "white",
              weight: 1,
              fillColor: getMarkerColor(event.confidence),
              fillOpacity: 0.85,
            }}
            eventHandlers={{
              click: () => navigate(`/events/${event.id}`),
            }}
          >
            <Popup>
              <div
                className="cursor-pointer p-2"
                onClick={() => navigate(`/events/${event.id}`)}
                style={{ minWidth: 140 }}
              >
                <p className="font-mono text-xs text-gray-400">{event.id}</p>
                <p className="font-semibold text-white">
                  {Math.round(event.confidence * 100)}% confidence
                </p>
                <p className="text-sm text-gray-300">
                  {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {highConfEvents.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lon]}
            icon={createPulseIcon(event.confidence)}
            eventHandlers={{
              click: () => navigate(`/events/${event.id}`),
            }}
          >
            <Popup>
              <div
                className="cursor-pointer p-2"
                onClick={() => navigate(`/events/${event.id}`)}
                style={{ minWidth: 140 }}
              >
                <p className="font-mono text-xs text-gray-400">{event.id}</p>
                <p className="font-semibold text-white">
                  {Math.round(event.confidence * 100)}% confidence
                </p>
                <p className="text-sm text-gray-300">
                  {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
