// wall-to-lock (art-spec card 7, revision 1 "at scale"): physical separation becomes cryptographic separation.
//
// State A (physical): two 24×36 dilution fridges kept apart by a 16×40 brick wall. Each is dealt its own `?`
// card from its own deck (Alice's blue-tabbed deck on the left, Bob's violet one on the right) and blinks its qubit.
// Morph: the wall crunches down into a block of bricks, leaps up over the two fridges as they slide together and
// merge into one wide fridge with one chip box holding both qubits, drops on the left as a padlock and turns from
// brick to steel.
// State B (crypto): Alice's card walks into the open padlock, the shackle snaps shut, and the locked question is
// pushed under the fridge, which answers it blind: Alice's qubit blinks, the answer runs up her readout line and
// leaves through the top. Only then is Bob's card dealt; it arrives open and his qubit answers the same way.
// Reverse morph: the padlock turns back to brick, leaps back over the splitting fridge and grows into the wall.
//
// Timeline: README.md. Every frame is a pure function of the tick (loop 120 = 10 s at 12 fps).
// W2: every static layer (ground, decks, wall courses, fridge pair bases, padlocks, cards, flying masses) is
// built once at module load; a frame is a handful of blits plus the moving pixels.

import { definePiece, ditherAt, font5x7, Grid, KEYS, type DitherLevel, type Key, type Part } from '../../engine';
import { drawPair, FH, FW, MERGED_D, readoutPath, FRIDGE } from './fridge';
import { BODY, BODY_Y, CARD, CARD_GLYPH, CARD_H, CARD_W, LOCK_H, LOCK_W, SHACKLE, SHACKLE_X } from './parts';

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Geometry (art px)

export const W = 96;
export const H = 48;
export const LOOP = 120;
export const POSTER = 72;
const FLOOR = 46; // the 2-row ground is rows 46–47; everything stands on row 45
const FY = FLOOR - FH; // fridge top row (10)
const L0 = 10; // Alice's fridge x (State A)
const R0 = 60; // Bob's fridge x (State A)
const D0 = R0 - L0; // 50
const LM = 28; // left fridge x when merged (the pair spans 28–67)
const SLIDE = LM - L0; // 18 px each
const WALL_X = 39;
const WALL_W = 18; // a 16-px brick face plus its 2-px side in shadow
const COURSE = 4; // rows per course (mortar row + 3-row face)
const COURSES = 11; // 44 rows: 2–45
const BLOCK = 2; // courses in the compacted block (16×8)
const LOCK_Y = FLOOR - LOCK_H; // 30
const LOCK_HOME = 13; // where the padlock lands (x 13–26)
const LOCK_DOCK = 20; // pushed under the fridge (x 20–33), 1 px from the chip box
const CARD_Y = FLOOR - CARD_H; // 35
const DECK_L = 0;
const DECK_R = W - CARD_W; // 87
const BOX_L = (lx: number) => lx + FRIDGE.BOX.x; // left column of a fridge's chip box
const BOX_R = (lx: number, d: number) => lx + d + FRIDGE.BOX.x + FRIDGE.BOX.w - 1; // right column of the right box

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Timeline (ticks). README has the frame-by-frame table.

export const T = {
  // State A · physical (0–23)
  dealA: 1, blinkL: 9, dealB: 10, blinkR: 18,
  // forward morph (24–47)
  morph: 24, crack: 24, compact: 25, crouch: 34, leap: 35, converge: 35, land: 47, recolour: 48, glint: 50, cloud: 43,
  // State B · crypto (48–95)
  crypto: 48, dealA2: 50, slot: 55, snap: 59, shuffle: 62, dock: 65, blink1: 67, dealB2: 76, blink2: 88,
  // reverse morph (96–119)
  back: 96, unrecolour: 96, crouchBack: 98, leapBack: 99, split: 100, landBack: 109, grow: 110, cloudOut: 96,
} as const;

/** Eased spacing of each fridge's 18-px slide (slow-in, slow-out, 12 ticks). */
const SLIDE_STEPS = [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1];
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
 * Two-valued caption key: which separator is standing. `cryptographic` from the moment the padlock lands (47),
 * `physical` again when the bricks land on the wall's footprint (109).
 */
export function labelAt(tick: number): 'physical' | 'cryptographic' {
  const t = mod(tick, LOOP);
  return t >= T.land && t < T.landBack ? 'cryptographic' : 'physical';
}

function mod(n: number, m: number): number { return ((n % m) + m) % m; }
function keyOf(v: number): Key { return KEYS[v - 1]; }

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Static layers (built once; W2)

/** Copy a Grid with an optional hide predicate in canvas coordinates. */
function stamp(g: Grid, src: Grid | Part, ox: number, oy: number, hide?: (x: number, y: number) => boolean): void {
  if (!hide) { g.blit(src, ox, oy); return; }
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const v = src.data[y * src.w + x];
    if (v && !hide(ox + x, oy + y)) g.set(ox + x, oy + y, keyOf(v));
  }
}

/** Bricks: a 4-row course is a mortar/top row `l` and a 3-row face `t`; cells 8 wide (7 face + 1 joint `l`); odd
 *  courses start with a half brick (running bond); the right-hand column is the shadow side `s`; the top row is
 *  the lit cap `e`. Coordinates are local to a mass of width w, counted from its floor. */
function brickKey(lx: number, fromFloor: number, w: number, h: number, side = true): Key {
  if (lx === w - 1) return 's';
  if (side && lx === w - 2) return fromFloor === h - 1 ? 'l' : 'm';
  if (fromFloor === h - 1) return 'e';
  const c = Math.floor(fromFloor / COURSE);
  if (fromFloor % COURSE === COURSE - 1) return 'l';
  const joint = c % 2 === 0 ? lx % 8 === 7 : lx % 8 === 3;
  return joint ? 'l' : 't';
}

function bricks(courses: number, w = WALL_W, rows = courses * COURSE): Grid {
  const g = new Grid(w, rows);
  for (let r = 0; r < rows; r++) for (let lx = 0; lx < w; lx++) g.set(lx, rows - 1 - r, brickKey(lx, r, w, rows));
  return g;
}
const WALLS: Grid[] = Array.from({ length: COURSES + 1 }, (_, c) => (c ? bricks(c) : new Grid(1, 1)));
const CROUCHED = bricks(BLOCK, WALL_W, BLOCK * COURSE - 1);

function cardGrid(owner: Key, back = false): Grid {
  const g = new Grid(CARD_W, CARD_H);
  g.blit(CARD, 0, 0, { recolor: back ? { b: 'l', p: 'e' } : { b: owner } });
  if (!back) g.text(font5x7, '?', CARD_GLYPH[0], CARD_GLYPH[1], 'k');
  return g;
}
const CARD_A = cardGrid('b');
const CARD_B = cardGrid('v');
const CARD_BACK = cardGrid('l', true);

/** A deck: the tops of two cards peek out above the front card. */
function deckGrid(owner: Key, front: boolean): Grid {
  const g = new Grid(CARD_W, CARD_H + 2);
  g.blit(CARD_BACK, 0, 0); g.blit(CARD_BACK, 0, 1);
  if (front) g.blit(owner === 'b' ? CARD_A : CARD_B, 0, 2);
  return g;
}
const DECKS = { b: [deckGrid('b', false), deckGrid('b', true)], v: [deckGrid('v', false), deckGrid('v', true)] };

interface LockLook { open: boolean; snap?: boolean; brick?: 0 | 4; slot?: boolean }
function lockGrid(L: LockLook): Grid {
  const g = new Grid(LOCK_W, LOCK_H + 3);
  const top = 3; // 3 spare rows above: the raised (open) or overshooting shackle
  const sh = top - (L.open ? 2 : 0) + (L.snap ? 1 : 0);
  for (let y = 0; y < SHACKLE.h; y++) for (let x = 0; x < SHACKLE.w; x++) {
    const v = SHACKLE.data[y * SHACKLE.w + x];
    if (!v) continue;
    if (L.open && x >= 10 && y >= 6) continue; // the short leg is out of the body: a 2-row gap
    g.set(SHACKLE_X + x, sh + y, keyOf(v));
  }
  for (let y = 0; y < BODY.h; y++) for (let x = 0; x < BODY.w; x++) {
    const v = BODY.data[y * BODY.w + x];
    if (!v) continue;
    g.set(x, top + BODY_Y + y, L.slot && x === 0 && y >= 2 && y <= 8 ? 'k' : keyOf(v));
  }
  if (L.brick) for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g.get(x, y)) g.set(x, y, brickKey(x, top + LOCK_H - 1 - y, LOCK_W, LOCK_H + 2, false));
  }
  return g;
}
const LOCKS = {
  open: lockGrid({ open: true }), slot: lockGrid({ open: true, slot: true }), snap: lockGrid({ open: false, snap: true }),
  shut: lockGrid({ open: false }), openBrick: lockGrid({ open: true, brick: 4 }), shutBrick: lockGrid({ open: false, brick: 4 }),
};

/** Flying masses: the 16×8 block, the block with clipped corners, the padlock silhouettes in brick. */
type Shape = 'block' | 'round' | 'lock' | 'shut';
const BLOCK_G = bricks(BLOCK);
const ROUND_G = (() => {
  const g = BLOCK_G.clone();
  const r = WALL_W - 1;
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [r, 0], [r - 1, 0], [r, 1], [0, 7], [1, 7], [0, 6], [r, 7], [r - 1, 7], [r, 6]]) g.set(x, y, null);
  return g;
})();

function drawMass(g: Grid, shape: Shape, x: number, top: number): void {
  if (shape === 'block') stamp(g, BLOCK_G, x, top);
  else if (shape === 'round') stamp(g, ROUND_G, x, top);
  else stamp(g, shape === 'lock' ? LOCKS.openBrick : LOCKS.shutBrick, x + 2, top - 3);
}

// The leaps: [x of the 16-wide mass, top row, shape] per tick. Checked against the sliding fridges (no overlap).
const LEAP: ReadonlyArray<readonly [number, number, Shape]> = [
  [39, 28, 'block'], [39, 16, 'block'], [39, 5, 'block'], [38, -1, 'block'], [34, -2, 'round'], [29, -2, 'round'],
  [24, -2, 'round'], [19, -2, 'round'], [15, -1, 'round'], [12, 0, 'round'], [11, 4, 'lock'], [11, 17, 'lock'],
]; // ticks 35–46; lands at 47 as the padlock (x 13)
const LEAP_BACK: ReadonlyArray<readonly [number, number, Shape]> = [
  [13, 24, 'shut'], [11, 12, 'shut'], [9, 1, 'round'], [12, -1, 'round'], [17, -2, 'block'], [23, -2, 'block'],
  [29, -2, 'block'], [35, -1, 'block'], [39, 2, 'block'], [39, 20, 'block'],
]; // ticks 99–108; lands at 109 on the wall's footprint

/**
 * The cloud (State B only): "inside one cloud" the provider plays both roles. A cumulus behind the merged fridge,
 * `g` body, `a` selective outline on its shadow (lower/right) side, knocked out 1 px around the fridge so the
 * silver plates keep their silhouette on it. Static: it condenses and evaporates with a 4-step ordered dither.
 */
const BUMPS: ReadonlyArray<readonly [number, number, number]> = [[20, 16, 7], [33, 10, 8], [50, 9, 8], [65, 10, 8], [78, 15, 7]];
const CLOUD = (() => {
  const g = new Grid(W, H);
  const inside = (x: number, y: number): boolean => {
    if (y > 25 || y < 0) return false;
    if (BUMPS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r)) return true;
    return y >= 16 && x >= 14 && x <= 84 && !(y === 25 && (x < 16 || x > 82));
  };
  const bumps = BUMPS;
  const inBump = (i: number, x: number, y: number) => { const [cx, cy, r] = bumps[i]; return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue;
    let shade = !inside(x, y + 1) || !inside(x + 1, y);
    // volume: the lower-right rim of a bump where it sits over its right-hand neighbour reads as a crescent
    for (let i = 0; i < bumps.length - 1 && !shade; i++) {
      const [cx, cy] = bumps[i];
      if (inBump(i, x, y) && !inBump(i, x + 1, y) && x >= cx + 2 && y >= cy - 1 && y <= cy + 4 && inBump(i + 1, x + 1, y)) shade = true;
    }
    g.set(x, y, shade ? 'a' : 'g');
  }
  // knock-out: clear a 1-px ring around the merged fridge
  const fr = new Grid(W, H);
  drawPair(fr, LM, FY, MERGED_D, { tick: 0, pulses: false, qubitL: 'b', qubitR: 'v' });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (fr.get(x + dx, y + dy)) { near = true; break; }
    if (near) g.set(x, y, null);
  }
  return g;
})();

function drawCloud(g: Grid, level: DitherLevel): void {
  if (level <= 0) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = CLOUD.data[y * W + x];
    if (v && (level >= 4 || ditherAt(x, y, level))) g.data[y * W + x] = v;
  }
}

function cloudLevel(t: number): DitherLevel {
  if (t >= T.cloud && t < T.cloud + 4) return (t - T.cloud + 1) as DitherLevel; // 1 2 3 4
  if (t >= T.cloud + 4 && t < T.cloudOut) return 4;
  if (t >= T.cloudOut && t < T.cloudOut + 3) return (3 - (t - T.cloudOut)) as DitherLevel; // 3 2 1
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The pair of fridges over the loop

function pairAt(t: number): { lx: number; d: number } {
  let s = 0;
  if (t >= T.converge && t < T.converge + 12) s = SLIDE_CUM[t - T.converge];
  else if (t >= T.converge + 12 && t < T.split) s = SLIDE;
  else if (t >= T.split && t < T.split + 12) s = SLIDE - SLIDE_CUM[t - T.split];
  return { lx: L0 + s, d: D0 - 2 * s };
}

function sliding(t: number): boolean {
  return (t >= T.converge && t < T.converge + 12) || (t >= T.split && t < T.split + 12);
}

function qubit(t: number, blinks: readonly number[], rest: Key): Key {
  for (const b of blinks) { if (t === b) return 'w'; if (t === b + 1) return 'a'; }
  return rest;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Cards

const HOP = [0, -2, -3, -2]; // one 4-tick hop arc (landed on phase 0)

/** Hops along landing x's, one hop of 4 ticks each, from tick t0. */
function hops(t: number, t0: number, xs: readonly number[]): { x: number; y: number } | null {
  const n = xs.length - 1;
  if (t < t0 || t > t0 + 4 * n) return null;
  if (t === t0 + 4 * n) return { x: xs[n], y: CARD_Y };
  const i = Math.floor((t - t0) / 4), ph = t - t0 - 4 * i;
  return { x: Math.round(xs[i] + ((xs[i + 1] - xs[i]) * ph) / 4), y: CARD_Y + HOP[ph] };
}

interface CardPose { x: number; y: number; card: Grid; hide?: (x: number, y: number) => boolean }

function cardsAt(t: number, lockX: number, lockTop: number): { inLock: CardPose[]; front: CardPose[] } {
  const front: CardPose[] = [];
  const inLock: CardPose[] = [];
  // State A · Alice's card into the left chip box, Bob's into the right one
  {
    const box = BOX_L(L0), end = box - CARD_W - 1; // 7
    const p = hops(t, T.dealA, [DECK_L, end]);
    if (p) front.push({ ...p, card: CARD_A });
    else if (t > T.dealA + 4 && t <= T.dealA + 6) front.push({ x: end + 4 * (t - T.dealA - 4), y: CARD_Y, card: CARD_A, hide: (x) => x >= box });
  }
  {
    const box = BOX_R(L0, D0), end = box + 2; // 80
    const p = hops(t, T.dealB, [DECK_R, end]);
    if (p) front.push({ ...p, card: CARD_B });
    else if (t > T.dealB + 4 && t <= T.dealB + 6) front.push({ x: end - 4 * (t - T.dealB - 4), y: CARD_Y, card: CARD_B, hide: (x) => x <= box });
  }
  // State B · Alice's card hops to the open padlock, slides into its body and rides inside it
  {
    const p = hops(t, T.dealA2, [DECK_L, LOCK_HOME - CARD_W]);
    if (p) front.push({ ...p, card: CARD_A });
    else if (t > T.dealA2 + 4 && t < T.back) {
      const slide = [LOCK_HOME - CARD_W + 3, LOCK_HOME - CARD_W + 6, LOCK_HOME - CARD_W + 9]; // 55–57; inside from 58
      const x = t >= T.slot && t < T.slot + 3 ? slide[t - T.slot] : t < T.slot ? LOCK_HOME - CARD_W : lockX + 2;
      const y = lockTop + (CARD_Y - LOCK_Y);
      // inside the body it is hidden; only its blue tab shows between the shackle legs
      inLock.push({ x, y, card: CARD_A, hide: (gx, gy) => gx >= lockX && gy > y });
    }
  }
  // State B · Bob's card is dealt only after Alice's answer has left; it arrives open
  {
    const { lx, d } = { lx: LM, d: MERGED_D };
    const box = BOX_R(lx, d), end = box + 2; // 62
    const p = hops(t, T.dealB2, [DECK_R, 75, end]);
    if (p) front.push({ ...p, card: CARD_B });
    else if (t > T.dealB2 + 8 && t <= T.dealB2 + 10) front.push({ x: end - 4 * (t - T.dealB2 - 8), y: CARD_Y, card: CARD_B, hide: (x) => x <= box });
  }
  return { inLock, front };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Padlock pose

function lockAt(t: number): { x: number; top: number; g: Grid } | null {
  if (t < T.land || t > T.crouchBack) return null;
  if (t < T.shuffle) {
    const brick = t < T.recolour;
    const g = brick ? LOCKS.openBrick : t < T.snap ? (t >= T.slot && t < T.snap ? LOCKS.slot : LOCKS.open) : t === T.snap ? LOCKS.snap : LOCKS.shut;
    return { x: LOCK_HOME, top: LOCK_Y, g };
  }
  if (t < T.back) {
    const xs = [15, 17, 19, 20];
    const x = t < T.dock ? xs[t - T.shuffle] : LOCK_DOCK;
    return { x, top: LOCK_Y + (t < T.dock && (t - T.shuffle) % 2 === 0 ? -1 : 0), g: LOCKS.shut };
  }
  if (t === T.crouchBack) return { x: LOCK_DOCK, top: LOCK_Y + 1, g: LOCKS.shutBrick };
  return { x: LOCK_DOCK, top: LOCK_Y, g: LOCKS.shutBrick };
}

/** The 1-tick half-and-half recolour (steel ↔ brick), screen-locked 50 % ordered dither. */
function drawLockMix(g: Grid, x: number, top: number, open: boolean): void {
  const steel = open ? LOCKS.open : LOCKS.shut, brick = open ? LOCKS.openBrick : LOCKS.shutBrick;
  for (let y = 0; y < steel.h; y++) for (let xx = 0; xx < steel.w; xx++) {
    const gx = x + xx, gy = top - 3 + y;
    const v = (ditherAt(gx, gy, 2 as DitherLevel) ? brick : steel).data[y * steel.w + xx];
    if (v) g.set(gx, gy, keyOf(v));
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Answers: up the player's readout line (hidden inside the plates, whose undersides glow), then a sparkle

function drawAnswer(g: Grid, t: number, blink: number, which: 0 | 1): void {
  const i = t - blink;
  if (i >= 1 && i <= 3) {
    const path = readoutPath(LM, FY, MERGED_D, which);
    const head = 7 * i - 1;
    for (let s = 0; s < 2; s++) {
      const p = path[head - s];
      if (!p) continue;
      if (p[2]) continue;
      g.set(p[0], p[1], s === 0 ? 'a' : 'c');
    }
  } else if (i >= 4 && i <= 8) {
    const cx = LM + ((MERGED_D + FW) >> 1), cy = FY - 3 - 2 * (i - 4);
    g.set(cx, cy, 'w');
    g.set(cx - 1, cy, 'a'); g.set(cx + 1, cy, 'a'); g.set(cx, cy - 1, 'a'); g.set(cx, cy + 1, 'a');
    if (i === 4) g.set(cx, FY - 1, 'c');
  }
}

function drawDust(g: Grid, t: number, t0: number, x0: number, x1: number): void {
  const i = t - t0;
  if (i < 0 || i > 1) return;
  g.set(x0 - 1 - i, FLOOR - 1, 'h'); g.set(x0 - 2 - i, FLOOR - 2 - i, 'h');
  g.set(x1 + 1 + i, FLOOR - 1, 'h'); g.set(x1 + 2 + i, FLOOR - 2 - i, 'h');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

function render(tick: number, g: Grid): void {
  const t = mod(tick, LOOP);
  // ground: a lit `h` top row over a `t` row
  for (let x = 0; x < W; x++) { g.set(x, FLOOR, 'h'); g.set(x, FLOOR + 1, 't'); }

  // the wall: intact, crunching down a course per tick, crouched, gone, growing back
  let courses = 0;
  if (t < T.compact) courses = COURSES;
  else if (t < T.crouch) courses = COURSES - (t - T.crack);
  else if (t >= T.landBack && t < T.grow + 9) courses = BLOCK + Math.max(0, t - T.landBack);
  else if (t >= T.grow + 9) courses = COURSES;
  if (courses) stamp(g, WALLS[courses], WALL_X, FLOOR - courses * COURSE);
  if (t === T.crouch) stamp(g, CROUCHED, WALL_X, FLOOR - CROUCHED.h);
  if (t === T.crack) for (let y = 3; y < 12; y++) g.set(WALL_X + 7 + ((y >> 1) & 1), y, 'm');

  drawCloud(g, cloudLevel(t));

  // decks
  // the front card is the one dealt; the next one takes its place once the dealt card has moved clear of the deck
  const out = (spans: Array<[number, number]>) => spans.some(([a, b]) => t >= a && t < b);
  stamp(g, DECKS.b[out([[T.dealA, T.dealA + 5], [T.dealA2, T.dealA2 + 6]]) ? 0 : 1], DECK_L, CARD_Y - 2);
  stamp(g, DECKS.v[out([[T.dealB, T.dealB + 5], [T.dealB2, T.dealB2 + 4]]) ? 0 : 1], DECK_R, CARD_Y - 2);

  // fridges
  const { lx, d } = pairAt(t);
  const merged = d === MERGED_D;
  const quiet = sliding(t) || (t > T.blink1 && t <= T.blink1 + 8) || (t > T.blink2 && t <= T.blink2 + 8);
  drawPair(g, lx, FY, d, {
    tick: t, pulses: !quiet,
    qubitL: qubit(t, merged ? [T.blink1] : [T.blinkL], 'b'),
    qubitR: qubit(t, merged ? [T.blink2] : [T.blinkR], 'v'),
  });

  // padlock with Alice's card inside it
  const lk = lockAt(t);
  const cards = cardsAt(t, lk?.x ?? LOCK_DOCK, lk?.top ?? LOCK_Y);
  for (const c of cards.inLock) stamp(g, c.card, c.x, c.y, c.hide);
  if (lk) {
    if (t === T.recolour) drawLockMix(g, lk.x, lk.top, true);
    else if (t === T.unrecolour) drawLockMix(g, lk.x, lk.top, false);
    else stamp(g, lk.g, lk.x, lk.top - 3);
  }
  if (t === T.snap) { // the click: two azure ticks off the shackle's shoulders
    g.set(LOCK_HOME - 1, LOCK_Y + 1, 'a'); g.set(LOCK_HOME - 2, LOCK_Y, 'a');
    g.set(LOCK_HOME + LOCK_W, LOCK_Y + 1, 'a'); g.set(LOCK_HOME + LOCK_W + 1, LOCK_Y, 'a');
  }
  if (t === T.glint || t === T.glint + 1) { // the new steel shines
    const sx = LOCK_HOME - 1, sy = LOCK_Y - 4;
    g.set(sx, sy, t === T.glint ? 'w' : 'a');
    if (t === T.glint) { g.set(sx - 1, sy, 'a'); g.set(sx + 1, sy, 'a'); g.set(sx, sy - 1, 'a'); g.set(sx, sy + 1, 'a'); }
  }

  // the leaping brick mass
  if (t >= T.leap && t < T.land) { const [x, y, sh] = LEAP[t - T.leap]; drawMass(g, sh, x, y); }
  if (t >= T.leapBack && t < T.landBack) { const [x, y, sh] = LEAP_BACK[t - T.leapBack]; drawMass(g, sh, x, y); }
  drawDust(g, t, T.land, LOCK_HOME, LOCK_HOME + LOCK_W - 1);
  drawDust(g, t, T.landBack, WALL_X, WALL_X + WALL_W - 1);

  for (const c of cards.front) stamp(g, c.card, c.x, c.y, c.hide);

  drawAnswer(g, t, T.blink1, 0);
  drawAnswer(g, t, T.blink2, 1);
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

/** QA hooks (not pieces; the registry ignores them): layer access for the overlap and coverage checks. */
export const __qa = { pairAt, LEAP, LEAP_BACK, drawMass, lockAt, FY, MERGED_D };
