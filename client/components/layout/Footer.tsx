import { Link } from "react-router-dom";
import { Satellite } from "lucide-react";

const pages = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/reports", label: "Reports" },
];

const dataSources = [
  "Sentinel-2",
  "Landsat 8/9",
  "VIIRS/FIRMS",
  "MODIS",
  "Sentinel-1",
  "GOES-16/17",
];

const techStack = ["React", "Express", "Firebase", "PyTorch", "Leaflet"];

export function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-[var(--accent-green)]" />
              <span className="font-sans font-bold">WatchBurn</span>
            </Link>
            <p
              className="mt-3 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              AI-powered illegal waste burning detection from space.
            </p>
          </div>

          <div>
            <h4
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Pages
            </h4>
            <ul className="space-y-2">
              {pages.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm transition-colors hover:text-[var(--accent-green)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Data Sources
            </h4>
            <ul className="space-y-2">
              {dataSources.map((name) => (
                <li
                  key={name}
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Tech Stack
            </h4>
            <ul className="space-y-2">
              {techStack.map((name) => (
                <li
                  key={name}
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
        >
          <span className="text-sm">
            © {new Date().getFullYear()} WatchBurn. Built for environmental
            monitoring.
          </span>
        </div>
      </div>
    </footer>
  );
}
