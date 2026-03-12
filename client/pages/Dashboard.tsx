import { Satellite, Flame, Clock, Layers } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useStats } from "@/hooks/useStats";
import { StatCard } from "@/components/StatCard";
import { Map } from "@/components/Map";
import { EventCard, EventCardSkeleton } from "@/components/EventCard";
import type { Classification } from "@/lib/types";

const classificationOptions = [
  { value: "all", label: "All" },
  { value: "illegal_waste_burning", label: "Illegal Waste" },
  { value: "agricultural_fire", label: "Agricultural" },
  { value: "industrial_flare", label: "Industrial" },
  { value: "natural_fire", label: "Natural" },
];

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

export function Dashboard() {
  const { events, loading, filters, setFilters } = useEvents();
  const { stats } = useStats();

  const filteredEvents = events.filter((e) => {
    if (filters.classification && filters.classification !== "all" && e.classification !== filters.classification)
      return false;
    if (filters.status && filters.status !== "all" && e.status !== filters.status)
      return false;
    if (filters.confidence_min > 0 && e.confidence < filters.confidence_min / 100)
      return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: "var(--bg-surface)" }}>
      <div className="mx-auto max-w-[1600px] px-6">
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Satellite}
            label="Total Detections"
            value={stats?.total ?? 0}
            trend="↑ +12% vs last week"
            trendUp
            accentColor="var(--accent-green)"
          />
          <StatCard
            icon={Flame}
            label="High-Risk Events"
            value={stats?.high_risk ?? 0}
            trend="↑ +8% vs last week"
            trendUp={false}
            accentColor="var(--accent-red)"
          />
          <StatCard
            icon={Clock}
            label="Pending Verification"
            value={stats?.pending ?? 0}
            trend="↓ -5% vs last week"
            trendUp
            accentColor="var(--accent-amber)"
          />
          <StatCard
            icon={Layers}
            label="Active Clusters"
            value={12}
            trend="3 new this week"
            trendUp
            accentColor="var(--accent-blue)"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[65%_35%]">
          <div className="min-h-[620px]">
            <Map events={filteredEvents} height={620} />
          </div>

          <div className="flex flex-col">
            <div
              className="sticky top-24 z-10 mb-4 rounded-xl p-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <select
                  value={filters.classification}
                  onChange={(e) =>
                    setFilters({ classification: e.target.value as Classification | "all" })
                  }
                  className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  {classificationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value })}
                  className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.confidence_min}
                    onChange={(e) =>
                      setFilters({ confidence_min: Number(e.target.value) })
                    }
                    className="h-2 w-24 rounded-lg"
                    style={{ accentColor: "var(--accent-green)" }}
                  />
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Min: {filters.confidence_min}%
                  </span>
                </div>
              </div>
              <p
                className="font-mono text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {filteredEvents.length} events
              </p>
            </div>

            <div
              className="flex-1 space-y-4 overflow-y-auto"
              style={{ maxHeight: 540 }}
            >
              {loading ? (
                <>
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                </>
              ) : (
                filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
