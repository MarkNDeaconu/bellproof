// cascade-coin · bitmaps. art-spec card 14. Light from the upper left; tokens shade within the glow ramp
// (w glint, a face, c rim, b rim shadow); the conveyor shades within the metal ramp (l t m s).

import { part, type Part } from '../../engine';

/** A resting token, 8×3: face row `a` with rounded corners, rim `c` lit at the left end (`a`), shadow `b`
 *  widening toward the lower right so the chip reads as a short cylinder lit from the upper left. */
export const TOKEN: Part = part(`
  .aaaaaa.
  acccccbb
  cccccbbb
`, 'token');

/** The top token of a stack: the same chip with the `w` glint on its lit rim (inside the silhouette, so it never
 *  reads as a hole on paper). */
export const TOKEN_TOP: Part = part(`
  .aaaaaa.
  awccccbb
  cccccbbb
`, 'token-top');

/** Landing squash, 10×2: one row shorter, one px wider each side. */
export const TOKEN_SQUASH: Part = part(`
  .aaaaaaaa.
  accccccbbb
`, 'token-squash');

/** The token at the bottom of the stack, pressed by the impact from above, 8×2 (the stack gives 1 px for 1 tick). */
export const TOKEN_PRESSED: Part = part(`
  .aaaaaa.
  accccbbb
`, 'token-pressed');

/** The 1-tick smear of a falling token, 8×6: the chip stretched up its path, straight-sided, no detail. */
export const TOKEN_SMEAR: Part = part(`
  .uuuuuu.
  .aaaaaa.
  .aaaaaa.
  .aaaaaa.
  acccccbb
  cccccbbb
`, 'token-smear');

/** Roller, 4×4: a navy wheel, rim lit `m` on the upper-left, a steel hub; a navy bolt turns on the hub. */
export const ROLLER: Part = part(`
  .mm.
  mtts
  mtts
  .ss.
`, 'roller');

/** Bolt positions on the hub, clockwise (the top run moves right, so the rollers turn clockwise). Phase 0 parks the
 *  bolt on the shaded lower-right pixel, so a still belt (and the poster) keeps the lit upper-left hub pixel. */
export const BOLT: ReadonlyArray<readonly [number, number]> = [[2, 2], [1, 2], [1, 1], [2, 1]];
