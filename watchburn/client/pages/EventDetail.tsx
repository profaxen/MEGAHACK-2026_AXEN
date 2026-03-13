import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, X } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import * as Toast from "@radix-ui/react-toast";
import { getEventById, updateEventStatus } from "@/lib/firebase";
import { SatelliteCanvas } from "@/components/SatelliteCanvas";
import { ClassificationBar } from "@/components/ClassificationBar";
import type { WasteBurnEvent } from "@/lib/types";
import { getLocationName } from "@/lib/geocode";

const classificationColors: Record<string, string> = {
  illegal_waste_burning: "var(--accent-red)",
  agricultural_fire: "var(--accent-amber)",
  industrial_flare: "var(--accent-blue)",
  natural_fire: "var(--accent-green)",
};

function formatClassification(c: string): string {
  return c
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays} days ago`;
  if (diffHours > 0) return `${diffHours} hours ago`;
  return "Just now";
}

function createPulseIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ef4444;
        border: 3px solid white;
        box-shadow: 0 0 20px rgba(239,68,68,0.6);
        animation: pulse 2s ease-out infinite;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<WasteBurnEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"rgb" | "smoke" | "thermal">("rgb");

  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then((e) => {
      setEvent(e ?? null);
      setLoading(false);
    });
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;

    getLocationName(event.lat, event.lon).then((label) => {
      if (!cancelled) {
        setLocationLabel(label);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [event]);

  const handleVerify = async () => {
    if (!event) return;
    await updateEventStatus(event.id, "verified", "");
    setEvent({ ...event, status: "verified", updated_at: new Date().toISOString() });
    setToastOpen(true);
  };

  const handleReject = async () => {
    if (!event) return;
    await updateEventStatus(event.id, "rejected", "");
    setEvent({ ...event, status: "rejected", updated_at: new Date().toISOString() });
    setToastOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24" style={{ background: "var(--bg-surface)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div
            className="h-8 w-48 animate-pulse rounded"
            style={{ background: "var(--border-subtle)" }}
          />
          <div
            className="mt-8 grid h-96 gap-8 animate-pulse rounded-2xl"
            style={{ background: "var(--bg-card)" }}
          />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-24" style={{ background: "var(--bg-surface)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <p style={{ color: "var(--text-secondary)" }}>Event not found.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-2"
            style={{ color: "var(--accent-green)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const confColor =
    event.confidence > 0.75
      ? "var(--accent-green)"
      : event.confidence > 0.5
      ? "var(--accent-amber)"
      : "var(--accent-red)";

  const radialData = [
    { name: "conf", value: event.confidence, fill: confColor },
  ];

  const ndvi = event.spectral_indices?.ndvi ?? 0.3;
  const ndviColor =
    ndvi > 0.3 ? "var(--accent-green)" : ndvi > 0.1 ? "var(--accent-amber)" : "var(--accent-red)";

  return (
    <div className="min-h-screen pt-24 pb-24" style={{ background: "var(--bg-surface)" }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .custom-marker { background: none !important; border: none !important; }
      `}</style>

      <div className="mx-auto max-w-[1400px] px-6">
        <Link
          to="/dashboard"
          className="mb-6 flex items-center gap-2 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard &gt; Event{" "}
          <span className="font-mono" style={{ color: "var(--text-primary)" }}>
            {event.id}
          </span>
        </Link>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <span
            className="rounded-md px-3 py-1 text-sm font-medium"
            style={{
              background: `${classificationColors[event.classification] || "var(--accent-green)"}20`,
              color: classificationColors[event.classification] || "var(--accent-green)",
            }}
          >
            {formatClassification(event.classification)}
          </span>
          <span
            className="rounded-full px-3 py-1 text-sm"
            style={{
              background:
                event.status === "verified"
                  ? "rgba(0,255,136,0.2)"
                  : event.status === "rejected"
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(245,158,11,0.2)",
              color:
                event.status === "verified"
                  ? "var(--accent-green)"
                  : event.status === "rejected"
                  ? "var(--text-muted)"
                  : "var(--accent-amber)",
            }}
          >
            {event.status}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Detected: {new Date(event.timestamp).toLocaleString()} (
            {formatRelativeTime(event.timestamp)})
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <div
                className="overflow-hidden rounded-xl"
                style={{ height: 280 }}
              >
                <MapContainer
                  center={[event.lat, event.lon]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  <Marker
                    position={[event.lat, event.lon]}
                    icon={createPulseIcon()}
                  />
                </MapContainer>
              </div>
              <p
                className="mt-4 font-mono text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                {locationLabel ?? `${event.lat.toFixed(6)}, ${event.lon.toFixed(6)}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className="rounded border px-2 py-1 text-sm"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {event.land_use}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {event.satellite_source} • {event.timestamp.slice(0, 10)}
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <h4 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Model Confidence Breakdown
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>Smoke Probability</span>
                    <span className="font-mono" style={{ color: "var(--accent-green)" }}>
                      {Math.round(event.smoke_probability * 100)}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--border-subtle)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${event.smoke_probability * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: "var(--gradient-green)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>Thermal Score</span>
                    <span className="font-mono" style={{ color: "var(--accent-amber)" }}>
                      {Math.round(event.thermal_score * 100)}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--border-subtle)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${event.thermal_score * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>Overall Confidence</span>
                    <span className="font-mono" style={{ color: confColor }}>
                      {Math.round(event.confidence * 100)}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--border-subtle)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${event.confidence * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full rounded-full"
                      style={{ background: confColor }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    barSize={12}
                    data={radialData}
                  >
                    <RadialBar background fill={confColor} dataKey="value" />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-mono text-2xl font-bold"
                      fill="var(--text-primary)"
                    >
                      {Math.round(event.confidence * 100)}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <h4 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Spectral Indices
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                  <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                    NDVI
                  </p>
                  <p className="font-mono text-lg font-bold" style={{ color: ndviColor }}>
                    {ndvi.toFixed(3)}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                  <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                    NBR
                  </p>
                  <p className="font-mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {(event.spectral_indices?.nbr ?? 0.2).toFixed(3)}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                  <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                    BAI
                  </p>
                  <p className="font-mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {(event.spectral_indices?.bai ?? 0.1).toFixed(3)}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                  <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                    SWIR
                  </p>
                  <p className="font-mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {(event.spectral_indices?.swir_ratio ?? 0.5).toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
                {(["rgb", "smoke", "thermal"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-6 py-3 text-sm font-medium transition-colors"
                    style={{
                      color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                      background: activeTab === tab ? "rgba(0,255,136,0.1)" : "transparent",
                      borderBottom: activeTab === tab ? "2px solid var(--accent-green)" : "2px solid transparent",
                    }}
                  >
                    {tab === "rgb" ? "RGB" : tab === "smoke" ? "Smoke Mask" : "Thermal"}
                  </button>
                ))}
              </div>
              <div className="p-4" style={{ background: "var(--bg-base)" }}>
                <SatelliteCanvas
                  type={activeTab}
                  event={event}
                  width={600}
                  height={400}
                />
              </div>
              <div className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>
                {event.satellite_source} • {event.timestamp.slice(0, 10)} • 10m
              </div>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <h4 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Classification Probabilities
              </h4>
              <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
                {event.satellite_source} • {event.timestamp.slice(0, 10)}
              </p>
              <ClassificationBar event={event} />
            </div>

            {event.cluster_id && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono" style={{ color: "var(--text-primary)" }}>
                    {event.cluster_id}
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      background: "rgba(239,68,68,0.2)",
                      color: "var(--accent-red)",
                    }}
                  >
                    Risk: 75
                  </span>
                </div>
                <div className="mt-4 flex gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span>8 events</span>
                  <span>Avg 82%</span>
                  <span>3 days</span>
                </div>
                <Link
                  to="/dashboard"
                  className="mt-4 inline-block text-sm"
                  style={{ color: "var(--accent-green)" }}
                >
                  Filter dashboard to this cluster →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
            {event.id} • {formatClassification(event.classification)}
          </span>
          <div className="flex gap-4">
            <button
              onClick={handleVerify}
              disabled={event.status === "verified"}
              className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: "var(--gradient-green)",
                color: "#020509",
              }}
            >
              <Check className="h-5 w-5" />
              Mark Verified
            </button>
            <button
              onClick={handleReject}
              disabled={event.status === "rejected"}
              className="flex items-center gap-2 rounded-xl border px-6 py-3 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                borderColor: "rgba(239,68,68,0.3)",
                color: "var(--accent-red)",
              }}
            >
              <X className="h-5 w-5" />
              Reject Event
            </button>
          </div>
        </div>
      </div>

      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--glow-green)",
        }}
      >
        <Toast.Title>Event status updated</Toast.Title>
      </Toast.Root>
      <Toast.Viewport />
    </div>
  );
}
