import type { WasteClassification } from "../lib/types";
import ClassificationIcon, {
  getClassificationLabel
} from "./ClassificationIcon";

interface ClassificationBarProps {
  value: string;
  onChange: (value: string) => void;
}

const options: { value: string; label: string; classification?: WasteClassification }[] =
  [
    { value: "all", label: "All" },
    { value: "illegal_waste_burning", label: "Waste", classification: "illegal_waste_burning" },
    { value: "agricultural_fire", label: "Agriculture", classification: "agricultural_fire" },
    { value: "industrial_flare", label: "Industrial", classification: "industrial_flare" },
    { value: "natural_fire", label: "Natural", classification: "natural_fire" }
  ];

export function ClassificationBar({
  value,
  onChange
}: ClassificationBarProps): JSX.Element {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[rgba(15,23,42,0.85)] px-1 py-1 text-xs text-[var(--text-secondary)]">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "flex items-center gap-1 rounded-full px-2 py-1 transition-all",
              active
                ? "bg-[rgba(0,255,136,0.16)] text-[var(--accent-green)]"
                : "text-[var(--text-secondary)] hover:bg-[rgba(15,23,42,0.9)] hover:text-[var(--text-primary)]"
            ].join(" ")}
          >
            {opt.classification ? (
              <ClassificationIcon classification={opt.classification} size={14} />
            ) : (
              <span className="text-xs">◎</span>
            )}
            <span className="hidden sm:inline">
              {opt.classification
                ? getClassificationLabel(opt.classification).split(" ")[0]
                : opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default ClassificationBar;

