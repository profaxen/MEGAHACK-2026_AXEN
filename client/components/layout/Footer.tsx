export function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[var(--border-subtle)] bg-[rgba(2,5,9,0.9)]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[var(--text-secondary)]">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              WatchBurn
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              AI-based illegal waste burning detection from orbit, designed for
              environmental intelligence teams.
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Pages
            </div>
            <ul className="space-y-1 text-xs">
              <li>Home</li>
              <li>Dashboard</li>
              <li>Analytics</li>
              <li>Reports</li>
            </ul>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Data Sources
            </div>
            <ul className="space-y-1 text-xs">
              <li>Sentinel-2 • ESA</li>
              <li>Landsat 8/9 • NASA/USGS</li>
              <li>VIIRS/FIRMS • NOAA</li>
              <li>MODIS • NASA</li>
              <li>Sentinel-1 SAR • ESA</li>
              <li>GOES-16/17 • NOAA</li>
            </ul>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Tech Stack
            </div>
            <ul className="space-y-1 text-xs">
              <li>React • TypeScript • Vite</li>
              <li>Express • FastAPI • PyTorch</li>
              <li>Firebase Firestore • NASA FIRMS</li>
              <li>Leaflet • Recharts • Framer Motion</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--text-muted)]">
          <span>© {year} WatchBurn. Built for environmental monitoring.</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Live Orbital Intelligence
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

