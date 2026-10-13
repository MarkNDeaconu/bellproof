// vault (24×24): Bellproof's escrow vault. A small safe with a round door that slides 4 px.
// Open at rest; it shuts when the token arrives (24), the wheel turns to lock (28), the bell rings when
// the answers pass (32), it slides open (36) and the escrowed token pops out as payment (39–47).

import { definePiece, KEYS, part, type Grid, type Key } from '../../engine';
import { COIN_FACE } from './parts';
import {
  DIAL_START, DING_START, DOOR_TRAVEL, LOOP, OPEN_START, PAY_START, POSTER, SHUT_HOME, SHUT_START, since,
} from './timeline';

const W = 24, BODY_H = 22;
const CX = 11.5, CY = 10.5;         // opening centre (between pixels: the door is 16 px, even)
const R_OPEN = 9, R_DOOR = 8;

/** The bell seal (8×8), Bellproof's mark reduced: indigo lit half, violet shaded half, night lip and clapper. */
const BELL = part(`
  ...ii...
  ..iiiv..
  ..iivv..
  ..iivv..
  .iiivvv.
  .iivvvv.
  nnnnnnnn
  ...nn...
`, 'bell');

function inDisc(x: number, y: number, cx: number, cy: number, r: number): boolean {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Door offset in px (4 = open, 0 = shut) for a story tick. */
export function doorOffset(tick: number): number {
  const s = since(tick, SHUT_START);
  if (s < 4) return 3 - s;                                // 24–27: 3, 2, 1, 0
  const o = since(tick, OPEN_START);
  if (o < 4) return o + 1;                                // 36–39: 1, 2, 3, 4
  return since(tick, SHUT_HOME) < OPEN_START - SHUT_HOME ? 0 : DOOR_TRAVEL;
}

function body(g: Grid): void {
  g.rect(1, 0, W - 2, BODY_H, 's'); g.rect(0, 1, W, BODY_H - 2, 's');
  g.rect(2, 1, W - 4, BODY_H - 2, 'm'); g.rect(1, 2, W - 2, BODY_H - 4, 'm');
  for (let x = 2; x < W - 2; x++) g.set(x, 1, 't');      // lit bevel, top
  for (let y = 2; y < BODY_H - 2; y++) g.set(1, y, 't'); // lit bevel, left
  g.rect(2, BODY_H, 4, 2, 's'); g.rect(W - 6, BODY_H, 4, 2, 's');   // feet
  // the opening: a dark recess whose lower-right inner wall catches the light
  for (let y = 0; y < BODY_H; y++) for (let x = 0; x < W; x++) {
    if (!inDisc(x, y, CX, CY, R_OPEN)) continue;
    const wall = !inDisc(x, y, CX, CY, R_OPEN - 1) && x - CX + (y - CY) > 2;
    g.set(x, y, wall ? 's' : 'k');
  }
}

function door(g: Grid, off: number, glint: boolean): void {
  const cx = CX - off;
  for (let y = 0; y < BODY_H; y++) for (let x = 0; x < W; x++) {
    if (!inDisc(x, y, cx, CY, R_DOOR)) continue;
    const dx = x - cx, dy = y - CY, d = Math.hypot(dx, dy);
    let k: Key = 'l';
    if (d > R_DOOR - 1) {
      const lit = -(dx + dy) / d > -0.2;                  // facing the upper-left light
      k = lit ? (glint && dx + dy < -7 ? 'w' : 'e') : 't';
    }
    g.set(x, y, k);
  }
  // the door's edge (its thickness) shows on the gap side while it is out of the frame
  if (off > 0) for (let y = 0; y < BODY_H; y++) for (let x = 0; x < W; x++) {
    if (inDisc(x, y, cx, CY, R_DOOR) || !inDisc(x - 1, y, cx, CY, R_DOOR)) continue;
    if (inDisc(x, y, CX, CY, R_OPEN)) g.set(x, y, 's');
  }
}

/** Idle life while the door waits open: one white glint runs along the lit rim, 1 px per tick (GLINT_START…). */
const GLINT_START = 4;
function rimGlint(g: Grid, off: number, tick: number): void {
  const t = since(tick, GLINT_START);
  if (off !== DOOR_TRAVEL || since(tick, OPEN_START) < 4) return;
  const cx = CX - off;
  const rim: Array<[number, number, number]> = [];
  for (let y = 0; y < BODY_H; y++) for (let x = 0; x < W; x++) {
    if (!inDisc(x, y, cx, CY, R_DOOR) || inDisc(x, y, cx, CY, R_DOOR - 1)) continue;
    const a = Math.atan2(y - CY, x - cx);                 // −π…π; the top arc runs from ≈ −2.6 (upper left) to ≈ −0.9 (upper right)
    if (a > -2.6 && a < -0.9) rim.push([a, x, y]);
  }
  rim.sort((p, q) => p[0] - q[0]);
  if (t >= rim.length) return;
  const [, x, y] = rim[t];
  g.set(x, y, 'w');
  // the spark spills one pixel onto the face, toward the centre
  const ix = x + Math.sign(Math.round(cx - x)), iy = y + Math.sign(Math.round(CY - y));
  if (g.get(ix, iy) === 'l') g.set(ix, iy, 'e');
}

function wheel(g: Grid, off: number, tick: number): void {
  // four 2-px slate spokes around the seal (the dial); they turn a quarter while the door locks
  const s = since(tick, DIAL_START);
  const locked = doorOffset(tick) === 0;
  const steps = locked ? Math.min(s, 4) : 0;
  const cx = CX - off;
  for (let i = 0; i < 4; i++) {
    const a = ((45 + i * 90 + steps * 22.5) * Math.PI) / 180;
    for (const r of [5.2, 6.2]) g.set(Math.round(cx + r * Math.cos(a) - 0.01), Math.round(CY + r * Math.sin(a) - 0.01), r > 6 ? 's' : 'm');
  }
}

function seal(g: Grid, off: number, tick: number): void {
  const d = since(tick, DING_START);
  const swing = d < 4 ? [-1, 0, 1, 0][d] : 0;            // ringing: left, centre, right, centre
  const sx = Math.round(CX - off - 3.5) + swing, sy = Math.round(CY - 3.5);
  g.blit(BELL, sx, sy);
  if (d < 2) {
    // first swing: a 1-px azure halo around the bell (the same ring the logo mark plays)
    const on = (x: number, y: number) => x >= 0 && y >= 0 && x < BELL.w && y < BELL.h && BELL.data[y * BELL.w + x] !== 0;
    for (let y = -1; y <= BELL.h; y++) for (let x = -1; x <= BELL.w; x++) {
      if (on(x, y)) continue;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.set(sx + x, sy + y, 'a');
    }
  }
}

function ding(g: Grid, tick: number): void {
  const d = since(tick, DING_START);
  if (d >= 4) return;
  const out = d >= 2 ? 1 : 0;                             // the marks step outward on the second beat
  for (const side of [-1, 1]) {
    const edge = side < 0 ? 2 - out : 21 + out;
    const inner = edge - side;
    for (const [x, y] of [[inner, 8], [edge, 9], [edge, 10], [edge, 11], [edge, 12], [inner, 13]] as const) g.set(x, y, 'a');
  }
}

function payout(g: Grid, tick: number): void {
  // the escrowed token rises out of the opened door (eased 3, 2, 1 px), glints, and bursts: payment released
  const p = since(tick, PAY_START);
  if (p >= LOOP - PAY_START) return;                     // 39–47
  const rise: Array<[number, number]> = [[16, 9], [16, 5], [16, 3], [16, 2], [16, 2]];
  if (p === 0) {
    // still inside: only its top peeks out of the gap
    const [x, y] = rise[0];
    for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < COIN_FACE.w; xx++) {
      const v = COIN_FACE.data[yy * COIN_FACE.w + xx], under = g.get(x + xx, y + yy);
      if (v && (under === 'k' || under === 's') && inDisc(x + xx, y + yy, CX, CY, R_OPEN)) g.set(x + xx, y + yy, KEYS[v - 1]);
    }
    return;
  }
  if (p < rise.length) {
    const [x, y] = rise[p];
    g.blit(COIN_FACE, x, y);
    if (p === 4) { g.set(x + 1, y + 1, 'w'); g.set(x + 2, y + 1, 'w'); }   // glint before the burst
    return;
  }
  const cx = 18, cy = 4, b = p - rise.length;           // 44–47: burst, ring, fade
  const plot = (pts: Array<[number, number]>, k: Key) => { for (const [x, y] of pts) g.set(cx + x, cy + y, k); };
  if (b === 0) { plot([[0, 0]], 'w'); plot([[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]], 'a'); }
  else if (b === 1) plot([[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]], 'a');
  else if (b === 2) plot([[-4, 0], [4, 0], [0, -4], [0, 4]], 'c');
}

function drawVault(g: Grid, tick: number): void {
  const off = doorOffset(tick);
  body(g);
  door(g, off, since(tick, SHUT_HOME) === 0);
  rimGlint(g, off, tick);
  wheel(g, off, tick);
  seal(g, off, tick);
  ding(g, tick);
  payout(g, tick);
}

export const vault = definePiece({
  id: 'vault',
  size: [24, 24],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 14,
  palette: ['k', 'n', 's', 'm', 't', 'l', 'e', 'w', 'v', 'i', 'b', 'c', 'a'],
  // content.md §8 (spr-layer-packets), verbatim: the one description for the whole diagram
  alt: "Jobs and payment flow from clients into Bellproof's escrow vault, encrypted challenges go to a quantum computer, and a certified result returns.",
  cache: 'loop',
  frame(tick: number, g: Grid) { drawVault(g, tick); },
});
