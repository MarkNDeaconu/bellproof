// The two `?` blocks (art-spec card 11, revision-1 §1.9): `tc-glyph` (the announcement-pill tile icon,
// 12×12, variant `sm` 8×8) and `question-block` (the paradox band's block on two feet, 16×16). Same
// visual language as the bottom row of tc-rounds: hairline `h` face, steel `t` glyph, what the provider
// sees. Both now flip through the verifier's secret — ? → T → C → ? — instead of anything game-like.
// T faces are violet with a white T, C faces blue with a white C (the round-tile colours).

import { definePiece, font3x5, font5x7, Grid, part, type Key, type Part, type PieceIO } from '../../engine';
import { hoverPhase } from './cta';

/** 5×7 question mark (rounded hook, 1-px stroke, detached dot), drawn in `t`. */
const Q = part(`
  .###.
  #...#
  ....#
  ...#.
  ..#..
  .....
  ..#..`.replace(/#/g, 't'), 'q');
const Q3 = font3x5.glyphs['?'];
const GLYPH7: Record<'?' | 'T' | 'C', Part> = { '?': Q, T: font5x7.glyphs.T, C: font5x7.glyphs.C };
const GLYPH5: Record<'?' | 'T' | 'C', Part> = { '?': Q3, T: font3x5.glyphs.T, C: font3x5.glyphs.C };

type Face = '?' | 'T' | 'C';
// face fill, lit bevel, glyph colour
const TC_FACE: Record<Face, { face: Key; bevel: Key; ink: Key }> = {
  '?': { face: 'h', bevel: 'p', ink: 't' },
  T: { face: 'v', bevel: 'i', ink: 'w' },
  C: { face: 'b', bevel: 'c', ink: 'w' },
};

// ---- tc-glyph --------------------------------------------------------------------------------
// Steel outline with rounded corners, a lit bevel on the top/left inner edge (one ramp step lighter
// than the face), the glyph centred on the rest of the face. Idle: every 3 s two azure pixels run along
// the bevel from the lit corner outward (3 frames of 2 ticks). Hover (io.hover + io.hoverAt; use
// hoverable()): ? → T → C → ?, each face held 2 ticks, joined by 2-frame narrow flips (edge-on, half
// width); while the pointer stays, it repeats every 2 s.
//   hover phase: 0 edge · 1 half T · 2–3 T · 4 edge · 5 half C · 6–7 C · 8 edge · 9 half ? · 10+ ?

function tcBlock(g: Grid, n: number, f: Face, shimmerTick: number): void {
  const { face, bevel, ink } = TC_FACE[f];
  for (let i = 1; i < n - 1; i++) { g.set(i, 0, 't'); g.set(i, n - 1, 't'); g.set(0, i, 't'); g.set(n - 1, i, 't'); }
  g.rect(1, 1, n - 2, n - 2, face);
  const reach = n === 12 ? 8 : 4;               // the bevel stops short of the far corners
  g.rect(1, 1, reach, 1, bevel);
  g.rect(1, 1, 1, reach, bevel);
  const glyph = (n === 12 ? GLYPH7 : GLYPH5)[f];
  // glyph area = face minus the bevel row/column: x 2..n-2, y 2..n-2
  g.blit(glyph, 2 + ((n - 3 - glyph.w) >> 1), 2 + ((n - 3 - glyph.h) >> 1), { recolor: { k: ink, t: ink } });
  if (f === '?' && shimmerTick >= 0 && shimmerTick < 6) {
    const d = n === 12 ? 2 * (1 + (shimmerTick >> 1)) : 2 + (shimmerTick >> 1);   // 2,4,6 · 2,3,4
    g.set(d, 1, 'a'); g.set(1, d, 'a');
  }
}

function tcEdge(g: Grid, n: number): void { g.rect((n >> 1) - 1, 0, 2, n, 't'); }
function tcNarrow(g: Grid, n: number, f: Face): void {
  const w = n >> 1, x0 = n >> 2;
  g.rect(x0 + 1, 1, w - 2, n - 2, TC_FACE[f].face);
  for (let i = 1; i < w - 1; i++) { g.set(x0 + i, 0, 't'); g.set(x0 + i, n - 1, 't'); }
  for (let j = 1; j < n - 1; j++) { g.set(x0, j, 't'); g.set(x0 + w - 1, j, 't'); }
  g.rect(x0 + 1, 1, 1, n >> 1, TC_FACE[f].bevel);
}

const TC_SEQ: Array<['edge' | 'narrow' | 'full', Face]> = [
  ['edge', 'T'], ['narrow', 'T'], ['full', 'T'], ['full', 'T'],
  ['edge', 'C'], ['narrow', 'C'], ['full', 'C'], ['full', 'C'],
  ['edge', '?'], ['narrow', '?'],
];

export const tcGlyph = definePiece({
  id: 'tc-glyph',
  size: [12, 12],
  variants: { sm: [8, 8] },
  ticksPerFrame: 1,
  loopTicks: 36,
  poster: 6,
  maxColours: 9,
  palette: ['h', 't', 'p', 'a', 'v', 'i', 'b', 'c', 'w'],
  alt: '',
  cache: 'none',
  inputs: { hoverAt: { type: 'number', default: 0 } },
  frame(tick: number, g: Grid, io: PieceIO, variant?: string) {
    const n = variant === 'sm' ? 8 : 12;
    const p = hoverPhase(tick, io);
    if (p >= 0 && p < TC_SEQ.length) {
      const [kind, f] = TC_SEQ[p];
      if (kind === 'edge') tcEdge(g, n);
      else if (kind === 'narrow') tcNarrow(g, n, f);
      else tcBlock(g, n, f, -1);
      return;
    }
    tcBlock(g, n, '?', p >= 0 ? -1 : ((tick % 36) + 36) % 36);
  },
});

// ---- question-block --------------------------------------------------------------------------
// A `?` block standing on two steel feet. Ink `k` outline so it separates from the blue band and the
// mist block it stands on; inner steel shadow on the bottom/right gives it depth.
//
// io.flicker (number, default -1): the tick at which a flicker starts (absolute local tick; use
// flickerOnce(mounted) from motion.ts). The flicker (14 ticks): the glyph cycles ? T C ? T C ? at
// 2 ticks each (T violet, C blue: the verifier's colours, as on round-tile) while the face pulses
// h → u (ticks 2–11) → h. No vertical motion. Events: 'flickered'
// on its last tick. Idle: the ? blinks azure at ticks 30–31 of every 36. Poster: rest.

interface Box { x: number; y: number; w: number; h: number }
const FLICKER: Face[] = ['?', 'T', 'C', '?', 'T', 'C', '?'];
const FLICKER_TICKS = FLICKER.length * 2;

function drawBlock(g: Grid, b: Box, glyph: Part, ink: Key, face: Key): void {
  const { x, y, w, h } = b;
  for (let i = 1; i < w - 1; i++) { g.set(x + i, y, 'k'); g.set(x + i, y + h - 1, 'k'); }
  for (let j = 1; j < h - 1; j++) { g.set(x, y + j, 'k'); g.set(x + w - 1, y + j, 'k'); }
  g.rect(x + 1, y + 1, w - 2, h - 2, face);
  g.rect(x + 1, y + h - 2, w - 2, 1, 't');
  g.rect(x + w - 2, y + 1, 1, h - 2, 't');
  const fw = w - 3, fh = h - 3;
  g.blit(glyph, x + 1 + Math.floor((fw - glyph.w) / 2), y + 1 + Math.ceil((fh - glyph.h) / 2), { recolor: { k: ink, t: ink } });
}

/** Two little feet (ankle + sole pointing outward); `y` is the ankle row. */
function feet(g: Grid, y: number): void {
  g.set(4, y, 't'); g.rect(2, y + 1, 3, 1, 't');
  g.set(11, y, 't'); g.rect(11, y + 1, 3, 1, 't');
}

const REST: Box = { x: 1, y: 2, w: 14, h: 12 };

/** Flicker phase 0..13 at this tick, or -1. */
export function flickerPhase(tick: number, io: PieceIO): number {
  const s = io.flicker;
  if (typeof s !== 'number' || s < 0) return -1;
  const dt = tick - s;
  return dt >= 0 && dt < FLICKER_TICKS ? dt : -1;
}

export const questionBlock = definePiece({
  id: 'question-block',
  size: [16, 16],
  ticksPerFrame: 1,
  loopTicks: 36,
  poster: 0,
  maxColours: 7,
  palette: ['h', 't', 'k', 'a', 'u', 'v', 'b'],
  alt: '',
  cache: 'none',
  inputs: { flicker: { type: 'number', default: -1 } },
  frame(tick: number, g: Grid, io: PieceIO) {
    const p = flickerPhase(tick, io);
    const t = ((tick % 36) + 36) % 36;
    feet(g, 14);
    if (p >= 0) {
      const f = FLICKER[p >> 1];
      drawBlock(g, REST, GLYPH7[f], f === 'T' ? 'v' : f === 'C' ? 'b' : 't', p >= 2 && p < FLICKER_TICKS - 2 ? 'u' : 'h');
      return;
    }
    drawBlock(g, REST, Q, t === 30 || t === 31 ? 'a' : 't', 'h');
  },
  events(tick: number, io: PieceIO) {
    return flickerPhase(tick, io) === FLICKER_TICKS - 1 ? ['flickered'] : [];
  },
});

export const BLOCK_PIECES = [tcGlyph, questionBlock];
