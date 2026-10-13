// The three 16×16 trust-cell icons (art-spec card 11, design-spec §5.2 B): loop arrow (Re-run it),
// target (Test it), chain link with a tick (Prove it). They share the check-scale's metal ramp
// (`s m t l`) so the four cells read as one family, plus one azure `a` accent pixel each.
// Rings and links are 2 px thick and shaded by position (shade.ts), light from the upper left.

import { definePiece, Grid, part, type Part } from '../../engine';
import { maskFrom, rotate90, shadeMask, type Mask } from './shade';

const METAL = { light: 'l', body: 't', shadow: 'm', outline: 's' } as const;

// ---- trust-loop ------------------------------------------------------------------------------
// A 12-px ring (2 px thick, centred) with a gap at the upper right and a 5-3-1 ▶ head at the top
// pointing clockwise. Rotating the mask by 90° maps the ring onto itself, so only the head and gap move.
const LOOP_MASK: Mask = maskFrom([
  '.........#......',
  '.........##.....',
  '.....#######....',
  '....#######.....',
  '...###...#......',
  '..###...........',
  '..##........##..',
  '..##........##..',
  '..##........##..',
  '..##........##..',
  '..###......###..',
  '...###....###...',
  '....########....',
  '.....######.....',
  '................',
  '................',
]);
const LOOP_TIP: [number, number] = [11, 2];

const LOOP_FRAMES: Array<{ m: Mask; tip: [number, number] }> = [];
{
  let m = LOOP_MASK, tip = LOOP_TIP;
  for (let r = 0; r < 4; r++) {
    LOOP_FRAMES.push({ m, tip });
    m = rotate90(m);
    tip = [15 - tip[1], tip[0]];
  }
}

/** Rest at the top for 3 s, then one clockwise turn in four 90° steps at 4 fps. */
function loopPos(tick: number): number {
  const t = ((tick % 48) + 48) % 48;
  return t < 36 ? 0 : (Math.floor((t - 36) / 3) + 1) % 4;
}

export const trustLoop = definePiece({
  id: 'trust-loop',
  size: [16, 16],
  ticksPerFrame: 3,
  loopTicks: 48,
  poster: 0,
  maxColours: 5,
  palette: ['s', 'm', 't', 'l', 'a'],
  alt: '',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const f = LOOP_FRAMES[loopPos(tick)];
    shadeMask(g, f.m, METAL, 0, 0, (x, y) => Math.hypot(x - 7.5, y - 7.5) > 5);
    g.set(f.tip[0], f.tip[1], 'a');
  },
});

// ---- trust-target ----------------------------------------------------------------------------
// Bullseye in the loop's 12-px circle: steel ring, silver ring, blue centre; a navy dart with blue
// flights has landed in the centre. The accent is the glint on the centre's lit (upper-left) side.
const DART: Array<[number, number]> = [[13, 2], [12, 3], [11, 4], [10, 5], [9, 6], [8, 7]];
const FLIGHTS: Array<[number, number]> = [[12, 1], [13, 1], [14, 2], [14, 3]];

export const trustTarget = definePiece({
  id: 'trust-target',
  size: [16, 16],
  ticksPerFrame: 1,
  loopTicks: 1,
  poster: 0,
  maxColours: 5,
  palette: ['s', 't', 'l', 'b', 'a'],
  alt: '',
  cache: 'loop',
  frame(_tick: number, g: Grid) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d < 2.0) g.set(x, y, 'b');
      else if (d < 3.9) g.set(x, y, 'l');
      else if (d < 6.1) g.set(x, y, 't');
    }
    // selective outline: the silhouette's lower-right edge in navy
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (g.get(x, y) !== 't' || x + y < 15) continue;
      if (g.get(x + 1, y) === null || g.get(x, y + 1) === null) g.set(x, y, 's');
    }
    for (const [x, y] of DART) g.set(x, y, 's');
    for (const [x, y] of FLIGHTS) g.set(x, y, 'b');
    g.set(6, 7, 'a');
  },
});

// ---- trust-chain-check -----------------------------------------------------------------------
// Two interlocked rounded-square links (2-px stroke, 3×3 holes): link B's top-left corner passes
// through link A's hole, so B is over A on A's right side and A is over B on A's bottom side.
// A blue badge with a silver tick is pinned over B's lower-right corner.
const LINK: Mask = maskFrom([
  '.#####.',
  '#######',
  '##...##',
  '##...##',
  '##...##',
  '#######',
  '.#####.',
]);
const LINK_A_AT: [number, number] = [1, 1];
const LINK_B_AT: [number, number] = [4, 4];
const A_OVER_B: Array<[number, number]> = [[4, 6], [5, 6], [4, 7], [5, 7]];
const BADGE: Part = part(`
  ..bbb..
  .bbbbb.
  bbbbblb
  bblblbb
  bbblbbb
  .bbbbb.
  ..bbb..`, 'badge');
// navy selective outline on the badge's lower-right rim
const BADGE_SHADOW: Array<[number, number]> = [[15, 12], [15, 13], [14, 14], [13, 15], [12, 15]];

export const trustChainCheck = definePiece({
  id: 'trust-chain-check',
  size: [16, 16],
  ticksPerFrame: 1,
  loopTicks: 1,
  poster: 0,
  maxColours: 5,
  palette: ['s', 't', 'l', 'b', 'a'],
  alt: '',
  cache: 'loop',
  frame(_tick: number, g: Grid) {
    const ramp = { light: 'l', body: 't', shadow: 's', outline: 's' } as const;
    const a = new Grid(16, 16), b = new Grid(16, 16);
    shadeMask(a, LINK, ramp, ...LINK_A_AT);
    shadeMask(b, LINK, ramp, ...LINK_B_AT);
    g.blit(a, 0, 0);
    g.blit(b, 0, 0);
    for (const [x, y] of A_OVER_B) g.set(x, y, a.get(x, y));
    g.blit(BADGE, 9, 9);
    for (const [x, y] of BADGE_SHADOW) g.set(x, y, 's');
    g.set(11, 10, 'a');
  },
});

export const TRUST_PIECES = [trustLoop, trustTarget, trustChainCheck];
