// Shared rules for the five client vignettes (art-spec card 13). Every vignette is 48×48, loops in 48 ticks
// at 12 fps, uses poster tick 12, rests on the same ground row, is lit from the upper left and has exactly one
// violet focal element. The family glint (a 4-tick azure/white twinkle) marks "verified" in each scene.

import type { Grid, Key } from '../../engine';

export const SIZE: [number, number] = [48, 48];
export const LOOP = 48;
export const POSTER = 12;
/** Row of the contact shadow. Objects stand with their lowest pixel on row GROUND - 1. */
export const GROUND = 44;

/** Positive modulo (ticks may be any integer). */
export function mod(n: number, m: number): number { return ((n % m) + m) % m; }

/** Integer wave in {-1, 0, 1}; `period` must divide LOOP so loops stay exact. */
export function wave(tick: number, period: number, phase = 0): number {
  const v = Math.round(Math.sin((2 * Math.PI * mod(tick + phase, period)) / period));
  return v === 0 ? 0 : v; // no -0
}

/** Contact shadow: one row of night on the ground row under an object (navy where a piece has no night to spare). */
export function shadow(g: Grid, x0: number, x1: number, y = GROUND, k: Key = 'n'): void {
  for (let x = x0; x <= x1; x++) g.set(x, y, k);
}

/** The family glint: a 4-tick twinkle starting at tick `at`: dot, plus with a white core, white dot, dot. */
export function glint(g: Grid, tick: number, at: number, x: number, y: number): void {
  const d = mod(tick - at, LOOP);
  if (d === 0 || d === 3) g.set(x, y, 'a');
  else if (d === 1) { g.set(x, y, 'w'); g.set(x - 1, y, 'a'); g.set(x + 1, y, 'a'); g.set(x, y - 1, 'a'); g.set(x, y + 1, 'a'); }
  else if (d === 2) g.set(x, y, 'w');
}

/** Plot a list of [x, y] points in one key. */
export function plot(g: Grid, pts: ReadonlyArray<readonly [number, number]>, k: Key): void {
  for (const [x, y] of pts) g.set(x, y, k);
}
