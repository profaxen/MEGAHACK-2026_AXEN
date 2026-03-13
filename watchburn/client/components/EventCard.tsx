import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { WasteBurnEvent, Classification } from "@/lib/types";
import { getLocationName } from "@/lib/geocode";

const classificationColors: Record<Classification, string> = {
  illegal_waste_burning: "var(--accent-red)",
  agricultural_fire: "var(--accent-amber)",
  industrial_flare: "var(--accent-blue)",
  natural_fire: "var(--accent-green)",
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: {
    bg: "rgba(245,158,11,0.2)",
    text: "var(--accent-amber)",
  },
  verified: {
    bg: "rgba(0,255,136,0.2)",
    text: "var(--accent-green)",
  },
  rejected: {
    bg: "rgba(239,68,68,0.1)",
    text: "var(--text-muted)",
  },
};

function formatClassification(c: Classification): string {
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
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

interface EventCardProps {
  event: WasteBurnEvent;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const confColor = classificationColors[event.classification];
  const statusStyle = statusStyles[event.status];
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLocationName(event.lat, event.lon).then((label) => {
      if (!cancelled) {
        setLocationLabel(label);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [event.lat, event.lon]);

  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      }}
      onClick={() => navigate(`/events/${event.id}`)}
      className="cursor-pointer rounded-xl p-4 transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.boxShadow =
          "0 4px 16px rgba(0,0,0,0.5), 0 0 24px rgba(0,255,136,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-xs font-medium"
          style={{
            background: `${confColor}20`,
            color: confColor,
          }}
        >
          {formatClassification(event.classification)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
          }}
        >
          {event.status}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, ${confColor}, ${confColor}99)`,
            width: `${event.confidence * 100}%`,
          }}
        />
      </div>
      <p
        className="mt-1 text-right font-mono text-xs"
        style={{ color: confColor }}
      >
        {Math.round(event.confidence * 100)}%
      </p>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span
          className="font-mono"
          style={{ color: "var(--text-secondary)" }}
        >
          {locationLabel ?? `${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}`}
        </span>
        <span
          className="font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {event.satellite_source}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span
          className="rounded border px-2 py-0.5 text-xs"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          {event.land_use}
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {formatRelativeTime(event.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

export function EventCardSkeleton() {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="h-5 w-24 animate-pulse rounded"
          style={{ background: "var(--border-subtle)" }}
        />
        <div
          className="h-5 w-16 animate-pulse rounded-full"
          style={{ background: "var(--border-subtle)" }}
        />
      </div>
      <div
        className="mt-2 h-1.5 w-full animate-pulse rounded-full"
        style={{ background: "var(--border-subtle)" }}
      />
      <div className="mt-3 flex justify-between">
        <div
          className="h-3 w-24 animate-pulse rounded"
          style={{ background: "var(--border-subtle)" }}
        />
        <div
          className="h-3 w-16 animate-pulse rounded"
          style={{ background: "var(--border-subtle)" }}
        />
      </div>
      <div className="mt-2 flex justify-between">
        <div
          className="h-3 w-20 animate-pulse rounded"
          style={{ background: "var(--border-subtle)" }}
        />
        <div
          className="h-3 w-16 animate-pulse rounded"
          style={{ background: "var(--border-subtle)" }}
        />
      </div>
    </div>
  );
}
