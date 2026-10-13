// client-providers · the Providers tab reuses `fridge-badge` (card 10b, by art-fridge-family) unchanged and stages it
// at the family's 48×48 size: the fridge hangs from a little cloud (a quantum *cloud* provider), its badge flips
// `?` → `✓`, and the family glint lands on the badge when the check appears. The badge piece is drawn through its own
// public `frame()`, so any polish art-fridge-family makes to it shows up here automatically.

import { definePiece, Grid, part } from '../../engine';
import { fridgeBadge } from '../fridge-family';
import { GROUND, LOOP, POSTER, SIZE, glint, mod, shadow } from './shared';

/** fridge-badge runs 18 ticks ahead, so our poster (12) shows its poster (30): the ✓ face. */
const BADGE_LEAD = 18;
const OX = 12, OY = 17;                 // fridge-badge top-left on the canvas
const CABLE_X = OX + 8;                 // the mini's own cable column

/** A three-puff cloud lit from the upper left: white caps, platinum body, silver underside, steel base line. */
const CLOUD = part(`
  ...........wwwe...........
  .........wwwwwwee.........
  ....wwe.wwwwwweeee........
  ...wwwwewwwweeeeeel.wwe...
  ..wwwweeewweeeeeeeeewwwee.
  .wwweeeeeeeeeeeeeeeeeeeeel
  .weeeeeeeeeeeeeeeeeeeeeell
  weeeeeeeeeeeeeeeeeeeeeelll
  .lleeeeeeeeeeeeeeeeellllt.
  ..tttttttttttttttttttttt..
`, 'cloud');
const CLOUD_X = CABLE_X - 12, CLOUD_Y = 3;

export const clientProviders = definePiece({
  id: 'client-providers',
  size: SIZE,
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 12,
  palette: [...fridgeBadge.palette],
  alt: 'A quantum computer hanging from a cloud, with a badge that flips from a question mark to a check mark.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const t = mod(tick, LOOP);
    const bob = t >= 24 ? 1 : 0;        // the whole rig sinks 1 px for half the loop
    shadow(g, OX + 4 - bob, OX + 11 + bob, GROUND, 's');   // nearer the ground → a wider shadow
    g.blit(CLOUD, CLOUD_X, CLOUD_Y + bob);
    for (let y = CLOUD_Y + CLOUD.h + bob; y < OY + bob; y++) g.set(CABLE_X, y, 'm');
    const sub = new Grid(24, 24);
    fridgeBadge.frame(t + BADGE_LEAD, sub, { hover: false, focus: false, click: 0, progress: 0, mode: '' });
    g.blit(sub, OX, OY + bob);
    glint(g, tick, 5, OX + 23, OY + 16 + bob);   // the check lands (badge ticks 22–26)
  },
});
