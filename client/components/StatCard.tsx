import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  trend?: string;
  trendUp?: boolean;
  accentColor: string;
  format?: (n: number) => string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp = true,
  accentColor,
  format = (n) => n.toLocaleString(),
}: StatCardProps) {
  const animatedValue = useCountUp(value, 1200);

  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      }}
      className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accentColor }}
      />
      <div className="pl-4">
        <div className="flex items-center gap-2">
          <Icon
            className="h-5 w-5"
            style={{ color: accentColor }}
          />
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </span>
        </div>
        <p
          className="mt-2 font-mono text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {format(animatedValue)}
        </p>
        {trend && (
          <p
            className="mt-1 text-sm"
            style={{
              color: trendUp ? "var(--accent-green)" : "var(--accent-red)",
            }}
          >
            {trend}
          </p>
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle), 0 0 24px ${accentColor}40`,
        }}
      />
    </motion.div>
  );
}
