// Input sweep for pieces with inputs (the validator only renders defaults): every face/flip/fade/hover
// combination over the period, checking palette membership, colour count, and that frame() never throws.
//   npx tsx src/art/icons/specimen/sweep.ts
import { Grid } from '../../../engine/grid';
import { defaultIO, sizeOf, periodOf, type Piece, type PieceIO } from '../../../engine/piece';
import { ICON_PIECES } from '../index';

const combos: Record<string, Array<Partial<PieceIO>>> = {
  'round-tile': ['?', 'T', 'C', 'ok'].flatMap((face) => [{ face }, { face, shimmer: false }, { face, flip: 5 }, { face, fade: 5, from: 'ok' }, { face, fade: 5, from: 'T' }]),
  'tc-glyph': [{}, { hover: true, hoverAt: 0 }, { hover: true, hoverAt: 7 }],
  'question-block': [{}, { flicker: 0 }, { flicker: 20 }],
  'cta-play': [{}, { hover: true }], 'cta-code': [{}, { hover: true }], 'cta-book': [{}, { hover: true }],
};
let bad = 0, checked = 0;
for (const [id, list] of Object.entries(combos)) {
  const p = ICON_PIECES.find((q) => q.id === id) as Piece;
  for (const variant of [undefined, ...Object.keys(p.variants ?? {})]) for (const over of list) {
    const io = defaultIO(p, over);
    const used = new Set<string>();
    const [w, h] = sizeOf(p, variant);
    for (let t = 0; t < periodOf(p) + 24; t++) {
      const g = new Grid(w, h);
      p.frame(t, g, io, variant);
      for (const k of g.colours()) { used.add(k); if (!p.palette.includes(k)) { bad++; console.log(`✗ ${id}${variant ? ':' + variant : ''} ${JSON.stringify(over)} t${t}: key ${k} not in palette`); } }
      checked++;
    }
    if (used.size > p.maxColours) { bad++; console.log(`✗ ${id} ${JSON.stringify(over)} uses ${used.size} colours > ${p.maxColours}`); }
  }
}
console.log(`sweep: ${checked} frames, ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
