import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Download } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { MOCK_EVENTS, getMockTrends } from "@/lib/mock-data";

const chartColors = {
  blue: "#60a5fa",
  green: "#00ff88",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a78bfa",
};

const classificationColors: Record<string, string> = {
  illegal_waste_burning: "#ef4444",
  agricultural_fire: "#f59e0b",
  industrial_flare: "#60a5fa",
  natural_fire: "#22c55e",
};

const rangeOptions = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
  { value: 365, label: "All Time" },
];

export function Analytics() {
  const { events } = useEvents();
  const [range, setRange] = useState(30);

  const data = events.length > 0 ? events : MOCK_EVENTS;
  const trends = useMemo(() => getMockTrends(Math.min(range, 90)), [range]);

  const classificationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of data) {
      counts[e.classification] = (counts[e.classification] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
      fill: classificationColors[name] || chartColors.blue,
    }));
  }, [data]);

  const confidenceBuckets = useMemo(() => {
    const buckets = Array(10)
      .fill(0)
      .map((_, i) => ({
        range: `${i * 10}-${(i + 1) * 10}%`,
        count: 0,
      }));
    for (const e of data) {
      const idx = Math.min(Math.floor(e.confidence * 10), 9);
      buckets[idx].count++;
    }
    return buckets.map((b, i) => ({
      ...b,
      fill: `hsl(${120 - i * 12}, 70%, 50%)`,
    }));
  }, [data]);

  const landUseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of data) {
      counts[e.land_use] = (counts[e.land_use] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, count: value }));
  }, [data]);

  const hourlyPattern = useMemo(() => {
    const hours = Array(24)
      .fill(0)
      .map((_, i) => ({ hour: i, count: 0, label: `${i}h` }));
    for (const e of data) {
      const h = new Date(e.timestamp).getHours();
      hours[h].count++;
    }
    return hours;
  }, [data]);

  const topLocations = useMemo(() => {
    const byCoords = new Map<string, { events: typeof data; avgConf: number }>();
    for (const e of data) {
      const key = `${e.lat.toFixed(2)},${e.lon.toFixed(2)}`;
      const existing = byCoords.get(key);
      if (!existing) {
        byCoords.set(key, { events: [e], avgConf: e.confidence });
      } else {
        existing.events.push(e);
        existing.avgConf =
          (existing.avgConf * (existing.events.length - 1) + e.confidence) /
          existing.events.length;
      }
    }
    return Array.from(byCoords.entries())
      .map(([coords, { events: evs, avgConf }]) => ({
        coords,
        count: evs.length,
        avgConf,
        lastDetected: evs
          .map((e) => new Date(e.timestamp).getTime())
          .sort((a, b) => b - a)[0],
        riskLevel:
          avgConf > 0.75 ? "high" : avgConf > 0.5 ? "medium" : "low",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl border px-4 py-3"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {payload[0]?.value}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: "var(--bg-surface)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Detection Analytics
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              {rangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: range === opt.value ? "var(--accent-green)" : "var(--text-secondary)",
                    background: range === opt.value ? "rgba(0,255,136,0.1)" : "transparent",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.blue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={chartColors.blue} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.green} stopOpacity={0.25} />
              <stop offset="100%" stopColor={chartColors.green} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke={chartColors.blue} fill="url(#blueGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="illegal_count" stroke={chartColors.green} fill="url(#greenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-end gap-4">
            <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="h-3 w-3 rounded-full" style={{ background: chartColors.blue }} />
              Total events
            </span>
            <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="h-3 w-3 rounded-full" style={{ background: chartColors.green }} />
              Illegal waste only
            </span>
          </div>
        </div>

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="mb-6 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Classification Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={classificationCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {classificationCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) =>
                    payload?.[0] ? (
                      <div
                        className="rounded-xl border px-4 py-3"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: "var(--border-default)",
                        }}
                      >
                        <p className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                          {payload[0].value} events
                        </p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {data.length}
            </p>
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              events
            </p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="mb-6 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Confidence Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={confidenceBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={chartColors.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="mb-6 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Events by Land Use
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={landUseCounts} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} width={80} />
                <Bar dataKey="count" fill="rgba(0,255,136,0.7)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="mb-6 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Hourly Detection Pattern
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hourlyPattern}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColors.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 10 }} ticks={[0, 6, 12, 18, 23]} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={6} stroke={chartColors.amber} strokeDasharray="4 4" />
                <ReferenceLine x={18} stroke={chartColors.amber} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="count" stroke={chartColors.green} strokeWidth={2.5} dot={{ r: 3 }} fill="url(#lineGrad)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="p-6">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Top 10 Detection Locations
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  Coordinates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  Avg Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  Last Detected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody>
              {topLocations.map((loc, i) => (
                <tr
                  key={loc.coords}
                  className="transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                    {i + 1}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {loc.coords}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {loc.count}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {(loc.avgConf * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {loc.lastDetected ? new Date(loc.lastDetected).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{
                        background: loc.riskLevel === "high" ? "rgba(239,68,68,0.2)" : loc.riskLevel === "medium" ? "rgba(245,158,11,0.2)" : "rgba(0,255,136,0.2)",
                        color: loc.riskLevel === "high" ? "var(--accent-red)" : loc.riskLevel === "medium" ? "var(--accent-amber)" : "var(--accent-green)",
                      }}
                    >
                      {loc.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
