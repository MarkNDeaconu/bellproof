// The Bellproof mark: a 12×11 single-colour pixel bell with a negative-space check in the skirt (art-spec card 16).
// This file holds the bitmap and the pure geometry (rect runs, the azure halo rings) and builds the SVG rect grid
// that the nav, the footer, the favicon and the og image all use. Integer scales only; no DOM access here.

import { mask, type Part } from '../../engine/ascii';
import { PALETTE } from '../../engine/palette';

export const BELL_W = 12;
export const BELL_H = 11;
/** Row index of the clapper (the only row that moves when the bell rings). */
export const CLAPPER_ROW = 10;
/** How far the halo may extend outside the 12×11 box (art px). */
export const HALO_MAX = 3;

/**
 * Silhouette "K4": knob crown (2), dome 4-6-6-6, a straight 8-wide skirt of four rows, a full-width 12 rim with a
 * 2-px overhang each side (the lip that makes it read as a bell at 16 px), and a 2-px clapper under the rim.
 * The check is cut out of the skirt: short arm (4,7), vertex (5,8), long arm (6,7) (7,6) (8,5).
 */
export const BELL_ROWS: readonly string[] = [
  '.....##.....', // r0  crown knob
  '....####....', // r1
  '...######...', // r2
  '...######...', // r3
  '...######...', // r4
  '..######.#..', // r5  long arm tip (8,5)
  '..#####.##..', // r6  (7,6)
  '..##.#.###..', // r7  short arm (4,7), long arm (6,7)
  '..###.####..', // r8  vertex (5,8)
  '############', // r9  rim (unbroken lip)
  '.....##.....', // r10 clapper
];

export const BELL: Part = mask(BELL_ROWS, 'k', 'bell');

export type Run = [x: number, y: number, w: number];

/** True where the bell has a pixel (clapper included, at its rest position). */
export function bellCell(x: number, y: number): boolean {
  return y >= 0 && y < BELL_H && x >= 0 && x < BELL_W && BELL_ROWS[y][x] === '#';
}

/** Merge same-row runs of a predicate over an (x0..x1, y0..y1) box. */
function runsOf(x0: number, y0: number, x1: number, y1: number, on: (x: number, y: number) => boolean): Run[] {
  const out: Run[] = [];
  for (let y = y0; y <= y1; y++) {
    let x = x0;
    while (x <= x1) {
      if (!on(x, y)) { x++; continue; }
      let x2 = x + 1;
      while (x2 <= x1 && on(x2, y)) x2++;
      out.push([x, y, x2 - x]);
      x = x2;
    }
  }
  return out;
}

/** Rect runs of the body (rows 0..9). */
export function bodyRuns(): Run[] { return runsOf(0, 0, BELL_W - 1, CLAPPER_ROW - 1, bellCell); }

/** Rect runs of the clapper, shifted `dx` ∈ {-1, 0, 1} art px. */
export function clapperRuns(dx = 0): Run[] {
  return runsOf(0, CLAPPER_ROW, BELL_W - 1, CLAPPER_ROW, (x) => bellCell(x - dx, CLAPPER_ROW));
}

/**
 * The halo: exterior cells at Chebyshev distance exactly `d` (1..3) from the silhouette (clapper at `dx`).
 * "Exterior" excludes the enclosed check holes, so the check never fills in. Coordinates are in the 12×11 frame
 * and may be negative or ≥ 12/11 (the SVG is rendered with overflow visible).
 */
export function haloRuns(d: 1 | 2 | 3, dx = 0): Run[] {
  const P = HALO_MAX;
  const W = BELL_W + 2 * P, H = BELL_H + 2 * P;
  const solid = new Uint8Array(W * H);
  const idx = (x: number, y: number) => y * W + x;
  for (let y = 0; y < BELL_H; y++) for (let x = 0; x < BELL_W; x++) {
    const on = y === CLAPPER_ROW ? bellCell(x - dx, y) : bellCell(x, y);
    if (on) solid[idx(x + P, y + P)] = 1;
  }
  // exterior: 4-connected flood from the padded border through empty cells
  const ext = new Uint8Array(W * H);
  const stack: number[] = [];
  const push = (x: number, y: number) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = idx(x, y); if (solid[i] || ext[i]) return; ext[i] = 1; stack.push(i); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) { const i = stack.pop()!; const x = i % W, y = (i - x) / W; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  // distance by repeated 8-neighbour dilation over exterior cells only
  const dist = new Uint8Array(W * H);   // 0 = not reached, else distance
  let frontier: number[] = [];
  for (let i = 0; i < W * H; i++) if (solid[i]) frontier.push(i);
  for (let k = 1; k <= d; k++) {
    const next: number[] = [];
    for (const i of frontier) {
      const x = i % W, y = (i - x) / W;
      for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = idx(xx, yy);
        if (solid[j] || !ext[j] || dist[j]) continue;
        dist[j] = k; next.push(j);
      }
    }
    frontier = next;
  }
  return runsOf(0, 0, W - 1, H - 1, (x, y) => dist[idx(x, y)] === d).map(([x, y, w]) => [x - P, y - P, w]);
}

const rect = (r: Run, extra = '') => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="1"${extra}/>`;

export interface MarkSVGOpts {
  /** CSS px per art px: 2 (nav 24×22), 4, 8, 20 (footer 240×220)… integer only. */
  scale: number;
  /** Accessible name; omitted → aria-hidden (the wordmark next to it names the brand). */
  label?: string;
  /** Fill for the body and clapper. Default `currentColor`, so CSS decides (ink on light, paper on dark). */
  fill?: string;
  /** Halo colour. Default azure `#8FAEFF` (design §5.11). */
  halo?: string;
  className?: string;
}

/**
 * The mark as an inline SVG string: a halo layer (empty until `ring()` fills it), the body runs and the clapper
 * group. `viewBox` is the 12×11 art box, so `transform="translate(±1 0)"` on the clapper moves it one art px and
 * every edge lands on the CSS pixel grid at any integer scale. Overflow is visible so the halo can extend outside.
 */
export function markSVG(opts: MarkSVGOpts): string {
  const s = Math.max(1, Math.round(opts.scale));
  if (s !== opts.scale) throw new Error(`markSVG: scale must be an integer (got ${opts.scale})`);
  const fill = opts.fill ?? 'currentColor';
  const halo = opts.halo ?? PALETTE.a;
  const aria = opts.label ? `role="img" aria-label="${opts.label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  const cls = `mark${opts.className ? ' ' + opts.className : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" width="${BELL_W * s}" height="${BELL_H * s}" viewBox="0 0 ${BELL_W} ${BELL_H}" shape-rendering="crispEdges" fill="${fill}" overflow="visible" style="overflow:visible" data-mark="bell" data-scale="${s}" ${aria}>` +
    `<g class="mark__halo" fill="${halo}" data-halo></g>` +
    `<g class="mark__body" data-body>${bodyRuns().map((r) => rect(r)).join('')}</g>` +
    `<g class="mark__clapper" data-clapper>${clapperRuns(0).map((r) => rect(r)).join('')}</g>` +
    `</svg>`;
}

/** SVG markup for a halo ring at distance d with the clapper at dx (used by ring() and the og/demo renders). */
export function haloSVG(d: 1 | 2 | 3, dx = 0): string { return haloRuns(d, dx).map((r) => rect(r)).join(''); }

/**
 * A compact single-`<path>` version of the silhouette for the favicon (one `M x y h w v 1 h -w z` per run).
 * `scale` multiplies coordinates, `ox/oy` offset them, so the favicon can place the mark inside its padding.
 */
export function bellPath(scale: number, ox: number, oy: number): string {
  const all = [...bodyRuns(), ...clapperRuns(0)];
  return all.map(([x, y, w]) => `M${ox + x * scale} ${oy + y * scale}h${w * scale}v${scale}h${-w * scale}z`).join('');
}
