import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Play, Radio } from "lucide-react";
import { runFullPipeline } from "../../lib/api-client";
import { isDemoMode } from "../../lib/firebase";

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Analytics", to: "/analytics" },
  { label: "Reports", to: "/reports" }
];

export function Navbar(): JSX.Element {
  const location = useLocation();
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    setConnected(!isDemoMode);
  }, [location.pathname]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleRunPipeline = async (): Promise<void> => {
    if (running) return;
    setRunning(true);
    try {
      await runFullPipeline({});
      setToast("Full pipeline executed (demo).");
    } catch {
      setToast("Pipeline failed, using demo output.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 wb-glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-tight"
          >
            <div className="relative h-7 w-7">
              <div className="absolute inset-0 rounded-full border border-[rgba(148,163,184,0.5)]" />
              <div className="absolute inset-1 rounded-full border border-[rgba(56,189,248,0.6)] animate-[satellite-orbit_8s_linear_infinite]" />
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-sm bg-[var(--accent-green)] shadow-[0_0_12px_rgba(0,255,136,0.8)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                WatchBurn
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Orbital Monitoring
              </span>
            </div>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[rgba(0,255,136,0.12)] px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-green)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-green)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-green)]" />
              </span>
              Live
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--text-secondary)] md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "wb-nav-link",
                    "transition-all hover:text-[var(--text-primary)]",
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isDemoMode && (
              <div className="hidden items-center gap-2 rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] px-3 py-1 text-[11px] font-medium text-[var(--accent-amber)] md:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-amber)]" />
                DEMO MODE
              </div>
            )}

            <button
              type="button"
              onClick={handleRunPipeline}
              className="wb-btn-primary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
            >
              <Play className="h-3 w-3" />
              {running ? "Running…" : "Run Pipeline"}
            </button>

            {connected && (
              <div className="hidden items-center gap-1 text-[11px] font-medium text-[var(--accent-green)] md:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)]" />
                Live
              </div>
            )}
          </div>
        </div>
      </header>
      {toast && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50">
          <div className="pointer-events-auto wb-card border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-wb-level-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[var(--accent-green)]" />
              <span>{toast}</span>
            </div>
          </div>
        </div>
      )}
      <div className="h-16" />
    </>
  );
}

export default Navbar;

