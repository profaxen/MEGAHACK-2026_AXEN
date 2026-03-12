import { motion } from "framer-motion";
import type { WasteBurnEvent } from "@/lib/types";

const classColors: Record<string, string> = {
  illegal_waste_burning: "var(--accent-red)",
  agricultural_fire: "var(--accent-amber)",
  industrial_flare: "var(--accent-blue)",
  natural_fire: "var(--accent-green)",
};

const classLabels: Record<string, string> = {
  illegal_waste_burning: "Illegal Waste",
  agricultural_fire: "Agricultural",
  industrial_flare: "Industrial",
  natural_fire: "Natural",
};

interface ClassificationBarProps {
  event: WasteBurnEvent;
}

export function ClassificationBar({ event }: ClassificationBarProps) {
  const classes = [
    "illegal_waste_burning",
    "agricultural_fire",
    "industrial_flare",
    "natural_fire",
  ] as const;
  const probs = event.class_probabilities;
  const maxProb = Math.max(...Object.values(probs));

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Classification Probabilities
      </h4>
      {classes.map((key) => {
        const p = probs[key] ?? 0;
        const color = classColors[key];
        const isMax = p === maxProb && p > 0;
        return (
          <div
            key={key}
            className="flex items-center gap-3"
            style={{
              background: isMax ? `${color}15` : "transparent",
              borderRadius: 8,
              padding: isMax ? "4px 8px" : "0 8px",
            }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span
              className="w-24 shrink-0 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {classLabels[key]}
            </span>
            <div className="flex-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p * 100}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="h-2 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${color}, ${color}99)`,
                }}
              />
            </div>
            <span
              className="w-12 text-right font-mono text-sm"
              style={{
                color: "var(--text-primary)",
                fontWeight: isMax ? 600 : 400,
              }}
            >
              {Math.round(p * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
