import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import PageWrapper from "../components/PageWrapper";
import { useEvents } from "../hooks/useEvents";
import ClassificationIcon from "../components/ClassificationIcon";
import type { WasteClassification, WasteBurnEvent } from "../lib/types";
import { EventCardSkeleton } from "../components/EventCard";

type RangeKey = "7D" | "30D" | "90D" | "ALL";

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function clampEventsByRange(events: WasteBurnEvent[], range: RangeKey): WasteBurnEvent[] {
  if (range === "ALL") return events;
  const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  return events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

function chartTooltip(): JSX.Element {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 shadow-wb-level-3">
      <div className="text-[11px] text-[var(--text-muted)]">Tooltip</div>
      <div className="text-sm font-semibold text-[var(--text-primary)]">
        —
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  label,
  payload
}: {
  active?: boolean;
  label?: string;
  payload?: { name?: string; value?: number; color?: string }[];
}): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 shadow-wb-level-3">
      <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 space-y-1">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-6">
            <span className="text-xs text-[var(--text-secondary)]">
              {p.name}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {typeof p.value === "number" ? p.value.toLocaleString() : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const classColors: Record<WasteClassification, string> = {
  illegal_waste_burning: "var(--accent-red)",
  agricultural_fire: "var(--accent-amber)",
  industrial_flare: "var(--accent-blue)",
  natural_fire: "var(--accent-green)"
};

export function Analytics(): JSX.Element {
  const { events, loading } = useEvents();
  const [range, setRange] = useState<RangeKey>("30D");

  const scoped = useMemo(() => clampEventsByRange(events, range), [events, range]);

  const daily = useMemo(() => {
    const map = new Map<string, { date: string; count: number; illegal_count: number }>();
    scoped.forEach((e) => {
      const k = dayKey(e.timestamp);
      const cur = map.get(k) ?? { date: k, count: 0, illegal_count: 0 };
      cur.count += 1;
      if (e.classification === "illegal_waste_burning") cur.illegal_count += 1;
      map.set(k, cur);
    });
    const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    return arr;
  }, [scoped]);

  const classificationCounts = useMemo(() => {
    const base: Record<WasteClassification, number> = {
      illegal_waste_burning: 0,
      agricultural_fire: 0,
      industrial_flare: 0,
      natural_fire: 0
    };
    scoped.forEach((e) => {
      base[e.classification] += 1;
    });
    return base;
  }, [scoped]);

  const donutData = useMemo(
    () =>
      (Object.keys(classificationCounts) as WasteClassification[]).map((k) => ({
        key: k,
        name:
          k === "illegal_waste_burning"
            ? "Illegal Waste"
            : k === "agricultural_fire"
            ? "Agriculture"
            : k === "industrial_flare"
            ? "Industrial"
            : "Natural",
        value: classificationCounts[k]
      })),
    [classificationCounts]
  );

  const confidenceBuckets = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      name: `${i * 10}-${i * 10 + 10}%`,
      idx: i,
      count: 0
    }));
    scoped.forEach((e) => {
      const b = Math.min(9, Math.floor(e.confidence * 10));
      buckets[b].count += 1;
    });
    return buckets;
  }, [scoped]);

  const landUse = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((e) => map.set(e.land_use, (map.get(e.land_use) ?? 0) + 1));
    const arr = Array.from(map.entries())
      .map(([k, v]) => ({ name: k, count: v }))
      .sort((a, b) => b.count - a.count);
    return arr;
  }, [scoped]);

  const hourly = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    scoped.forEach((e) => {
      const h = new Date(e.timestamp).getHours();
      arr[h].count += 1;
    });
    return arr;
  }, [scoped]);

  const topLocations = useMemo(() => {
    const map = new Map<string, { key: string; count: number; sum: number; last: string }>();
    scoped.forEach((e) => {
      const key = e.location_name || `${e.city},${e.country}` || `${e.lat.toFixed(2)},${e.lon.toFixed(2)}`;
      const cur = map.get(key) ?? { key, count: 0, sum: 0, last: e.timestamp };
      cur.count += 1;
      cur.sum += e.confidence;
      if (e.timestamp > cur.last) cur.last = e.timestamp;
      map.set(key, cur);
    });
    const arr = Array.from(map.values()).sort((a, b) => b.count - a.count);
    return arr.slice(0, 10).map((r, idx) => ({
      rank: idx + 1,
      location: r.key,
      events: r.count,
      avg: r.sum / r.count,
      last: r.last,
      risk:
        r.count >= 8 || r.sum / r.count > 0.8
          ? "High"
          : r.count >= 4 || r.sum / r.count > 0.65
          ? "Medium"
          : "Low"
    }));
  }, [scoped]);

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Detection Analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Trends, distributions, and high-signal locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["7D", "30D", "90D", "ALL"] as RangeKey[]).map((k) => {
            const active = range === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={[
                  "rounded-full border px-3 py-1 text-xs transition-all",
                  active
                    ? "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.12)] text-[var(--accent-green)]"
                    : "border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                ].join(" ")}
              >
                {k}
              </button>
            );
          })}
          <button type="button" className="wb-btn-secondary rounded-full px-4 py-2 text-xs">
            Export Data ↓
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <div className="wb-card h-[280px] rounded-2xl border border-[var(--border-subtle)] p-4">
            <EventCardSkeleton />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="wb-card h-[280px] rounded-2xl border border-[var(--border-subtle)] p-4" />
            <div className="wb-card h-[280px] rounded-2xl border border-[var(--border-subtle)] p-4" />
          </div>
        </div>
      ) : (
        <>
          <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Detection Trends
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(74,85,104,0.9)"
                    tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis
                    stroke="rgba(74,85,104,0.9)"
                    tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Total events"
                    stroke="#60a5fa"
                    strokeWidth={2.5}
                    fill="url(#blueGrad)"
                    isAnimationActive
                  />
                  <Area
                    type="monotone"
                    dataKey="illegal_count"
                    name="Illegal waste only"
                    stroke="#00ff88"
                    strokeWidth={2.5}
                    fill="url(#greenGrad)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Classification
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      isAnimationActive
                    >
                      {donutData.map((d) => (
                        <Cell key={d.key} fill={classColors[d.key]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                {donutData.map((d) => (
                  <div key={d.key} className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(13,20,33,0.55)] px-3 py-1">
                    <ClassificationIcon classification={d.key} size={14} />
                    <span>{d.name}</span>
                    <span className="font-mono text-[11px] text-[var(--text-primary)]">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Confidence Distribution
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(74,85,104,0.9)"
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <YAxis
                      stroke="rgba(74,85,104,0.9)"
                      tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive>
                      {confidenceBuckets.map((b) => {
                        const t = b.idx / 9;
                        const color =
                          t < 0.4
                            ? "rgba(34,197,94,0.8)"
                            : t < 0.7
                            ? "rgba(245,158,11,0.85)"
                            : "rgba(239,68,68,0.85)";
                        return <Cell key={b.name} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Events by Land Use
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={landUse} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      type="number"
                      stroke="rgba(74,85,104,0.9)"
                      tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="rgba(74,85,104,0.9)"
                      tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="rgba(0,255,136,0.7)" isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Hourly Detection Pattern
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="hour"
                      stroke="rgba(74,85,104,0.9)"
                      tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                      tickFormatter={(h) => `${h}h`}
                    />
                    <YAxis
                      stroke="rgba(74,85,104,0.9)"
                      tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={6} stroke="rgba(245,158,11,0.6)" strokeDasharray="6 6" />
                    <ReferenceLine x={18} stroke="rgba(245,158,11,0.6)" strokeDasharray="6 6" />
                    <Line type="monotone" dataKey="count" stroke="var(--accent-green)" strokeWidth={2.5} dot={false} isAnimationActive />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 wb-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Top 10 Detection Locations
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Events</th>
                    <th className="px-3 py-3">Avg Conf</th>
                    <th className="px-3 py-3">Last</th>
                    <th className="px-3 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocations.map((r) => (
                    <tr
                      key={r.rank}
                      className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="px-3 py-3 font-mono text-[var(--text-secondary)]">
                        {r.rank}
                      </td>
                      <td className="px-3 py-3 text-[var(--text-primary)]">
                        {r.location}
                      </td>
                      <td className="px-3 py-3 font-mono text-[var(--text-primary)]">
                        {r.events}
                      </td>
                      <td className="px-3 py-3 font-mono text-[var(--text-primary)]">
                        {(r.avg * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-3 font-mono text-[var(--text-secondary)]">
                        {r.last.slice(0, 10)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                            r.risk === "High"
                              ? "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.12)] text-[var(--accent-red)]"
                              : r.risk === "Medium"
                              ? "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] text-[var(--accent-amber)]"
                              : "border-[rgba(0,255,136,0.4)] bg-[rgba(0,255,136,0.10)] text-[var(--accent-green)]"
                          ].join(" ")}
                        >
                          {r.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}

export default Analytics;

