// The wall-to-lock fridges (revision 1): a 24×36 dilution refrigerator in the fridge-out manner, drawn with the
// public fridge-family recipe (plate(), coax(), pulse()), and the pair it becomes.
//
// One fridge, relative to its top-left (26×38):
//   cable x 13 rows 0–2 · plates 26/20/14/10 at rows 3, 11, 18, 24 · two coax lines (x 10, 15) from the top plate
//   down into the chip box (more lines made a cage at this width) · chip box 12×10 at x 7, rows 28–37 with a 4×3
//   window and a 2×1 qubit in its owner's colour.
//
// The pair: while the two are apart each is drawn whole. Once they overlap, the plates are re-rasterised at the
// combined width (so each keeps one lit end and one shaded end), all eight coax lines stay, and as soon as the
// two chip boxes touch they become one wide box with both windows: one provider holding both players' qubits.

import { Grid, type Key } from '../../engine';
import { coax, plate, type Pt } from '../fridge-family';

export const FW = 26;
export const FH = 38;
export const MERGED_D = 14; // R.x − L.x when merged: one 40-wide fridge

const CABLE_X = 13;
const PLATES = [
  { x: 0, y: 3, w: 26 },
  { x: 3, y: 11, w: 20 },
  { x: 6, y: 18, w: 14 },
  { x: 8, y: 24, w: 10 },
] as const;
const BOX = { x: 7, y: 28, w: 12, h: 10 } as const;
const WIN = { x: 3, y: 3, w: 4, h: 3 } as const; // inside the box
/** Coax lines: [x, y0, y1, jog row or -1, jog dx]. Both carry pulses. */
const LINES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [10, 6, 27, -1, 0],
  [15, 6, 27, -1, 0],
];

export interface PairOpts {
  /** 12-fps tick for the pulses (each inner line: a pulse every 24 ticks). */
  tick: number;
  pulses: boolean;
  qubitL: Key;
  qubitR: Key;
}

function linePath(x0: number, line: (typeof LINES)[number]): Pt[] {
  const [lx, y0, y1, jy, jdx] = line;
  return coax(null as unknown as Grid, x0 + lx, y0, y1, { dry: true, jogs: jy >= 0 ? [{ y: jy, dx: jdx as 1 | -1 }] : [] });
}

function plateAt(y: number): number { return PLATES.findIndex((p) => y >= p.y && y <= p.y + 2); }

/** The static structure (no pulses, no qubits) of the pair with the left fridge at lx and offset d, origin (0, 0). */
function buildBase(d: number): Grid {
  const merged = d < FW;
  const w = d + FW;
  const g = new Grid(w, FH);
  const xs = [0, d];
  // cables
  if (d <= MERGED_D) for (let y = 0; y < 3; y++) g.set((w >> 1), y, 'm');
  else for (const x0 of xs) for (let y = 0; y < 3; y++) g.set(x0 + CABLE_X, y, 'm');
  // coax first (plates hide them where they pass through)
  for (const x0 of xs) for (const L of LINES) {
    const [lx, y0, y1, jy, jdx] = L;
    coax(g, x0 + lx, y0, y1, { jogs: jy >= 0 ? [{ y: jy, dx: jdx as 1 | -1 }] : [] });
  }
  // plates
  if (merged) for (const p of PLATES) plate(g, p.x, p.y, p.w + d);
  else for (const x0 of xs) for (const p of PLATES) plate(g, x0 + p.x, p.y, p.w);
  // the cast shadow of each plate on the coax right under it
  for (const x0 of xs) for (const L of LINES) for (const pt of linePath(x0, L)) {
    const pi = PLATES.findIndex((p) => pt[1] === p.y + 3);
    if (pi >= 0 && g.get(pt[0], pt[1]) === 't') g.set(pt[0], pt[1], 'm');
  }
  // chip box(es)
  const gap = d - BOX.w;
  if (gap <= 2) box(g, BOX.x, BOX.w + d, [WIN.x, d + WIN.x]);
  else for (const x0 of xs) box(g, x0 + BOX.x, BOX.w, [WIN.x]);
  return g;
}

/** A chip box of any width: `s` shell with open corners, lit `e` top row and left column, `t`/`m` shade. */
function box(g: Grid, x: number, w: number, windows: readonly number[]): void {
  const y = BOX.y, h = BOX.h;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const edgeR = r === 0 || r === h - 1, edgeC = c === 0 || c === w - 1;
    if (edgeR && edgeC) continue;
    let k: Key;
    if (edgeR || edgeC) k = 's';
    else if (c === w - 2) k = 'm';
    else if (r === 1) k = 'e';
    else if (r === h - 2) k = c === 1 ? 'e' : 'm';
    else if (c === 1) k = 'e';
    else if (c === w - 3) k = 't';
    else k = 'l';
    g.set(x + c, y + r, k);
  }
  for (const wx of windows) for (let r = 0; r < WIN.h; r++) for (let c = 0; c < WIN.w; c++) g.set(x + wx + c, y + WIN.y + r, 'k');
}

const BASES = new Map<number, Grid>();
/** Static bases are built once per offset (W2: the per-tick work is a blit plus a few pulse pixels). */
export function pairBase(d: number): Grid {
  let b = BASES.get(d);
  if (!b) { b = buildBase(d); BASES.set(d, b); }
  return b;
}

/** Draws the pair with the left fridge's top-left at (lx, top) and the right one at (lx + d, top). */
export function drawPair(g: Grid, lx: number, top: number, d: number, o: PairOpts): void {
  g.blit(pairBase(d), lx, top);
  const xs = [0, d];
  // qubits (2×1 in each window)
  const qy = top + BOX.y + WIN.y + 1;
  xs.forEach((x0, i) => {
    const qx = lx + x0 + BOX.x + WIN.x + 1;
    const k = i === 0 ? o.qubitL : o.qubitR;
    g.set(qx, qy, k); g.set(qx + 1, qy, k);
  });
  if (!o.pulses) return;
  // pulses down the inner pair of each fridge, `a` head and `g` tail, hidden inside plates (whose underside glows)
  xs.forEach((x0, i) => {
    [0, 1].forEach((li, j) => {
      const path = linePath(lx + x0, LINES[li]);
      const head = (((o.tick + 12 * j + 6 * i) % 24) + 24) % 24;
      if (head >= path.length) return;
      for (let s = 0; s < 2; s++) {
        const p = path[head - s];
        if (!p) continue;
        const rel = p[1];
        const pi = plateAt(rel);
        if (pi >= 0) { if (s === 0) g.set(p[0], top + PLATES[pi].y + 2, 'a'); continue; }
        g.set(p[0], top + rel, s === 0 ? 'a' : 'g');
      }
    });
  });
}

/** The readout path of fridge `which` (0 = left, 1 = right) in the merged pair: up its inner line, hidden in plates. */
export function readoutPath(lx: number, top: number, d: number, which: 0 | 1): Array<readonly [number, number, boolean]> {
  const x0 = which === 0 ? 0 : d;
  const path = linePath(lx + x0, LINES[which === 0 ? 0 : 1]).slice().reverse();
  return path.map(([x, y]) => [x, top + y, plateAt(y) >= 0] as const);
}

export const FRIDGE = { CABLE_X, PLATES, BOX, WIN } as const;
