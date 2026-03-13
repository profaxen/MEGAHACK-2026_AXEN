import type { WasteBurnEvent } from "./types";

export type SatelliteCanvasType = "rgb" | "smoke" | "thermal";

class SeededRng {
  private value: number;

  constructor(seed: number) {
    this.value = seed;
  }

  next(): number {
    this.value = (this.value * 1664525 + 1013904223) % 4294967296;
    return this.value / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}

export function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface RenderOptions {
  width: number;
  height: number;
}

function getRgbBaseColor(ndvi: number): string {
  if (ndvi > 0.4) return "#0a1a0a";
  if (ndvi > 0.1) return "#1a1508";
  return "#0f0f12";
}

function drawRgb(
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  opts: RenderOptions,
  rng: SeededRng
): void {
  const { width, height } = opts;
  const ndvi = event.spectral_indices.ndvi;
  const base = getRgbBaseColor(ndvi);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, base);
  gradient.addColorStop(1, "#05070a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const parcels = 4 + Math.floor(rng.range(0, 3));
  for (let i = 0; i < parcels; i += 1) {
    const cx = rng.range(0.1, 0.9) * width;
    const cy = rng.range(0.1, 0.9) * height;
    const w = rng.range(0.15, 0.35) * width;
    const h = rng.range(0.15, 0.35) * height;
    const angle = rng.range(0, Math.PI);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + rng.range(-6, 6));
    ctx.lineTo(w / 2 + rng.range(-6, 6), h / 2);
    ctx.lineTo(-w / 2, h / 2 + rng.range(-6, 6));
    ctx.closePath();
    ctx.fillStyle = base;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  const roadCount = 3;
  for (let i = 0; i < roadCount; i += 1) {
    const y = rng.range(0.1, 0.9) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + rng.range(-10, 10));
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle =
    event.land_use === "urban"
      ? "rgba(30,41,59,0.9)"
      : event.land_use === "industrial"
      ? "rgba(15,23,42,0.9)"
      : event.land_use === "landfill"
      ? "rgba(120,72,24,0.9)"
      : "rgba(30,41,59,0.7)";

  if (event.land_use === "urban") {
    const count = 6 + Math.floor(rng.range(0, 4));
    for (let i = 0; i < count; i += 1) {
      const w = rng.range(8, 18);
      const h = rng.range(8, 22);
      const x = rng.range(0.05, 0.9) * width;
      const y = rng.range(0.05, 0.9) * height;
      ctx.fillRect(x, y, w, h);
    }
  } else if (event.land_use === "industrial") {
    for (let i = 0; i < 3; i += 1) {
      const w = rng.range(24, 40);
      const h = rng.range(18, 30);
      const x = rng.range(0.1, 0.8) * width;
      const y = rng.range(0.1, 0.8) * height;
      ctx.fillRect(x, y, w, h);
    }
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.75, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (event.land_use === "landfill") {
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.7);
    ctx.bezierCurveTo(
      width * 0.3,
      height * 0.4,
      width * 0.6,
      height * 0.9,
      width * 0.85,
      height * 0.6
    );
    ctx.lineTo(width * 0.9, height * 0.95);
    ctx.lineTo(width * 0.1, height * 0.95);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (event.smoke_probability > 0.5) {
    const plumes = event.smoke_probability > 0.8 ? 2 : 1;
    for (let i = 0; i < plumes; i += 1) {
      const baseX = rng.range(0.2, 0.8) * width;
      const baseY = rng.range(0.2, 0.8) * height;
      const maxRadius =
        event.smoke_probability *
        Math.min(width, height) *
        (event.smoke_probability > 0.9 ? 0.35 : 0.25);
      ctx.save();
      ctx.globalAlpha = 0.65;
      for (let r = maxRadius; r > maxRadius * 0.2; r -= 10) {
        const gradientSmoke = ctx.createRadialGradient(
          baseX,
          baseY,
          r * 0.1,
          baseX,
          baseY,
          r
        );
        gradientSmoke.addColorStop(0, "rgba(255,255,255,0.6)");
        gradientSmoke.addColorStop(1, "rgba(148,163,184,0)");
        ctx.fillStyle = gradientSmoke;
        ctx.beginPath();
        ctx.ellipse(
          baseX + rng.range(-10, 10),
          baseY - r * 0.3,
          r * 0.7,
          r,
          rng.range(-0.4, 0.4),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.save();
  ctx.fillStyle = "rgba(22,163,74,0.08)";
  const lineY = (Date.now() % 4000) / 4000 * height;
  ctx.fillRect(0, lineY, width, 2);
  ctx.restore();

  ctx.save();
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.textBaseline = "bottom";
  const resolution =
    event.satellite_source && event.satellite_source.includes("Sentinel")
      ? "10m"
      : event.satellite_source && event.satellite_source.includes("Landsat")
      ? "30m"
      : "1km";
  const text = `${event.satellite_source} | ${resolution} | ${event.timestamp.slice(
    0,
    10
  )}`;
  ctx.fillText(text, 8, height - 6);
  ctx.restore();
}

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  opts: RenderOptions,
  rng: SeededRng
): void {
  const { width, height } = opts;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  if (event.smoke_detected || event.smoke_probability > 0.4) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    const centerX = width / 2 + rng.range(-20, 20);
    const centerY = height / 2 + rng.range(-10, 10);
    const vertices = 8 + Math.floor(rng.range(0, 4));
    const radius = (Math.min(width, height) / 2) * 0.7;
    ctx.beginPath();
    for (let i = 0; i < vertices; i += 1) {
      const angle = (i / vertices) * Math.PI * 2;
      const r = radius * rng.range(0.6, 1);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    const secondaryCount = 2 + Math.floor(rng.range(0, 2));
    ctx.fillStyle = "#cbd5f5";
    for (let i = 0; i < secondaryCount; i += 1) {
      const r = radius * rng.range(0.2, 0.4);
      const x = centerX + rng.range(-radius * 0.6, radius * 0.6);
      const y = centerY + rng.range(-radius * 0.4, radius * 0.4);
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        r,
        r * rng.range(0.6, 1),
        rng.range(0, Math.PI),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();

    ctx.canvas.style.filter = "blur(3px)";
  } else {
    const noiseDensity = event.smoke_probability * 100;
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = rng.next();
      const v = n < noiseDensity / 1000 ? 40 + n * 60 : 0;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = v > 0 ? 80 : 0;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  ctx.save();
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(34,197,94,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "SMOKE MASK | U-Net v2.3 Output",
    width / 2,
    height - 8
  );
  ctx.restore();
}

function drawThermal(
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  opts: RenderOptions,
  rng: SeededRng
): void {
  const { width, height } = opts;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const centerX = width * rng.range(0.35, 0.65);
  const centerY = height * rng.range(0.35, 0.65);
  const baseRadius =
    event.thermal_score *
    Math.min(width, height) *
    0.45;

  ctx.save();
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    baseRadius
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.3, "rgba(255,220,50,0.9)");
  gradient.addColorStop(0.6, "rgba(255,80,0,0.7)");
  gradient.addColorStop(0.8, "rgba(180,0,100,0.5)");
  gradient.addColorStop(1, "rgba(60,0,80,0.2)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const secondary = 1 + Math.floor(rng.range(0, 2));
  for (let i = 0; i < secondary; i += 1) {
    const r = baseRadius * rng.range(0.25, 0.45);
    const x =
      centerX + rng.range(-baseRadius * 0.7, baseRadius * 0.7);
    const y =
      centerY + rng.range(-baseRadius * 0.7, baseRadius * 0.7);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(255,255,255,0.8)");
    grad.addColorStop(0.4, "rgba(255,190,60,0.7)");
    grad.addColorStop(1, "rgba(220,38,38,0.2)");
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const barHeight = 80;
  const barWidth = 8;
  const barX = width - 18;
  const barY = (height - barHeight) / 2;
  const barGrad = ctx.createLinearGradient(
    barX,
    barY,
    barX,
    barY + barHeight
  );
  barGrad.addColorStop(0, "#ffffff");
  barGrad.addColorStop(0.25, "#fde047");
  barGrad.addColorStop(0.5, "#ef4444");
  barGrad.addColorStop(0.75, "#a855f7");
  barGrad.addColorStop(1, "#000000");
  ctx.fillStyle = barGrad;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.strokeStyle = "rgba(15,23,42,0.9)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.save();
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(226,232,240,0.9)";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("High", barX - 4, barY - 2);
  ctx.textBaseline = "bottom";
  ctx.fillText("Low", barX - 4, barY + barHeight + 2);
  ctx.restore();

  ctx.save();
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(245,158,11,0.9)";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(
    "THERMAL HEATMAP | Landsat-8 Band 10",
    8,
    height - 8
  );
  ctx.restore();
}

export function renderSatelliteCanvas(
  type: SatelliteCanvasType,
  ctx: CanvasRenderingContext2D,
  event: WasteBurnEvent,
  opts: RenderOptions
): void {
  const seed = hashSeed(event.id);
  const rng = new SeededRng(seed);

  if (type === "rgb") {
    drawRgb(ctx, event, opts, rng);
  } else if (type === "smoke") {
    drawSmoke(ctx, event, opts, rng);
  } else {
    drawThermal(ctx, event, opts, rng);
  }
}

