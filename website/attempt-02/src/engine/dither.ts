// Ordered (Bayer 4×4) dither, screen-locked in art space. research 03 §1.4.

export const BAYER4: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export type DitherLevel = 0 | 1 | 2 | 3 | 4;

/** true where a pixel should be drawn for the given density level (0 none … 4 full). */
export function ditherAt(x: number, y: number, level: DitherLevel, phase = 0): boolean {
  if (level <= 0) return false;
  if (level >= 4) return true;
  return BAYER4[(y + phase) & 3][(x + phase) & 3] < level * 4;
}
