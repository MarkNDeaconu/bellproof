// glitch-cells · six failure icons for the Cost section (art-spec card 12, design-spec §5.4 A).
//
// Each icon is a 16×16 still that looks perfectly normal, then glitches for two frames and snaps back
// as if nothing happened ("a wrong answer looks exactly like a right one"). Timeline of one glitch:
//   d = 0  g1   (1 tick)
//   d = 1  g2   (1 tick)
//   d = 2  base (the third tick of the glitch; the icon is back to its idle frame)
// Idle (no hover/focus) is static: every tick draws the same frame, so the poster (tick 0) is the idle frame.
//
// Triggering (frame() is pure, so the hover-enter tick comes in as an input):
//   io.hover || io.focus, with io.hoverAt ≥ 0  → one glitch starting at local tick hoverAt (repeats only
//                                                if the pointer stays a whole loop, 6–16 s)
//   io.hover || io.focus, no hoverAt           → fallback: a glitch every 24 ticks (2 s) while hovered;
//                                                used by the harness (?hover=1) and naive bindings
//   io.idle (opt-in, default false)            → one unprompted glitch per loop at a per-icon offset; loops
//                                                differ per icon so six cells never twitch in unison
// Use bindGlitch(mounted, cellElement) from section code to get the exact once-per-enter behaviour.

import { definePiece, motion, type Grid, type Key, type Mounted, type Part, type Piece, type PieceIO } from '../../engine';
import {
  TV, SNOW_A, SNOW_B, DISC13, DISC11, DISC9, BUG, BUG_STEP, BLADES_OPEN, BLADES_WIDE, BLADES_SHUT, HANDLES, MASK, COIN,
} from './parts';

const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** Fallback cadence (ticks) when hovered without a hoverAt tick. Every loop length is a multiple of it. */
export const FALLBACK_EVERY = 24;

/** 0 = base, 1 = g1, 2 = g2. */
export function glitchStep(tick: number, io: PieceIO, loop: number, idleAt: number): 0 | 1 | 2 {
  let d = -1;
  if (io.hover === true || io.focus === true) {
    const at = typeof io.hoverAt === 'number' && io.hoverAt >= 0 ? io.hoverAt : -1;
    d = at >= 0 ? mod(tick - at, loop) : mod(tick - 12, FALLBACK_EVERY);
  } else if (io.idle === true) d = mod(tick - idleAt, loop);
  return d === 0 ? 1 : d === 1 ? 2 : 0;
}

/**
 * Wire hover and focus on `el` (default: the piece's own element; pass the whole cell) so that every
 * pointer-enter or focus-enter plays exactly one glitch, starting on the very next tick.
 * Does nothing under reduced motion. Returns an unbind function.
 */
export function bindGlitch(m: Mounted, el: HTMLElement = m.el): () => void {
  // own enter state, so another listener that also sets io.hover cannot swallow the hoverAt stamp
  const inside = { hover: false, focus: false };
  const on = (k: 'hover' | 'focus') => (): void => {
    if (motion.reduced) return;
    if (!inside.hover && !inside.focus) m.set('hoverAt', m.localTick + 1);   // next drawn tick = g1
    inside[k] = true;
    m.set(k, true);
  };
  const off = (k: 'hover' | 'focus') => (): void => { inside[k] = false; m.set(k, false); };
  const pairs: Array<[string, () => void]> = [
    ['pointerenter', on('hover')], ['pointerleave', off('hover')], ['focusin', on('focus')], ['focusout', off('focus')],
  ];
  for (const [ev, fn] of pairs) el.addEventListener(ev, fn);
  return () => { for (const [ev, fn] of pairs) el.removeEventListener(ev, fn); };
}

const INPUTS = {
  hoverAt: { type: 'number' as const, default: -1 },
  idle: { type: 'boolean' as const, default: false },
};

/** Shared contract for the six pieces; each supplies only its drawing. */
function glitchPiece(o: {
  id: string; loop: number; idleAt: number; palette: Piece['palette']; alt: string;
  draw(g: Grid, step: 0 | 1 | 2): void;
}): Piece {
  return definePiece({
    id: o.id, size: [16, 16], ticksPerFrame: 1, loopTicks: o.loop, poster: 0,
    maxColours: 6, palette: o.palette, alt: o.alt, cache: 'none', inputs: INPUTS,
    frame(tick: number, g: Grid, io: PieceIO) { o.draw(g, glitchStep(tick, io, o.loop, o.idleAt)); },
    events(tick: number, io: PieceIO) { return glitchStep(tick, io, o.loop, o.idleAt) === 1 ? ['glitch'] : []; },
    exports: { bindGlitch, glitchStep },
  });
}

/** Shift a band of rows right by dx (vacated pixels become transparent; overflow is clipped). */
function shiftBand(g: Grid, y0: number, y1: number, x0: number, x1: number, dx: number): void {
  for (let y = y0; y <= y1; y++) {
    const row: Array<Key | null> = [];
    for (let x = x0; x <= x1; x++) row.push(g.get(x, y));
    for (let i = 0; i < row.length; i++) {
      const src = i - dx;
      g.set(x0 + i, y, src >= 0 && src < row.length ? row[src] : null);
    }
  }
}

/** Stamp a mask part in one colour, optionally only where `where(x, y)` holds (grid coordinates). */
function stamp(g: Grid, p: Part, ox: number, oy: number, k: Key, where?: (x: number, y: number) => boolean): void {
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    if (!p.data[y * p.w + x]) continue;
    if (where && !where(ox + x, oy + y)) continue;
    g.set(ox + x, oy + y, k);
  }
}

// ── Noise: a TV with rabbit ears and frozen snow. g1: the snow reseeds and the right ear gets knocked
//    flat; g2: a 2-px band of the picture tears 2 px to the right.
function drawSnow(g: Grid, rows: readonly string[]): void {
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const ch = r[x];
      if (ch !== '.') g.set(3 + x, 7 + y, ch === '1' ? 't' : ch === '2' ? 'l' : 'e');
    }
  });
  g.set(3, 7, 'e'); g.set(3, 12, 'e'); g.set(10, 7, 'l'); g.set(10, 12, 'l');   // rounded screen corners
}

export const glitchNoise = glitchPiece({
  id: 'glitch-noise', loop: 96, idleAt: 40, palette: ['s', 'm', 't', 'l', 'e', 'a'],
  alt: 'A small television with rabbit-ear antennas, its screen full of static.',
  draw(g, step) {
    g.blit(TV, 0, 0);
    drawSnow(g, step === 1 ? SNOW_B : SNOW_A);
    if (step === 1) {
      for (const [x, y] of [[10, 2], [11, 1], [12, 0]] as const) g.set(x, y, null);
      for (const [x, y] of [[10, 3], [11, 2], [12, 2], [13, 1]] as const) g.set(x, y, 't');
    }
    if (step === 2) shiftBand(g, 9, 10, 0, 15, 2);
  },
});

// ── Drift: a pressure gauge, needle parked in its blue calibrated zone. g1: needle at 1 o'clock;
//    g2: needle at 2 o'clock (each angle re-rasterised, never rotated). Then it is back on 12.
const NEEDLE: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[7, 6], [7, 5], [7, 4], [7, 3]],
  [[8, 6], [8, 5], [9, 4]],
  [[8, 6], [9, 6], [10, 5]],
];

export const glitchDrift = glitchPiece({
  id: 'glitch-drift', loop: 144, idleAt: 70, palette: ['s', 'l', 't', 'e', 'b', 'k'],
  alt: 'A gauge with its needle in the calibrated zone.',
  draw(g, step) {
    stamp(g, DISC13, 1, 1, 's');                                 // bezel outline
    stamp(g, DISC11, 2, 2, 'l', (x, y) => x + y <= 14);          // inner rim, lit upper left
    stamp(g, DISC11, 2, 2, 't', (x, y) => x + y > 14);           // inner rim, shaded lower right
    stamp(g, DISC9, 3, 3, 'e');                                  // face
    g.rect(6, 14, 1, 2, 'l'); g.rect(7, 14, 1, 2, 't'); g.rect(8, 14, 1, 2, 's');   // stem
    for (const [x, y] of [[6, 3], [7, 3], [8, 3], [5, 4], [9, 4]] as const) g.set(x, y, 'b');   // calibrated zone
    for (const [x, y] of [[3, 7], [11, 7], [4, 10], [10, 10]] as const) g.set(x, y, 't');      // scale ticks
    for (const [x, y] of NEEDLE[step]) g.set(x, y, 'k');
    g.set(7, 7, 'k');                                            // hub
  },
});

// ── Software bugs: a glossy beetle. g1: a tripod of legs steps forward; g2: the beetle jumps 1 px
//    right and leaves a steel after-image where it was.
export const glitchBug = glitchPiece({
  id: 'glitch-bug', loop: 72, idleAt: 30, palette: ['k', 's', 'm', 'l', 'a', 't'],
  alt: 'A beetle: a bug.',
  draw(g, step) {
    if (step === 2) { g.blit(BUG, 0, 1, { recolor: { k: 't', s: 't', m: 't', l: 't', a: 't' } }); g.blit(BUG, 1, 1); }
    else g.blit(step === 1 ? BUG_STEP : BUG, 0, 1);
  },
});

// ── Corner-cutting: scissors straddling a thread. g1: the blades open 2 px wider; g2: they snap shut,
//    the thread parts and sags, and the snipped piece drops. Then the thread is whole again.
export const glitchCut = glitchPiece({
  id: 'glitch-cut', loop: 120, idleAt: 60, palette: ['t', 's', 'l', 'b', 'c'],
  alt: 'A pair of scissors about to snip a thread.',
  draw(g, step) {
    if (step === 2) {
      for (let x = 0; x < 16; x++) if (x < 6 || x > 9) g.set(x, x < 4 || x > 11 ? 3 : 4, 't');
      g.set(11, 6, 't'); g.set(12, 6, 't');
    } else for (let x = 0; x < 16; x++) g.set(x, 3, 't');
    g.blit(step === 1 ? BLADES_WIDE : step === 2 ? BLADES_SHUT : BLADES_OPEN, 0, 0);
    g.blit(HANDLES, 0, 7);
  },
});

// ── Classical stand-ins: a blank porcelain mask on a strap. g1: the eye slits light up azure, as if
//    something quantum were looking out; g2: the mask slips 1 px down off its strap and the slits are
//    empty: nobody is behind it.
export const glitchMask = glitchPiece({
  id: 'glitch-mask', loop: 168, idleAt: 90, palette: ['e', 'l', 'm', 'k', 't', 'a'],
  alt: 'A blank face mask on a strap.',
  draw(g, step) {
    if (step === 2) {
      g.blit(MASK, 0, 1, { mask: ['e', 'l', 'm'] });
      g.blit(MASK, 0, 0, { mask: ['t'] });
    } else g.blit(MASK, 0, 0, step === 1 ? { recolor: { k: 'a' } } : {});
    selout(g);
  },
});

/** Selective outline for the mask: its outline steps up to steel on the lit upper-left. */
function selout(g: Grid): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g.get(x, y) === 'm' && x + y <= 13) g.set(x, y, 't');
}

// ── Fraud: a token coin that looks perfectly sound. g1: a 1-px raspberry crack runs through it;
//    g2: the crack widens to 2 px and the right half shifts 1 px. The only alert pixels in the family.
const CRACK: ReadonlyArray<readonly [number, number]> = [
  [7, 1], [7, 2], [6, 3], [6, 4], [7, 5], [8, 6], [8, 7], [7, 8], [7, 9], [8, 10], [8, 11], [7, 12], [7, 13], [8, 14],
];

function drawCoin(g: Grid): void {
  g.blit(COIN, 1, 1);
  g.rect(7, 5, 1, 5, 'c'); g.rect(6, 5, 1, 5, 'g');              // the token slot, raised: lit left, shaded right
}

export const glitchCrack = glitchPiece({
  id: 'glitch-crack', loop: 192, idleAt: 50, palette: ['g', 'a', 'c', 'b', 'w', 'R'],
  alt: 'A token coin.',
  draw(g, step) {
    drawCoin(g);
    if (step === 1) for (const [x, y] of CRACK) { if (g.get(x, y)) g.set(x, y, 'R'); }
    if (step === 2) {
      for (const [x, y] of CRACK) {
        shiftBand(g, y, y, x + 1, 15, 1);
        if (g.get(x, y)) { g.set(x, y, 'R'); g.set(x + 1, y, 'R'); }
      }
    }
  },
});

/** In design-spec order: Noise, Drift, Software bugs, Corner-cutting, Classical stand-ins, Fraud. */
export const glitchCells = [glitchNoise, glitchDrift, glitchBug, glitchCut, glitchMask, glitchCrack];
export default glitchCells;
