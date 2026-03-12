import { useState, useMemo } from "react";
import { FileText, Download, Check } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import jsPDF from "jspdf";
import { useEvents } from "@/hooks/useEvents";
import { MOCK_EVENTS } from "@/lib/mock-data";
import type { ReportConfig } from "@/lib/types";

const reportTypes = [
  { value: "summary", label: "Summary Report", desc: "High-level overview" },
  { value: "detailed", label: "Detailed Event Report", desc: "Per-event details" },
  { value: "cluster", label: "Cluster Analysis", desc: "Cluster-level insights" },
  { value: "regional", label: "Regional Risk Assessment", desc: "Geographic risk" },
];

const regions = [
  { value: "all", label: "All" },
  { value: "south_asia", label: "South Asia" },
  { value: "se_asia", label: "SE Asia" },
  { value: "custom", label: "Custom BBox" },
];

const sectionOptions = [
  "Executive Summary",
  "Statistical Charts",
  "Event Table",
  "Model Metrics",
  "Methodology",
  "Recommendations",
];

const RECENT_KEY = "watchburn_recent_reports";

function getRecentReports(): { type: string; date: string; count: number; format: string }[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRecentReport(item: { type: string; date: string; count: number; format: string }) {
  const recent = getRecentReports();
  recent.unshift(item);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function Reports() {
  const { events } = useEvents();
  const data = events.length > 0 ? events : MOCK_EVENTS;

  const [config, setConfig] = useState<ReportConfig>({
    type: "summary",
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    date_to: new Date().toISOString().slice(0, 10),
    region: "all",
    classifications: [],
    confidence_min: 65,
    sections: sectionOptions,
  });

  const [recent, setRecent] = useState(getRecentReports);

  const filteredEvents = useMemo(() => {
    let result = [...data];
    const from = new Date(config.date_from).getTime();
    const to = new Date(config.date_to).getTime();
    result = result.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= from && t <= to;
    });
    if (config.confidence_min > 0) {
      result = result.filter((e) => e.confidence >= config.confidence_min / 100);
    }
    if (config.classifications.length > 0) {
      result = result.filter((e) => config.classifications.includes(e.classification));
    }
    return result;
  }, [data, config]);

  const generatePDF = async () => {
    const doc = new jsPDF();
    doc.setFillColor(2, 5, 9);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(240, 246, 255);
    doc.setFontSize(24);
    doc.text("WatchBurn", 20, 40);
    doc.setFontSize(14);
    doc.text("Environmental Detection Report", 20, 55);
    doc.setTextColor(136, 153, 170);
    doc.setFontSize(10);
    doc.text(`Date range: ${config.date_from} to ${config.date_to}`, 20, 70);
    doc.text(`Region: ${config.region}`, 20, 78);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 19)}`, 20, 86);
    doc.text(`Events: ${filteredEvents.length}`, 20, 96);

    doc.addPage();
    doc.setFillColor(13, 20, 33);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(240, 246, 255);
    doc.setFontSize(16);
    doc.text("Executive Summary", 20, 30);
    doc.setFontSize(10);
    doc.setTextColor(136, 153, 170);
    doc.text(
      `This report summarizes ${filteredEvents.length} detection events within the specified criteria. ` +
        `High-confidence events (confidence > 75%): ${filteredEvents.filter((e) => e.confidence > 0.75).length}. ` +
        `Illegal waste burning: ${filteredEvents.filter((e) => e.classification === "illegal_waste_burning").length}.`,
      20,
      50,
      { maxWidth: 170 }
    );

    doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(240, 246, 255);
    doc.text("Top Events (by confidence)", 20, 30);
    doc.setFontSize(8);
    doc.setTextColor(136, 153, 170);
    const topEvents = [...filteredEvents].sort((a, b) => b.confidence - a.confidence).slice(0, 30);
    topEvents.forEach((e, i) => {
      doc.text(
        `${i + 1}. ${e.id} | ${(e.confidence * 100).toFixed(0)}% | ${e.classification} | ${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`,
        20,
        45 + i * 6,
        { maxWidth: 170 }
      );
    });

    const filename = `watchburn-report-${config.date_to}.pdf`;
    doc.save(filename);
    saveRecentReport({
      type: config.type,
      date: config.date_to,
      count: filteredEvents.length,
      format: "PDF",
    });
    setRecent(getRecentReports());
  };

  const exportCSV = () => {
    const headers = ["id", "lat", "lon", "timestamp", "confidence", "classification", "status", "land_use", "satellite_source"];
    const rows = filteredEvents.map((e) =>
      headers.map((h) => String((e as unknown as Record<string, unknown>)[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchburn-events-${config.date_to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    saveRecentReport({ type: config.type, date: config.date_to, count: filteredEvents.length, format: "CSV" });
    setRecent(getRecentReports());
  };

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: filteredEvents.map((e) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [e.lon, e.lat] },
        properties: {
          id: e.id,
          confidence: e.confidence,
          classification: e.classification,
          timestamp: e.timestamp,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchburn-events-${config.date_to}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    saveRecentReport({ type: config.type, date: config.date_to, count: filteredEvents.length, format: "GeoJSON" });
    setRecent(getRecentReports());
  };

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: "var(--bg-surface)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Report Generator
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Configure and export detection data
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Report Type
              </label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value as ReportConfig["type"] })}
                className="w-full rounded-xl border px-4 py-3 text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                {reportTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.desc}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  From
                </label>
                <input
                  type="date"
                  value={config.date_from}
                  onChange={(e) => setConfig({ ...config, date_from: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  To
                </label>
                <input
                  type="date"
                  value={config.date_to}
                  onChange={(e) => setConfig({ ...config, date_to: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Region
              </label>
              <div className="flex flex-wrap gap-2">
                {regions.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setConfig({ ...config, region: r.value })}
                    className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: config.region === r.value ? "rgba(0,255,136,0.15)" : "var(--bg-card)",
                      borderColor: config.region === r.value ? "var(--accent-green)" : "var(--border-subtle)",
                      color: config.region === r.value ? "var(--accent-green)" : "var(--text-secondary)",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Confidence Minimum: {config.confidence_min}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.confidence_min}
                onChange={(e) => setConfig({ ...config, confidence_min: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: "var(--accent-green)" }}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Include Sections
              </label>
              <div className="space-y-2">
                {sectionOptions.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <Switch.Root
                      checked={config.sections.includes(s)}
                      onCheckedChange={(checked) => {
                        setConfig({
                          ...config,
                          sections: checked ? [...config.sections, s] : config.sections.filter((x) => x !== s),
                        });
                      }}
                      className="relative h-6 w-11 shrink-0 rounded-full transition-colors data-[state=checked]:bg-[var(--accent-green)]"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      <Switch.Thumb className="block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform data-[state=checked]:translate-x-6" />
                    </Switch.Root>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={generatePDF}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--gradient-green)",
                  color: "#020509",
                }}
              >
                <FileText className="h-5 w-5" />
                Generate PDF Report
              </button>
              <button
                onClick={exportCSV}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 font-medium"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={exportGeoJSON}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 font-medium"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                <Download className="h-4 w-4" />
                Export GeoJSON
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            <h3 className="mb-6 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Report Preview
            </h3>
            <div
              className="rounded-xl border p-6"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-subtle)",
                borderTop: "2px solid var(--accent-green)",
              }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                WatchBurn Environmental Detection Report
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Date range: {config.date_from} — {config.date_to} | Region: {config.region} | Generated: {new Date().toLocaleString()}
              </p>
              <div className="mt-6 grid grid-cols-4 gap-4">
                {[
                  [filteredEvents.length, "Events"],
                  [filteredEvents.filter((e) => e.confidence > 0.75).length, "High-Risk"],
                  [filteredEvents.filter((e) => e.status === "verified").length, "Verified"],
                  [125000, "Coverage km²"],
                ].map(([val, label]) => (
                  <div
                    key={label}
                    className="rounded-lg p-3 text-center"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <p className="font-mono text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {val}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                {config.sections.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: "var(--accent-green)" }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-6 font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                Report will include {filteredEvents.length} events matching your criteria
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Estimated pages: ~8 | Format: PDF/A
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Recent Exports
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recent.map((r, i) => (
              <div
                key={i}
                className="flex min-w-[200px] items-center justify-between rounded-xl border p-4"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.type}
                  </span>
                  <p className="mt-2 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {r.count} events
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {r.date} • {r.format}
                  </p>
                </div>
                <Download className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
