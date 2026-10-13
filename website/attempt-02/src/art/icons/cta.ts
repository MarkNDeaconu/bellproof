// CTA band cell icons (art-spec card 11, content §10): 6×6, one colour, azure `a` on the ink band.
// Variant `lg` 12×12 (48 px) for the revision-1 CTA cells (§1.8, task I4): same gestures, more room —
// a real </> (chevron-family brackets + a 2:1 slash) and an open book with text lines.
// Hover gestures are brief (2–6 ticks). While the pointer stays, the gesture repeats every 2 s
// (24 ticks) so a lingering hover stays alive without fidgeting.
//
// Inputs: io.hover (boolean) and io.hoverAt (number: the tick, mod 24, when hover began). Use
// hoverable(cell, mounted) from motion.ts: it sets both, so the gesture starts on the very next tick.
// With hover alone (hoverAt = 0) the gesture still plays, aligned to the 24-tick loop.
//   cta-play  ▶ presses 1 px down for 2 ticks
//   cta-code  { } blink: the braces' points retract to bars for 2 ticks (the gap frame);
//             lg </>: the slash blinks out for 2 ticks, like a caret
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

function cta(id: string, alt: string, frames: Part[], lg: Part[], pick: (phase: number) => number): Piece {
  return definePiece({
    id,
    size: [6, 6],
    variants: { lg: [12, 12] },
    ticksPerFrame: 1,
    loopTicks: GESTURE,
    poster: 0,
    maxColours: 1,
    palette: ['a'],
    alt,
    cache: 'none',
    inputs: { hoverAt: { type: 'number', default: 0 } },
    frame(tick: number, g: Grid, io: PieceIO, variant?: string) {
      const p = hoverPhase(tick, io);
      g.blit((variant === 'lg' ? lg : frames)[p < 0 ? 0 : pick(p)], 0, 0);
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

// ---- lg 12×12 --------------------------------------------------------------------------------
// "Watch the demo": a screen (1-px frame, rounded corners, neck and foot) with a 1:1 ▶ inside, set one
// column right of the screen's centre for optical balance; the ▶ presses 1 px down on hover. A solid
// 9×10 triangle outweighed the </> and the book beside it (rev1 round 1).
const PLAY_LG_SCREEN = [
  '............',
  '.##########.',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '.##########.',
  '.....##.....',
  '...######...',
];
const PLAY_LG_TRI: Array<[number, number]> = [[5, 0], [5, 1], [6, 1], [5, 2], [6, 2], [7, 2], [5, 3], [6, 3], [5, 4]];
function playLg(dy: number, name: string): Part {
  const r = PLAY_LG_SCREEN.map((row) => row.split(''));
  for (const [x, y] of PLAY_LG_TRI) r[3 + dy + y][x] = '#';
  return m(r.map((row) => row.join('')).join('\n'), name);
}
const PLAY_LG = [playLg(0, 'play-lg'), playLg(1, 'play-lg:pressed')];

// </>: brackets are the 3×5 chevron of ui-chevron; the slash runs 2:1 over 8 rows; 1-px gaps everywhere.
const CODE_LG = [
  m(`
    ............
    ............
    .......#....
    ..#....#.#..
    .#....#...#.
    #.....#....#
    .#...#....#.
    ..#..#...#..
    ....#.......
    ....#.......
    ............
    ............`, 'code-lg'),
  m(`
    ............
    ............
    ............
    ..#......#..
    .#........#.
    #..........#
    .#........#.
    ..#......#..
    ............
    ............
    ............
    ............`, 'code-lg:gap'),
];

// Open book: solid fanned pages, a 1-px gutter, two knocked-out text lines per page, the bottom edge
// closed by the spine. 11 px wide (odd, so the gutter is centred), set at x 1–11. The turning page is
// a 1-px sliver hinged at the spine top: lifted right, edge-on, landing left.
const BOOK_LG_BASE = [
  '............',
  '............',
  '............',
  '.##.......##',
  '.####...####',
  '.#####.#####',
  '.#...#.#...#',
  '.#####.#####',
  '.#...#.#...#',
  '.#####.#####',
  '..#########.',
  '............',
];
function bookLg(sliver: Array<[number, number]>, name: string): Part {
  const r = BOOK_LG_BASE.map((row) => row.split(''));
  for (const [x, y] of sliver) r[y][x] = '#';
  return m(r.map((row) => row.join('')).join('\n'), name);
}
const BOOK_LG = [
  bookLg([], 'book-lg'),
  bookLg([[7, 4], [8, 3], [9, 2], [10, 1], [11, 0]], 'book-lg:lift'),
  bookLg([[6, 4], [6, 3], [6, 2], [6, 1], [6, 0]], 'book-lg:edge'),
  bookLg([[5, 4], [4, 3], [3, 2], [2, 1], [1, 0]], 'book-lg:land'),
];

export const ctaPlay = cta('cta-play', '', PLAY, PLAY_LG, (p) => (p < 2 ? 1 : 0));
export const ctaCode = cta('cta-code', '', CODE, CODE_LG, (p) => (p < 2 ? 1 : 0));
export const ctaBook = cta('cta-book', '', BOOK, BOOK_LG, (p) => (p < 6 ? 1 + Math.floor(p / 2) : 0));

export const CTA_PIECES = [ctaPlay, ctaCode, ctaBook];
