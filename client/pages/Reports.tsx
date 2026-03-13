import { useEffect, useMemo, useRef, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import { useEvents } from "../hooks/useEvents";
import type { ReportConfig, WasteBurnEvent, WasteClassification } from "../lib/types";
import ClassificationIcon from "../components/ClassificationIcon";
import { MOCK_EVENTS } from "../lib/mock-data";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { downloadCsv, downloadGeoJson } from "../lib/api-client";

type ReportKind = "summary" | "detailed" | "cluster" | "regional";

const sectionOptions = [
  "Executive Summary",
  "Statistical Charts",
  "Event Table",
  "Model Metrics",
  "Methodology",
  "Recommendations"
];

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function withinRange(ts: string, from: string, to: string): boolean {
  const t = new Date(ts).getTime();
  const f = new Date(from).getTime();
  const tt = new Date(to).getTime();
  return t >= f && t <= tt;
}

function buildConfig(): ReportConfig {
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
  const to = today;
  return {
    type: "summary",
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
    region: "All",
    classifications: [
      "illegal_waste_burning",
      "agricultural_fire",
      "industrial_flare",
      "natural_fire"
    ],
    confidence_min: 0,
    sections: [...sectionOptions]
  };
}

export function Reports(): JSX.Element {
  const { events } = useEvents();
  const [config, setConfig] = useState<ReportConfig>(() => buildConfig());
  const [recent, setRecent] = useState<
    { type: ReportKind; date: string; count: number; format: string }[]
  >([]);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("wb_recent_reports");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        type: ReportKind;
        date: string;
        count: number;
        format: string;
      }[];
      setRecent(parsed);
    } catch {
      // ignore
    }
  }, []);

  const scoped: WasteBurnEvent[] = useMemo(() => {
    const list = events.length ? events : MOCK_EVENTS;
    const from = `${config.date_from}T00:00:00.000Z`;
    const to = `${config.date_to}T23:59:59.999Z`;
    return list
      .filter((e) => withinRange(e.timestamp, from, to))
      .filter((e) => e.confidence >= config.confidence_min / 100)
      .filter((e) =>
        config.classifications.length
          ? config.classifications.includes(e.classification)
          : true
      );
  }, [events, config]);

  const addRecent = (format: string): void => {
    const entry = {
      type: config.type,
      date: new Date().toISOString(),
      count: scoped.length,
      format
    };
    const next = [entry, ...recent].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem("wb_recent_reports", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handlePdf = async (): Promise<void> => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pages: HTMLElement[] = Array.from(
        previewRef.current.querySelectorAll("[data-wb-page]")
      ) as HTMLElement[];

      for (let i = 0; i < pages.length; i += 1) {
        const canvas = await html2canvas(pages[i], {
          backgroundColor: "#0b1220",
          scale: 2
        });
        const imgData = canvas.toDataURL("image/png");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        const x = (pageWidth - w) / 2;
        const y = (pageHeight - h) / 2;
        if (i > 0) doc.addPage();
        doc.addImage(imgData, "PNG", x, y, w, h);
      }

      const filename = `watchburn-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      addRecent("PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleCsv = async (): Promise<void> => {
    const blob = await downloadCsv(config);
    downloadBlob(blob, `watchburn-report-${new Date().toISOString().slice(0, 10)}.csv`);
    addRecent("CSV");
  };

  const handleGeo = async (): Promise<void> => {
    const blob = await downloadGeoJson(config);
    downloadBlob(blob, `watchburn-report-${new Date().toISOString().slice(0, 10)}.geojson`);
    addRecent("GeoJSON");
  };

  const toggleClass = (c: WasteClassification): void => {
    setConfig((prev) => {
      const exists = prev.classifications.includes(c);
      const next = exists
        ? prev.classifications.filter((x) => x !== c)
        : [...prev.classifications, c];
      return { ...prev, classifications: next };
    });
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure and export detection data.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Report Generator
            </div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">
              Configure and export detection data
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Report Type
              </div>
              <select
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                value={config.type}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, type: e.target.value as ReportKind }))
                }
              >
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Event Report</option>
                <option value="cluster">Cluster Analysis</option>
                <option value="regional">Regional Risk Assessment</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  From
                </div>
                <input
                  type="date"
                  value={config.date_from}
                  onChange={(e) => setConfig((p) => ({ ...p, date_from: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  To
                </div>
                <input
                  type="date"
                  value={config.date_to}
                  onChange={(e) => setConfig((p) => ({ ...p, date_to: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Region
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", "South Asia", "SE Asia", "Custom BBox"].map((r) => {
                  const active = config.region === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, region: r }))}
                      className={[
                        "rounded-full border px-3 py-1 text-xs transition-all",
                        active
                          ? "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.12)] text-[var(--accent-green)]"
                          : "border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                      ].join(" ")}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Classification Filter
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "illegal_waste_burning",
                    "agricultural_fire",
                    "industrial_flare",
                    "natural_fire"
                  ] as WasteClassification[]
                ).map((c) => {
                  const active = config.classifications.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleClass(c)}
                      className={[
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all",
                        active
                          ? "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.10)] text-[var(--text-primary)]"
                          : "border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                      ].join(" ")}
                    >
                      <ClassificationIcon classification={c} size={16} />
                      <span className="capitalize">{c.split("_").join(" ")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <span>Confidence Minimum</span>
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                  Min: {config.confidence_min}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={95}
                value={config.confidence_min}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, confidence_min: Number(e.target.value) }))
                }
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Include Sections
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sectionOptions.map((s) => {
                  const active = config.sections.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setConfig((p) => ({
                          ...p,
                          sections: active
                            ? p.sections.filter((x) => x !== s)
                            : [...p.sections, s]
                        }))
                      }
                      className={[
                        "rounded-xl border px-3 py-2 text-xs transition-all",
                        active
                          ? "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.10)] text-[var(--text-primary)]"
                          : "border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                      ].join(" ")}
                    >
                      {active ? "✓ " : ""}{s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => void handlePdf()}
                className="wb-btn-primary w-full"
                disabled={generating}
              >
                {generating ? "Generating…" : "📄 Generate PDF Report"}
              </button>
              <button type="button" onClick={() => void handleCsv()} className="wb-btn-secondary w-full">
                📊 Export CSV
              </button>
              <button type="button" onClick={() => void handleGeo()} className="wb-btn-secondary w-full">
                🗺 Export GeoJSON
              </button>
            </div>
          </div>
        </div>

        <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Report Preview
            </div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">
              Report will include {scoped.length} events matching your criteria
            </div>
          </div>

          <div ref={previewRef} className="space-y-4">
            <div data-wb-page className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-semibold tracking-[-0.04em]">
                    WatchBurn
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-secondary)]">
                    Environmental Detection Report
                  </div>
                  <div className="mt-4 grid gap-1 text-xs text-[var(--text-muted)]">
                    <div>Date range: {config.date_from} → {config.date_to}</div>
                    <div>Region: {config.region}</div>
                    <div>Generated: {new Date().toLocaleString()}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.10)] px-3 py-2 text-xs font-semibold text-[var(--accent-green)]">
                  PDF/A Ready
                </div>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {[
                  { k: "Events", v: scoped.length.toLocaleString() },
                  { k: "High-risk", v: scoped.filter((e) => e.confidence > 0.75).length.toLocaleString() },
                  { k: "Verified", v: scoped.filter((e) => e.status === "verified").length.toLocaleString() },
                  { k: "Coverage", v: "3.5M km²" }
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(2,5,9,0.5)] px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{s.k}</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[var(--text-primary)]">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div data-wb-page className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Sections Included
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[var(--text-secondary)]">
                {sectionOptions.map((s) => {
                  const active = config.sections.includes(s);
                  return (
                    <div key={s} className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[rgba(2,5,9,0.45)] px-3 py-2">
                      <span className={active ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"}>
                        {active ? "✓" : "—"}
                      </span>
                      <span>{s}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 text-xs text-[var(--text-muted)]">
                Estimated pages: ~8 • Format: PDF/A
              </div>
            </div>

            <div data-wb-page className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Event Table (Top 50 by confidence)
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-[rgba(2,5,9,0.6)] text-[var(--text-muted)]">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Conf</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...scoped]
                      .sort((a, b) => b.confidence - a.confidence)
                      .slice(0, 10)
                      .map((e) => (
                        <tr key={e.id} className="border-t border-[var(--border-subtle)]">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <ClassificationIcon classification={e.classification} size={14} />
                              <span className="capitalize text-[var(--text-primary)]">
                                {e.classification.split("_").join(" ")}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {e.location_name || `${e.city}, ${e.country}`}
                          </td>
                          <td className="px-3 py-2 font-mono text-[var(--text-primary)]">
                            {(e.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {e.status}
                          </td>
                          <td className="px-3 py-2 font-mono text-[var(--text-muted)]">
                            {e.timestamp.slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-[var(--text-muted)]">
                Full export includes all filtered events.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Recent Exports
        </div>
        <div className="wb-scroll flex gap-3 overflow-auto pb-2">
          {recent.length === 0 ? (
            <div className="text-sm text-[var(--text-secondary)]">
              No recent exports yet.
            </div>
          ) : (
            recent.map((r, idx) => (
              <div
                key={`${r.date}_${idx}`}
                className="wb-card min-w-[220px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[rgba(0,255,136,0.12)] px-2 py-[2px] text-[10px] font-semibold text-[var(--accent-green)]">
                    {r.format}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {r.type} report
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {r.count} events
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

export default Reports;

