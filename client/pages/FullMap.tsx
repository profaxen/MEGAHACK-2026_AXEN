import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EventMap from "../components/Map";
import ClassificationBar from "../components/ClassificationBar";
import { useEvents } from "../hooks/useEvents";
import type { Cluster } from "../lib/types";
import { getClusters } from "../lib/firebase";
import { motion } from "framer-motion";

export function FullMap(): JSX.Element {
  const navigate = useNavigate();
  const { events, filters, setFilters } = useEvents();
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

  const onSelectEvent = (id: string): void => {
    navigate(`/events/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-base)]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[rgba(13,20,33,0.92)] px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-all hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Full Map View
          </h1>
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--accent-green)]">
            {filteredEvents.length} events
          </span>
        </div>
        <ClassificationBar
          value={filters.classification}
          onChange={(v) =>
            setFilters((prev) => ({ ...prev, classification: v }))
          }
        />
      </div>

      {/* Full-screen map */}
      <div className="relative flex-1">
        <EventMap
          events={filteredEvents}
          clusters={clusters}
          onSelectEvent={onSelectEvent}
          fullscreen
        />
      </div>
    </motion.div>
  );
}

export default FullMap;
