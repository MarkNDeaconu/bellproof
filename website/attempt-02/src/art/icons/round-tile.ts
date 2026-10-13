// `round-tile` (revision-1 §1.9, task I1): one round of the protocol as a tile. The hero's right-rail
// blocks carry three of them, and the T/C shuffle choreography (art-bands) drives their faces.
//   24×24 (U → 96 px); variant `md` 16×16 (64 px).
//   Faces: '?' hairline face + steel glyph · 'T' violet + white · 'C' blue + white · 'ok' azure + ink ✓.
//   1-px silver outline with rounded corners, white 1-px specular at the top-left.
// Glyphs are bold (2-px stems, 1-px stair curves) and sized so they centre exactly in the even face:
// 8×12 at 24 px and 6×10 at 16 px (the ✓ is 12×10 / 10×8). The spec's 5×7 / 3×5 font glyphs sat half a
// pixel off centre and read small on a 96-px tile (critique round 0, qa/art-icons/rev1/i1-r0-glyphs.png).
//
// Inputs (cache 'none'; the engine passes the absolute local tick, engine-spec E9):
//   face: '?' | 'T' | 'C' | 'ok'   the face shown
//   flip: number                   first tick of a 2-frame narrow flip into `face` (edge-on, half width);
//                                  flipping into 'ok' adds a 1-tick white flash. Use flipTile() (+1 tick).
//   fade: number, from: face       4-tick ordered-dither fade from `from` to `face` (dither levels 1–3, then 4)
//   shimmer: boolean (true)        on the '?' face, two azure glints run along the lit edges every 3 s
// Pure under tick + period (36) with default inputs.

import { definePiece, Grid, mask, type Key, type Part, type PieceIO } from '../../engine';

export type TileFace = '?' | 'T' | 'C' | 'ok';
export const TILE_FACES: readonly TileFace[] = ['?', 'T', 'C', 'ok'];

const FACE: Record<TileFace, { face: Key; ink: Key }> = {
  '?': { face: 'h', ink: 't' },
  T: { face: 'v', ink: 'w' },
  C: { face: 'b', ink: 'w' },
  ok: { face: 'a', ink: 'k' },
};

const rows = (s: string) => s.split('/');
const G24: Record<TileFace, string> = {
  '?': '..####../.######./##....##/##....##/.....###/....###./...###../...##.../...##.../......../...##.../...##...',
  T: '########/########/...##.../...##.../...##.../...##.../...##.../...##.../...##.../...##.../...##.../...##...',
  C: '..######/.#######/###...../##....../##....../##....../##....../##....../##....../###...../.#######/..######',
  ok: '..........##/.........###/........###./.......###../......###.../##...###..../###.###...../.#####....../..###......./...#........',
};
const G16: Record<TileFace, string> = {
  '?': '.####./##..##/....##/...##./..##../..##../....../..##../..##../......',
  T: '######/######/..##../..##../..##../..##../..##../..##../..##../..##..',
  C: '.#####/######/##..../##..../##..../##..../##..../##..../######/.#####',
  ok: '........##/.......###/......###./##...###../###.###.../.#####..../..###...../...#......',
};

const GLYPHS: Record<'24' | '16', Record<TileFace, Part>> = { '24': {} as Record<TileFace, Part>, '16': {} as Record<TileFace, Part> };
for (const f of TILE_FACES) {
  GLYPHS['24'][f] = mask(rows(G24[f]), 'k', `tile24:${f}`);
  GLYPHS['16'][f] = mask(rows(G16[f]), 'k', `tile16:${f}`);
}

const asFace = (v: unknown): TileFace => (TILE_FACES.includes(v as TileFace) ? (v as TileFace) : '?');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : -1);

/** Outline (rounded corners) + face fill for a tile `w` wide, `n` tall, left edge at x0. */
function body(g: Grid, x0: number, w: number, n: number, face: Key): void {
  g.rect(x0 + 1, 1, w - 2, n - 2, face);
  for (let i = 1; i < w - 1; i++) { g.set(x0 + i, 0, 'l'); g.set(x0 + i, n - 1, 'l'); }
  for (let j = 1; j < n - 1; j++) { g.set(x0, j, 'l'); g.set(x0 + w - 1, j, 'l'); }
  g.set(x0 + 1, 1, 'w');
}

function full(g: Grid, n: number, f: TileFace, shimmerTick: number): void {
  const { face, ink } = FACE[f];
  body(g, 0, n, n, face);
  const glyph = GLYPHS[n === 24 ? '24' : '16'][f];
  g.blit(glyph, (n - glyph.w) >> 1, (n - glyph.h) >> 1, { recolor: { k: ink } });
  if (f === '?' && shimmerTick >= 0 && shimmerTick < 6) {
    const step = n === 24 ? 3 : 2;
    const d = step * (1 + (shimmerTick >> 1));
    g.set(d, 1, 'a'); g.set(1, d, 'a');
  }
}

export const roundTile = definePiece({
  id: 'round-tile',
  size: [24, 24],
  variants: { md: [16, 16] },
  ticksPerFrame: 1,
  loopTicks: 36,
  poster: 0,
  maxColours: 8,
  palette: ['l', 'h', 't', 'v', 'b', 'a', 'k', 'w'],
  alt: '',
  cache: 'none',
  inputs: {
    face: { type: 'string', default: '?' },
    flip: { type: 'number', default: -1 },
    fade: { type: 'number', default: -1 },
    from: { type: 'string', default: '?' },
    shimmer: { type: 'boolean', default: true },
  },
  states: TILE_FACES,
  state: (_tick: number, io: PieceIO) => asFace(io.face),
  frame(tick: number, g: Grid, io: PieceIO, variant?: string) {
    const n = variant === 'md' ? 16 : 24;
    const f = asFace(io.face);
    const flipDt = num(io.flip) >= 0 ? tick - num(io.flip) : -1;
    const shimmerTick = io.shimmer === false ? -1 : ((tick % 36) + 36) % 36;
    if (flipDt === 0) {                          // edge-on: a 2-px silver sliver
      g.rect((n >> 1) - 1, 1, 2, n - 2, 'l');
      return;
    }
    if (flipDt === 1) {                          // half width, new face, no glyph yet
      body(g, n >> 2, n >> 1, n, FACE[f].face);
      return;
    }
    if (flipDt === 2 && f === 'ok') {            // the verdict lands with one white tick
      body(g, 0, n, n, 'w');
      return;
    }
    const fadeDt = num(io.fade) >= 0 ? tick - num(io.fade) : -1;
    if (fadeDt >= 0 && fadeDt < 3) {
      const a = new Grid(n, n), b = new Grid(n, n);
      full(a, n, asFace(io.from), -1);
      full(b, n, f, -1);
      g.dissolve(a, b, (fadeDt + 1) as 1 | 2 | 3);
      return;
    }
    full(g, n, f, shimmerTick);
  },
});
