// fridge-family (art-spec card 10): fridge-mini, fridge-badge, fridge-out
// + the public recipe helpers plate() / coax() / pulse() / drawFridgeMini() (see README.md).

import { definePiece, type Grid } from '../../engine';
import { drawFridgeMini, MINI } from './recipe';

export { plate, coax, pulse, drawFridgeMini, miniPulseFrame, miniBlinks, MINI } from './recipe';
export type { Pt, PlateOpts, CoaxOpts, PulseOpts, MiniOpts } from './recipe';

export const fridgeMini = definePiece({
  id: 'fridge-mini',
  size: [MINI.w, MINI.h],
  ticksPerFrame: 2,
  loopTicks: 16,
  poster: 4,
  maxColours: 10,
  palette: [...MINI.palette],
  alt: 'Pixel-art quantum computer: a small dilution refrigerator with signals running down to its chip.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    drawFridgeMini(g, 0, 0, tick);
  },
});

export { fridgeBadge, drawBadge, badgeFace, BADGE } from './badge';
export { fridgeOut, OUT } from './out';
