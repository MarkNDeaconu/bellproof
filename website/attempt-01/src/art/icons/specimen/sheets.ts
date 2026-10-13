// Icon specimen sheets (Node, exact pixels): every icon at every size (2, 4, 8, 20 px per art px)
// on paper and on ink, plus every frame of every animated icon and its hover/bump frames.
//   npx tsx src/art/icons/specimen/sheets.ts [outDir=qa/art-icons] [--tag r1]
// 1-colour glyphs are drawn as icon() draws them: in currentColor (ink on paper, paper on ink).

import { join, resolve } from 'node:path';
import { Grid } from '../../../engine/grid';
import { defaultIO, frameCount, frameTick, sizeOf, type Piece, type PieceIO } from '../../../engine/piece';
import { ICON_PIECES } from '../index';
import { Sheet, SURFACE, textWidth, type RGB } from './raster';

const args = process.argv.slice(2);
const tagIdx = args.indexOf('--tag');
const tag = tagIdx >= 0 ? `-${args[tagIdx + 1]}` : '';
const outDir = resolve(args.find((a, i) => !a.startsWith('--') && (i === 0 || args[i - 1] !== '--tag')) ?? 'qa/art-icons');
const SIZES = [2, 4, 8, 20];

interface Entry { piece: Piece; variant?: string; label: string }

function render(p: Piece, variant: string | undefined, tick: number, io?: PieceIO): Grid {
  const [w, h] = sizeOf(p, variant);
  const g = new Grid(w, h);
  p.frame(tick, g, io ?? defaultIO(p), variant);
  return g;
}
// Static glyphs render through icon() in currentColor; canvases (cta-*) keep their palette colour.
const isMono = (p: Piece) => p.id.startsWith('ui-') || p.id.startsWith('social-');

/** One specimen block: rows of entries × [paper sizes | ink sizes]. */
function specimen(entries: Entry[], sizes: number[], file: string, title: string): void {
  const labelW = 190, gap = 16, pad = 20;
  const colW = sizes.map((s) => Math.max(...entries.map((e) => sizeOf(e.piece, e.variant)[0])) * s);
  const halfW = colW.reduce((a, b) => a + b + gap, 0) + pad;
  const rowHs = entries.map((e) => Math.max(14, sizeOf(e.piece, e.variant)[1] * Math.max(...sizes)) + 18);
  const H = 56 + rowHs.reduce((a, b) => a + b, 0) + pad;
  const W = labelW + halfW * 2;
  const sheet = new Sheet(W, H, SURFACE.paper);
  sheet.rect(labelW + halfW, 0, halfW, H, SURFACE.ink);
  sheet.text(title, 12, 12, 2, SURFACE.ink);
  let hx = labelW;
  for (const [i, s] of sizes.entries()) {
    sheet.text(`${s}PX`, hx, 34, 2, SURFACE.soft);
    sheet.text(`${s}PX`, hx + halfW, 34, 2, SURFACE.muted);
    hx += colW[i] + gap;
  }
  let y = 56;
  entries.forEach((e, r) => {
    const g = render(e.piece, e.variant, e.piece.poster);
    const [w, h] = sizeOf(e.piece, e.variant);
    sheet.text(e.label, 12, y + 2, 2, SURFACE.soft);
    sheet.text(`${w}X${h}`, 12, y + 16, 2, SURFACE.muted);
    for (const [half, fg] of [[0, SURFACE.ink], [1, SURFACE.paper]] as Array<[number, RGB]>) {
      let x = labelW + half * halfW;
      sizes.forEach((s, i) => {
        sheet.grid(g, x, y, s, isMono(e.piece) ? fg : undefined);
        if (s >= 8) sheet.box(x, y, w * s, h * s, half ? SURFACE.hairDark : SURFACE.hair);
        x += colW[i] + gap;
      });
    }
    y += rowHs[r];
  });
  sheet.save(join(outDir, file));
  console.log('wrote', file, W, H);
}

/** Every frame of a piece's period at `s`× (optionally with inputs), poster boxed, on paper and ink. */
function frames(rows: Array<{ piece: Piece; io?: PieceIO; label: string; count?: number }>, s: number, file: string, title: string): void {
  const gap = 6, labelW = 230;
  const layout = rows.map((r) => {
    const [w, h] = r.piece.size;
    const n = Math.min(r.count ?? frameCount(r.piece), 60);
    return { ...r, w, h, n };
  });
  const maxRowW = Math.max(...layout.map((l) => l.n * (l.w * s + gap)));
  const W = labelW + Math.min(maxRowW, 2400) + 20;
  const rowH = (l: { h: number; w: number; n: number }) => (l.h * s + 16) * Math.ceil((l.n * (l.w * s + gap)) / Math.min(maxRowW, 2400));
  const halfH = 40 + layout.reduce((a, l) => a + rowH(l) + 10, 0);
  const sheet = new Sheet(W, halfH * 2, SURFACE.paper);
  sheet.rect(0, halfH, W, halfH, SURFACE.ink);
  for (const [half, fg, oy] of [[0, SURFACE.ink, 0], [1, SURFACE.paper, halfH]] as Array<[number, RGB, number]>) {
    sheet.text(title + (half ? ' · INK' : ' · PAPER'), 12, oy + 12, 2, half ? SURFACE.muted : SURFACE.ink);
    let y = oy + 40;
    for (const l of layout) {
      sheet.text(l.label, 12, y + 2, 2, half ? SURFACE.muted : SURFACE.soft);
      let x = labelW, yy = y;
      for (let f = 0; f < l.n; f++) {
        if (x + l.w * s > W - 10) { x = labelW; yy += l.h * s + 16; }
        const tick = frameTick(l.piece, f);
        const g = render(l.piece, undefined, tick, l.io);
        sheet.grid(g, x, yy, s, isMono(l.piece) ? fg : undefined);
        if (tick === l.piece.poster && !l.io) sheet.box(x, yy, l.w * s, l.h * s, SURFACE.azure);
        sheet.text(String(tick), x, yy + l.h * s + 3, 1, half ? SURFACE.muted : SURFACE.soft);
        x += l.w * s + gap;
      }
      y += rowH(l) + 10;
    }
  }
  sheet.save(join(outDir, file));
  console.log('wrote', file, W, halfH * 2);
}

const byId = (id: string) => ICON_PIECES.find((p) => p.id === id)!;
const glyphs: Entry[] = [];
for (const p of ICON_PIECES.filter((q) => q.id.startsWith('ui-') || q.id.startsWith('social-'))) {
  glyphs.push({ piece: p, label: p.id });
  for (const v of Object.keys(p.variants ?? {})) glyphs.push({ piece: p, variant: v, label: `${p.id}:${v}` });
}
specimen(glyphs, SIZES, `specimen-glyphs${tag}.png`, 'ICONS · STATIC GLYPHS · POSTER = SVG BITMAP');

const sprites = (ids: string[]): Entry[] => ids.map((id) => ({ piece: byId(id), label: id }));
specimen(sprites(['cta-play', 'cta-code', 'cta-book', 'tag-disk', 'tag-gpu', 'tag-helix', 'tag-candles', 'tag-globe', 'tag-chain']), SIZES, `specimen-small${tag}.png`, 'ICONS · CTA + TAGS · POSTERS');
specimen(sprites(['trust-loop', 'trust-target', 'trust-chain-check', 'tc-glyph', 'question-block']), SIZES, `specimen-cells${tag}.png`, 'ICONS · TRUST CELLS + BLOCKS · POSTERS');
specimen(sprites(['check-scale']), SIZES, `specimen-scale${tag}.png`, 'ICONS · CHECK-SCALE · POSTER');

// frames: idle loops, then input-driven gestures
const hov = (id: string): PieceIO => defaultIO(byId(id), { hover: true, hoverAt: 0 });
frames([
  { piece: byId('tag-disk'), label: 'tag-disk' }, { piece: byId('tag-gpu'), label: 'tag-gpu' },
  { piece: byId('tag-helix'), label: 'tag-helix' }, { piece: byId('tag-candles'), label: 'tag-candles' },
  { piece: byId('tag-globe'), label: 'tag-globe' }, { piece: byId('tag-chain'), label: 'tag-chain' },
  { piece: byId('cta-play'), io: hov('cta-play'), label: 'cta-play HOVER', count: 8 },
  { piece: byId('cta-code'), io: hov('cta-code'), label: 'cta-code HOVER', count: 8 },
  { piece: byId('cta-book'), io: hov('cta-book'), label: 'cta-book HOVER', count: 8 },
], 4, `frames-small${tag}.png`, 'FRAMES 4X');
frames([
  { piece: byId('trust-loop'), label: 'trust-loop' },
  { piece: byId('tc-glyph'), label: 'tc-glyph' },
  { piece: byId('question-block'), label: 'question-block IDLE' },
  { piece: byId('question-block'), io: defaultIO(byId('question-block'), { bump: 0 }), label: 'question-block BUMP', count: 10 },
], 4, `frames-cells${tag}.png`, 'FRAMES 4X');
frames([{ piece: byId('check-scale'), label: 'check-scale' }], 3, `frames-scale${tag}.png`, 'FRAMES 3X');
void textWidth;
