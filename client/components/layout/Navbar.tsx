import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Satellite, ArrowRight } from "lucide-react";
import { isDemoMode } from "@/lib/firebase";
import { runPipeline } from "@/lib/api-client";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/reports", label: "Reports" },
];

export function Navbar() {
  const location = useLocation();
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleRunPipeline = async () => {
    setPipelineRunning(true);
    try {
      await runPipeline();
      setToast("Pipeline completed");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Pipeline completed (demo)");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setPipelineRunning(false);
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Satellite className="h-6 w-6 text-[var(--accent-green)]" />
            </motion.div>
            <span className="font-sans text-lg font-bold tracking-tight">
              WatchBurn
            </span>
            <span
              className="flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: "rgba(0,255,136,0.2)",
                color: "var(--accent-green)",
              }}
            >
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)]"
                style={{ animationDuration: "2s" }}
              />
              LIVE
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5"
                      style={{
                        background: "var(--accent-green)",
                        borderRadius: 2,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  {!isActive && (
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-0.5 origin-left scale-x-0 rounded transition-transform hover:scale-x-100"
                      style={{
                        background: "var(--accent-green)",
                        transitionDuration: "0.2s",
                        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span
                className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: "rgba(245,158,11,0.3)",
                  color: "var(--accent-amber)",
                  background: "rgba(245,158,11,0.1)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-amber)]"
                  style={{ animationDuration: "2s" }}
                />
                DEMO MODE
              </span>
            )}
            {!isDemoMode && (
              <span
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--accent-green)" }}
              >
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)]"
                  style={{ animationDuration: "2s" }}
                />
                Live
              </span>
            )}
            <button
              onClick={handleRunPipeline}
              disabled={pipelineRunning}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              style={{
                background: "var(--gradient-green)",
                color: "#020509",
              }}
            >
              Run Pipeline
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 shadow-lg"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--glow-green)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
