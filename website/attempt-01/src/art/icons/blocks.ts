// The two `?` blocks (art-spec card 11): `tc-glyph` (the announcement-pill icon, 12×12) and
// `question-block` (the paradox band's block on two feet, 16×16). Same visual language as the bottom
// row of tc-rounds: hairline `h` face, steel `t` glyph, what the provider sees.

import { definePiece, part, type Grid, type Key, type PieceIO } from '../../engine';

/** 5×7 question mark (rounded hook, 1-px stroke, detached dot). */
const Q = part(`
  .###.
  #...#
  ....#
  ...#.
  ..#..
  .....
  ..#..`.replace(/#/g, 't'), 'q');

// ---- tc-glyph --------------------------------------------------------------------------------
// Steel outline with rounded corners, a paper bevel on the lit (top/left) inner edge, hairline face,
// steel `?`. Shimmer: every 3 s two azure pixels run along the bevel from the lit corner outward,
// three frames at 6 fps, then the face rests.
const TC_BASE = part(`
  .tttttttttt.
  tpppppppphht
  tphhhhhhhhht
  tphhhhhhhhht
  tphhhhhhhhht
  tphhhhhhhhht
  tphhhhhhhhht
  tphhhhhhhhht
  tphhhhhhhhht
  thhhhhhhhhht
  thhhhhhhhhht
  .tttttttttt.`, 'tc-glyph');
const TC_SHIMMER: Array<Array<[number, number]>> = [
  [[2, 1], [1, 2]],
  [[4, 1], [1, 4]],
  [[6, 1], [1, 6]],
];

export const tcGlyph = definePiece({
  id: 'tc-glyph',
  size: [12, 12],
  ticksPerFrame: 2,
  loopTicks: 36,
  poster: 0,
  maxColours: 4,
  palette: ['h', 't', 'p', 'a'],
  alt: '',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    g.blit(TC_BASE, 0, 0);
    g.blit(Q, 4, 3);
    const f = Math.floor((((tick % 36) + 36) % 36) / 2);
    if (f < TC_SHIMMER.length) for (const [x, y] of TC_SHIMMER[f]) g.set(x, y, 'a');
  },
});

// ---- question-block --------------------------------------------------------------------------
// A `?` block standing on two steel feet. Ink `k` outline so it separates from the blue band and the
// mist block it stands on; inner steel shadow on the bottom/right gives it depth.
//
// io.bump (number, default -1): the tick (mod 36) at which a bump starts. Use bumpOnce(mounted) from
// motion.ts, which sets it and clears it again on the piece's 'bumped' event. The bump (8 ticks):
//   0 anticipation squash · 1–2 up 2 px (glint at 2) · 3 falling, up 1 px · 4 landing squash · 5–7 rest
// Idle: the `?` blinks azure at ticks 30–31 of every 36-tick loop. Poster: rest.

interface Box { x: number; y: number; w: number; h: number }

function drawBlock(g: Grid, b: Box, glyph: Key, glint: boolean, squashed = false): void {
  const { x, y, w, h } = b;
  // outline with rounded corners
  for (let i = 1; i < w - 1; i++) { g.set(x + i, y, 'k'); g.set(x + i, y + h - 1, 'k'); }
  for (let j = 1; j < h - 1; j++) { g.set(x, y + j, 'k'); g.set(x + w - 1, y + j, 'k'); }
  // inside: face + inner shadow (bottom row and right column)
  g.rect(x + 1, y + 1, w - 2, h - 2, 'h');
  // squashed: the bottom shadow row is pressed out of sight, which keeps the ? clear of every edge
  if (!squashed) g.rect(x + 1, y + h - 2, w - 2, 1, 't');
  g.rect(x + w - 2, y + 1, 1, h - 2, 't');
  // ? centred on the face (face = inside minus the shadow row/column); odd remainders sit low
  const fw = w - 3, fh = squashed ? h - 2 : h - 3;
  const qx = x + 1 + Math.floor((fw - 5) / 2), qy = y + 1 + Math.ceil((fh - 7) / 2);
  g.blit(Q, qx, qy, glyph === 't' ? undefined : { recolor: { t: glyph } });
  if (glint) { g.set(x + 2, y + 1, 'w'); g.set(x + 1, y + 2, 'w'); }
}

/** Two little feet (ankle + sole pointing outward); `y` is the ankle row. */
function feet(g: Grid, y: number): void {
  g.set(4, y, 't'); g.rect(2, y + 1, 3, 1, 't');
  g.set(11, y, 't'); g.rect(11, y + 1, 3, 1, 't');
}

const REST: Box = { x: 1, y: 2, w: 14, h: 12 };
const SQUASH: Box = { x: 0, y: 3, w: 16, h: 11 };

function bumpStart(io: PieceIO): number {
  const b = io.bump;
  if (b === true) return 0;
  return typeof b === 'number' && b >= 0 ? b % 36 : -1;
}

/** Bump phase 0..7 at this tick, or -1. */
export function bumpPhase(tick: number, io: PieceIO): number {
  const s = bumpStart(io);
  if (s < 0) return -1;
  const dt = (((tick % 36) - s) % 36 + 36) % 36;
  return dt < 8 ? dt : -1;
}

export const questionBlock = definePiece({
  id: 'question-block',
  size: [16, 16],
  ticksPerFrame: 1,
  loopTicks: 36,
  poster: 0,
  maxColours: 5,
  palette: ['h', 't', 'k', 'a', 'w'],
  alt: '',
  cache: 'none',
  inputs: { bump: { type: 'number', default: -1 } },
  frame(tick: number, g: Grid, io: PieceIO) {
    const p = bumpPhase(tick, io);
    const t = ((tick % 36) + 36) % 36;
    if (p === 0 || p === 4) { feet(g, 14); drawBlock(g, SQUASH, 't', false, true); return; }
    if (p === 1 || p === 2) { feet(g, 12); drawBlock(g, { ...REST, y: REST.y - 2 }, 't', p === 2); return; }
    if (p === 3) { feet(g, 13); drawBlock(g, { ...REST, y: REST.y - 1 }, 't', false); return; }
    feet(g, 14);
    drawBlock(g, REST, p < 0 && (t === 30 || t === 31) ? 'a' : 't', false);
  },
  events(tick: number, io: PieceIO) {
    const p = bumpPhase(tick, io);
    return p === 4 ? ['land'] : p === 7 ? ['bumped'] : [];
  },
});

export const BLOCK_PIECES = [tcGlyph, questionBlock];
