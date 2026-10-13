// CTA band cell icons (art-spec card 11, content §10): 6×6, one colour, azure `a` on the ink band.
// Hover gestures are brief (2–6 ticks). While the pointer stays, the gesture repeats every 2 s
// (24 ticks) so a lingering hover stays alive without fidgeting.
//
// Inputs: io.hover (boolean) and io.hoverAt (number: the tick, mod 24, when hover began). Use
// hoverable(cell, mounted) from motion.ts: it sets both, so the gesture starts on the very next tick.
// With hover alone (hoverAt = 0) the gesture still plays, aligned to the 24-tick loop.
//   cta-play  ▶ presses 1 px down for 2 ticks
//   cta-code  { } blink: the braces' points retract to bars for 2 ticks (the gap frame)
//   cta-book  a page flips right → left in 3 frames of 2 ticks (lift, edge-on sliver, land)

import { definePiece, mask, type Grid, type Part, type Piece, type PieceIO } from '../../engine';

const GESTURE = 24;

/** Ticks since the gesture (re)started, or -1 when not hovered. */
export function hoverPhase(tick: number, io: PieceIO): number {
  if (!io.hover) return -1;
  const at = typeof io.hoverAt === 'number' ? io.hoverAt : 0;
  return ((((tick - at) % GESTURE) + GESTURE) % GESTURE);
}

const m = (rows: string, name: string): Part => mask(rows, 'a', name);

function cta(id: string, alt: string, frames: Part[], pick: (phase: number) => number): Piece {
  return definePiece({
    id,
    size: [6, 6],
    ticksPerFrame: 1,
    loopTicks: GESTURE,
    poster: 0,
    maxColours: 1,
    palette: ['a'],
    alt,
    cache: 'none',
    inputs: { hoverAt: { type: 'number', default: 0 } },
    frame(tick: number, g: Grid, io: PieceIO) {
      const p = hoverPhase(tick, io);
      g.blit(frames[p < 0 ? 0 : pick(p)], 0, 0);
    },
  });
}

const PLAY = [
  // 1:1 stair 2-3-4-3-2: an odd-height ▶ with a 2:1 slope ends in a 2-px spike that reads as a pin
  m(`
    .##...
    .###..
    .####.
    .###..
    .##...
    ......`, 'play'),
  m(`
    ......
    .##...
    .###..
    .####.
    .###..
    .##...`, 'play:pressed'),
];

const CODE = [
  m(`
    .#..#.
    .#..#.
    #....#
    #....#
    .#..#.
    .#..#.`, 'code'),
  m(`
    .#..#.
    .#..#.
    .#..#.
    .#..#.
    .#..#.
    .#..#.`, 'code:gap'),
];

// Open book: two solid pages fanned up at the outer corners, a 1-px gutter running down from the
// spine notch. The turning page is a 1-px sliver: lifted right, edge-on over the gutter, landing left.
const BOOK = [
  m(`
    ......
    #....#
    ##..##
    ###.##
    ######
    .####.`, 'book'),
  m(`
    .....#
    #...##
    ##.###
    ###.##
    ######
    .####.`, 'book:lift'),
  m(`
    ...#..
    #..#.#
    ##.###
    ###.##
    ######
    .####.`, 'book:edge'),
  m(`
    .#....
    #.#..#
    ##.###
    ###.##
    ######
    .####.`, 'book:land'),
];

export const ctaPlay = cta('cta-play', '', PLAY, (p) => (p < 2 ? 1 : 0));
export const ctaCode = cta('cta-code', '', CODE, (p) => (p < 2 ? 1 : 0));
export const ctaBook = cta('cta-book', '', BOOK, (p) => (p < 6 ? 1 + Math.floor(p / 2) : 0));

export const CTA_PIECES = [ctaPlay, ctaCode, ctaBook];
