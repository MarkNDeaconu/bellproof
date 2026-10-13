// npm run sheet -- <piece-id> [variant] [--bg ink|paper] [--out dir]
// Renders every frame of the piece's period at 4× with tick labels (poster boxed azure), plus a 1× strip, to a PNG.
// No browser needed. Output: qa/sheets/<id>[-variant][-ink].png

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';
import { Grid } from '../src/engine/grid';
import { font3x5 } from '../src/engine/glyphs';
import { defaultIO, frameCount, frameTick, sizeOf } from '../src/engine/piece';
import { discover } from './validate';
import type { Piece } from '../src/engine/piece';

const args = process.argv.slice(2);
const flag = (k: string): string | undefined => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const all = args.includes('--all');
const id = all ? undefined : positional[0];
const variant = all ? undefined : positional[1];
const bg = flag('bg') ?? 'paper';
const root = resolve(new URL('..', import.meta.url).pathname);
const outDir = flag('out') ?? join(root, 'qa', 'sheets');
const fromTick = flag('from') !== undefined ? Number(flag('from')) : undefined;
const toTick = flag('to') !== undefined ? Number(flag('to')) : undefined;

if (!id && !all) { console.error('usage: npm run sheet -- <piece-id> [variant] [--bg ink|paper] [--out dir] [--from tick --to tick] | --all [--bg ink]'); process.exit(1); }

const found = await discover();
if (all) {
  // integrator (queue #7): every piece (and every variant), one PNG each
  for (const { piece } of found) for (const v of [undefined, ...Object.keys(piece.variants ?? {})]) render(piece, v);
  process.exit(0);
}
const entry = found.find((f) => f.piece.id === id);
if (!entry) { console.error(`unknown piece "${id}". Known: ${found.map((f) => f.piece.id).join(', ')}`); process.exit(1); }
render(entry.piece, variant);

function render(piece: Piece, variant: string | undefined): void {
const [w, h] = sizeOf(piece, variant);
const n = frameCount(piece);
const first = fromTick !== undefined ? Math.max(0, Math.floor(fromTick / piece.ticksPerFrame)) : 0;
const last = toTick !== undefined ? Math.min(n - 1, Math.floor(toTick / piece.ticksPerFrame)) : n - 1;
const stride = Math.max(1, Math.ceil((last - first + 1) / 144));
const frames: number[] = [];
for (let f = first; f <= last; f += stride) frames.push(f);
const cols = Math.ceil(Math.sqrt(frames.length)), rows = Math.ceil(frames.length / cols);
const cellW = w + 4, cellH = h + 4 + 7;
const paper = bg !== 'ink';
const sheet = new Grid(cols * cellW, rows * cellH);
sheet.rect(0, 0, sheet.w, sheet.h, paper ? 'p' : 'k');
const io = defaultIO(piece);
const g = new Grid(w, h);
frames.forEach((f, i) => {
  const tick = frameTick(piece, f);
  const x = (i % cols) * cellW + 2, y = Math.floor(i / cols) * cellH + 2;
  g.clear(); piece.frame(tick, g, io, variant);
  sheet.blit(g, x, y);
  if (tick === piece.poster) sheet.rect(x - 1, y - 1, w + 2, h + 2, 'a', false);
  sheet.text(font3x5, String(tick), x, y + h + 1, paper ? 'm' : 'l');
});
const strip = new Grid(frames.length * (w + 1), h);
frames.forEach((f, i) => { g.clear(); piece.frame(frameTick(piece, f), g, io, variant); strip.blit(g, i * (w + 1), 0); });

const SCALE = 4, GAP = 8;
const W = Math.max(sheet.w * SCALE, strip.w), H = sheet.h * SCALE + GAP + strip.h;
const png = new PNG({ width: W, height: H });
const bgRgb = paper ? [0xf4, 0xf2, 0xed] : [0x0e, 0x14, 0x24];
for (let i = 0; i < W * H; i++) { png.data[i * 4] = bgRgb[0]; png.data[i * 4 + 1] = bgRgb[1]; png.data[i * 4 + 2] = bgRgb[2]; png.data[i * 4 + 3] = 255; }
function paint(src: Grid, ox: number, oy: number, scale: number): void {
  const rgba = src.toRGBA();
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const si = (y * src.w + x) * 4;
    if (!rgba[si + 3]) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const di = ((oy + y * scale + dy) * W + (ox + x * scale + dx)) * 4;
      png.data[di] = rgba[si]; png.data[di + 1] = rgba[si + 1]; png.data[di + 2] = rgba[si + 2]; png.data[di + 3] = 255;
    }
  }
}
paint(sheet, 0, 0, SCALE);
paint(strip, 0, sheet.h * SCALE + GAP, 1);
mkdirSync(outDir, { recursive: true });
const file = join(outDir, `${piece.id}${variant ? '-' + variant : ''}${paper ? '' : '-ink'}${fromTick !== undefined || toTick !== undefined ? `-${first * piece.ticksPerFrame}-${last * piece.ticksPerFrame}` : ''}.png`);
writeFileSync(file, PNG.sync.write(png));
console.log(`${frames.length} frame(s) of ${n} (${w}×${h}) → ${file}`);
}
