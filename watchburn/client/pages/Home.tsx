import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Satellite,
  Globe,
  Target,
  Zap,
  ArrowRight,
  FlaskConical,
  Cloud,
  Thermometer,
  Bot,
  Flame,
  Shield,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Footer } from "@/components/layout/Footer";

const satellites = [
  {
    name: "Sentinel-2",
    agency: "ESA",
    capability: "10m multispectral, 5-day revisit",
    tag: "10m resolution",
    color: "var(--accent-blue)",
  },
  {
    name: "Landsat 8/9",
    agency: "NASA/USGS",
    capability: "Thermal infrared, 16-day revisit",
    tag: "16-day revisit",
    color: "var(--accent-amber)",
  },
  {
    name: "VIIRS/FIRMS",
    agency: "NOAA",
    capability: "Active fire hotspots, daily",
    tag: "Daily",
    color: "var(--accent-red)",
  },
  {
    name: "MODIS",
    agency: "NASA",
    capability: "250m–1km, twice daily",
    tag: "Twice daily",
    color: "var(--accent-purple)",
  },
  {
    name: "Sentinel-1 SAR",
    agency: "ESA",
    capability: "All-weather radar, 6-day",
    tag: "6-day revisit",
    color: "var(--accent-green)",
  },
  {
    name: "GOES-16/17",
    agency: "NOAA",
    capability: "Geostationary, 5-min",
    tag: "5-min",
    color: "#93c5fd",
  },
];

const pipelineSteps = [
  {
    icon: Satellite,
    title: "Satellite Ingestion",
    desc: "6 sources, continuous global coverage",
  },
  {
    icon: FlaskConical,
    title: "Band Processing",
    desc: "NDVI, NBR, BAI, SWIR computation",
  },
  {
    icon: Cloud,
    title: "Smoke Detection",
    desc: "U-Net segmentation on Sentinel-2",
  },
  {
    icon: Thermometer,
    title: "Thermal Analysis",
    desc: "CNN hotspot detection on Landsat",
  },
  {
    icon: Bot,
    title: "AI Classification",
    desc: "Fusion model: waste vs agricultural vs industrial",
  },
];

export function Home() {
  const detections = useCountUp(500, 1500);
  const satellitesCount = useCountUp(6, 1200);
  const accuracy = useCountUp(92, 1200);
  const latency = useCountUp(24, 1000);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--gradient-hero)",
      }}
    >
      <div className="relative">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24">
        <div className="grid items-center gap-16 lg:grid-cols-[6fr_4fr]">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div
                className="h-px w-6"
                style={{ background: "var(--accent-green)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.3em]"
                style={{ color: "var(--accent-green)" }}
              >
                Environmental Intelligence Platform
              </span>
            </div>

            <h1
              className="font-display text-5xl font-extrabold leading-tight tracking-[-3px] md:text-6xl lg:text-7xl"
              style={{ color: "var(--text-primary)" }}
            >
              Detect Illegal
              <br />
              <span
                className="gradient-text"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #00ff88 50%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Waste Burning
              </span>
              <br />
              From Space
            </h1>

            <p
              className="mt-6 max-w-md text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              WatchBurn combines 6 satellite systems with deep learning to identify
              illegal waste burning events in near real-time — giving environmental
              agencies actionable intelligence at planetary scale.
            </p>

            <div className="mt-10 flex gap-4">
              <Link
                to="/dashboard"
                className="group flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--gradient-green)",
                  color: "#020509",
                  boxShadow: "0 0 24px rgba(0,255,136,0.25)",
                }}
              >
                Open Live Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/analytics"
                className="flex items-center gap-2 rounded-xl border px-6 py-3 font-medium transition-all hover:scale-[1.02]"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                Explore Analytics
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div
              className="mt-12 flex flex-wrap items-center gap-6 border-l-2 pl-6"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5" style={{ color: "var(--accent-green)" }} />
                <span className="font-mono text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {detections}+
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Detections
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" style={{ color: "var(--accent-green)" }} />
                <span className="font-mono text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {satellitesCount}
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Satellites
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: "var(--accent-green)" }} />
                <span className="font-mono text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {accuracy}%
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Accuracy
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: "var(--accent-green)" }} />
                <span className="font-mono text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  &lt;{latency}hr
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Latency
                </span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mx-auto h-64 w-64 rounded-full border-2 border-dashed opacity-30"
              style={{ borderColor: "var(--accent-green)" }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 mx-auto h-80 w-80 rounded-full border border-dashed opacity-20"
              style={{ borderColor: "var(--accent-blue)" }}
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "var(--accent-green)" }}
            />
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full"
              style={{ background: "var(--accent-red)" }}
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
              className="absolute right-1/4 top-1/2 h-2 w-2 rounded-full"
              style={{ background: "var(--accent-amber)" }}
            />
          </div>
        </div>

        <section className="mt-32">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            The Pipeline
          </p>
          <h2 className="mb-16 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            From Orbit to Alert in Under 24 Hours
          </h2>

          <div className="flex flex-wrap justify-between gap-8">
            {pipelineSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-1 min-w-[180px] flex-col items-center rounded-2xl p-6 transition-all hover:-translate-y-2"
                style={{
                  background: "var(--gradient-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: "var(--accent-green)",
                    background: "transparent",
                  }}
                >
                  <step.icon className="h-6 w-6" style={{ color: "var(--accent-green)" }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-32">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Data Sources
          </p>
          <h2 className="mb-16 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Powered by 6 Satellite Systems
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {satellites.map((sat) => (
              <motion.div
                key={sat.name}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-6"
                style={{
                  background: "var(--gradient-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${sat.color}30` }}
                >
                  <Satellite className="h-5 w-5" style={{ color: sat.color }} />
                </div>
                <h4 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {sat.name}
                </h4>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {sat.agency}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {sat.capability}
                </p>
                <span
                  className="mt-4 inline-block rounded-md px-2 py-1 text-xs"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {sat.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-32">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            AI Architecture
          </p>
          <h2 className="mb-16 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Three-Stage Deep Learning Pipeline
          </h2>

          <div className="space-y-8">
            {[
              {
                title: "U-Net Smoke Segmentation",
                color: "var(--accent-green)",
                arch: "Encoder-Decoder, 5 levels, skip connections, 31M params",
                input: "6-channel Sentinel-2 (RGB+NIR+SWIR), 256×256",
                output: "Binary smoke mask (per-pixel probability)",
                acc: 92,
                prec: 91,
                rec: 87,
                f1: 0.89,
              },
              {
                title: "Thermal Anomaly CNN",
                color: "var(--accent-amber)",
                arch: "4 Conv blocks + 3 FC layers, Dropout 0.4",
                input: "Landsat 8/9 thermal Band 10, 80×80 patch",
                output: "Hotspot probability 0–1",
                acc: 94,
                prec: 93,
                rec: 89,
                f1: 0.91,
              },
              {
                title: "Fusion Classifier MLP",
                color: "var(--accent-blue)",
                arch: "128→64→32, ReLU, Dropout, Softmax",
                input: "8-feature vector (smoke_prob, thermal_prob, NDVI, NBR, BAI, land_use, hour, area)",
                output: "4-class probability distribution",
                acc: 89,
                prec: 88,
                rec: 84,
                f1: 0.86,
              },
            ].map((model) => (
              <motion.div
                key={model.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid items-center gap-8 rounded-2xl p-8 lg:grid-cols-2"
                style={{
                  background: "var(--gradient-card)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: `4px solid ${model.color}`,
                }}
              >
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {model.title}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {model.arch}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="rounded-lg px-2 py-1 font-mono text-xs"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {model.input}
                    </span>
                    <span
                      className="rounded-lg px-2 py-1 font-mono text-xs"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {model.output}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Accuracy", model.acc],
                    ["Precision", model.prec],
                    ["Recall", model.rec],
                    ["F1", model.f1],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: "var(--bg-elevated)" }}>
                      <p className="font-mono text-2xl font-bold" style={{ color: model.color }}>
                        {typeof val === "number" && val < 1 ? val.toFixed(2) : val}%
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section
          className="mt-32 rounded-2xl px-8 py-16"
          style={{ background: "#050a12" }}
        >
          <div className="flex flex-wrap justify-between gap-8">
            {[
              [500, "Events Detected"],
              [6, "Satellites"],
              ["<24hrs", "Detection Latency"],
              ["89-94%", "Model Accuracy"],
            ].map(([val, label]) => (
              <div key={label} className="text-center">
                <p
                  className="gradient-text font-display text-4xl font-extrabold md:text-5xl"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #00ff88 50%, #60a5fa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {val}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-32 grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Grounded in Environmental Science
            </h2>
            <p className="mt-6 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Illegal waste burning releases toxic gases and particulate matter, contributing
              to air pollution and greenhouse gas emissions. Traditional ground monitoring
              fails to scale. Satellite-based AI fills this gap by providing near real-time
              detection across vast regions.
            </p>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              WatchBurn leverages multi-spectral satellite imagery and deep learning to
              distinguish illegal waste burning from agricultural or industrial activity,
              enabling targeted enforcement and public health protection.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Globe, title: "Air Pollution", desc: "Toxic gases + particulate matter from open burning" },
              { icon: Flame, title: "GHG Emissions", desc: "CO2, CH4, black carbon release" },
              { icon: Shield, title: "Public Health", desc: "Respiratory and cardiovascular disease risk" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl p-4"
                style={{
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Icon className="h-6 w-6 shrink-0" style={{ color: "var(--accent-green)" }} />
                <div>
                  <h4 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {title}
                  </h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
