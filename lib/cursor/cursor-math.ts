const LOCK_SELECTOR = 'a, button, [role="button"], [data-cursor-target]';
const TEXT_CONTROL_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

export interface CursorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BracketCorners {
  tl: Point;
  tr: Point;
  bl: Point;
  br: Point;
}

/** Closest element the reticle should lock onto, if any. */
export function resolveLockTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  if (target.closest(TEXT_CONTROL_SELECTOR)) return null;
  return target.closest(LOCK_SELECTOR);
}

/** Four outer corners of a rect expanded by pad. */
export function bracketCorners(rect: CursorRect, pad: number): BracketCorners {
  return {
    tl: { x: rect.x - pad, y: rect.y - pad },
    tr: { x: rect.x + rect.width + pad, y: rect.y - pad },
    bl: { x: rect.x - pad, y: rect.y + rect.height + pad },
    br: { x: rect.x + rect.width + pad, y: rect.y + rect.height + pad },
  };
}

/** Square box centered on the pointer (idle reticle footprint). */
export function tightRect(px: number, py: number, size: number): CursorRect {
  return { x: px - size / 2, y: py - size / 2, width: size, height: size };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
