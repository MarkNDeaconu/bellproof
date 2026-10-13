// card 15 · the pixel diamond. The only sprite drawn at B = 8 (mount it with `unit: BAND`).
// 15×15 (rows of width 1, 3, 5 … 15 … 3, 1) → 120 CSS px, centred in a 128 module; `sm` 7×7 → 56 px in a 64 cell.
// Pulses every 36 ticks: violet → indigo → violet, a colour swap only (2 ticks of indigo), so the silhouette never moves.

import { definePiece, type Grid } from '../../engine';

export const DIAMOND_PULSE_TICKS = 36;

export function drawDiamondShape(g: Grid, n: number, key: 'v' | 'i'): void {
  const c = (n - 1) / 2;
  for (let y = 0; y < n; y++) {
    const half = c - Math.abs(y - c);           // row y spans c-half … c+half
    g.rect(c - half, y, 2 * half + 1, 1, key);
  }
}

export const diamond = definePiece({
  id: 'diamond',
  size: [15, 15],
  variants: { sm: [7, 7] },
  ticksPerFrame: 1,
  loopTicks: DIAMOND_PULSE_TICKS,
  poster: 6,
  maxColours: 2,
  palette: ['v', 'i'],
  alt: '',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const t = ((tick % DIAMOND_PULSE_TICKS) + DIAMOND_PULSE_TICKS) % DIAMOND_PULSE_TICKS;
    drawDiamondShape(g, g.w, t < 2 ? 'i' : 'v');
  },
});

export default diamond;
