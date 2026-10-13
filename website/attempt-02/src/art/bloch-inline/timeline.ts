// bloch-inline · the timeline as pure functions of the tick (art-spec card 2).
//
// One loop is 96 ticks:
//   0–71   precession: θ = 60°, φ advancing 15° per frame (3 turns of 24 frames)
//   72     measurement: the rim flashes white and the vector snaps to a pole
//   73–74  ring burst around the tip (radius 2, then 3)
//   75–86  hold on the measured pole (12 ticks)
//   87–95  Rabi rotation back to θ = 60° with eased spacing (2 4 8 12 14 12 8 4 2, scaled); the free precession
//          eases back in over the last 2 frames so the seam (95 → 0) is one ordinary step
//
// The outcome is seeded per loop: 3 of every 4 loops land north, matching P(0) = cos²(θ/2) = cos²30° = 0.75.
// So the piece's period is 4 loops (384 ticks) and frame(384) == frame(0).

import { rng, shuffle } from '../../engine';

export const LOOP = 96;
export const LOOPS = 4;
export const PERIOD = LOOP * LOOPS;

export const THETA = 60;              // polar angle of the prepared state (degrees)
export const STEP = 15;               // φ advance per frame during precession (24 frames per turn)
/** Screen azimuth at tick 0: 0° = pointing right, +90° = pointing at the viewer. −45° puts frames exactly on
 *  the front and back passes (φ = 90°, 270°), so the tip crosses the axis column one pixel at a time instead of
 *  skipping it, and the poster (tick 5, φ = 30°) shows the vector front-right on a clean 2:1 pixel slope. */
export const PHI0 = -45;

export const T_MEASURE = 72;
export const T_HOLD = 75;             // first hold tick
export const T_RABI = 87;             // first Rabi tick
export const POSTER = 5;
/** The drive (Rabi pulse) tips the vector down a fixed meridian while it is strong; over its last BLEND frames the
 *  free precession eases back in (0 → 15°/frame), so tick 95 → tick 0 is an ordinary precession step: no stall at
 *  the seam and no jump in speed. That is also what a shaped pulse does: drive-dominated core, precession-dominated tail. */
const BLEND = 2;
const MERIDIAN = PHI0 - (STEP * BLEND) / 2;

/** Eased Rabi spacing from the card (sum 66), normalised to cumulative fractions 0 → 1 over 9 frames. */
const RABI_SPACING = [2, 4, 8, 12, 14, 12, 8, 4, 2];
const RABI_SUM = RABI_SPACING.reduce((a, b) => a + b, 0);
export const RABI_CUM: readonly number[] = RABI_SPACING.reduce<number[]>((acc, s) => {
  acc.push((acc.length ? acc[acc.length - 1] : 0) + s / RABI_SUM);
  return acc;
}, []);

export type Outcome = 'N' | 'S';
/** Seeded shuffle of three norths and one south (seed 1946, the year of Bloch's "Nuclear Induction": loops measure N, S, N, N, so loop 0 (the poster's) lands north and the rarer south shows up within the first 16 s). */
export const OUTCOMES: readonly Outcome[] = shuffle(rng(1946), ['N', 'N', 'N', 'S'] as Outcome[]);

export type Phase = 'precess' | 'flash' | 'burst' | 'hold' | 'rabi';

export interface Pose {
  theta: number;                      // degrees from +z
  phi: number;                        // screen azimuth, degrees
  phase: Phase;
  outcome: Outcome;
  /** burst ring index: 0 on tick 73, 1 on tick 74 */
  ring?: number;
  /** true while the tip is moving (draw the sub-pixel lead) */
  moving: boolean;
}

export function wrap(tick: number): number { return ((tick % PERIOD) + PERIOD) % PERIOD; }

/** Continuous Rabi fraction for a (possibly fractional) Rabi frame index k in [0, 9]. */
function rabiFrac(k: number): number {
  if (k <= 0) return 0;
  if (k >= 9) return 1;
  const i = Math.floor(k), f = k - i;
  const a = i === 0 ? 0 : RABI_CUM[i - 1], b = RABI_CUM[i];
  return a + (b - a) * f;
}

/** θ/φ for a loop-local time (fractional allowed, used for the motion direction). Ignores the collapse. */
export function motionAt(lt: number, outcome: Outcome): { theta: number; phi: number } {
  if (lt < T_MEASURE) return { theta: THETA, phi: PHI0 + STEP * lt };
  const pole = outcome === 'N' ? 0 : 180;
  if (lt < T_RABI - 1) return { theta: pole, phi: PHI0 };
  const k = lt - (T_RABI - 1);                       // 1 … 9 on ticks 87 … 95
  const theta = pole + (THETA - pole) * rabiFrac(k);
  // φ(u) = PHI0 − 15u + (15 / 2·BLEND)u² for u = 96 − lt ≤ BLEND: 0°/frame at u = BLEND, 15°/frame at u = 0
  const u = LOOP - lt;
  return { theta, phi: u >= BLEND ? MERIDIAN : PHI0 - STEP * u + (STEP / (2 * BLEND)) * u * u };
}

export function pose(tick: number): Pose {
  const t = wrap(tick);
  const loop = Math.floor(t / LOOP), lt = t % LOOP;
  const outcome = OUTCOMES[loop];
  const pole = outcome === 'N' ? 0 : 180;
  if (lt < T_MEASURE) return { theta: THETA, phi: PHI0 + STEP * lt, phase: 'precess', outcome, moving: true };
  if (lt === T_MEASURE) return { theta: pole, phi: PHI0, phase: 'flash', outcome, moving: false };
  if (lt < T_HOLD) return { theta: pole, phi: PHI0, phase: 'burst', outcome, ring: lt - T_MEASURE - 1, moving: false };
  if (lt < T_RABI) return { theta: pole, phi: PHI0, phase: 'hold', outcome, moving: false };
  const m = motionAt(lt, outcome);
  return { theta: m.theta, phi: m.phi, phase: 'rabi', outcome, moving: true };
}
