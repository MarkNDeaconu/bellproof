// client-battery · an upright cylindrical cell in a violet wrap with a charge window. Loop: the six bars charge
// bottom-up one per 4 ticks (0–23), hold full (24–27, the cap blinks white and the family glint lands on the
// terminal), then drain top-down (28–47).

import { definePiece, part, type Grid } from '../../engine';
import { GROUND, LOOP, POSTER, SIZE, glint, shadow } from './shared';

// 18 wide: nub (rows 0–2), cap ellipse (2–5), wrap body with the window (6–34), base ring (35–36).
const CELL = part(`
  .......ssss.......
  ......seelts......
  ...sssseelltsss...
  .sseeeeeeeellltss.
  slleeeeeeeeellltts
  stllllllllllltttss
  svrvvvvvvvvvvvvnns
  svrvkkkkkkkkkkvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvkkkkkkkkkkvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvkkkkkkkkkkvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvkkkkkkkkkkvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvkkkkkkkkkkvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvkkkkkkkkkkvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvksssssssskvnns
  svrvkkkkkkkkkkvnns
  svrvvvvvvvvvvvvnns
  svrvvvvvvvvvvvvnns
  stlleeeeeellllttss
  .ssssssssssssssss.
`, 'cell');

const X0 = 15;                       // cell left edge on the canvas
const Y0 = GROUND - CELL.h;          // cell top
const BAR_X = X0 + 5, BAR_W = 8;
/** Top row of bar i (0 = bottom bar). */
const barY = (i: number) => Y0 + 8 + (5 - i) * 4;

/**
 * Number of lit bars at tick t (card 13: fill one per 4 ticks, hold, drain top-down 28–47). Each bar lands one tick
 * before the card's 0/4/8/… beat (47, 3, 7, 11, 15, 19) so the poster (12) is a settled frame, not a pop frame.
 */
export function litBars(t: number): number {
  if (t === 47 || t < 3) return 1;
  if (t < 19) return Math.floor((t + 1) / 4) + 1;
  if (t < 28) return 6;
  return Math.max(0, 5 - Math.floor((t - 28) / 3));
}
const popping = (t: number) => t === 47 || (t < 20 && (t + 1) % 4 === 0);   // the tick a bar lands
const draining = (t: number) => t >= 28 && t <= 43 && (t - 28) % 3 === 0;   // the tick a bar lets go

export const clientBattery = definePiece({
  id: 'client-battery',
  size: SIZE,
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 12,
  palette: ['s', 't', 'l', 'e', 'w', 'k', 'v', 'r', 'n', 'a', 'g', 'c'],
  alt: 'A battery cell whose charge bars fill and empty.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const t = tick % LOOP;
    shadow(g, X0 + 2, X0 + CELL.w - 3);
    g.blit(CELL, X0, Y0);
    const lit = litBars(t);
    for (let i = 0; i < lit; i++) {
      const y = barY(i);
      // the newest bar lands glow-white for one tick while charging
      const fresh = popping(t) && i === lit - 1;
      g.rect(BAR_X, y, BAR_W, 3, fresh ? 'g' : 'a');
      if (!fresh) { g.set(BAR_X, y, 'g'); g.set(BAR_X + 1, y, 'g'); }
    }
    // the bar that just let go dims through cornflower for one tick
    if (draining(t)) g.rect(BAR_X, barY(lit), BAR_W, 3, 'c');
    // full: the terminal blinks white twice and the family glint lands just above it
    if (t === 24 || t === 26) { g.set(X0 + 7, Y0 + 1, 'w'); g.set(X0 + 8, Y0 + 1, 'w'); }
    glint(g, tick, 23, X0 + 12, Y0);
  },
});
