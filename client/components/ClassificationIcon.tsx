import type { WasteClassification } from "../lib/types";

export interface ClassificationIconProps {
  classification: WasteClassification;
  size?: number;
}

export function getClassificationLabel(
  classification: WasteClassification
): string {
  switch (classification) {
    case "illegal_waste_burning":
      return "Illegal Waste Burning";
    case "agricultural_fire":
      return "Agricultural Fire";
    case "industrial_flare":
      return "Industrial Flare";
    case "natural_fire":
      return "Natural Fire";
    default:
      return classification;
  }
}

export function getClassificationColor(
  classification: WasteClassification
): string {
  switch (classification) {
    case "illegal_waste_burning":
      return "var(--accent-red)";
    case "agricultural_fire":
      return "var(--accent-amber)";
    case "industrial_flare":
      return "var(--accent-blue)";
    case "natural_fire":
      return "var(--accent-green)";
    default:
      return "var(--accent-green)";
  }
}

export function ClassificationIcon({
  classification,
  size = 20
}: ClassificationIconProps): JSX.Element {
  const color = getClassificationColor(classification);
  const stroke = "rgba(15,23,42,0.9)";
  const viewBox = "0 0 24 24";

  if (classification === "illegal_waste_burning") {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className="shrink-0"
      >
        <defs>
          <linearGradient id="wbFlameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="60%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>
        <g>
          <path
            d="M12 3c.8 2.5-.5 4.2-1.9 5.4C8.8 9.5 8 10.4 8 12c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.9-1-3.2-1.7-4.2-.6-.9-1.1-1.6-1.3-2.8Z"
            fill="url(#wbFlameGrad)"
            stroke={stroke}
            strokeWidth="1"
          >
            <animate
              attributeName="d"
              dur="1.4s"
              repeatCount="indefinite"
              values="
              M12 3c.8 2.5-.5 4.2-1.9 5.4C8.8 9.5 8 10.4 8 12c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.9-1-3.2-1.7-4.2-.6-.9-1.1-1.6-1.3-2.8Z;
              M12 3c1 2.2-.3 4.1-1.8 5.4C8.7 9.6 8 10.7 8 12.1c0 2.1 1.7 3.8 4 3.8s4.1-1.7 4.1-3.9c0-1.8-1-3.1-1.8-4.1-.7-.9-1.2-1.7-1.3-2.9Z;
              M12 3c.8 2.5-.5 4.2-1.9 5.4C8.8 9.5 8 10.4 8 12c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.9-1-3.2-1.7-4.2-.6-.9-1.1-1.6-1.3-2.8Z
            "
            />
          </path>
          <path
            d="M10.5 13.2c.4-.7 1-1.2 1.5-1.7.4.6.7 1.1.7 1.9 0 1-.7 1.6-1.6 1.6-.8 0-1.5-.6-1.6-1.4"
            fill="rgba(248,250,252,0.9)"
            stroke="none"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              dur="1.2s"
              repeatCount="indefinite"
              values="0.5;0.9;0.5"
            />
          </path>
          <path
            d="M6 18c1.2-.6 2.7-1 4.3-1h3.4c1.6 0 3.1.4 4.3 1"
            stroke="rgba(148,163,184,0.7)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M6 18c1.2.7 2.7 1.1 4.3 1.1h3.4c1.6 0 3.1-.4 4.3-1.1"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.4"
          >
            <animate
              attributeName="opacity"
              dur="1.6s"
              repeatCount="indefinite"
              values="0.2;0.7;0.2"
            />
          </path>
          <g opacity="0.5">
            <circle
              cx="7.5"
              cy="6.5"
              r="0.6"
              fill="rgba(148,163,184,0.6)"
            >
              <animate
                attributeName="cy"
                dur="2.4s"
                repeatCount="indefinite"
                values="7;5;7"
              />
              <animate
                attributeName="opacity"
                dur="2.4s"
                repeatCount="indefinite"
                values="0.2;0.7;0.2"
              />
            </circle>
            <circle
              cx="15.5"
              cy="5.5"
              r="0.5"
              fill="rgba(148,163,184,0.6)"
            >
              <animate
                attributeName="cy"
                dur="2.8s"
                repeatCount="indefinite"
                values="6.5;4.5;6.5"
              />
              <animate
                attributeName="opacity"
                dur="2.8s"
                repeatCount="indefinite"
                values="0.2;0.6;0.2"
              />
            </circle>
          </g>
        </g>
      </svg>
    );
  }

  if (classification === "agricultural_fire") {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className="shrink-0"
      >
        <g>
          <path
            d="M8 18c.8-1.8 1.4-3.6 1.7-5.5.3-1.9.3-3.7.3-5.5"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              dur="2s"
              repeatCount="indefinite"
              values="
              M8 18c.8-1.8 1.4-3.6 1.7-5.5.3-1.9.3-3.7.3-5.5;
              M8 18c.9-1.7 1.5-3.5 1.9-5.3.4-2 .4-3.8.4-5.7;
              M8 18c.8-1.8 1.4-3.6 1.7-5.5.3-1.9.3-3.7.3-5.5
            "
            />
          </path>
          <path
            d="M10 7c-.8.8-1.9 1.4-3.1 1.6"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M10.2 9.4c-.9.8-2.1 1.4-3.5 1.5"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M9.8 11.7c-.9.9-2 1.5-3.4 1.8"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M16 18c-.8-1.8-1.4-3.6-1.7-5.5-.3-1.9-.3-3.7-.3-5.5"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              dur="2.2s"
              repeatCount="indefinite"
              values="
              M16 18c-.8-1.8-1.4-3.6-1.7-5.5-.3-1.9-.3-3.7-.3-5.5;
              M16 18c-.9-1.7-1.5-3.5-1.9-5.3-.4-2-.4-3.8-.4-5.7;
              M16 18c-.8-1.8-1.4-3.6-1.7-5.5-.3-1.9-.3-3.7-.3-5.5
            "
            />
          </path>
          <path
            d="M14 7c.8.8 1.9 1.4 3.1 1.6"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M13.8 9.4c.9.8 2.1 1.4 3.5 1.5"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M14.2 11.7c.9.9 2 1.5 3.4 1.8"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M5 18.5h14"
            stroke="rgba(55,65,81,0.9)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M7 18c.8-.9 1.9-1.5 3-1.5h4c1.1 0 2.2.6 3 1.5"
            stroke="var(--accent-amber)"
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              dur="1.6s"
              repeatCount="indefinite"
              values="0.3;0.9;0.3"
            />
          </path>
          <path
            d="M12 11c.4.6.8 1.2.8 2 0 .9-.6 1.7-1.4 2"
            fill="none"
            stroke="#f97316"
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              dur="1.4s"
              repeatCount="indefinite"
              values="0.4;1;0.4"
            />
          </path>
        </g>
      </svg>
    );
  }

  if (classification === "industrial_flare") {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className="shrink-0"
      >
        <defs>
          <linearGradient id="wbFlareGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5f3ff" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <g>
          <rect
            x="7"
            y="10"
            width="4"
            height="7"
            rx="0.8"
            fill="#0f172a"
            stroke={stroke}
            strokeWidth="1"
          />
          <rect
            x="13"
            y="9"
            width="4"
            height="8"
            rx="0.8"
            fill="#020617"
            stroke={stroke}
            strokeWidth="1"
          />
          <path
            d="M8 10V7.3c0-.7.4-1.3 1-1.6l2.5-1.3"
            stroke="rgba(148,163,184,0.8)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M16 9V6.5c0-.7-.4-1.3-1-1.6L12.5 3.6"
            stroke="rgba(148,163,184,0.8)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M11.5 6c.5.6.9 1.4.9 2.2 0 1.6-1.2 2.8-2.6 2.8"
            fill="url(#wbFlareGrad)"
            stroke="rgba(15,23,42,0.95)"
            strokeWidth="1"
          />
          <path
            d="M12.5 4.2c.4.5.7 1.1.7 1.8 0 1.3-.9 2.4-2.2 2.7"
            fill="none"
            stroke="url(#wbFlareGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              dur="1.2s"
              repeatCount="indefinite"
              values="0.5;1;0.5"
            />
          </path>
          <circle
            cx="12.5"
            cy="4.1"
            r="0.9"
            fill="#e5f3ff"
            stroke="rgba(15,23,42,0.9)"
            strokeWidth="0.5"
          >
            <animate
              attributeName="r"
              dur="1.6s"
              repeatCount="indefinite"
              values="0.7;1.4;0.7"
            />
          </circle>
          <circle
            cx="12.5"
            cy="4.1"
            r="2.4"
            fill="none"
            stroke="rgba(56,189,248,0.4)"
            strokeWidth="1"
          >
            <animate
              attributeName="r"
              dur="1.6s"
              repeatCount="indefinite"
              values="1.8;3.2;1.8"
            />
            <animate
              attributeName="opacity"
              dur="1.6s"
              repeatCount="indefinite"
              values="0.6;0;0.6"
            />
          </circle>
          <path
            d="M5 18.5h14"
            stroke="rgba(55,65,81,0.9)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M6 18c.8-.9 1.9-1.5 3-1.5h6c1.1 0 2.2.6 3 1.5"
            stroke="var(--accent-blue)"
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              dur="1.6s"
              repeatCount="indefinite"
              values="0.3;0.9;0.3"
            />
          </path>
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={viewBox} className="shrink-0">
      <defs>
        <linearGradient id="wbForestGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M7 17c.6-1.3 1.4-2.5 2.4-3.6L8 13.5l2-2.7-1.4-.5L10.7 7 13 10.3l-1.4.5 2 2.7-1.4-.1c1 1.1 1.8 2.3 2.4 3.6"
          fill="url(#wbForestGrad)"
          stroke={stroke}
          strokeWidth="1"
          strokeLinejoin="round"
        >
          <animate
            attributeName="d"
            dur="2.2s"
            repeatCount="indefinite"
            values="
            M7 17c.6-1.3 1.4-2.5 2.4-3.6L8 13.5l2-2.7-1.4-.5L10.7 7 13 10.3l-1.4.5 2 2.7-1.4-.1c1 1.1 1.8 2.3 2.4 3.6;
            M7 17.2c.7-1.5 1.6-2.8 2.6-4L8 13.6l2.1-2.6-1.5-.6L10.8 7l2.3 3.4-1.5.6 2.1 2.6-1.4-.2c1.1 1.2 1.9 2.5 2.6 4;
            M7 17c.6-1.3 1.4-2.5 2.4-3.6L8 13.5l2-2.7-1.4-.5L10.7 7 13 10.3l-1.4.5 2 2.7-1.4-.1c1 1.1 1.8 2.3 2.4 3.6
          "
          />
        </path>
        <rect
          x="11"
          y="14.5"
          width="1.5"
          height="3.5"
          fill="#0f172a"
          stroke={stroke}
          strokeWidth="0.9"
        />
        <path
          d="M5 18.5h14"
          stroke="rgba(55,65,81,0.9)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle
          cx="17.5"
          cy="7"
          r="1.7"
          fill="rgba(239,68,68,0.2)"
          stroke="rgba(248,113,113,0.9)"
          strokeWidth="1"
        >
          <animate
            attributeName="r"
            dur="2s"
            repeatCount="indefinite"
            values="1.5;2.3;1.5"
          />
          <animate
            attributeName="opacity"
            dur="2s"
            repeatCount="indefinite"
            values="0.5;0.9;0.5"
          />
        </circle>
        <circle
          cx="17.5"
          cy="7"
          r="0.7"
          fill="#fee2e2"
        />
        <path
          d="M15.5 17.2c.6-.5 1.3-.8 2.1-.8 1.1 0 2.1.5 2.9 1.3"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <animate
            attributeName="opacity"
            dur="1.8s"
            repeatCount="indefinite"
            values="0.3;0.9;0.3"
          />
        </path>
      </g>
    </svg>
  );
}

export default ClassificationIcon;

