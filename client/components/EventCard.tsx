import type { MouseEvent } from "react";
import { useState } from "react";
import { Clock3 } from "lucide-react";
import type { WasteBurnEvent } from "../lib/types";
import ClassificationIcon, {
  getClassificationLabel,
  getClassificationColor
} from "./ClassificationIcon";

interface EventCardProps {
  event: WasteBurnEvent;
  onClick?: () => void;
}

export function formatRelativeTime(timestamp: string): string {
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${mins} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(diffHours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function EventCardSkeleton(): JSX.Element {
  return (
    <div className="wb-card mb-3 rounded-xl border border-[var(--border-subtle)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="wb-skeleton h-4 w-24 rounded-full" />
        <div className="wb-skeleton h-4 w-16 rounded-full" />
      </div>
      <div className="mb-3 h-2 w-full rounded-full wb-skeleton" />
      <div className="mb-2 flex justify-between gap-2 text-xs">
        <div className="wb-skeleton h-3 w-32 rounded-full" />
        <div className="wb-skeleton h-3 w-20 rounded-full" />
      </div>
      <div className="flex justify-between gap-2 text-xs">
        <div className="wb-skeleton h-4 w-20 rounded-full" />
        <div className="wb-skeleton h-3 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function EventCard({ event, onClick }: EventCardProps): JSX.Element {
  const [glowPos, setGlowPos] = useState<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5
  });

  const onMouseMove = (e: MouseEvent<HTMLButtonElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setGlowPos({ x, y });
  };

  const classificationLabel = getClassificationLabel(event.classification);
  const color = getClassificationColor(event.classification);

  const statusColor =
    event.status === "pending"
      ? "bg-[rgba(245,158,11,0.12)] text-[var(--accent-amber)] border-[rgba(245,158,11,0.3)]"
      : event.status === "verified"
      ? "bg-[rgba(34,197,94,0.12)] text-[var(--accent-green)] border-[rgba(34,197,94,0.4)]"
      : "bg-[rgba(148,163,184,0.15)] text-[rgba(148,163,184,0.9)] border-[rgba(148,163,184,0.35)]";

  const statusLabel =
    event.status === "pending"
      ? "Pending"
      : event.status === "verified"
      ? "Verified"
      : "Rejected";

  const location =
    event.location_name ||
    [event.city, event.country].filter(Boolean).join(", ") ||
    `${event.lat.toFixed(3)}, ${event.lon.toFixed(3)}`;

  const confidencePercent = Math.round(event.confidence * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={onMouseMove}
      className="wb-card mb-3 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:shadow-wb-glow-green"
    >
      <div
        className="wb-card-cursor-glow"
        style={{
          background: `radial-gradient(circle at ${glowPos.x * 100}% ${
            glowPos.y * 100
          }%, rgba(0,255,136,0.18), transparent 55%)`
        }}
      />
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <ClassificationIcon classification={event.classification} />
          <span>{classificationLabel}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[11px] font-medium ${statusColor}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <span className="text-[var(--accent-green)]">📍</span>
          <span className="truncate">{location}</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {event.satellite_source}
        </span>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[rgba(15,23,42,0.9)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${confidencePercent}%`,
              backgroundImage:
                confidencePercent > 80
                  ? "linear-gradient(90deg,#ef4444,#f97316)"
                  : confidencePercent > 60
                  ? "linear-gradient(90deg,#f59e0b,#eab308)"
                  : "linear-gradient(90deg,#22c55e,#4ade80)"
            }}
          />
        </div>
        <span
          className="w-12 text-right font-mono text-[11px]"
          style={{ color }}
        >
          {confidencePercent}%
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1 font-mono">
          <Clock3 className="h-3 w-3" />
          <span>{formatRelativeTime(event.timestamp)}</span>
        </span>
        <span className="rounded-full border border-[var(--border-subtle)] px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          {event.land_use}
        </span>
      </div>
    </button>
  );
}

export default EventCard;

