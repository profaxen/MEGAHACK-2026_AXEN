import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import PageWrapper from "../components/PageWrapper";
import SatelliteCanvas from "../components/SatelliteCanvas";
import ClassificationIcon, {
  getClassificationLabel,
  getClassificationColor
} from "../components/ClassificationIcon";
import type { WasteBurnEvent } from "../lib/types";
import { getDisplayClassification } from "../lib/classification-utils";
import { getEventById, updateEventStatus } from "../lib/firebase";
import { MOCK_EVENTS } from "../lib/mock-data";

function DetailSkeleton(): JSX.Element {
  return (
    <PageWrapper>
      <div className="wb-card rounded-2xl border border-[var(--border-subtle)] p-6">
        <div className="wb-skeleton h-6 w-48 rounded-xl" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[420px_1fr]">
          <div className="space-y-4">
            <div className="wb-card h-[320px] rounded-2xl border border-[var(--border-subtle)] p-4">
              <div className="wb-skeleton h-5 w-40 rounded-full" />
              <div className="wb-skeleton mt-4 h-[240px] w-full rounded-xl" />
            </div>
            <div className="wb-card h-[220px] rounded-2xl border border-[var(--border-subtle)] p-4">
              <div className="wb-skeleton h-5 w-44 rounded-full" />
              <div className="wb-skeleton mt-4 h-3 w-full rounded-full" />
              <div className="wb-skeleton mt-3 h-3 w-full rounded-full" />
              <div className="wb-skeleton mt-3 h-3 w-full rounded-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="wb-card h-[420px] rounded-2xl border border-[var(--border-subtle)] p-4">
              <div className="wb-skeleton h-5 w-48 rounded-full" />
              <div className="wb-skeleton mt-4 h-[340px] w-full rounded-xl" />
            </div>
            <div className="wb-card h-[260px] rounded-2xl border border-[var(--border-subtle)] p-4">
              <div className="wb-skeleton h-5 w-56 rounded-full" />
              <div className="wb-skeleton mt-4 h-3 w-full rounded-full" />
              <div className="wb-skeleton mt-3 h-3 w-full rounded-full" />
              <div className="wb-skeleton mt-3 h-3 w-full rounded-full" />
              <div className="wb-skeleton mt-3 h-3 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function ScoreBar({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}): JSX.Element {
  const pct = Math.round(value * 100);
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="font-mono text-[11px]" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(15,23,42,0.9)]">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, backgroundImage: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.25))` }}
        />
      </div>
    </div>
  );
}

function makePulsingIcon(color: string): L.DivIcon {
  const html = `
    <div style="position:relative;width:24px;height:24px;">
      <span style="position:absolute;inset:0;border-radius:999px;border:2px solid ${color};opacity:.9;animation:wb-marker-pulse 2s ease-out infinite;"></span>
      <span style="position:absolute;inset:6px;border-radius:999px;background:${color};border:1px solid #fff;box-shadow:0 0 18px rgba(0,255,136,0.35);"></span>
    </div>
  `;
  return L.divIcon({ html, className: "", iconSize: [24, 24], iconAnchor: [12, 12] });
}

export function EventDetail(): JSX.Element {
  const { eventId } = useParams();
  const [event, setEvent] = useState<WasteBurnEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"rgb" | "smoke" | "thermal">("rgb");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const id = eventId ?? "";
        const res = await getEventById(id);
        const fallback = MOCK_EVENTS.find((e) => e.id === id) ?? null;
        if (active) setEvent(res ?? fallback);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const location = useMemo(() => {
    if (!event) return "";
    return (
      event.location_name ||
      [event.city, event.country].filter(Boolean).join(", ") ||
      `${event.lat.toFixed(3)}, ${event.lon.toFixed(3)}`
    );
  }, [event]);

  if (loading || !event) return <DetailSkeleton />;

  const displayClass = getDisplayClassification(event);
  const classColor = getClassificationColor(displayClass);
  const classLabel = getClassificationLabel(displayClass);
  const confidencePct = Math.round(event.confidence * 100);
  const radialData = [{ name: "confidence", value: confidencePct, fill: classColor }];

  const overallColor =
    event.confidence > 0.8
      ? "var(--accent-red)"
      : event.confidence > 0.6
      ? "var(--accent-amber)"
      : "var(--accent-green)";

  const handleUpdate = async (status: WasteBurnEvent["status"]): Promise<void> => {
    try {
      await updateEventStatus(event.id, status, event.notes ?? "");
      setToast("Event status updated");
      setEvent((prev) => (prev ? { ...prev, status } : prev));
    } catch {
      setToast("Failed to update — demo mode");
    }
  };

  return (
    <PageWrapper>
      <div className="mb-4 text-sm text-[var(--text-secondary)]">
        <Link to="/dashboard" className="hover:text-[var(--text-primary)]">
          ← Dashboard
        </Link>
        <span className="mx-2 text-[var(--text-muted)]">/</span>
        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
          Event {event.id}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClassificationIcon classification={event.classification} size={28} />
          <h1 className="text-2xl font-semibold tracking-[-0.04em]">
            {classLabel}
          </h1>
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "var(--border-default)",
              background: "rgba(13,20,33,0.6)"
            }}
          >
            Status:{" "}
            <span className="font-semibold" style={{ color: classColor }}>
              {event.status}
            </span>
          </span>
        </div>
        <div className="font-mono text-xs text-[var(--text-secondary)]">
          Detected: {new Date(event.timestamp).toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-wb-level-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Location
            </div>
            <div className="h-[280px] overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              <MapContainer
                key={event.id}
                center={[event.lat, event.lon]}
                zoom={12}
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <Marker position={[event.lat, event.lon]} icon={makePulsingIcon(classColor)} />
              </MapContainer>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  📍 {location}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
                  {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Source
                </div>
                <div className="font-mono text-xs text-[var(--text-primary)]">
                  {event.satellite_source}
                </div>
              </div>
            </div>
          </div>

          <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-wb-level-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Model Confidence Breakdown
            </div>
            <ScoreBar label="Smoke Probability" value={event.smoke_probability} color="var(--accent-green)" />
            <ScoreBar label="Thermal Score" value={event.thermal_score} color="var(--accent-amber)" />
            <ScoreBar label="Overall Confidence" value={event.confidence} color={overallColor} />

            <div className="mt-4 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[rgba(2,5,9,0.65)] py-5">
              <div className="relative h-[120px] w-[120px]">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke={overallColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${confidencePct * 3.14} ${314 - confidencePct * 3.14}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">
                    {confidencePct}%
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Confidence
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-wb-level-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Spectral Indices
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "NDVI", v: event.spectral_indices.ndvi, color: event.spectral_indices.ndvi > 0.3 ? "var(--accent-green)" : event.spectral_indices.ndvi > 0.1 ? "var(--accent-amber)" : "var(--accent-red)" },
                { k: "NBR", v: event.spectral_indices.nbr, color: event.spectral_indices.nbr > 0.2 ? "var(--accent-green)" : event.spectral_indices.nbr > 0 ? "var(--accent-amber)" : "var(--accent-red)" },
                { k: "BAI", v: event.spectral_indices.bai, color: event.spectral_indices.bai < 400 ? "var(--accent-green)" : event.spectral_indices.bai < 800 ? "var(--accent-amber)" : "var(--accent-red)" },
                { k: "SWIR", v: event.spectral_indices.swir_ratio, color: event.spectral_indices.swir_ratio < 1.0 ? "var(--accent-green)" : event.spectral_indices.swir_ratio < 1.25 ? "var(--accent-amber)" : "var(--accent-red)" }
              ].map((cell) => (
                <div
                  key={cell.k}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] px-3 py-3"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {cell.k}
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold" style={{ color: cell.color }}>
                    {cell.v.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-wb-level-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Satellite Imagery
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {event.satellite_source} • {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[rgba(2,5,9,0.6)] p-1 text-xs text-[var(--text-secondary)]">
                {(["rgb", "smoke", "thermal"] as const).map((t) => {
                  const active = tab === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={[
                        "rounded-lg px-3 py-1 transition-all",
                        active
                          ? "bg-[rgba(0,255,136,0.12)] text-[var(--text-primary)] border-b-2 border-[var(--accent-green)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      ].join(" ")}
                    >
                      {t.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3">
              <SatelliteCanvas type={tab} event={event} width={720} height={340} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
              <span className="font-mono uppercase tracking-[0.18em]">
                Resolution: {event.satellite_source.includes("Sentinel") ? "10m" : event.satellite_source.includes("Landsat") ? "30m" : "1km"}
              </span>
              <span className="font-mono uppercase tracking-[0.18em]">
                Land use: {event.land_use}
              </span>
            </div>
          </div>

          <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-wb-level-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Classification Probabilities
            </div>
            {(
              Object.entries(event.class_probabilities) as [string, number][]
            )
              .sort((a, b) => b[1] - a[1])
              .map(([key, value], idx) => {
                const pct = Math.round(value * 100);
                const isTop = idx === 0;
                return (
                  <div
                    key={key}
                    className={[
                      "mb-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2",
                      isTop ? "bg-[rgba(0,255,136,0.06)]" : "bg-[rgba(13,20,33,0.55)]"
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: key === "illegal_waste_burning" ? "var(--accent-red)" : key === "agricultural_fire" ? "var(--accent-amber)" : key === "industrial_flare" ? "var(--accent-blue)" : "var(--accent-green)" }}
                        />
                        <span className="capitalize">
                          {key.split("_").join(" ")}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {pct}%
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(15,23,42,0.9)]">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${pct}%`,
                          background:
                            key === "illegal_waste_burning"
                              ? "linear-gradient(90deg,var(--accent-red),rgba(255,255,255,0.25))"
                              : key === "agricultural_fire"
                              ? "linear-gradient(90deg,var(--accent-amber),rgba(255,255,255,0.25))"
                              : key === "industrial_flare"
                              ? "linear-gradient(90deg,var(--accent-blue),rgba(255,255,255,0.25))"
                              : "linear-gradient(90deg,var(--accent-green),rgba(255,255,255,0.25))"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-6 rounded-2xl wb-glass px-4 py-3 shadow-wb-level-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              {event.id}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {classLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleUpdate("verified")}
              className="wb-btn-primary rounded-xl px-4 py-2 text-sm"
            >
              ✓ Mark Verified
            </button>
            <button
              type="button"
              onClick={() => void handleUpdate("rejected")}
              className="wb-btn-danger rounded-xl px-4 py-2 text-sm"
            >
              ✗ Reject Event
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50">
          <div className="pointer-events-auto wb-card border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-wb-level-3">
            {toast}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default EventDetail;

