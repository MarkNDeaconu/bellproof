// wall-to-lock (art-spec card 7): physical separation becomes cryptographic separation.
//
// State A (physical): two mini fridges kept apart by a brick wall. Each is dealt its own `?` card from
// its own stack (Alice's blue-tabbed deck on the left, Bob's violet one on the right).
// Morph: the wall crunches down into a block of bricks, leaps over the two fridges as they slide together
// and merge, lands on the left as a padlock, and turns from brick to steel.
// State B (crypto): Alice's card walks into the open padlock, the shackle snaps shut, and the locked
// question is carried to the one fridge, which answers it blind: the answer runs up the readout line and
// leaves through the top. Only then is Bob's card dealt; it arrives open and is answered the same way.
// Reverse morph: the padlock turns back to brick, leaps back over the splitting fridge and grows into
// the wall again.
//
// Timeline: README.md. Every frame is a pure function of the tick (loop 120 = 10 s at 12 fps).

import { definePiece, ditherAt, Grid, KEYS, type DitherLevel, type Key, type Part } from '../../engine';
import { drawFridgeMini, MINI } from '../fridge-family';
import {
  BODY, BODY_Y, CARD, CARD_GLYPH, CARD_H, CARD_W, LOCK_H, LOCK_W, QMARK, SHACKLE, SHACKLE_X,
} from './parts';

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Geometry (art px)

export const W = 96;
export const H = 48;
export const LOOP = 120;
export const POSTER = 73;
const FLOOR = 44; // floor row; everything stands on row 43
const FY = FLOOR - MINI.h; // fridge top row (20)
const FL_X = 8; // left fridge (Alice's device)
const FR_X = 72; // right fridge (Bob's device)
const SLIDE = 32; // both slide 32 px and meet at x 40
const FM_X = FL_X + SLIDE; // merged fridge
const WALL_X = 42;
const WALL_W = 12;
const COURSES = 10; // 10 courses × 3 rows = 30 rows (14–43)
const BLOCK_COURSES = 4; // the compacted wall: 12×12
const LOCK_Y = FLOOR - LOCK_H; // 32
const LOCK_HOME = 20; // where the padlock lands (x 20–29)
const LOCK_DOCK = 34; // where it parks against the fridge (x 34–43, 1 px left of the chip box)
const CARD_Y = FLOOR - CARD_H; // 36
const STACK_L = 1; // left deck: front card x 1–6, fanned up-right toward the centre
const STACK_R = W - 1 - CARD_W; // right deck: front card x 89–94, fanned up-left
const CHIP_L = (fx: number) => fx + MINI.chipBox.x; // chip box left column
const CHIP_R = (fx: number) => fx + MINI.chipBox.x + MINI.chipBox.w - 1; // chip box right column

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Timeline (ticks). README has the frame-by-frame table.

export const T = {
  // State A · physical (0–23)
  dealA: 1, blinkL: 8, dealB: 9, blinkR: 16,
  // forward morph (24–47)
  morph: 24, crack: 24, compact: 25, leap: 31, land: 39, recolour: 40, glint: 42, converge: 30,
  // State B · crypto (48–95)
  dealA2: 43, slot: 51, snap: 55, travel: 59, dock: 65, blink1: 67, dealB2: 76, blink2: 91,
  crypto: 48,
  // reverse morph (96–119)
  back: 96, unrecolour: 96, leapBack: 98, split: 100, landBack: 108, grow: 109,
} as const;

/** Eased spacing of the 32-px slide (slow-in, slow-out, 12 ticks). */
const SLIDE_STEPS = [1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1];
const SLIDE_CUM = SLIDE_STEPS.map((_, i) => SLIDE_STEPS.slice(0, i + 1).reduce((a, b) => a + b, 0));

export type WtlState = 'physical' | 'morph' | 'crypto';

export function stateAt(tick: number): WtlState {
  const t = mod(tick, LOOP);
  if (t < T.morph) return 'physical';
  if (t < T.crypto) return 'morph';
  if (t < T.back) return 'crypto';
  return 'morph';
}

/**
 * Two-valued label for the HTML caption: which separator is standing. Flips to `cryptographic` when the
 * padlock lands (39) and back to `physical` when the bricks land on the wall's footprint again (108).
 */
export function labelAt(tick: number): 'physical' | 'cryptographic' {
  const t = mod(tick, LOOP);
  return t >= T.land && t < T.landBack ? 'cryptographic' : 'physical';
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Small helpers

function mod(n: number, m: number): number { return ((n % m) + m) % m; }
function keyOf(v: number): Key { return KEYS[v - 1]; }

/** Blit a Part with an optional hide predicate (canvas coords) and a recolour map. */
function stamp(g: Grid, p: Part, ox: number, oy: number, hide?: (x: number, y: number) => boolean, recolor?: Partial<Record<Key, Key>>): void {
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const v = p.data[y * p.w + x];
    if (!v) continue;
    const gx = ox + x, gy = oy + y;
    if (hide?.(gx, gy)) continue;
    const k = keyOf(v);
    g.set(gx, gy, recolor?.[k] ?? k);
  }
}

/** Mini-fridge clock: normal speed in the two states, half speed while morphing, so 120 ticks = 6 × 16. */
function miniTick(t: number): number {
  if (t < 24) return t;
  if (t < 48) return 24 + ((t - 24) >> 1);
  if (t < 96) return 36 + (t - 48);
  return 84 + ((t - 96) >> 1);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Bricks. A course is 3 rows: a mortar/top row `l` and a 2-row face `t`; cells are 6 wide (5 face + 1
// joint `l`), odd courses start with a half brick (running bond, joints never line up); the right-hand
// column is the shadow side `m`. Coordinates are local to a brick mass of width w, counted from its floor.

function brickKey(lx: number, fromFloor: number, w: number): Key {
  if (lx === w - 1) return 'm';
  const c = Math.floor(fromFloor / 3);
  if (fromFloor % 3 === 2) return 'l';
  const joint = c % 2 === 0 ? lx % 6 === 5 : lx % 6 === 2;
  return joint ? 'l' : 't';
}

/** A brick wall/block of `courses` courses standing with its bottom row at `bottom`. */
function drawBricks(g: Grid, x: number, bottom: number, courses: number, w = WALL_W): void {
  const h = courses * 3;
  for (let r = 0; r < h; r++) for (let lx = 0; lx < w; lx++) g.set(x + lx, bottom - r, brickKey(lx, r, w));
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Padlock

interface LockPose { x: number; top: number; open: boolean; snap?: boolean; brick?: DitherLevel; slot?: boolean }

/** Draws the padlock with its top-left at (x, top). `brick` 4 = all brick texture, 2 = half (dither), 0 = steel. */
function drawLock(g: Grid, L: LockPose): void {
  const brick = L.brick ?? 0;
  const tex = (k: Key, gx: number, gy: number): Key => {
    if (brick <= 0) return k;
    if (brick < 4 && !ditherAt(gx, gy, brick)) return k;
    return brickKey(gx - L.x, L.top + LOCK_H - 1 - gy, LOCK_W);
  };
  const raise = L.open ? 2 : 0;
  const shTop = L.top - raise + (L.snap ? 1 : 0);
  for (let y = 0; y < SHACKLE.h; y++) for (let x = 0; x < SHACKLE.w; x++) {
    const v = SHACKLE.data[y * SHACKLE.w + x];
    if (!v) continue;
    if (L.open && x >= 6 && y >= 3) continue; // the short leg is out of the body: a 2-row gap
    const gx = L.x + SHACKLE_X + x, gy = shTop + y;
    if (gy >= FLOOR) continue;
    g.set(gx, gy, tex(keyOf(v), gx, gy));
  }
  for (let y = 0; y < BODY.h; y++) for (let x = 0; x < BODY.w; x++) {
    const v = BODY.data[y * BODY.w + x];
    if (!v) continue;
    const gx = L.x + x, gy = L.top + BODY_Y + y;
    if (gy >= FLOOR) continue;
    let k = keyOf(v);
    if (L.slot && x === 0 && y >= 1 && y <= 5) k = 'k';
    g.set(gx, gy, tex(k, gx, gy));
  }
}

/** The flying brick mass: a 12×12 block, a block with clipped corners, or the padlock's silhouette in brick. */
type Shape = 'block' | 'round' | 'lock' | 'shut';
function drawMass(g: Grid, shape: Shape, x: number, top: number): void {
  if (shape === 'lock' || shape === 'shut') { drawLock(g, { x: x + 1, top, open: shape === 'lock', brick: 4 }); return; }
  const w = WALL_W, h = BLOCK_COURSES * 3;
  for (let r = 0; r < h; r++) for (let lx = 0; lx < w; lx++) {
    const y = top + r;
    if (y >= FLOOR) continue;
    if (shape === 'round') {
      const edgeX = lx === 0 || lx === w - 1, edgeY = r === 0 || r === h - 1;
      if (edgeX && edgeY) continue;
      if ((lx === 1 || lx === w - 2) && edgeY) continue;
      if (edgeX && (r === 1 || r === h - 2)) continue;
    }
    g.set(x + lx, y, brickKey(lx, h - 1 - r, w));
  }
}

// Leap paths: [x of the 12-wide mass, top row, shape] per tick.
const LEAP: ReadonlyArray<readonly [number, number, Shape]> = [
  [41, 24, 'block'], [38, 14, 'block'], [35, 7, 'round'], [32, 3, 'round'], [29, 2, 'round'],
  [26, 4, 'lock'], [23, 10, 'lock'], [20, 20, 'lock'],
]; // ticks 31–38; lands at 39 as the padlock (x 20)
const LEAP_BACK: ReadonlyArray<readonly [number, number, Shape]> = [
  [31, 24, 'shut'], [29, 14, 'shut'], [29, 7, 'round'], [30, 3, 'round'], [32, 1, 'round'], [35, 1, 'block'],
  [38, 3, 'block'], [40, 9, 'block'], [42, 19, 'block'],
]; // ticks 99–107; lands at 108 on the wall's footprint

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Fridges

function qubitAt(t: number, which: 'L' | 'R' | 'M'): Key {
  const blinks = which === 'L' ? [T.blinkL] : which === 'R' ? [T.blinkR] : [T.blink1, T.blink2];
  for (const b of blinks) { if (t === b) return 'w'; if (t === b + 1) return 'a'; }
  return 'v';
}

/** True while an answer is travelling up the merged fridge (its own pulses rest so the answer reads). */
function answering(t: number): boolean {
  return (t >= T.blink1 && t <= T.blink1 + 7) || (t >= T.blink2 && t <= T.blink2 + 7);
}

/** Slide offset of each fridge (0 = State A, 32 = merged). */
function slideAt(t: number): number {
  if (t < T.converge) return 0;
  if (t < T.converge + 12) return SLIDE_CUM[t - T.converge];
  if (t < T.split) return SLIDE;
  if (t < T.split + 12) return SLIDE - SLIDE_CUM[t - T.split];
  return 0;
}

/** True while the fridges are sliding (their pulses rest: the devices go quiet while they merge or split). */
function sliding(t: number): boolean {
  return (t >= T.converge && t < T.converge + 12) || (t >= T.split && t < T.split + 12);
}

/**
 * The two fridges. Apart, each is drawn whole. Once their plates touch (slide ≥ 24) they "zip": every column
 * left of the centre line comes from the left fridge, every column right of it from the right one, so the pair
 * reads as one wide fridge squeezing into a single one (and back) with no ghosting.
 */
function drawFridges(g: Grid, t: number): void {
  const s = slideAt(t);
  const quiet = sliding(t) || answering(t);
  const qL: Key = t < T.morph ? qubitAt(t, 'L') : s === SLIDE ? qubitAt(t, 'M') : 'v';
  const qR: Key = t < T.morph ? qubitAt(t, 'R') : 'v';
  if (s === SLIDE) {
    drawFridgeMini(g, FM_X, FY, miniTick(t), { qubit: qL, pulses: !quiet });
    if (t === T.blink1 || t === T.blink2) g.set(FM_X + MINI.window.x, FY + MINI.window.y, 'a');
    return;
  }
  if (s < 24) {
    drawFridgeMini(g, FL_X + s, FY, miniTick(t), { qubit: qL, pulses: !quiet });
    drawFridgeMini(g, FR_X - s, FY, miniTick(t) + 8, { qubit: qR, pulses: !quiet });
    return;
  }
  const mid = (FL_X + FR_X + MINI.w - 1) >> 1; // 47: the seam column (left side keeps it)
  const half = (fx: number, phase: number, left: boolean) => {
    const tmp = new Grid(MINI.w, MINI.h);
    drawFridgeMini(tmp, 0, 0, miniTick(t) + phase, { qubit: 'v', pulses: false });
    for (let y = 0; y < MINI.h; y++) for (let x = 0; x < MINI.w; x++) {
      const k = tmp.get(x, y);
      const gx = fx + x;
      if (k && (left ? gx <= mid : gx > mid)) g.set(gx, FY + y, k);
    }
  };
  half(FL_X + s, 0, true);
  half(FR_X - s, 8, false);
}

/** The answer: up the right coax line (hidden inside the plates, which glow as it passes), out of the cable, up and away. */
const ANSWER_PATH: ReadonlyArray<readonly [number, number, number]> = (() => {
  // [dx from the fridge's x, y, plate index whose underside glows when hidden there (-1 = visible)]
  const pts: Array<[number, number, number]> = [];
  const plateAt = (y: number) => MINI.plates.findIndex((p) => y - FY >= p.y && y - FY <= p.y + 2);
  for (let y = FY + MINI.coaxY[1] - 1; y >= FY + MINI.plates[0].y; y--) pts.push([MINI.coax[1], y, plateAt(y)]);
  for (let y = FY + MINI.cable.y1; y >= FY + MINI.cable.y0; y--) pts.push([MINI.cable.x, y, -1]);
  for (let y = FY - 1; y >= -3; y--) pts.push([MINI.cable.x, y, -1]);
  return pts;
})();

function drawAnswer(g: Grid, t: number, blink: number, fx: number): void {
  const i = t - blink;
  if (i >= 1 && i <= 3) {
    // up the readout line, 7 px per tick (hidden inside the plates, whose undersides glow as it passes)
    const head = 7 * i - 1;
    (['a', 'c'] as Key[]).forEach((k, j) => {
      const p = ANSWER_PATH[head - j];
      if (!p) return;
      if (p[2] >= 0) { if (j === 0) g.set(fx + p[0], FY + MINI.plates[p[2]].y + 2, 'a'); return; }
      g.set(fx + p[0], p[1], k);
    });
  } else if (i >= 4 && i <= 8) {
    // out of the top: a small plus sparkle rising 4 px per tick, white core
    const cx = fx + MINI.cable.x, cy = FY - 3 - 4 * (i - 4);
    g.set(cx, cy, 'w');
    g.set(cx - 1, cy, 'a'); g.set(cx + 1, cy, 'a'); g.set(cx, cy - 1, 'a'); g.set(cx, cy + 1, 'a');
    if (i === 4) g.set(cx, FY - 1, 'c'); // still leaving the cable
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Cards and decks

const HOP = [0, -2, -3, -2]; // one 4-tick hop arc (landed on phase 0)

interface CardPose { x: number; y: number; owner: Key; hide?: (x: number, y: number) => boolean; blank?: boolean; back?: boolean }

function drawCard(g: Grid, c: CardPose): void {
  // a card further back in a deck is all edge: its face would only peek through as stray specks
  stamp(g, CARD, c.x, c.y, c.hide, c.back ? { b: 'l', p: 'e' } : { b: c.owner });
  if (!c.blank) stamp(g, QMARK, c.x + CARD_GLYPH[0], c.y + CARD_GLYPH[1], c.hide);
}

/** Hops along a list of landing x's, one hop of 4 ticks each, starting at tick t0. */
function hops(t: number, t0: number, xs: readonly number[]): { x: number; y: number } | null {
  const n = xs.length - 1;
  if (t < t0 || t > t0 + 4 * n) return null;
  const i = Math.min(n - 1, Math.floor((t - t0) / 4));
  const ph = (t - t0) - 4 * i;
  if (t === t0 + 4 * n) return { x: xs[n], y: CARD_Y };
  const x = Math.round(xs[i] + ((xs[i + 1] - xs[i]) * ph) / 4);
  return { x, y: CARD_Y + HOP[ph] };
}

function drawDeck(g: Grid, t: number, side: 'L' | 'R'): void {
  // a short pile seen from the front: the top edges of two cards peek out above the front card
  const x0 = side === 'L' ? STACK_L : STACK_R;
  const owner: Key = side === 'L' ? 'b' : 'v';
  const deals = side === 'L' ? [T.dealA, T.dealA2] : [T.dealB, T.dealB2];
  drawCard(g, { x: x0, y: CARD_Y - 2, owner: 'l', blank: true, back: true });
  drawCard(g, { x: x0, y: CARD_Y - 1, owner: 'l', blank: true, back: true });
  // the front card is the one dealt; the next one takes its place once the dealt card has landed clear
  if (!deals.some((d) => t >= d && t < d + 4)) drawCard(g, { x: x0, y: CARD_Y, owner });
}

function cardsAt(t: number): { inLock: CardPose[]; front: CardPose[] } {
  const front: CardPose[] = [];
  const inLock: CardPose[] = [];

  // State A · Alice's card hops to the left fridge and slides into its chip box
  {
    const end = CHIP_L(FL_X) - CARD_W; // 7: right edge touching the box
    const p = hops(t, T.dealA, [STACK_L, end]);
    const slide = t === T.dealA + 5 ? end + 3 : null;
    if (p) front.push({ ...p, owner: 'b' });
    else if (slide !== null) front.push({ x: slide, y: CARD_Y, owner: 'b', hide: (x) => x >= CHIP_L(FL_X) });
  }
  // State A · Bob's card hops to the right fridge
  {
    const end = CHIP_R(FR_X) + 1; // 83
    const p = hops(t, T.dealB, [STACK_R, end]);
    const slide = t === T.dealB + 5 ? end - 3 : null;
    if (p) front.push({ ...p, owner: 'v' });
    else if (slide !== null) front.push({ x: slide, y: CARD_Y, owner: 'v', hide: (x) => x <= CHIP_R(FR_X) });
  }
  // State B · Alice's card hops to the open padlock, slides into its body and rides inside it
  {
    const p = hops(t, T.dealA2, [STACK_L, 8, LOCK_HOME - CARD_W]);
    if (p) front.push({ ...p, owner: 'b' });
    else if (t > T.dealA2 + 8 && t < T.back) {
      const lk = lockPose(t)!;
      const x = t < T.snap ? LOCK_HOME - CARD_W + 2 * (t - T.slot) : lk.x + 2;
      const lockX = lk.x, y = lk.top + (CARD_Y - LOCK_Y); // rides with the lock (and its little shuffle)
      // inside the body it is hidden; only its blue tab shows between the shackle legs
      inLock.push({ x, y, owner: 'b', hide: (gx, gy) => gx >= lockX && gy > y });
    }
  }
  // State B · Bob's card is dealt only after the first answer has left; it arrives open
  {
    const end = CHIP_R(FM_X) + 1; // 51
    const p = hops(t, T.dealB2, [STACK_R, 77, 64, end]);
    if (p) front.push({ ...p, owner: 'v' });
    else if (t === T.dealB2 + 13 || t === T.dealB2 + 14) {
      const x = end - 2 * (t - T.dealB2 - 12);
      front.push({ x, y: CARD_Y, owner: 'v', hide: (gx) => gx <= CHIP_R(FM_X) });
    }
  }
  return { inLock, front };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Padlock pose over the loop

function lockPose(t: number): LockPose | null {
  if (t < T.land || t > T.leapBack) return null;
  if (t < T.travel) {
    const brick: DitherLevel = t < T.recolour ? 4 : t === T.recolour ? 2 : 0;
    return { x: LOCK_HOME, top: LOCK_Y, open: t < T.snap, snap: t === T.snap, brick, slot: t >= T.slot && t < T.snap };
  }
  if (t < T.back) {
    const x = Math.min(LOCK_DOCK, LOCK_HOME + 2 * (t - T.travel + 1));
    const hop = t < T.dock && (t - T.travel) % 2 === 1 ? -1 : 0; // a heavy little shuffle
    return { x, top: LOCK_Y + hop, open: false };
  }
  if (t === T.leapBack) return { x: LOCK_DOCK, top: LOCK_Y + 1, open: false, brick: 4 }; // crouch before the leap
  return { x: LOCK_DOCK, top: LOCK_Y, open: false, brick: t === T.unrecolour ? 2 : 4 };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

function drawDust(g: Grid, t: number, t0: number, x0: number, x1: number): void {
  const i = t - t0;
  if (i < 0 || i > 1) return;
  g.set(x0 - 1 - i, FLOOR - 1, 'h'); g.set(x0 - 2 - i, FLOOR - 2 - i, 'h');
  g.set(x1 + 1 + i, FLOOR - 1, 'h'); g.set(x1 + 2 + i, FLOOR - 2 - i, 'h');
}

function render(tick: number, g: Grid): void {
  const t = mod(tick, LOOP);
  for (let x = 0; x < W; x++) g.set(x, FLOOR, 'l');

  // the wall: intact, crunching down a course per tick, gone, then growing back
  if (t < T.crack) drawBricks(g, WALL_X, FLOOR - 1, COURSES);
  else if (t === T.crack) { drawBricks(g, WALL_X, FLOOR - 1, COURSES); for (let y = 14; y < 20; y++) g.set(WALL_X + 5 + ((y >> 1) & 1), y, 'm'); }
  else if (t < T.leap - 1) drawBricks(g, WALL_X, FLOOR - 1, COURSES - (t - T.crack));
  else if (t === T.leap - 1) { drawBricks(g, WALL_X, FLOOR - 1, BLOCK_COURSES); for (let x = 0; x < WALL_W; x++) g.set(WALL_X + x, FLOOR - 3 * BLOCK_COURSES, null); } // crouch
  else if (t >= T.landBack && t < T.grow + 6) drawBricks(g, WALL_X, FLOOR - 1, BLOCK_COURSES + Math.max(0, t - T.grow + 1));
  else if (t >= T.grow + 6) drawBricks(g, WALL_X, FLOOR - 1, COURSES);

  drawFridges(g, t);

  // decks
  drawDeck(g, t, 'L');
  drawDeck(g, t, 'R');

  // padlock (with Alice's card inside it)
  const cards = cardsAt(t);
  for (const c of cards.inLock) drawCard(g, c);
  const lk = lockPose(t);
  if (lk) drawLock(g, lk);
  if (t === T.snap) { // the click: two little azure ticks off the shackle's shoulders
    g.set(LOCK_HOME - 1, LOCK_Y, 'a'); g.set(LOCK_HOME - 2, LOCK_Y - 1, 'a');
    g.set(LOCK_HOME + LOCK_W, LOCK_Y, 'a'); g.set(LOCK_HOME + LOCK_W + 1, LOCK_Y - 1, 'a');
  }
  if (t === T.glint || t === T.glint + 1) { // the new steel shines: a sparkle off the shackle's lit shoulder
    const sx = LOCK_HOME - 1, sy = LOCK_Y - 4;
    g.set(sx, sy, t === T.glint ? 'w' : 'a');
    if (t === T.glint) { g.set(sx - 1, sy, 'a'); g.set(sx + 1, sy, 'a'); g.set(sx, sy - 1, 'a'); g.set(sx, sy + 1, 'a'); }
    g.set(LOCK_HOME + SHACKLE_X + 2, LOCK_Y - 2, 'w');
  }

  // the leaping brick mass
  if (t >= T.leap && t < T.land) { const [x, y, sh] = LEAP[t - T.leap]; drawMass(g, sh, x, y); }
  if (t > T.leapBack && t < T.landBack) { const [x, y, sh] = LEAP_BACK[t - T.leapBack - 1]; drawMass(g, sh, x, y); }
  drawDust(g, t, T.land, LOCK_HOME, LOCK_HOME + LOCK_W - 1);
  drawDust(g, t, T.landBack, WALL_X, WALL_X + WALL_W - 1);

  for (const c of cards.front) drawCard(g, c);

  // answers leave up the readout line
  drawAnswer(g, t, T.blink1, FM_X);
  drawAnswer(g, t, T.blink2, FM_X);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

export const wallToLock = definePiece({
  id: 'wall-to-lock',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 15,
  palette: ['k', 's', 'm', 't', 'l', 'e', 'h', 'p', 'w', 'b', 'c', 'a', 'i', 'v', 'g'],
  alt: 'Two quantum computers kept apart by a brick wall become one: the wall turns into a padlock, the first question arrives locked and is answered blind, and only then does the second, open question arrive.',
  cache: 'loop',
  states: ['physical', 'morph', 'crypto'],
  frame(tick: number, g: Grid) { render(tick, g); },
  state(tick: number) { return stateAt(tick); },
  events(tick: number) {
    const t = mod(tick, LOOP);
    const out: string[] = [];
    if (t === T.snap) out.push('lock');
    if (t === T.blink1 || t === T.blink2) out.push('answer');
    if (t === T.land || t === T.landBack) out.push('label');
    return out;
  },
  exports: { labelAt, stateAt, T, LOOP },
});

export default wallToLock;
