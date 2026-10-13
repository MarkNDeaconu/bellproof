// Round-3 refinement of the chosen silhouette (K): check placement variants at 4×, 8× and 20× on paper and ink.
//   npx tsx src/art/logo-mark/tools/refine.ts  → qa/art-logo-mark/refine-sheet.png
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { mask } from '../../../engine/ascii';
import { Sheet } from './sheet';

const root = resolve(new URL('../../../..', import.meta.url).pathname);
const out = join(root, 'qa', 'art-logo-mark');
mkdirSync(out, { recursive: true });

const V: Array<{ id: string; rows: string[] }> = [
  { id: 'K  vertex in rim', rows: ['.....##.....','....####....','...######...','...######...','...######...','...######...','..######.#..','..#####.##..','..##.#.###..','#####.######','.....##.....'] },
  { id: 'K2 2-wide vertex', rows: ['.....##.....','....####....','...######...','...######...','...######...','...######...','..######.#..','..#####.##..','..##.#.###..','#####..#####','.....##.....'] },
  { id: 'K4 check in skirt, rim whole', rows: ['.....##.....','....####....','...######...','...######...','...######...','..######.#..','..#####.##..','..##.#.###..','..###.####..','############','.....##.....'] },
  { id: 'K5 K4 + 6-wide r5', rows: ['.....##.....','....####....','...######...','...######...','...######...','...######...','..######.#..','..#####.##..','..##.#.###..','..###.####..','############','.....##.....'].slice(0, 11) },
];
// K5 is 12 rows above; drop it (kept the slice to make the typo obvious). Real K5: shift the whole check up by using r4 width 8.
V[3] = { id: 'K5 short waist, rim whole', rows: ['.....##.....','....####....','...######...','...######...','..######.#..','..#####.##..','..##.#.###..','..###.####..','..########..','############','.....##.....'] };

const SCALES = [2, 4, 8, 20];
const colW = 16 + SCALES.reduce((a, s) => a + 12 * s + 16, 0);
const rowH = 11 * 20 + 40;
const sheet = new Sheet(colW * 2, V.length * rowH + 8, 'p');
sheet.fill(colW, 0, colW, sheet.h, 'k');
V.forEach((v, i) => {
  const part = mask(v.rows, 'k', v.id);
  const y0 = 8 + i * rowH;
  sheet.label(v.id, 16, y0, 'm');
  sheet.label(v.id, colW + 16, y0, 'l');
  for (const side of [0, 1]) {
    let x = side * colW + 16;
    for (const s of SCALES) { sheet.paintPart(part, x, y0 + 16 + (220 - 11 * s), s, side ? 'p' : 'k'); x += 12 * s + 16; }
  }
});
sheet.save(join(out, 'refine-sheet.png'));
console.log('ok');
