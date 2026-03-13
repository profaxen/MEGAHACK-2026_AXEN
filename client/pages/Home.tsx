import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Satellite, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import useCountUp from "../hooks/useCountUp";

function LiveStat({
  icon,
  value,
  label
}: {
  icon: JSX.Element;
  value: number;
  label: string;
}): JSX.Element {
  const v = useCountUp(value);
  return (
    <div className="flex items-center gap-2">
      <div className="text-[var(--text-secondary)]">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
          {Math.round(v).toLocaleString()}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      </div>
    </div>
  );
}

function OrbitVisual(): JSX.Element {
  return (
    <div className="relative h-[420px] w-full">
      <div className="absolute inset-0 rounded-3xl border border-[var(--border-subtle)] bg-[rgba(13,20,33,0.35)] shadow-wb-level-2" />

      <svg
        viewBox="0 0 520 420"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="wbGlobeStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(96,165,250,0.7)" />
            <stop offset="50%" stopColor="rgba(0,255,136,0.6)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.6)" />
          </linearGradient>
        </defs>

        <g opacity="0.95">
          <circle
            cx="260"
            cy="210"
            r="120"
            fill="rgba(2,6,23,0.2)"
            stroke="url(#wbGlobeStroke)"
            strokeWidth="3"
          />
          <ellipse
            cx="260"
            cy="210"
            rx="190"
            ry="90"
            fill="none"
            stroke="rgba(148,163,184,0.25)"
            strokeDasharray="6 8"
            strokeWidth="2"
          />
          <ellipse
            cx="260"
            cy="210"
            rx="160"
            ry="140"
            fill="none"
            stroke="rgba(148,163,184,0.18)"
            strokeDasharray="6 10"
            strokeWidth="2"
          />
        </g>

        <g>
          <circle cx="220" cy="165" r="6" fill="rgba(0,255,136,0.9)">
            <animate
              attributeName="opacity"
              dur="2.4s"
              repeatCount="indefinite"
              values="0.2;1;0.2"
            />
          </circle>
          <circle cx="310" cy="260" r="5" fill="rgba(96,165,250,0.9)">
            <animate
              attributeName="opacity"
              dur="2.8s"
              repeatCount="indefinite"
              values="0.2;1;0.2"
            />
          </circle>
          <circle cx="275" cy="140" r="4" fill="rgba(245,158,11,0.9)">
            <animate
              attributeName="opacity"
              dur="2.1s"
              repeatCount="indefinite"
              values="0.2;1;0.2"
            />
          </circle>
          <circle cx="220" cy="265" r="4" fill="rgba(239,68,68,0.9)">
            <animate
              attributeName="opacity"
              dur="2.6s"
              repeatCount="indefinite"
              values="0.2;1;0.2"
            />
          </circle>
        </g>

        <g>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 260 210"
              to="360 260 210"
              dur="20s"
              repeatCount="indefinite"
            />
            <rect
              x="430"
              y="205"
              width="14"
              height="8"
              rx="2"
              fill="rgba(0,255,136,0.95)"
            />
            <rect
              x="446"
              y="203"
              width="10"
              height="12"
              rx="2"
              fill="rgba(96,165,250,0.85)"
            />
          </g>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 260 210"
              to="0 260 210"
              dur="28s"
              repeatCount="indefinite"
            />
            <rect
              x="70"
              y="205"
              width="14"
              height="8"
              rx="2"
              fill="rgba(167,139,250,0.9)"
            />
            <rect
              x="86"
              y="203"
              width="10"
              height="12"
              rx="2"
              fill="rgba(0,255,136,0.75)"
            />
          </g>
        </g>

        <rect
          x="130"
          y="0"
          width="6"
          height="420"
          fill="rgba(0,255,136,0.12)"
        >
          <animate
            attributeName="x"
            dur="4s"
            repeatCount="indefinite"
            values="120;390;120"
          />
        </rect>
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute left-6 top-6 w-56 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] px-4 py-3 shadow-wb-level-2"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Hotspot Detected
        </div>
        <div className="mt-1 font-mono text-xs text-[var(--text-primary)]">
          19.0760, 72.8777
        </div>
        <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-red)] shadow-wb-glow-red" />
          Confidence 0.91
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute bottom-6 right-6 w-60 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] px-4 py-3 shadow-wb-level-2"
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            VIIRS • Sentinel-2
          </div>
          <span className="rounded-full bg-[rgba(0,255,136,0.12)] px-2 py-[2px] text-[10px] font-semibold text-[var(--accent-green)]">
            LIVE
          </span>
        </div>
        <div className="mt-2 text-xs text-[var(--text-secondary)]">
          Thermal anomaly + smoke segmentation aligned.
        </div>
      </motion.div>
    </div>
  );
}

export function Home(): JSX.Element {
  return (
    <PageWrapper>
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--gradient-hero)] px-6 py-10 shadow-wb-level-2 md:px-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,1)_0px,rgba(255,255,255,1)_1px,transparent_1px,transparent_60px),repeating-linear-gradient(90deg,rgba(255,255,255,1)_0px,rgba(255,255,255,1)_1px,transparent_1px,transparent_60px)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:radial-gradient(circle_at_20%_10%,rgba(0,255,136,0.08),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(96,165,250,0.06),transparent_55%)]" />
        <div className="relative grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-[var(--accent-green)]" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-green)]">
                Environmental Intelligence Platform
              </div>
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-[-0.06em] md:text-6xl">
              <span className="block text-[var(--text-primary)]">
                Detect Illegal
              </span>
              <span className="block wb-gradient-text">Waste Burning</span>
              <span className="block text-[var(--text-primary)]">
                From Space
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
              WatchBurn combines 6 satellite systems with deep learning to
              identify illegal waste burning events in near real-time — giving
              environmental agencies actionable intelligence at planetary scale.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/dashboard" className="wb-btn-primary inline-flex items-center gap-2">
                  Open Live Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/analytics" className="wb-btn-secondary inline-flex items-center gap-2">
                  Explore Analytics
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-[var(--border-subtle)] pt-6">
              <LiveStat
                icon={<Satellite className="h-4 w-4" />}
                value={500}
                label="Detections"
              />
              <div className="h-5 w-px bg-[var(--border-subtle)]" />
              <LiveStat
                icon={<Globe2 className="h-4 w-4" />}
                value={6}
                label="Satellites"
              />
              <div className="h-5 w-px bg-[var(--border-subtle)]" />
              <LiveStat
                icon={<Target className="h-4 w-4" />}
                value={92}
                label="% Accuracy"
              />
              <div className="h-5 w-px bg-[var(--border-subtle)]" />
              <LiveStat
                icon={<Zap className="h-4 w-4" />}
                value={24}
                label="hr Latency"
              />
            </div>
          </div>

          <div className="md:pl-2">
            <OrbitVisual />
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

export default Home;

