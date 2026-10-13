// fridge-family recipe helpers: the shared construction language of every Bellproof fridge.
// PUBLIC BY DESIGN (engine-spec §1): other pieces (wall-to-lock, clients) may import these.
// Signatures are frozen; pixel output may still be polished inside these functions.
//
//   plate(g, x, y, w, opts?)        one cryostat plate (3-row mini recipe, or the 5-row hero recipe)
//   coax(g, x, y0, y1, opts?)       one 1-px coax run, returns its path (top → bottom) for pulses
//   pulse(g, path, head, opts?)     a glowing pulse (head + tail) drawn along a coax path
//   drawFridgeMini(g, ox, oy, tick, opts?)   the complete 16×24 `fridge-mini` at an offset, any tick
//   MINI                            geometry constants of the mini fridge (chip/qubit coordinates, loop)
//
// Palette: cool metals only (k s m t l e w) + glow (a g) + the violet qubit (v). No warm colours.

import type { Grid } from '../../engine/grid';
import type { Key } from '../../engine/palette';

export type Pt = readonly [x: number, y: number];

// ─────────────────────────────────────────────────────────────────────────────────────────────
// plate()
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface PlateOpts {
  /** 3 = mini recipe (card 10, default) · 5 = hero recipe (card 1). */
  rows?: 3 | 5;
  /** Recolour the plate's cold rim (3-row: the underside's lit run; 5-row: the r3 rim's lit run), e.g. 'a' for a cool-down flash. */
  rim?: Key;
  /** Light the plate face's leftmost run one step brighter ('w' gleam). Default true for w ≥ 10, false below. */
  gleam?: boolean;
}

/**
 * One cryostat plate, lit from the upper left. `x` = left edge, `y` = top row, `w` = full width (≥ 4).
 *
 * 3-row recipe (card 10, default):
 *   r0  back edge   `l`, inset 1
 *   r1  face        `l` end cap · `w` gleam (≈ 15 %, w ≥ 10 only) · `e` to 45 % · `l` · `t` from 86 % (≥ 2 px)
 *   r2  underside   `m`, inset 1, `s` from 72 % (≥ 2 px, shadow side)
 *
 * 5-row recipe (card 1, the hero's):
 *   r0  back edge `l` inset 2 · r1 face `e` 45 % then `l` · r2 gleam `w` 18 %, `e` to 60 %, `l`
 *   r3  rim `l | t | m` split at 12 % / 68 % · r4 underside `m` → `s` from 72 %, inset 2
 */
export function plate(g: Grid, x: number, y: number, w: number, opts: PlateOpts = {}): void {
  const rows = opts.rows ?? 3;
  const at = (pct: number) => x + Math.round(w * pct);
  if (rows === 5) {
    run(g, x + 2, x + w - 3, y, 'l');
    run(g, x, at(0.45) - 1, y + 1, 'e'); run(g, at(0.45), x + w - 1, y + 1, 'l');
    run(g, x, at(0.18) - 1, y + 2, 'w'); run(g, at(0.18), at(0.6) - 1, y + 2, 'e'); run(g, at(0.6), x + w - 1, y + 2, 'l');
    run(g, x, at(0.12) - 1, y + 3, opts.rim ?? 'l'); run(g, at(0.12), at(0.68) - 1, y + 3, 't'); run(g, at(0.68), x + w - 1, y + 3, 'm');
    run(g, x + 2, at(0.72) - 1, y + 4, 'm'); run(g, at(0.72), x + w - 3, y + 4, 's');
    return;
  }
  const gleam = opts.gleam ?? w >= 10;
  // r0 back edge
  run(g, x + 1, x + w - 2, y, 'l');
  // r1 face: lit end cap `l` (keeps the lozenge readable on paper), gleam, platinum, silver, steel shadow end
  const eEnd = at(0.45) - 1;
  const tFrom = Math.min(x + w - 2, at(0.86)); // ≥ 2 px of steel so the shadow end is a cluster, not a speck
  run(g, x + 1, eEnd, y + 1, 'e');
  run(g, eEnd + 1, tFrom - 1, y + 1, 'l');
  run(g, tFrom, x + w - 1, y + 1, 't');
  g.set(x, y + 1, 'l');
  if (gleam) run(g, x + 1, x + Math.max(1, Math.round(w * 0.15)), y + 1, 'w');
  // r2 underside
  const sFrom = Math.min(at(0.72), x + w - 3); // ≥ 2 px of navy on the shadow side
  run(g, x + 1, Math.min(sFrom - 1, x + w - 2), y + 2, 'm');
  run(g, sFrom, x + w - 2, y + 2, 's');
  if (opts.rim) run(g, x + 1, Math.min(at(0.3), sFrom - 1), y + 2, opts.rim);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// coax()
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface CoaxOpts {
  /** Line colour. Default 't' (steel). */
  key?: Key;
  /** Bends: at row `y` the line steps `dx` (±1) sideways; the bend pixel gets `shadow` on its right. */
  jogs?: ReadonlyArray<{ y: number; dx: -1 | 1 }>;
  /** Shadow key drawn to the right of each bend (card 1: 'm'). Default 'm'; null = none. */
  shadow?: Key | null;
  /** Only compute the path (draw nothing). */
  dry?: boolean;
}

/**
 * A 1-px coax line from (x, y0) down to row y1 inclusive. Returns the path, top to bottom, one point per row
 * (a jog adds the sideways pixel as an extra point), so pulses can follow it with `pulse()`.
 * Draw plates AFTER coax: the plates hide the line where it passes through them (thermal anchoring).
 */
export function coax(g: Grid, x: number, y0: number, y1: number, opts: CoaxOpts = {}): Pt[] {
  const key = opts.key ?? 't';
  const shadow = opts.shadow === undefined ? 'm' : opts.shadow;
  const jogs = new Map((opts.jogs ?? []).map((j) => [j.y, j.dx] as const));
  const path: Pt[] = [];
  let cx = x;
  for (let y = y0; y <= y1; y++) {
    const dx = jogs.get(y);
    if (dx) {
      path.push([cx, y]);
      cx += dx;
      path.push([cx, y]);
      if (!opts.dry && shadow) g.set(Math.max(cx, cx - dx) + 1, y, shadow);
    } else path.push([cx, y]);
  }
  if (!opts.dry) for (const [px, py] of path) g.set(px, py, key);
  return path;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// pulse()
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface PulseOpts {
  /** Colours from the head backwards. Default ['a', 'g'] (card 10); the hero uses ['w', 'g', 'a']. */
  keys?: readonly Key[];
  /** Skip points where this returns true (e.g. rows hidden behind a plate). */
  hidden?: (x: number, y: number) => boolean;
}

/** Draws a pulse whose head sits at `path[head]`; the tail trails up the path. Out-of-range indices are skipped. */
export function pulse(g: Grid, path: readonly Pt[], head: number, opts: PulseOpts = {}): void {
  const keys = opts.keys ?? ['a', 'g'];
  keys.forEach((k, i) => {
    const p = path[head - i];
    if (!p) return;
    if (opts.hidden?.(p[0], p[1])) return;
    g.set(p[0], p[1], k);
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The mini fridge (card 10a), 16×24
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Geometry of `fridge-mini` (relative to its top-left). */
export const MINI = {
  w: 16,
  h: 24,
  ticksPerFrame: 2,
  loopTicks: 16,
  cable: { x: 8, y0: 0, y1: 1 },
  plates: [
    { x: 1, y: 2, w: 14 },
    { x: 3, y: 9, w: 10 },
    { x: 5, y: 16, w: 6 },
  ],
  coax: [6, 9] as const,
  coaxY: [5, 20] as const,
  chipBox: { x: 5, y: 20, w: 6, h: 4 },
  /** The `k` window is 2×1 at (7, 22)–(8, 22); the qubit pixel is the right one. */
  window: { x: 7, y: 22, w: 2, h: 1 },
  qubit: [8, 22] as const,
  /** Where an answer pixel leaves the box (right side, window row). */
  exit: [11, 22] as const,
  palette: ['k', 's', 'm', 't', 'l', 'e', 'w', 'v', 'a', 'g'] as const,
} as const;

export interface MiniOpts {
  /** Draw the travelling pulses (default true). */
  pulses?: boolean;
  /** Force the qubit pixel's colour (e.g. 'w' for an answer blink, 'k' for a dark/cold chip). Overrides the loop. */
  qubit?: Key;
}

// One pulse's 8-frame life on its line (local frame → what is lit):
//   0–1: open coax rows 5–8 · 2: anchored inside plate 2 (underside glows) · 3–4: rows 12–15
//   5: anchored inside plate 3 · 6: enters the box (row 19–20) · 7: the qubit answers `w`
const MINI_PULSE: ReadonlyArray<{ head?: number; glow?: Pt; blink?: boolean }> = [
  { head: 6 }, { head: 8 }, { glow: [0, 11] }, { head: 13 }, { head: 15 }, { glow: [0, 18] }, { head: 20 }, { blink: true },
];
/** Line k's local frame = (frame + MINI_PHASE[k]) mod 8 → line 0 leads, line 1 trails it by 2 frames (4 ticks). */
const MINI_PHASE = [1, 7] as const;

/** The mini fridge's local pulse frame for line `k` at `tick` (0..7). Exposed for scenes that sync to it. */
export function miniPulseFrame(tick: number, k: 0 | 1): number {
  const f = Math.floor((((tick % 16) + 16) % 16) / 2);
  return (f + MINI_PHASE[k]) % 8;
}

/** True on the ticks the mini fridge's qubit blinks `w` in its own loop. */
export function miniBlinks(tick: number): boolean {
  return miniPulseFrame(tick, 0) === 7 || miniPulseFrame(tick, 1) === 7;
}

/**
 * Draws the complete `fridge-mini` (card 10a) with its top-left at (ox, oy), as it looks at `tick`
 * (12-fps ticks; it animates at 6 fps, loop 16). Pure; safe to call from any piece's frame().
 */
export function drawFridgeMini(g: Grid, ox: number, oy: number, tick: number, opts: MiniOpts = {}): void {
  const set = (x: number, y: number, k: Key) => g.set(ox + x, oy + y, k);

  // cable
  for (let y = MINI.cable.y0; y <= MINI.cable.y1; y++) set(MINI.cable.x, y, 'm');
  // coax (behind the plates)
  for (const cx of MINI.coax) for (let y = MINI.coaxY[0]; y < MINI.chipBox.y; y++) set(cx, y, 't');
  // plates
  for (const p of MINI.plates) plate(g, ox + p.x, oy + p.y, p.w);
  // plates cast a 1-px shadow on the coax right under them (light from the upper left)
  for (const p of MINI.plates) for (const cx of MINI.coax) if (cx >= p.x && cx < p.x + p.w) set(cx, p.y + 3, 'm');
  // chip box: `s` shell, lit face, `k` window with the violet qubit
  const b = MINI.chipBox;
  for (let x = b.x; x < b.x + b.w; x++) { set(x, b.y, 's'); set(x, b.y + b.h - 1, 's'); }
  for (let y = b.y; y < b.y + b.h; y++) { set(b.x, y, 's'); set(b.x + b.w - 1, y, 's'); }
  // 4×2 face as two clusters: lit `l` (top run + left column), shadow `t` (right column); window + qubit between
  set(b.x + 1, b.y + 1, 'l'); set(b.x + 2, b.y + 1, 'l'); set(b.x + 3, b.y + 1, 'l'); set(b.x + 4, b.y + 1, 't');
  set(b.x + 1, b.y + 2, 'l'); set(b.x + 4, b.y + 2, 't');
  set(MINI.window.x, MINI.window.y, 'k');
  let q: Key = 'v';

  if (opts.pulses !== false) {
    MINI.coax.forEach((cx, k) => {
      const step = MINI_PULSE[miniPulseFrame(tick, k as 0 | 1)];
      if (step.head !== undefined) { set(cx, step.head, 'a'); set(cx, step.head - 1, 'g'); }
      if (step.glow) set(cx, step.glow[1], 'a');
      if (step.blink) q = 'w';
    });
  }
  if (opts.qubit) q = opts.qubit;
  set(MINI.qubit[0], MINI.qubit[1], q);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

function run(g: Grid, x0: number, x1: number, y: number, k: Key): void {
  for (let x = x0; x <= x1; x++) g.set(x, y, k);
}
