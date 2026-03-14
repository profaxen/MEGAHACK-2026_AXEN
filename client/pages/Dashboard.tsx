import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Layers,
  Clock3,
  SatelliteDish
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import StatCard from "../components/StatCard";
import EventCard, { EventCardSkeleton } from "../components/EventCard";
import ClassificationBar from "../components/ClassificationBar";
import EventMap from "../components/Map";
import { useEvents } from "../hooks/useEvents";
import type { WasteBurnEvent, Cluster } from "../lib/types";
import { getClusters } from "../lib/firebase";

function StatsSkeletonRow(): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="wb-card h-[116px] rounded-2xl border border-[var(--border-subtle)] p-5"
        >
          <div className="wb-skeleton mb-4 h-3 w-32 rounded-full" />
          <div className="wb-skeleton h-8 w-24 rounded-xl" />
          <div className="wb-skeleton mt-4 h-3 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const { events, loading, filters, setFilters } = useEvents();
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useMemo(() => {
    void getClusters().then(setClusters).catch(() => setClusters([]));
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesClass =
        !filters.classification ||
        filters.classification === "all" ||
        e.classification === filters.classification;
      const matchesStatus =
        !filters.status ||
        filters.status === "all" ||
        e.status === filters.status;
      const matchesConf = e.confidence >= (filters.confidence_min || 0) / 100;
      return matchesClass && matchesStatus && matchesConf;
    });
  }, [events, filters]);

  const highRisk = useMemo(
    () => filteredEvents.filter((e) => e.confidence > 0.75).length,
    [filteredEvents]
  );

  const pending = useMemo(
    () => filteredEvents.filter((e) => e.status === "pending").length,
    [filteredEvents]
  );

  const activeClusters = useMemo(() => {
    const set = new Set<string>();
    filteredEvents.forEach((e) => {
      if (e.cluster_id) set.add(e.cluster_id);
    });
    return set.size;
  }, [filteredEvents]);

  const onSelectEvent = (id: string): void => {
    navigate(`/events/${id}`);
  };

  const listToRender: WasteBurnEvent[] = useMemo(() => {
    const list = [...filteredEvents];
    list.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return list;
  }, [filteredEvents]);

  return (
    <PageWrapper>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Live Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Realtime detections, clusters, and risk visualization.
          </p>
        </div>
        <div className="hidden md:block">
          <ClassificationBar
            value={filters.classification}
            onChange={(v) =>
              setFilters((prev) => ({ ...prev, classification: v }))
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total Detections"
            icon={<SatelliteDish className="h-4 w-4 text-[var(--accent-green)]" />}
            value={filteredEvents.length}
            trendLabel="+12% vs last week"
            trendPositive
            accentColor="green"
          />
          <StatCard
            label="High-Risk Events"
            icon={<Flame className="h-4 w-4 text-[var(--accent-red)]" />}
            value={highRisk}
            trendLabel="+7% vs last week"
            trendPositive
            accentColor="red"
          />
          <StatCard
            label="Pending Verification"
            icon={<Clock3 className="h-4 w-4 text-[var(--accent-amber)]" />}
            value={pending}
            trendLabel="-2% vs last week"
            trendPositive={false}
            accentColor="amber"
          />
          <StatCard
            label="Active Clusters"
            icon={<Layers className="h-4 w-4 text-[var(--accent-blue)]" />}
            value={activeClusters}
            trendLabel="+3% vs last week"
            trendPositive
            accentColor="blue"
          />
        </div>


      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative">
          <EventMap
            events={listToRender}
            clusters={clusters}
            onSelectEvent={onSelectEvent}
          />
        </div>

        <div className="wb-card flex h-[620px] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[rgba(13,20,33,0.85)] px-4 py-3 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Events
            </div>
            <div className="font-mono text-[11px] text-[var(--text-secondary)]">
              {listToRender.length} events
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3 md:hidden">
            <ClassificationBar
              value={filters.classification}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, classification: v }))
              }
            />
          </div>

          <div className="wb-scroll flex-1 overflow-auto px-4 py-4">
            {loading ? (
              <>
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
              </>
            ) : (
              listToRender.slice(0, 80).map((e) => (
                <EventCard key={e.id} event={e} onClick={() => onSelectEvent(e.id)} />
              ))
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Dashboard;

