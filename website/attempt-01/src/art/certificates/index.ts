// art-certificates · card 4 (art-spec §4): `cert-mini` (hero rider) and `cert-mint` (guarantees scene).
// Both pieces are pure functions of (tick, io). Light from the upper left. Timelines: README.md.

import {
  definePiece, ditherAt, Grid, KEYS, motion, rng,
  type DitherLevel, type Key, type Mounted, type Part, type PieceIO,
} from '../../engine';
import { BELL_SEAL, ISO_BLOCK, MINI_SEAL, MINI_STAMP, STAMP } from './parts';

// ── helpers ────────────────────────────────────────────────────────────────────────────────

const mod = (t: number, n: number) => ((t % n) + n) % n;
const keyOf = (v: number): Key => KEYS[v - 1];

/** Blit a part through an ordered-dither mask (0 = nothing, 4 = all), screen-locked. */
function blitDither(g: Grid, p: Part, x: number, y: number, level: DitherLevel): void {
  if (level <= 0) return;
  for (let sy = 0; sy < p.h; sy++) for (let sx = 0; sx < p.w; sx++) {
    const v = p.data[sy * p.w + sx];
    if (v && (level >= 4 || ditherAt(x + sx, y + sy, level))) g.set(x + sx, y + sy, keyOf(v));
  }
}

/** Blit a part resized vertically to `h` rows: rows above `a` keep the top, rows below `b` keep the bottom,
 *  the band a..b stretches (smear) or shrinks (squash). `flat` paints every pixel one key (smear, no detail). */
function blitV(g: Grid, p: Part, x: number, y: number, h: number, a: number, b: number, flat?: Key): void {
  const top = a, bottom = p.h - 1 - b, mid = Math.max(0, h - top - bottom), band = b - a + 1;
  for (let ty = 0; ty < h; ty++) {
    let sy: number;
    if (ty < top) sy = ty;
    else if (ty >= h - bottom) sy = p.h - (h - ty);
    else sy = a + Math.min(band - 1, Math.floor(((ty - top) * band) / Math.max(1, mid)));
    for (let sx = 0; sx < p.w; sx++) {
      const v = p.data[sy * p.w + sx];
      if (v) g.set(x + sx, y + ty, flat && keyOf(v) !== 'v' ? flat : keyOf(v));
    }
  }
}

function setD(g: Grid, x: number, y: number, k: Key, level: DitherLevel): void {
  if (level >= 4 || (level > 0 && ditherAt(x, y, level))) g.set(x, y, k);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════
// 4a · cert-mini  24×20 · loop 72 · poster 60 (stamped) · cache 'loop'
// ═════════════════════════════════════════════════════════════════════════════════════════════

const MINI = { cardX: 3, cardY: 6, cardW: 16, cardH: 14, sealX: 12, sealY: 12, hoverY: 8, impact: 45 } as const;

/** The tilted card: its left edge steps 1 px every 6 rows. */
const shear = (r: number) => (r < 6 ? 2 : r < 12 ? 1 : 0);

/** Text lines: [card-local row, x0, x1, key]. The seal sits at card-local x 8–13, rows 6–11. */
const MINI_LINES: Array<[number, number, number, Key]> = [
  [3, 2, 4, 'l'], [3, 6, 9, 'l'], [3, 11, 13, 'l'],
  [5, 2, 5, 'l'], [5, 7, 8, 'l'], [5, 10, 12, 'l'],
  [7, 2, 3, 'l'], [7, 5, 6, 'l'],
  [9, 2, 6, 'l'],
  [11, 2, 6, 't'],
];

function drawMiniCard(g: Grid, flash: boolean): void {
  const { cardX, cardY, cardW, cardH } = MINI;
  for (let r = 0; r < cardH; r++) {
    const x0 = cardX + shear(r), y = cardY + r;
    for (let c = 0; c < cardW; c++) {
      let k: Key = 'p';
      if (r === 0 || c === 0) k = 'l';
      if (r === cardH - 1 || c === cardW - 1) k = 't';
      if (flash && k !== 'p') k = 'w';
      g.set(x0 + c, y, k);
    }
  }
  for (const [r, a, b, k] of MINI_LINES) for (let c = a; c <= b; c++) g.set(cardX + shear(r) + c, cardY + r, k);
}

/** Stamp top y per tick (null = off canvas). */
function miniStampY(t: number): number | null {
  const { hoverY, sealY } = MINI;
  if (t <= 3) return [-2, 3, 6, 7][t];                       // returns from above, decelerating
  if (t <= 41) return hoverY - (Math.floor(t / 6) % 2);      // hover, 1-px bob every 12 ticks
  if (t <= 43) return hoverY - (t - 41);                     // anticipation: lifts 2 px
  if (t <= 47) return sealY;                                 // 44 smear, 45 impact, 46–47 pressed
  if (t <= 51) return sealY - [1, 4, 9, 16][t - 48];         // lifts away, accelerating
  return null;
}

export const certMini = definePiece({
  id: 'cert-mini',
  size: [24, 20],
  ticksPerFrame: 1,
  loopTicks: 72,
  poster: 60,
  maxColours: 9,
  palette: ['p', 'h', 'l', 't', 'm', 'i', 'a', 'v', 'w'],
  alt: '',
  cache: 'loop',
  states: ['hover', 'stamp', 'stamped'],
  frame(tick: number, g: Grid) {
    const t = mod(tick, 72);
    const { sealX, sealY, hoverY, impact } = MINI;
    drawMiniCard(g, t === impact);
    // printed seal (under the stamp while it presses); fades out over ticks 0–1 of the next loop
    if (t >= 48) g.blit(MINI_SEAL, sealX, sealY);
    else if (t <= 1) blitDither(g, MINI_SEAL, sealX, sealY, (t === 0 ? 2 : 1) as DitherLevel);
    // the stamp's contact shadow on the paper: shrinks as it lifts (anticipation), widens on the way down
    const y = miniStampY(t);
    if (t >= 2 && t <= 44) {
      const w = t === 44 ? 6 : t >= 42 ? 2 : 4;
      for (let x = 0; x < w; x++) g.set(sealX + 3 - (w >> 1) + x, sealY + 5, 'h');
    }
    if (t === 44) blitV(g, MINI_STAMP, sealX, hoverY - 2, sealY + 6 - (hoverY - 2), 2, 3, 't');   // smear 2× tall
    else if (t === impact) blitV(g, MINI_STAMP, sealX, sealY + 1, 5, 2, 3);                        // squash 1 px
    else if (y !== null) g.blit(MINI_STAMP, sealX, y);
    // dust: 4 pixels fly 1 px diagonally per tick from the base corners (45), fading l → h (46–47)
    if (t >= impact && t <= impact + 2) {
      const d = t - impact;
      const pts: Array<[number, number]> = [[sealX - 1 - d, sealY + 5 - d], [sealX + 6 + d, sealY + 5 - d], [sealX - 1 - d, sealY + 3 - d], [sealX + 6 + d, sealY + 3 - d]];
      pts.forEach(([x, yy], i) => { if (d < 2 || i < 2) g.set(x, yy, d === 0 ? 'l' : 'h'); });
    }
  },
  state(tick: number) {
    const t = mod(tick, 72);
    return t < 44 ? 'hover' : t < 48 ? 'stamp' : 'stamped';
  },
  events(tick: number) { return mod(tick, 72) === MINI.impact ? ['impact'] : []; },
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
// 4b · cert-mint  72×48 · loop 84 · poster 40 · cache 'none' · io.stamp
// ═════════════════════════════════════════════════════════════════════════════════════════════

export const MINT = {
  loop: 84,
  cardX: 2, cardY: 6, cardW: 28, cardH: 36,
  sealX: 17, sealY: 30,              // the printed bell seal
  stampX: 16, hoverY: 25, impactY: 29,
  chainY: 30, slots: [16, 30, 44] as const, newSlot: 58,
  impact: 27, landed: 56,
  entry: 22,                         // tick the sequence enters at when triggered from idle (rows typed, stamp hovering)
} as const;

/** 8 certificate rows (key length, value length), after the HTML card's rows. Row y = 9 + 2i (card-local). */
const ROWS: Array<[number, number]> = [[3, 4], [4, 10], [5, 15], [5, 14], [5, 12], [5, 8], [5, 10], [5, 6]];
const ROW_START = [2, 3, 5, 6, 8, 9, 11, 12];
const VALUE_X = 9;
const VERDICT = 7;                   // its value is stamped in, not typed

const SIG = ['.s.........', 's.s..ss..s.', '..s.s..ss.s', '...s.......'];

function drawScroll(g: Grid, flash: boolean): void {
  const { cardX: X, cardY: Y, cardW: W, cardH: H } = MINT;
  // rolled top edge: a cylinder with a highlight band, curled ends
  for (let x = 1; x < W - 1; x++) { g.set(X + x, Y, 'e'); g.set(X + x, Y + 1, 'e'); g.set(X + x, Y + 2, 'l'); g.set(X + x, Y + 3, 't'); }
  g.set(X, Y + 1, 'l'); g.set(X, Y + 2, 'l'); g.set(X + 1, Y, 'l');
  g.set(X + W - 1, Y + 1, 't'); g.set(X + W - 1, Y + 2, 't'); g.set(X + W - 2, Y, 'l');
  g.set(X + 1, Y + 2, 'm'); g.set(X + W - 2, Y + 2, 'm');            // the curl
  // the sheet
  for (let y = 4; y < H; y++) for (let x = 1; x < W - 1; x++) {
    let k: Key = 'p';
    if (x === 1) k = 'l';
    if (x === W - 2 || y === H - 1) k = 't';
    if (flash && k !== 'p') k = 'w';
    g.set(X + x, Y + y, k);
  }
  // printed form: title, rule, keys, signature line
  for (let x = 9; x <= 18; x++) g.set(X + x, Y + 5, 'm');
  for (let x = 3; x <= 24; x++) g.set(X + x, Y + 7, 'l');
  ROWS.forEach(([kl], i) => { for (let x = 3; x < 3 + kl; x++) g.set(X + x, Y + 9 + 2 * i, 't'); });
  for (let x = 3; x <= 13; x++) g.set(X + x, Y + 31, 'l');
}

/** Typed values: `px(i)` visible px of row i's value; the verdict value is drawn separately. */
function drawValues(g: Grid, px: (i: number) => number, level: DitherLevel, cursor: boolean): void {
  const { cardX: X, cardY: Y } = MINT;
  ROWS.forEach(([, vl], i) => {
    if (i === VERDICT) return;
    const n = Math.min(vl, px(i));
    for (let x = 0; x < n; x++) setD(g, X + VALUE_X + x, Y + 9 + 2 * i, 'l', level);
    if (cursor && n > 0 && n < vl) g.set(X + VALUE_X + n - 1, Y + 9 + 2 * i, 'c');
  });
}

function drawVerdict(g: Grid, k: Key, level: DitherLevel): void {
  const { cardX: X, cardY: Y } = MINT;
  for (let x = 0; x < ROWS[VERDICT][1]; x++) setD(g, X + VALUE_X + x, Y + 9 + 2 * VERDICT, k, level);
}

function drawSignature(g: Grid, cols: number, level: DitherLevel): void {
  const { cardX: X, cardY: Y } = MINT;
  for (let sy = 0; sy < SIG.length; sy++) for (let sx = 0; sx < Math.min(cols, SIG[0].length); sx++) {
    if (SIG[sy][sx] === 's') setD(g, X + 3 + sx, Y + 27 + sy, 's', level);
  }
}

/** Hash bits for block `id` at shuffle step `s`. */
function bits(id: number, s: number): boolean[] {
  const r = rng(((id + 1) * 7919 + s * 104729) >>> 0);
  return Array.from({ length: 16 }, () => r() < 0.35);
}
const LEFT_FACE: Array<[number, number]> = [[2, 5], [3, 6], [4, 6], [5, 7]];     // [x, first row] per bit column
const RIGHT_FACE: Array<[number, number]> = [[6, 7], [7, 6], [8, 6], [9, 5]];

/** One chain block. `face`: hash bits, or the certificate glyph on the lit face (dissolving at `glyph` < 4). */
function drawBlock(g: Grid, x: number, y: number, id: number, s: number, cert: boolean, glyph: DitherLevel = 4, h = 12): void {
  if (h !== 12) { blitV(g, ISO_BLOCK, x, y, h, 6, 8); return; }      // smear / squash: silhouette only
  g.blit(ISO_BLOCK, x, y);
  const b = bits(id, s);
  RIGHT_FACE.forEach(([bx, by], c) => { for (let r = 0; r < 4; r++) if (b[c * 4 + r]) g.set(x + bx, y + by + r, 'c'); });
  const leftBits = () => LEFT_FACE.forEach(([bx, by], c) => { for (let r = 0; r < 4; r++) if (b[(3 - c) * 4 + r]) g.set(x + bx, y + by + r, 'a'); });
  if (!cert) { leftBits(); return; }
  if (glyph < 4) leftBits();
  LEFT_FACE.forEach(([bx, by]) => { for (let r = 0; r < 4; r++) setD(g, x + bx, y + by + r, 'p', glyph); });
  setD(g, x + 4, y + 8, 'v', glyph); setD(g, x + 5, y + 9, 'v', glyph);
}

function drawLink(g: Grid, x: number, y: number): void {
  g.set(x, y + 6, 'l'); g.set(x + 1, y + 6, 'l'); g.set(x, y + 7, 't'); g.set(x + 1, y + 7, 't');
}

/** Stamp phase (0..83) or -1 when idle (io.stamp === false). */
function phaseOf(tick: number, io: PieceIO): number { return io.stamp === false ? -1 : mod(tick, MINT.loop); }

/** Stamp tool top y for a phase (idle uses the bob); null = off canvas. */
function stampY(P: number, T: number): number | null {
  const { hoverY, impactY } = MINT;
  if (P < 0) return hoverY - (Math.floor(T / 6) % 2);
  if (P < 10) return null;
  if (P <= 15) return [-2, 9, 16, 20, 23, 24][P - 10];          // enters from above, decelerating
  if (P <= 23) return hoverY - (P >= 18 && P < 22 ? 1 : 0);     // hover with one bob
  if (P <= 25) return hoverY - (P - 23);                        // anticipation
  if (P <= 29) return impactY;                                  // 26 smear · 27 impact · 28–29 pressed
  if (P <= 34) return impactY - [1, 4, 9, 17, 29][P - 30];      // lifts away, accelerating
  return null;
}

export const certMint = definePiece({
  id: 'cert-mint',
  size: [72, 48],
  ticksPerFrame: 1,
  loopTicks: 84,
  poster: 40,
  maxColours: 15,
  palette: ['p', 'h', 'l', 'e', 't', 'm', 's', 'i', 'v', 'r', 'w', 'g', 'c', 'b', 'a'],
  alt: 'A certificate is stamped ACCEPTED and minted as a block on a chain.',
  cache: 'none',
  inputs: { stamp: { type: 'boolean', default: true } },
  states: ['idle', 'typing', 'stamping', 'stamped', 'minting', 'chained'],
  frame(tick: number, g: Grid, io: PieceIO) {
    const T = mod(tick, MINT.loop);
    const P = phaseOf(tick, io);
    const idle = P < 0;
    const { sealX, sealY, stampX, hoverY, impactY, chainY, slots, newSlot, impact } = MINT;

    // ── the chain (behind the scroll) ──
    const shift = idle || P < 60 ? 0 : Math.min(14, P - 59);
    const settled = !idle && P >= 74;                          // ids follow the slot a block rests in
    slots.forEach((sx, j) => {
      const x = sx - shift, id = settled ? j - 1 : j;
      const s = Math.floor(mod(T + 4 * (id + 1), 84) / 12);
      drawLink(g, x + 12, chainY);
      drawBlock(g, x, chainY, id, s, false);
    });
    if (!idle && P >= 50) {
      const id = settled ? 2 : 3, s = Math.floor(mod(T + 4 * (id + 1), 84) / 12);
      if (P >= 56) {
        const glyph: DitherLevel = P < 76 ? 4 : P === 76 ? 2 : P === 77 ? 1 : 0;
        if (P === 56) drawBlock(g, newSlot, chainY + 1, id, s, true, 4, 11);             // squash on landing
        else { drawLink(g, newSlot - shift + 12, chainY); drawBlock(g, newSlot - shift, chainY, id, s, glyph > 0, glyph); }
      } else if (P === 55) drawBlock(g, newSlot, 25, id, s, true, 4, 17);                 // smear, path 25→41
      else drawBlock(g, newSlot, 16 + 2 * (P - 50), id, s, true);                         // appears at row 16, drops 2 px/tick
    }

    // the chain only shows right of the sheet (x ≥ 29): blocks slide behind it
    for (let y = chainY; y < chainY + 12; y++) for (let x = 0; x < 29; x++) g.set(x, y, null);

    // ── the scroll layer (drawn on its own grid so the impact can jolt it 1 px) ──
    const front = g;
    g = new Grid(front.w, front.h);
    drawScroll(g, P === impact);
    const fade: DitherLevel = idle ? 4 : P === 0 ? 2 : P === 1 ? 1 : 4;
    const full = idle || P <= 1;
    if (full || P >= 2) {
      drawValues(g, (i) => (full ? 99 : (P - ROW_START[i]) * 2), fade, !full);
      drawSignature(g, full ? 99 : (P - 14) * 2, fade);
    }
    if (!idle && (P <= 1 || P >= impact)) drawVerdict(g, P === impact ? 'a' : 'i', fade);

    // ── the bell wax seal: pressed in at impact, revealed as the stamp lifts; fades out at 0–1 ──
    if (!idle && (P <= 1 || P >= 30)) {
      if (P <= 1) blitDither(g, BELL_SEAL, sealX, sealY, (P === 0 ? 2 : 1) as DitherLevel);
      else {
        g.blit(BELL_SEAL, sealX, sealY);
        if (P >= 42 && P <= 47) {                                // glint: a 3-px diagonal sweeps a → g → w → g → a
          const d = 3 + (P - 42) * 2, k: Key = (['a', 'g', 'w', 'w', 'g', 'a'] as Key[])[P - 42];
          for (let sy = 0; sy < 9; sy++) { const sx = d - sy; if (sy >= 1 && sy <= 3 + Math.min(2, P - 42) && sx >= 0 && sx < 9 && BELL_SEAL.data[sy * 9 + sx] && keyOf(BELL_SEAL.data[sy * 9 + sx]) !== 'g') g.set(sealX + sx, sealY + sy, k); }
        }
      }
    }

    // ── the stamp tool, with its contact shadow on the paper while it hovers ──
    if (idle || (P >= 16 && P <= 26)) {
      const w = P === 26 ? 9 : P === 24 || P === 25 ? 3 + (25 - P) * 2 : 7;
      for (let x = 0; x < w; x++) g.set(sealX + 4 - (w >> 1) + x, sealY + 8, 'h');
    }
    if (P === 26) blitV(g, STAMP, stampX, hoverY - 2, impactY + 10 - (hoverY - 2), 4, 5, 't');   // smear, 1.6× tall
    else if (P === impact) {
      blitV(g, STAMP, stampX, impactY + 1, 9, 4, 5);                                              // squash 1 px
      g.set(stampX - 1, impactY + 9, 'i'); g.set(stampX + 11, impactY + 9, 'i');                  // wax squeezed out
    } else if (P === 33) blitV(g, STAMP, stampX, impactY - 17, 20, 4, 5, 't');                   // exit smear
    else {
      const y = stampY(P, T);
      if (y !== null) g.blit(STAMP, stampX, y);
    }

    // ── impact dust: 6 pixels fly out from the base, fading t → l → h (27–29) ──
    if (!idle && P >= impact && P <= impact + 2) {
      const d = P - impact, k: Key = (['t', 'l', 'h'] as Key[])[d], by = impactY + 9;
      const pts: Array<[number, number]> = [
        [stampX - 2 - d, by - 1 - d], [stampX - 1 - d, by - 3 - d], [stampX - 3 - d, by - d],
        [stampX + 12 + d, by - 1 - d], [stampX + 11 + d, by - 3 - d], [stampX + 13 + d, by - d],
      ];
      pts.forEach(([x, y], i) => { if (d < 2 || i % 3 === 0) g.set(x, y, k); });
    }
    front.blit(g, 0, P === impact ? 1 : 0);
    g = front;

    // ── mint sparkle (48–49) and the click spark at the link (56–57) ──
    if (!idle && (P === 48 || P === 49)) {
      const cx = newSlot + 6, cy = 21, r = P === 48 ? 1 : 2;
      g.set(cx, cy, P === 48 ? 'w' : 'g');
      g.set(cx - r, cy, 'a'); g.set(cx + r, cy, 'a'); g.set(cx, cy - r, 'a'); g.set(cx, cy + r, 'a');
    }
    if (!idle && (P === 56 || P === 57)) {
      const lx = newSlot - 2, ly = chainY + 6;                 // the link: 2×2 at (lx, ly)
      const r = P === 56 ? 2 : 3, k: Key = P === 56 ? 'w' : 'a';
      g.set(lx - r + 1, ly - r + 1, k); g.set(lx + r, ly - r + 1, k); g.set(lx - r + 1, ly + r, k); g.set(lx + r, ly + r, k);
    }
  },
  state(tick: number, io: PieceIO) {
    const P = phaseOf(tick, io);
    if (P < 0) return 'idle';
    if (P < 24) return 'typing';
    if (P < 30) return 'stamping';
    if (P < 48) return 'stamped';
    if (P < 60) return 'minting';
    return 'chained';
  },
  events(tick: number, io: PieceIO) {
    const P = phaseOf(tick, io);
    return P === MINT.impact ? ['impact'] : P === MINT.landed ? ['minted'] : [];
  },
  exports: {
    /** Section API: start the stamp now (HTML rows typed). Under reduced motion the stamped poster is shown. */
    stamp(m: Mounted): void {
      m.set('stamp', true);
      if (motion.reduced) return;
      const was = m.playing;
      m.stop(); m.seek(MINT.entry); if (was) m.play();
    },
    timeline: { loop: 84, entry: 22, impact: 27, minted: 56, poster: 40 },
  },
});

export default [certMini, certMint];
