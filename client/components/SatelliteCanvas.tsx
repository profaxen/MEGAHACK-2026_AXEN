import { useRef, useEffect } from "react";
import { hashSeed, seededRandom } from "@/lib/canvas-renderer";
import type { WasteBurnEvent } from "@/lib/types";

interface SatelliteCanvasProps {
  type: "rgb" | "smoke" | "thermal";
  event: WasteBurnEvent;
  width: number;
  height: number;
}

export function SatelliteCanvas({
  type,
  event,
  width,
  height,
}: SatelliteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const seed = hashSeed(event.id);
    const rand = seededRandom(seed);

    if (type === "rgb") {
      renderRgb(ctx, event, width, height, rand);
    } else if (type === "smoke") {
      renderSmokeMask(ctx, event, width, height, rand);
    } else {
      renderThermal(ctx, event, width, height, rand);
    }
  }, [type, event, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: 12,
      }}
    />
  );
}

function renderRgb(
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  w: number,
  h: number,
  rand: () => number
) {
  const ndvi = event.spectral_indices?.ndvi ?? 0.3;
  let baseColor: string;
  if (ndvi > 0.4) baseColor = "#0a1a0a";
  else if (ndvi > 0.1) baseColor = "#1a1508";
  else baseColor = "#0f0f12";

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  const numParcels = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < numParcels; i++) {
    const shade = 1 + (rand() - 0.5) * 0.15;
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    ctx.fillStyle = `rgb(${Math.round(r * shade)}, ${Math.round(g * shade)}, ${Math.round(b * shade)})`;
    ctx.strokeStyle = `rgba(255,255,255,0.1)`;
    ctx.lineWidth = 1;

    const points: [number, number][] = [];
    for (let j = 0; j < 4; j++) {
      points.push([
        rand() * w * 0.8 + w * 0.1,
        rand() * h * 0.8 + h * 0.1,
      ]);
    }
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j][0], points[j][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (event.land_use === "urban") {
    for (let i = 0; i < 8; i++) {
      const x = rand() * w * 0.7 + w * 0.15;
      const y = rand() * h * 0.7 + h * 0.15;
      const bw = 15 + rand() * 25;
      const bh = 20 + rand() * 30;
      ctx.fillStyle = "rgba(40,40,45,0.8)";
      ctx.fillRect(x, y, bw, bh);
    }
  } else if (event.land_use === "industrial") {
    ctx.fillStyle = "rgba(50,48,45,0.9)";
    ctx.fillRect(w * 0.2, h * 0.3, w * 0.25, h * 0.25);
    ctx.fillRect(w * 0.55, h * 0.4, w * 0.2, h * 0.2);
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.6, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (event.land_use === "landfill") {
    ctx.fillStyle = "rgba(60,45,30,0.8)";
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + rand() * 0.5;
      const r = w * (0.15 + rand() * 0.25);
      const x = w / 2 + Math.cos(a) * r;
      const y = h / 2 + Math.sin(a) * r * 0.8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  if (event.smoke_probability > 0.5) {
    const size = 0.1 + event.smoke_probability * 0.25;
    const angle = rand() * Math.PI * 0.5;
    const cx = w * (0.4 + rand() * 0.2);
    const cy = h * (0.3 + rand() * 0.2);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * size);
    gradient.addColorStop(0, "rgba(180,180,190,0.1)");
    gradient.addColorStop(0.5, "rgba(140,140,150,0.15)");
    gradient.addColorStop(1, "rgba(100,100,110,0.05)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * size * 1.2, h * size * 0.8, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0,255,136,0.06)";
  ctx.fillRect(0, 0, w, 2);

  ctx.font = "10px JetBrains Mono";
  ctx.fillStyle = "#4a5568";
  ctx.fillText(
    `${event.satellite_source} | 10m | ${event.timestamp.slice(0, 10)}`,
    8,
    h - 8
  );
}

function renderSmokeMask(
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  w: number,
  h: number,
  rand: () => number
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  if (event.smoke_detected) {
    const cx = w / 2 + (rand() - 0.5) * w * 0.1;
    const cy = h / 2 + (rand() - 0.5) * h * 0.1;
    const numPoints = 8 + Math.floor(rand() * 5);
    const points: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + rand() * 0.3;
      const r = w * (0.15 + rand() * 0.2);
      points.push([
        cx + Math.cos(angle) * r,
        cy + Math.sin(angle) * r * 0.9,
      ]);
    }
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    for (let s = 0; s < 2; s++) {
      const sx = w * (0.2 + rand() * 0.6);
      const sy = h * (0.2 + rand() * 0.6);
      const sr = w * (0.03 + rand() * 0.05);
      ctx.fillStyle = "rgba(180,180,190,0.6)";
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.02, 0, Math.PI * 2);
    ctx.fill();
  } else if (event.smoke_probability > 0) {
    const intensity = event.smoke_probability * 0.05;
    for (let i = 0; i < 20; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 2 + rand() * 4;
      ctx.fillStyle = `rgba(80,80,90,${intensity})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.font = "10px JetBrains Mono";
  ctx.fillStyle = "#00ff88";
  ctx.textAlign = "center";
  ctx.fillText("SMOKE MASK | U-Net v2.3 Output", w / 2, h - 8);
  ctx.textAlign = "left";
}

function renderThermal(
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  w: number,
  h: number,
  rand: () => number
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const cx = w * (0.45 + rand() * 0.1);
  const cy = h * (0.45 + rand() * 0.1);
  const radius =
    event.thermal_score * Math.min(w, h) * 0.45;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.2, "rgba(255,220,50,0.8)");
  gradient.addColorStop(0.4, "rgba(255,80,0,0.6)");
  gradient.addColorStop(0.6, "rgba(180,0,100,0.4)");
  gradient.addColorStop(0.8, "rgba(60,0,80,0.2)");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 2; i++) {
    const sx = w * (0.2 + rand() * 0.6);
    const sy = h * (0.2 + rand() * 0.6);
    const sr = radius * (0.2 + rand() * 0.3);
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, "rgba(255,180,50,0.5)");
    sg.addColorStop(0.5, "rgba(255,80,0,0.3)");
    sg.addColorStop(1, "transparent");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  const scaleY = 80;
  const scaleLeft = w - 16;
  const scaleTop = h - scaleY - 24;

  const scaleGradient = ctx.createLinearGradient(0, scaleTop, 0, scaleTop + scaleY);
  scaleGradient.addColorStop(0, "white");
  scaleGradient.addColorStop(0.25, "yellow");
  scaleGradient.addColorStop(0.5, "red");
  scaleGradient.addColorStop(0.75, "purple");
  scaleGradient.addColorStop(1, "black");
  ctx.fillStyle = scaleGradient;
  ctx.fillRect(scaleLeft, scaleTop, 8, scaleY);

  ctx.font = "9px JetBrains Mono";
  ctx.fillStyle = "#4a5568";
  ctx.textAlign = "right";
  ctx.fillText("High", scaleLeft - 4, scaleTop + 10);
  ctx.fillText("Low", scaleLeft - 4, scaleTop + scaleY - 2);
  ctx.textAlign = "left";

  ctx.fillStyle = "#f59e0b";
  ctx.fillText("THERMAL HEATMAP | Landsat-8 Band 10", 8, h - 8);
}
