import { mulberry32 } from "./random";

export type StarLayer = 0 | 1 | 2; // far / mid / near

export interface Star {
  x: number; // 0..1 normalized
  y: number;
  size: number; // px, square
  layer: StarLayer;
  phase: number; // rad
  period: number; // seconds per breath
  plus: boolean; // cross sparkle star
  driftX: number; // normalized viewport units per second
  driftY: number;
}

export const PARALLAX_PX: readonly [number, number, number] = [6, 14, 26];
export const MAX_STARS = 200;
const AREA_PER_STAR = 9000;
const PLUS_PROBABILITY = 0.05;

export function generateStars(seed: number, width: number, height: number): Star[] {
  const rnd = mulberry32(seed);
  const count = Math.min(MAX_STARS, Math.max(1, Math.floor((width * height) / AREA_PER_STAR)));
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const layerRoll = rnd();
    const layer: StarLayer = layerRoll < 0.5 ? 0 : layerRoll < 0.85 ? 1 : 2;
    const size = layer === 0 ? 1 : layer === 1 ? (rnd() < 0.5 ? 1 : 2) : 2 + Math.floor(rnd() * 2);
    stars.push({
      x: rnd(),
      y: rnd(),
      size,
      layer,
      phase: rnd() * Math.PI * 2,
      period: 1.4 + rnd() * 2.4,
      plus: rnd() < PLUS_PROBABILITY,
      driftX: (rnd() - 0.5) * (0.0012 + layer * 0.0011),
      driftY: (rnd() - 0.5) * (0.0008 + layer * 0.0008),
    });
  }
  return stars;
}

export function twinkleOpacity(star: Star, timeSec: number, minOpacity = 0.15): number {
  return minOpacity + (1 - minOpacity) * (0.5 + 0.5 * Math.sin((timeSec * 2 * Math.PI) / star.period + star.phase));
}

export interface DrawOptions {
  width: number; // CSS px
  height: number;
  dpr: number;
  timeSec: number;
  offsetX: number; // -1..1 pointer, drives parallax
  offsetY: number;
  color: string;
  minOpacity?: number;
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], o: DrawOptions): void {
  ctx.clearRect(0, 0, o.width * o.dpr, o.height * o.dpr);
  ctx.fillStyle = o.color;
  for (const s of stars) {
    const x = ((s.x + s.driftX * o.timeSec) % 1 + 1) % 1;
    const y = ((s.y + s.driftY * o.timeSec) % 1 + 1) % 1;
    const px = (x * o.width + o.offsetX * PARALLAX_PX[s.layer]) * o.dpr;
    const py = (y * o.height + o.offsetY * PARALLAX_PX[s.layer]) * o.dpr;
    const sz = s.size * o.dpr;
    ctx.globalAlpha = twinkleOpacity(s, o.timeSec, o.minOpacity);
    ctx.fillRect(px, py, sz, sz);
    if (s.plus) {
      ctx.fillRect(px - sz, py, sz, sz);
      ctx.fillRect(px + sz, py, sz, sz);
      ctx.fillRect(px, py - sz, sz, sz);
      ctx.fillRect(px, py + sz, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
}
