// Validates the logo-mark piece with the engine validator and renders its contact sheets (same layout as
// scripts/sheet.ts: frames at 4× with tick labels, poster boxed azure, 1× strip) without importing other agents'
// folders (scripts/validate.ts discovers every src/art/* and a broken sibling blocks it).
//   npx tsx src/art/logo-mark/tools/check.ts   → qa/sheets/logo-mark[-variant][-ink].png, exit 1 on errors

import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Grid } from '../../../engine/grid';
import { font3x5 } from '../../../engine/glyphs';
import { defaultIO, frameCount, frameTick, sizeOf } from '../../../engine/piece';
import { validatePiece } from '../../../engine/validate';
import { logoMark } from '../index';
import { Sheet } from './sheet';

const root = resolve(new URL('../../../..', import.meta.url).pathname);
const outDir = join(root, 'qa', 'sheets');
mkdirSync(outDir, { recursive: true });

const r = validatePiece(logoMark);
console.log(`validate logo-mark: ${r.errors.length} errors, ${r.warnings.length} warnings, colours ${r.colours}${r.frameMs !== undefined ? `, ${r.frameMs.toFixed(3)} ms/frame` : ''}`);
for (const e of r.errors) console.log('  ERROR', e);
for (const w of r.warnings) console.log('  warn ', w);

function sheet(variant: string | undefined, ink: boolean): string {
  const piece = logoMark;
  const [w, h] = sizeOf(piece, variant);
  const n = frameCount(piece);
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
  const cellW = w + 4, cellH = h + 4 + 7;
  const grid = new Grid(cols * cellW, rows * cellH);
  grid.rect(0, 0, grid.w, grid.h, ink ? 'k' : 'p');
  const io = defaultIO(piece);
  const g = new Grid(w, h);
  for (let f = 0; f < n; f++) {
    const tick = frameTick(piece, f);
    const x = (f % cols) * cellW + 2, y = Math.floor(f / cols) * cellH + 2;
    g.clear(); piece.frame(tick, g, io, variant);
    grid.blit(g, x, y);
    if (tick === piece.poster) grid.rect(x - 1, y - 1, w + 2, h + 2, 'a', false);
    grid.text(font3x5, String(tick), x, y + h + 1, ink ? 'l' : 'm');
  }
  const strip = new Grid(n * (w + 1), h);
  for (let f = 0; f < n; f++) { g.clear(); piece.frame(frameTick(piece, f), g, io, variant); strip.blit(g, f * (w + 1), 0); }
  const SCALE = 4, GAP = 8;
  const W = Math.max(grid.w * SCALE, strip.w), H = grid.h * SCALE + GAP + strip.h;
  const s = new Sheet(W, H, ink ? 'k' : 'p');
  s.paint(grid, 0, 0, SCALE);
  s.paint(strip, 0, grid.h * SCALE + GAP, 1);
  const file = join(outDir, `logo-mark${variant ? '-' + variant : ''}${ink ? '-ink' : ''}.png`);
  s.save(file);
  return file;
}

for (const [variant, ink] of [[undefined, false], ['halo', false], ['dark', true], ['halo-dark', true]] as const) console.log('sheet', sheet(variant, ink));
process.exit(r.errors.length ? 1 : 0);
