import type { ReactNode, MouseEvent } from "react";
import { useState } from "react";
import useCountUp from "../hooks/useCountUp";

export interface StatCardProps {
  label: string;
  icon: ReactNode;
  value: number;
  format?: (value: number) => string;
  trendLabel: string;
  trendPositive?: boolean;
  accentColor: "green" | "red" | "amber" | "blue";
}

export function StatCard({
  label,
  icon,
  value,
  format,
  trendLabel,
  trendPositive = true,
  accentColor
}: StatCardProps): JSX.Element {
  const animatedValue = useCountUp(value);
  const [glowPos, setGlowPos] = useState<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5
  });

  const display =
    format?.(animatedValue) ?? Math.round(animatedValue).toLocaleString();

  const borderColor =
    accentColor === "green"
      ? "border-[var(--accent-green)]"
      : accentColor === "red"
      ? "border-[var(--accent-red)]"
      : accentColor === "amber"
      ? "border-[var(--accent-amber)]"
      : "border-[var(--accent-blue)]";

  const glowShadow =
    accentColor === "green"
      ? "shadow-wb-glow-green"
      : accentColor === "red"
      ? "shadow-wb-glow-red"
      : accentColor === "amber"
      ? "shadow-wb-glow-amber"
      : "shadow-[0_0_24px_rgba(96,165,250,0.25),0_0_48px_rgba(37,99,235,0.15)]";

  const onMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setGlowPos({ x, y });
  };

  return (
    <div
      className={`wb-card relative flex flex-col rounded-2xl border-l-4 ${borderColor} bg-[var(--bg-card)] p-5 ${glowShadow}`}
      onMouseMove={onMouseMove}
    >
      <div
        className="wb-card-cursor-glow"
        style={{
          background: `radial-gradient(circle at ${glowPos.x * 100}% ${
            glowPos.y * 100
          }%, rgba(0,255,136,0.16), transparent 55%)`
        }}
      />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {icon}
          <span>{label}</span>
        </div>
      </div>
      <div className="mb-3 text-3xl font-semibold text-[var(--text-primary)]">
        <span className="font-mono">{display}</span>
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        <span
          className={
            trendPositive
              ? "text-[var(--accent-green)]"
              : "text-[var(--accent-red)]"
          }
        >
          {trendPositive ? "↑ " : "↓ "}
        </span>
        {trendLabel}
      </div>
    </div>
  );
}

export default StatCard;

