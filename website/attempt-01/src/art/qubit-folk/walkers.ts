// 3b · walkers (CTA staircase) 40×16, cache 'none'. Alice (x 0–11) and Bob (x 28–39), facing right, joined
// by the link. The section moves the canvas; the piece animates in place.
//
//   mode 'walk'   : the shared 8-pose walk at 12 fps, in lockstep (the pair marches in step). Move the
//                   canvas 1 art px (4 CSS px) per tick on the same clock and the planted feet stay put.
//   mode 'hifive' : 24 ticks counted from the `since` input (set it to mounted.localTick when you switch).
//                    0     Bob turns to face Alice
//                    1–2   both lean in 1 px, then crouch (anticipation)
//                    3     take-off (stretch, antennas dragged)
//                    4     apex: both rims and the whole link flash white on this one tick → event 'flash'
//                    5–6   an indigo ring blooms on the middle of the link (r 1, r 2); a twinkle opens
//                          over each head (5–8, plus → cross → dot → mist)
//                    6–8   fall, touchdown, landing squash
//                    5–15  smile and blush
//                    9–20  antennas spin one L-U-R-U cycle in mirror (3 ticks each)
//                    21    Bob turns back to face right; 23 → event 'done' (switch back to 'walk')
//   mode 'stand'  : both face the viewer, mirrored antenna sweep, blink on 10 and 34 (hover pauses the walk).
// Poster: stand, tick 2.
//
// Stairs: the staircase steps are narrower than the 28-px Alice→Bob spacing, so on the real strip the two
// usually stand on different steps. Variant 'stairs' (40×32) adds 16 rows of headroom and the inputs
// liftA / liftB (art px) raise each creature independently; the link follows as a slanted chord. Put the
// canvas bottom on the lower creature's surface and lift the other by the height difference ÷ 4.

import { definePiece, type Grid, type PieceIO } from '../../engine';
import { BOX, drawCreature, FOOT_INK, type Pose } from './creature';
import { drawLink } from './link';
import { walkPose } from './walk';

const LOOP = 48;
export const HIFIVE_TICKS = 24;
const FLASH_TICK = 4;
const SWEEP: Array<-1 | 0 | 1> = [-1, -1, -1, 0, 0, 0, 1, 1, 1, 0, 0, 0];
const SPIN: Array<-1 | 0 | 1> = SWEEP;          // one L-U-R-U cycle
const mod = (a: number, n: number) => ((a % n) + n) % n;
const WALK_FEET = [FOOT_INK[1], FOOT_INK[0]] as const;   // behind foot shaded, front foot lit

function elapsed(tick: number, io: PieceIO): number { return mod(tick - Number(io.since ?? 0), LOOP); }

type Partial2 = Omit<Pose, 'who'>;

/** Shared hop arc of the high-five (both creatures move on exactly the same ticks). */
function hifiveBody(e: number): Partial2 {
  switch (e) {
    case 2: return { body: 'squash' };
    case 3: return { body: 'stretch', air: 1, stalk: 1, tip: -1 };
    case 4: return { air: 2 };
    case 5: return { air: 2 };
    case 6: return { body: 'stretch', air: 1 };
    case 7: return {};
    case 8: return { body: 'squash' };
    default: return {};
  }
}

/** Integer lift in art px for one creature, clamped to the variant's headroom (0 on the 40×16 default). */
function lift(v: unknown, g: Grid): number {
  const n = Math.round(Number(v) || 0);
  return Math.max(0, Math.min(g.h - 16, n));
}

function drawWalkers(tick: number, g: Grid, io: PieceIO): void {
  const t = mod(tick, LOOP);
  const mode = io.mode || 'stand';
  const B = BOX.md;
  const byA = g.h - B.h - lift(io.liftA, g);   // each creature's box top; lifts let the 'stairs' variant
  const byB = g.h - B.h - lift(io.liftB, g);   // stand Alice and Bob on different steps
  const ax = 0, bx = g.w - B.w;
  let alice: Pose, bob: Pose;
  let link: 'idle' | 'flash' | 'agree' = 'idle';
  let ring = 0, twinkle = 0;

  if (mode === 'walk') {
    const w = walkPose(t, 1);
    const p: Partial2 = { face: 1, feet: w.feet, bob: w.bob, tip: w.tip, footKeys: WALK_FEET };
    alice = { who: 'alice', ...p };
    bob = { who: 'bob', ...p };
  } else if (mode === 'hifive' && elapsed(tick, io) < HIFIVE_TICKS) {
    const e = elapsed(tick, io);
    const arc = hifiveBody(e);
    const lean = e === 1 || e === 2 ? 1 : 0;
    const spin = e >= 9 && e <= 20 ? SPIN[e - 9] : 0;
    const happy = e >= 5 && e <= 15;
    const flash = e === FLASH_TICK;
    const tip = arc.tip ?? spin;
    link = flash ? 'flash' : e >= 5 && e <= 9 ? 'agree' : 'idle';
    ring = e === 5 ? 1 : e === 6 ? 2 : 0;
    twinkle = e >= 5 && e <= 8 ? e - 4 : 0;
    const common: Partial2 = { ...arc, flash, mouth: happy ? 'smile' : 'none', footKeys: FOOT_INK, tip: 0 };
    alice = { who: 'alice', ...common, face: 1, lean, tip, blush: happy ? 'a' : null };
    bob = { who: 'bob', ...common, face: e >= 1 && e <= 20 ? -1 : e === 0 ? -1 : 1, lean: -lean, tip: (-tip) as -1 | 0 | 1, blush: happy ? 'r' : null };
  } else if (mode === 'hifive') {
    // after the high-five (until the section switches back to 'walk'): idle, facing the way they walk
    const s = SWEEP[t % 12];
    const blink = t === 10 || t === 34;
    alice = { who: 'alice', face: 1, tip: s, eyes: blink ? 'closed' : 'open', footKeys: FOOT_INK };
    bob = { who: 'bob', face: 1, tip: s, eyes: blink ? 'closed' : 'open', footKeys: FOOT_INK };
  } else {
    const s = SWEEP[t % 12];
    const blink = t === 10 || t === 34;
    alice = { who: 'alice', face: 0, tip: s, eyes: blink ? 'closed' : 'open', footKeys: FOOT_INK };
    bob = { who: 'bob', face: 0, mirror: true, tip: (-s) as -1 | 0 | 1, eyes: blink ? 'closed' : 'open', footKeys: FOOT_INK };
  }

  const eqY = (p: Pose, by: number) => by + B.orbBottom - 5 - (p.air ?? 0) - (p.bob ?? 0) + (p.body === 'squash' ? 1 : 0);
  const ya = eqY(alice, byA), yb = eqY(bob, byB);
  drawLink(g, ax + B.w - 1, ya, bx, yb, t, { state: link, period: 24, harmonic: 1, shimmer: 6 });
  // the ring blooms on the middle of the link, then sinks into the ink
  if (ring) g.ring(Math.floor(g.w / 2), Math.round((ya + yb) / 2), ring, ring === 1 ? 'i' : 'n');
  drawCreature(g, ax, byA, alice);
  drawCreature(g, bx, byB, bob);

  // twinkles over each head, mirrored, same ticks: plus with a white heart → plus → dot → mist
  if (twinkle) {
    for (const [cx, cy] of [[1, byA - 1], [g.w - 2, byB - 1]]) {
      if (twinkle <= 2) {
        g.set(cx - 1, cy, 'a'); g.set(cx + 1, cy, 'a'); g.set(cx, cy - 1, 'a'); g.set(cx, cy + 1, 'a');
        if (twinkle === 1) g.set(cx, cy, 'w');
      } else g.set(cx, cy, twinkle === 3 ? 'a' : 'u');
    }
  }
}

export const walkers = definePiece({
  id: 'walkers',
  size: [40, 16],
  variants: { stairs: [40, 32] },
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: 2,
  maxColours: 13,
  palette: ['k', 'n', 'm', 't', 'v', 'i', 'b', 'c', 'a', 'u', 'g', 'r', 'w'],
  alt: 'Alice and Bob, two entangled qubit creatures, walk down the staircase together and high-five.',
  cache: 'none',
  inputs: { since: { type: 'number', default: 0 }, liftA: { type: 'number', default: 0 }, liftB: { type: 'number', default: 0 } },
  modes: ['stand', 'walk', 'hifive'],
  states: ['stand', 'walk', 'hifive', 'hifive-done'],
  frame(tick: number, g: Grid, io: PieceIO, _variant?: string) { drawWalkers(tick, g, io); },
  state(tick: number, io: PieceIO) {
    if (io.mode === 'hifive') return elapsed(tick, io) < HIFIVE_TICKS ? 'hifive' : 'hifive-done';
    return io.mode === 'walk' ? 'walk' : 'stand';
  },
  events(tick: number, io: PieceIO) {
    if (io.mode !== 'hifive') return [];
    const e = elapsed(tick, io);
    return e === FLASH_TICK ? ['flash'] : e === HIFIVE_TICKS - 1 ? ['done'] : [];
  },
  exports: { walkArtPxPerTick: 1, hifiveTicks: HIFIVE_TICKS, flashTick: FLASH_TICK, feetRow: 15 },
});
