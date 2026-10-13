// The shared 8-pose walk cycle (contact · down · passing · up, twice).
//
// Feet share one centre column (side-on gait) and travel ±2 px around it, so a planted foot moves back
// exactly 1 px per pose. If the canvas advances 1 art px per pose, every planted foot stays fixed on the
// ground: no foot sliding. walkers plays one pose per tick (canvas moves 1 art px/tick = 48 CSS px/s);
// qubit-walker plays one pose per 2 ticks (canvas moves 1 art px per 2 ticks, the footer's 4 px / 2 ticks).

import type { Foot, Size } from './creature';
import { BOX } from './creature';

// planted foot offsets from the centre column; the other foot swings through lifted
const A_OFF = [2, 1, 0, -1, -2, -1, 0, 1];
const A_LIFT = [0, 0, 0, 0, 0, 1, 1, 1];
const B_OFF = [-2, -1, 0, 1, 2, 1, 0, -1];
const B_LIFT = [0, 1, 1, 1, 0, 0, 0, 0];
/**
 * Orb height over the feet: it dips only on the contact pose and rides high through down/passing/up,
 * so the swinging foot (drawn behind the orb) always shows under it: a springy, toy-like gait.
 */
const BOB = [0, 1, 1, 1, 0, 1, 1, 1];
/** Antenna tip trails the motion (−1 = behind when facing right) and springs upright one pose after each dip. */
const TIP: Array<-1 | 0> = [-1, 0, -1, -1, -1, 0, -1, -1];

export interface WalkPose { feet: [Foot, Foot]; bob: number; tip: -1 | 0 | 1 }

/** Walk pose p ∈ [0, 8) for a creature facing `dir` (1 right, −1 left). */
export function walkPose(p: number, dir: 1 | -1, size: Size = 'md'): WalkPose {
  const i = ((p % 8) + 8) % 8;
  const B = BOX[size];
  const centre = (B.feet[0] + B.feet[1]) / 2;           // md: 5 (feet at 3 and 7), sm: 4
  const absA = centre + A_OFF[i], absB = centre + B_OFF[i];
  const mirror = (x: number) => (dir > 0 ? x : B.w - 2 - x);
  // drawCreature places feet[i] at B.feet[i] + dx, so dx converts an absolute column into an offset.
  // Draw order: A behind (feet[0], shaded key), B in front (feet[1], lit key): the near foot reads on top.
  const fa: Foot = { dx: mirror(absA) - B.feet[0], lift: A_LIFT[i] };
  const fb: Foot = { dx: mirror(absB) - B.feet[1], lift: B_LIFT[i] };
  return { feet: [fa, fb], bob: BOB[i], tip: (TIP[i] * dir) as -1 | 0 | 1 };
}
