/** Character-field renderer primitives. A raster source is sampled to a
 *  coarse luminance grid, perturbed by a slow travelling wave field, then
 *  error-diffused onto a short glyph ramp so every brightness band becomes
 *  a *texture* of mixed glyphs instead of a flat fill. A radial lift keeps
 *  the centre luminous and a checkerboard micro-dim breaks up banding. */

export interface AsciiGrid {
  cols: number;
  rows: number;
  /** CSS px per glyph cell. */
  cellW: number;
  cellH: number;
  fontSize: number;
}

/** Glyph size in CSS px. Low-end devices render coarser, not slower. */
const FONT_PX = 10;
const FONT_PX_LOW_END = 13;
const MIN_COLS = 24;
const MAX_COLS = 220;

/** Grid for a container width and source aspect (height / width). `charW`
 *  is the measured advance of an average glyph; cells are taller than wide,
 *  so rows compensate by that ratio to keep the source proportions. */
export function computeAsciiGrid(
  availW: number,
  aspect: number,
  charW: number,
  fontSize?: number,
  lowEnd = false,
): AsciiGrid {
  const px = fontSize ?? (lowEnd ? FONT_PX_LOW_END : FONT_PX);
  const cellW = Math.max(px * 0.45, charW || px * 0.62);
  const cellH = px;
  const cols = Math.min(MAX_COLS, Math.max(MIN_COLS, Math.floor(availW / cellW)));
  const rows = Math.max(10, Math.round(cols * aspect * (cellW / cellH)));
  return { cols, rows, cellW, cellH, fontSize: px };
}

/** Density ramp, dark -> bright. Twelve bands: enough to hold a gradient,
 *  few enough that neighbouring bands stay visually distinct. */
export const RAMP = " .·:;-+=*#%@";

/** Rec.601 luma, 0..255 — the field works in byte units end to end. */
export function luma601(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Wave-field amplitude in luma units — strong enough to push borderline
 *  cells across ramp bands, weak enough that void grain never climbs past
 *  the faint-dot bands. */
const WAVE_AMP = 44;
/** Wave periods in cells, deliberately mismatched so crests never align
 *  into straight bands. */
const WAVE_PERIOD_X = 26;
const WAVE_PERIOD_Y = 31;

/** Two overlapping directional sine waves drifting with time (a plasma
 *  field). Deterministic per (cell, second): same inputs, same offset, so
 *  frames stay coherent and tests stay reproducible. nx/ny are 0..1. */
export function waveOffset(
  nx: number,
  ny: number,
  cols: number,
  rows: number,
  t: number,
): number {
  const l = Math.max(cols, rows);
  const z = t * 2.1;
  const a =
    Math.sin((nx * l + 11.7) / WAVE_PERIOD_X + z) *
    Math.cos((ny * l - 5.3) / WAVE_PERIOD_Y - z * 0.67);
  const b = Math.sin(nx * l * 1.19 + ny * l * 1.87 + z * 5.4);
  return (a * 0.62 + b * 0.38) * WAVE_AMP;
}

/** Floyd–Steinberg kernel: [dx, dy, weight], divisor 16. */
const FS_KERNEL: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 7],
  [-1, 1, 3],
  [0, 1, 5],
  [1, 1, 1],
];

/** Error-diffuse a 0..255 field onto `levels` evenly spaced quanta. The
 *  diffused residue is what turns flat areas into living texture: each cell
 *  lands on the nearest band and hands the remainder to its neighbours.
 *  `strength` < 1 damps the spread so grain stays fine. */
export function diffuseToLevels(
  field: Float32Array,
  cols: number,
  rows: number,
  levels: number,
  strength = 0.8,
): Float32Array {
  const step = 255 / Math.max(2, levels - 1);
  const work = new Float32Array(field);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const old = work[i];
      const q = Math.min(255, Math.max(0, Math.round(old / step) * step));
      const err = (old - q) * strength;
      work[i] = q;
      for (const [dx, dy, wt] of FS_KERNEL) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          work[ny * cols + nx] += (err * wt) / 16;
        }
      }
    }
  }
  return work;
}

export interface FieldFrame {
  /** RAMP index per cell. */
  idx: Uint8Array;
  /** Draw alpha per cell; 0 for cells that map to the blank glyph. */
  alpha: Float32Array;
}

/** Luminance gain applied at frame build: pushes solid mark cells onto the
 *  top bands so the texture variance lives in the edges and shadows. */
const GAIN = 1.2;

/** Build one animation frame from a 0..1 luminance grid: gain -> wave
 *  perturbation -> band diffusion -> ramp index + alpha. The wave term runs
 *  over the *unquantised* luminance so the grain crawls smoothly. Void cells
 *  may surface a sparse band-1 grain, never more — the mark stays loud, the
 *  backdrop stays quiet. */
export function buildField(
  gray: Float32Array,
  cols: number,
  rows: number,
  t: number,
): FieldFrame {
  const n = cols * rows;
  const waved = new Float32Array(n);
  for (let y = 0; y < rows; y++) {
    const ny = rows > 1 ? y / (rows - 1) : 0;
    for (let x = 0; x < cols; x++) {
      const nx = cols > 1 ? x / (cols - 1) : 0;
      waved[y * cols + x] =
        gray[y * cols + x] * GAIN * 255 + waveOffset(nx, ny, cols, rows, t);
    }
  }
  const dithered = diffuseToLevels(waved, cols, rows, RAMP.length);

  const idx = new Uint8Array(n);
  const alpha = new Float32Array(n);
  const last = RAMP.length - 1;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const v = dithered[i];
      const band = Math.min(last, Math.max(0, Math.floor((v / 255) * last)));
      idx[i] = band;
      if (RAMP[band] === " ") continue;
      const lift = Math.min(1, (v + 32) / 255);
      alpha[i] = lift * (((x + y) & 1) === 0 ? 1 : 0.85);
    }
  }
  return { idx, alpha };
}
