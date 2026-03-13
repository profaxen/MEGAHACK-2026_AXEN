import { useEffect, useRef } from "react";
import type { WasteBurnEvent } from "../lib/types";
import {
  renderSatelliteCanvas,
  type SatelliteCanvasType
} from "../lib/canvas-renderer";

interface SatelliteCanvasProps {
  type: SatelliteCanvasType;
  event: WasteBurnEvent;
  width: number;
  height: number;
}

export function SatelliteCanvas({
  type,
  event,
  width,
  height
}: SatelliteCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderSatelliteCanvas(type, ctx, event, { width, height });
  }, [type, event, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="block rounded-xl bg-[var(--bg-base)]"
    />
  );
}

export default SatelliteCanvas;

