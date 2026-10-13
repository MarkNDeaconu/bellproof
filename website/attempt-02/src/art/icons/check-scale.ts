// `check-scale` (art-spec card 11; content §5 "the light side wins"): a balance in the trust section's
// "Check it" cell. Left pan: a heavy navy block stamped with a blue C (the compute). Right pan: one
// azure pixel (the check). It wobbles the way physics expects, then settles with the LIGHT side down.
//
// Geometry (32×20): beam 24 px (x 4..27) through a 2×2 ink pivot on a slate post; three pre-drawn tilts.
// A tilt moves each end 2 px: runs 3-6-6-6-3, so the pivot run (x 13..18) never moves and every
// jaggy is regular. Each pan hangs on two 1-px strings that leave the hook in an inverted V (slope 2:1).
// Loop 60: 0–11 level · 12–14 left-down · 15–17 level · 18–20 right-down · 21–23 level ·
//          24–47 right-down (settled; the check blinks white at 30 and 42) · 48–59 level. Poster 36.

import { definePiece, part, type Grid } from '../../engine';

type Tilt = -1 | 0 | 1;   // -1 left end down, 0 level, 1 right end down

const RUNS: Array<[x0: number, x1: number]> = [[4, 6], [7, 12], [13, 18], [19, 24], [25, 27]];
const LEFT_DOWN = [6, 5, 4, 3, 2];

function beamY(x: number, tilt: Tilt): number {
  if (tilt === 0) return 4;
  const i = RUNS.findIndex(([a, b]) => x >= a && x <= b);
  const y = LEFT_DOWN[i];
  return tilt === -1 ? y : 8 - y;
}

function tiltAt(tick: number): Tilt {
  const t = ((tick % 60) + 60) % 60;
  if (t >= 12 && t < 15) return -1;
  if (t >= 18 && t < 21) return 1;
  if (t >= 24 && t < 48) return 1;
  return 0;
}

const BLOCK = part(`
  mmmmmmmm
  mssbbbss
  mssbssss
  mssbssss
  mssbssss
  mssbbbss`, 'heavy');

/** Strings + pan for a pan whose hook pixels are (hx, hx+1) and whose rim spans rimX..rimX+9. */
function pan(g: Grid, hx: number, hookY: number): number {
  const panY = hookY + 10;
  g.line(hx, hookY + 1, hx - 4, panY - 1, 't');
  g.line(hx + 1, hookY + 1, hx + 5, panY - 1, 't');
  g.rect(hx - 4, panY, 10, 1, 'l');
  g.rect(hx - 2, panY + 1, 6, 1, 'l');
  return panY;
}

export const checkScale = definePiece({
  id: 'check-scale',
  size: [32, 20],
  ticksPerFrame: 1,
  loopTicks: 60,
  poster: 36,
  maxColours: 8,
  palette: ['k', 's', 'm', 't', 'l', 'a', 'b', 'w'],
  alt: 'A balance scale: a heavy compute block on one pan, a single check pixel on the other, and the light side wins.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const tilt = tiltAt(tick);
    const t = ((tick % 60) + 60) % 60;
    // base and post
    g.rect(10, 19, 12, 1, 's');
    g.rect(12, 18, 8, 1, 'm');
    g.rect(15, 5, 1, 13, 'm');
    g.rect(16, 5, 1, 13, 's');
    // pans first (strings run behind the beam ends and behind the block)
    const leftPanY = pan(g, 5, beamY(5, tilt));
    const rightPanY = pan(g, 25, beamY(25, tilt));
    g.blit(BLOCK, 2, leftPanY - 6);
    g.set(25, rightPanY - 1, t === 30 || t === 42 ? 'w' : 'a');
    // beam and pivot
    for (let x = 4; x <= 27; x++) g.set(x, beamY(x, tilt), 't');
    g.rect(15, 3, 2, 2, 'k');
  },
});
