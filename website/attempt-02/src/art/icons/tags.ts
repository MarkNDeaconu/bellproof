// Trust-section tag icons (art-spec card 11): 8×8, palette `k t a b`, a 2-frame idle at 4 fps.
// Silhouettes are carried by steel `t` and blue `b` so every tag also reads on ink; ink `k` is used
// only for inner detail (seams, rungs, the die, the globe rim). In each loop one azure `a` pixel sits
// at position A and hops to position B for 2 frames (6 ticks), then hops back. Loop lengths differ
// (24…39 ticks) and the hops sit at different points of each loop, so six tags never blip together.

import { definePiece, part, type Grid, type Part, type Piece } from '../../engine';

interface TagDef {
  id: string;
  alt: string;
  map: string;
  a: [x: number, y: number];        // where the azure pixel rests
  b: [x: number, y: number];        // where it hops to
  loop: number;                     // loopTicks (multiple of 3)
  hop: number;                      // tick at which the hop starts (multiple of 3)
  mapB?: string;                    // optional whole second frame for the hop window (tag-helix twists)
}

export const TAG_DEFS: TagDef[] = [
  {
    id: 'tag-disk', alt: '', loop: 30, hop: 18, a: [5, 3], b: [5, 5],
    map: `
      .bbbbbb.
      bbbbbbbb
      tkkkkkkt
      tttttttt
      tkkkkkkt
      tttttttt
      tkkkkkkt
      .tttttt.`,
  },
  {
    id: 'tag-gpu', alt: '', loop: 27, hop: 9, a: [3, 3], b: [4, 4],
    map: `
      ..t..t..
      .kkkkkk.
      tkbbbbkt
      .kbkkbk.
      .kbkkbk.
      tkbbbbkt
      .kkkkkk.
      ..t..t..`,
  },
  {
    // revision 1 (qa-pixel #12): two 1-px strands (blue front, steel back) crossing twice, two azure
    // rungs at the wide points; the idle B frame is the same helix one row further round (a twist).
    id: 'tag-helix', alt: '', loop: 33, hop: 21, a: [3, 0], b: [3, 0],
    map: `
      .taaaab.
      ..t..b..
      ...bb...
      ..b..t..
      .baaaat.
      ..b..t..
      ...tt...
      ..t..b..`,
    mapB: `
      ..t..b..
      .taaaab.
      ..t..b..
      ...bb...
      ..b..t..
      .baaaat.
      ..b..t..
      ...tt...`,
  },
  {
    // revision 1 (qa-pixel #12): three 2-px bars (up blue, down steel, up blue) with 1-px wicks on each
    // bar's right column, floating one row clear of a 1-px steel baseline. The live price (azure, top of
    // the last wick) ticks down a pixel and back.
    id: 'tag-candles', alt: '', loop: 36, hop: 27, a: [7, 0], b: [7, 1],
    map: `
      .......t
      ......bb
      .t....bb
      bb..t.bb
      bb.tt..t
      .t.tt...
      ........
      tttttttt`,
  },
  {
    id: 'tag-globe', alt: '', loop: 39, hop: 12, a: [1, 3], b: [6, 3],
    map: `
      ..kkkk..
      .kbttbk.
      kbtbbtbk
      kttttttk
      kbtbbtbk
      kbtbbtbk
      .kbttbk.
      ..kkkk..`,
  },
  {
    id: 'tag-chain', alt: '', loop: 24, hop: 15, a: [5, 0], b: [2, 7],
    map: `
      ....ttt.
      ...t...t
      ...t...t
      .bbb...t
      b...ttt.
      b...b...
      b...b...
      .bbb....`,
  },
];

function tag(def: TagDef): Piece {
  const base: Part = part(def.map, def.id);
  const baseB: Part | null = def.mapB ? part(def.mapB, `${def.id}:b`) : null;
  return definePiece({
    id: def.id,
    size: [8, 8],
    ticksPerFrame: 3,
    loopTicks: def.loop,
    poster: 0,
    maxColours: 4,
    palette: ['k', 't', 'a', 'b'],
    alt: def.alt,
    cache: 'loop',
    frame(tick: number, g: Grid) {
      const t = ((tick % def.loop) + def.loop) % def.loop;
      const inHop = t >= def.hop && t < def.hop + 6;
      if (baseB) { g.blit(inHop ? baseB : base, 0, 0); return; }
      g.blit(base, 0, 0);
      const [x, y] = inHop ? def.b : def.a;
      g.set(x, y, 'a');
    },
  });
}

export const TAG_PIECES = TAG_DEFS.map(tag);
export const [tagDisk, tagGpu, tagHelix, tagCandles, tagGlobe, tagChain] = TAG_PIECES;
