// State sheets for chain-flow (inputs the standard `npm run sheet` cannot show: lit/age, progress/walk, modes).
// Run from attempt-01/:  npx tsx src/art/chain-flow/tools/states.ts [round-label]
// Writes qa/art-chain-flow/<label>-*.png at 4× (labels) plus 1× and page-scale strips.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';
import { Grid } from '../../../engine/grid';
import { font3x5 } from '../../../engine/glyphs';
import { defaultIO, type Piece, type PieceIO } from '../../../engine/piece';
import { RGBA } from '../../../engine/palette';
import { chainBlock, BLOCK_MODES, CLICK_TICKS } from '../block';
import { jobToken } from '../token';
import { magnifierScroll } from '../magnifier';
import { settle } from '../settle';

const root = resolve(new URL('../../../../', import.meta.url).pathname);
const out = join(root, 'qa', 'art-chain-flow');
mkdirSync(out, { recursive: true });
const label = process.argv[2] ?? 'states';

interface Cell { label: string; piece: Piece; tick: number; io: Partial<PieceIO> }
interface Row { title: string; cells: Cell[] }

function render(c: Cell): Grid {
  const g = new Grid(c.piece.size[0], c.piece.size[1]);
  c.piece.frame(c.tick, g, { ...defaultIO(c.piece), ...c.io } as PieceIO);
  return g;
}

function toPng(src: Grid, scale: number, bg: 'paper' | 'ink', file: string): void {
  const W = src.w * scale, H = src.h * scale;
  const png = new PNG({ width: W, height: H });
  const bgc = bg === 'paper' ? RGBA.p : RGBA.k;
  const rgba = src.toRGBA();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const si = (Math.floor(y / scale) * src.w + Math.floor(x / scale)) * 4;
    const di = (y * W + x) * 4;
    const on = rgba[si + 3] > 0;
    png.data[di] = on ? rgba[si] : bgc[0]; png.data[di + 1] = on ? rgba[si + 1] : bgc[1]; png.data[di + 2] = on ? rgba[si + 2] : bgc[2]; png.data[di + 3] = 255;
  }
  writeFileSync(file, PNG.sync.write(png));
}

/** Labelled grid of cells (art space), plus a strip of the same cells at 1 art px = 1 px. */
function sheet(name: string, rows: Row[], scale = 4): void {
  const cw = Math.max(...rows.flatMap((r) => r.cells.map((c) => c.piece.size[0])));
  const ch = Math.max(...rows.flatMap((r) => r.cells.map((c) => c.piece.size[1])));
  const cols = Math.max(...rows.map((r) => r.cells.length));
  const cellW = Math.max(cw + 4, 22), cellH = ch + 9, titleH = 7;
  for (const bg of ['paper', 'ink'] as const) {
    const big = new Grid(cols * cellW + 2, rows.length * (cellH + titleH) + 2);
    const txt = bg === 'paper' ? 'm' : 'l';
    rows.forEach((row, ri) => {
      const oy = ri * (cellH + titleH) + 1;
      big.text(font3x5, row.title.toUpperCase(), 1, oy, bg === 'paper' ? 'b' : 'a');
      row.cells.forEach((c, ci) => {
        const ox = ci * cellW + 1;
        big.blit(render(c), ox, oy + titleH);
        big.text(font3x5, c.label.toUpperCase(), ox, oy + titleH + ch + 2, txt);
      });
    });
    toPng(big, scale, bg, join(out, `${label}-${name}-${bg}.png`));
    // 1× and page-scale (4 css px per art px) strips: every cell of the first rows, no labels
    const strip = new Grid(cols * (cw + 2), rows.length * (ch + 2));
    rows.forEach((row, ri) => row.cells.forEach((c, ci) => strip.blit(render(c), ci * (cw + 2), ri * (ch + 2))));
    toPng(strip, 1, bg, join(out, `${label}-${name}-${bg}-1x.png`));
  }
}

// chain-block: per mode — unlit, click ages 0..CLICK_TICKS-1, lit rest
sheet('chain-block', BLOCK_MODES.map((mode) => ({
  title: mode,
  cells: [
    { label: 'unlit', piece: chainBlock, tick: 0, io: { mode, lit: false } },
    ...Array.from({ length: CLICK_TICKS }, (_, a) => ({ label: `a${a}`, piece: chainBlock, tick: 0, io: { mode, lit: true, age: a } })),
    { label: 'lit', piece: chainBlock, tick: 0, io: { mode, lit: true } },
  ],
})));

// job-token: progress steps × (rest, walk a/b, glint)
sheet('job-token', Array.from({ length: 7 }, (_, s) => ({
  title: `step ${s + 1} p${(s / 6).toFixed(2)}`,
  cells: [
    { label: 'rest', piece: jobToken, tick: 0, io: { progress: s / 6 } },
    { label: 'walk0', piece: jobToken, tick: 0, io: { progress: s / 6, walk: true } },
    { label: 'walk2', piece: jobToken, tick: 2, io: { progress: s / 6, walk: true } },
    { label: 'g13', piece: jobToken, tick: 13, io: { progress: s / 6 } },
    { label: 'g17', piece: jobToken, tick: 17, io: { progress: s / 6 } },
  ],
})));

// magnifier: the 4 lens positions
sheet('magnifier', [{ title: 'lens', cells: [0, 6, 12, 18].map((t) => ({ label: `t${t}`, piece: magnifierScroll, tick: t, io: {} })) }]);

// settle: honest and cheat, every 2nd tick, in rows of 12
for (const mode of ['honest', 'cheat'] as const) {
  const rows: Row[] = [];
  for (let r = 0; r < 6; r++) rows.push({ title: `${mode} ${r * 12}-${r * 12 + 11}`, cells: Array.from({ length: 6 }, (_, i) => r * 12 + i * 2).map((t) => ({ label: `t${t}`, piece: settle, tick: t, io: { mode } })) });
  sheet(`settle-${mode}`, rows, 3);
}
console.log(`wrote ${label}-*.png to ${out}`);
