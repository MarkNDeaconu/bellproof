// Renders the candidate bells side by side at every scale that matters (favicon 1×, nav 2×, 4×, 8×, footer 20×)
// on paper and on ink. Output: qa/art-logo-mark/compare-sheet.png and compare-small.png (true-size, then ×6 zoom).
//   npx tsx src/art/logo-mark/tools/compare.ts

import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { mask } from '../../../engine/ascii';
import { CANDIDATES } from '../candidates';
import { Sheet } from './sheet';

const root = resolve(new URL('../../../..', import.meta.url).pathname);
const out = join(root, 'qa', 'art-logo-mark');
mkdirSync(out, { recursive: true });

const SCALES = [1, 2, 4, 8, 20];
const ROW_H = 20 * 11 + 36;
const half = 16 + SCALES.reduce((a, s) => a + 12 * s + 16, 0);
const W = half * 2, H = 24 + CANDIDATES.length * ROW_H;

const sheet = new Sheet(W, H, 'p');
sheet.fill(half, 0, half, H, 'k');
sheet.label('PAPER  1X 2X 4X 8X 20X', 16, 8, 'm');
sheet.label('INK  1X 2X 4X 8X 20X', half + 16, 8, 'l');

CANDIDATES.forEach((c, i) => {
  const part = mask(c.rows, 'k', c.id);
  const y0 = 24 + i * ROW_H;
  sheet.label(c.name, 16, y0 + 4, 'm');
  sheet.label(c.name, half + 16, y0 + 4, 'l');
  for (const side of [0, 1]) {
    let x = side * half + 16;
    const k = side ? 'p' : 'k';
    for (const s of SCALES) {
      const y = y0 + 20 + (11 * 20 - 11 * s);   // bottom-align on the rim
      sheet.paintPart(part, x, y, s, k);
      x += 12 * s + 16;
    }
  }
});
sheet.save(join(out, 'compare-sheet.png'));

// True-size grid of 1× (favicon) and 2× (nav) per candidate, paper then ink. Zoom it ×4 with nearest-neighbour to inspect.
{
  const cell = 56;
  const w = 16 + CANDIDATES.length * cell;
  const strip = new Sheet(w, 2 * 44, 'p');
  strip.fill(0, 44, w, 44, 'k');
  CANDIDATES.forEach((c, i) => {
    const part = mask(c.rows, 'k', c.id);
    for (const side of [0, 1]) {
      const k = side ? 'p' : 'k';
      const bx = 16 + i * cell, by = side * 44;
      strip.label(c.id, bx, by + 4, side ? 'l' : 'm', 1);
      strip.paintPart(part, bx, by + 24, 1, k);
      strip.paintPart(part, bx + 18, by + 14, 2, k);
    }
  });
  strip.save(join(out, 'compare-small.png'));
}
console.log('wrote', join(out, 'compare-sheet.png'), 'and compare-small.png');
