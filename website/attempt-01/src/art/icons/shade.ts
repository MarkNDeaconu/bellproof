// Shape → shaded sprite, light from the upper left (research 03 §1.3, §1.6).
// A mask is a set of filled cells; every cell is coloured by which of its neighbours are empty:
//   lit edge  (empty to the left / above / upper-left only)        → light
//   dark edge facing the outside (empty right / below / lower-right) → outline (selective outline)
//   dark edge facing an inner hole                                  → shadow (one step lighter than outline)
//   both or neither                                                 → body
// Because shading follows position, a mask can be rotated by 90° and re-shaded, and the light stays
// at the upper left in every frame (used by trust-loop).

import type { Grid, Key } from '../../engine';

export type Mask = boolean[][];   // [y][x]

export interface Ramp { light: Key; body: Key; shadow: Key; outline: Key }

export function maskFrom(rows: readonly string[]): Mask {
  return rows.map((r) => [...r].map((c) => c !== '.'));
}

export function rotate90(m: Mask): Mask {
  // clockwise: (x, y) → (h-1-y, x)
  const h = m.length, w = m[0].length;
  const out: Mask = Array.from({ length: w }, () => new Array<boolean>(h).fill(false));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[x][h - 1 - y] = m[y][x];
  return out;
}

/** Empty cells reachable from the border (outside), as opposed to enclosed holes. */
function exterior(m: Mask): boolean[][] {
  const h = m.length, w = m[0].length;
  const ext = Array.from({ length: h }, () => new Array<boolean>(w).fill(false));
  const stack: Array<[number, number]> = [];
  for (let x = 0; x < w; x++) { stack.push([x, 0], [x, h - 1]); }
  for (let y = 0; y < h; y++) { stack.push([0, y], [w - 1, y]); }
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h || ext[y][x] || m[y][x]) continue;
    ext[y][x] = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return ext;
}

/**
 * Shade a mask into `g`. `isOutside(x, y)` decides whether an empty cell counts as the outside
 * (default: flood fill from the border); pass one when a gap joins a hole to the outside (trust-loop).
 */
export function shadeMask(g: Grid, m: Mask, ramp: Ramp, ox = 0, oy = 0, isOutside?: (x: number, y: number) => boolean): void {
  const h = m.length, w = m[0].length;
  const ext = exterior(m);
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && m[y][x];
  const outside = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || (isOutside ? isOutside(x, y) : ext[y][x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y][x]) continue;
    const lit = !filled(x - 1, y) || !filled(x, y - 1) || !filled(x - 1, y - 1);
    const darkCells: Array<[number, number]> = [[x + 1, y], [x, y + 1], [x + 1, y + 1]];
    const dark = darkCells.some(([a, b]) => !filled(a, b));
    let k: Key = ramp.body;
    if (lit && !dark) k = ramp.light;
    else if (dark && !lit) k = darkCells.some(([a, b]) => !filled(a, b) && outside(a, b)) ? ramp.outline : ramp.shadow;
    g.set(ox + x, oy + y, k);
  }
}
