// Dev-only contact sheets for every piece, mode and variant of card 3, on the backgrounds each piece
// actually sits on (hero card + blue block, CTA ink + staircase steps, footer blue band over cornflower).
// The engine's `npm run sheet` renders default inputs only; this covers the modes too.
//
//   npx tsx src/art/qubit-folk/sheets.ts            → qa/art-qubit-folk/sheets/*.png
//
// Not imported by the app (the registry only loads index.ts), so it never reaches the bundle.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';
import { Grid } from '../../engine/grid';
import { font3x5 } from '../../engine/glyphs';
import { RGBA } from '../../engine/palette';
import { defaultIO, type Piece, type PieceIO } from '../../engine/piece';
import { qubitPair, walkers, qubitWalker } from './index';
import { drawCreature } from './creature';

const root = resolve(new URL('../../..', import.meta.url).pathname);
const outDir = join(root, 'qa', 'art-qubit-folk', 'sheets');

type RGB = [number, number, number];
const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const BG: Record<string, RGB> = {
  card: hex('#FBFAF7'), paper: hex('#F4F2ED'), ink: hex('#0E1424'), blue: hex('#2F5BEA'), cornflower: hex('#5E87F1'),
  night: hex('#321B63'), violet: hex('#7202BC'), indigo: hex('#6331DF'), azure: hex('#8FAEFF'),
};

interface Row { label: string; bg: string; ground?: string; groundRows?: number; frames: Array<{ g: Grid; tag: string; box?: boolean }> }

function render(rows: Row[], file: string, scale = 4, maxW = 400): void {
  const gap = 3, labelH = 8, tagH = 7, pad = 4;
  let W = 0, H = pad;
  const layout = rows.map((r) => {
    const fw = r.frames[0].g.w, fh = r.frames[0].g.h + (r.groundRows ?? 0);
    const perRow = Math.max(1, Math.min(r.frames.length, Math.floor(maxW / (fw + gap))));
    const lines = Math.ceil(r.frames.length / perRow);
    const w = pad * 2 + perRow * (fw + gap);
    const h = labelH + lines * (fh + tagH + gap) + pad;
    const y = H; H += h; W = Math.max(W, w);
    return { r, fw, fh, perRow, y, h };
  });
  const buf = new Uint8Array(W * H * 3).fill(40);
  const put = (x: number, y: number, c: RGB) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; };
  const label = new Grid(W, 8);
  for (const L of layout) {
    // label
    label.clear(); label.text(font3x5, L.r.label.toUpperCase(), 0, 1, 'e');
    for (let y = 0; y < 8; y++) for (let x = 0; x < W; x++) { const k = label.get(x, y); if (k) put(pad + x, L.y + y, RGBA[k].slice(0, 3) as RGB); }
    L.r.frames.forEach((f, i) => {
      const col = i % L.perRow, line = Math.floor(i / L.perRow);
      const fx = pad + col * (L.fw + gap), fy = L.y + labelH + line * (L.fh + tagH + gap);
      for (let y = 0; y < L.fh; y++) for (let x = 0; x < L.fw; x++) {
        const ground = L.r.ground && y >= f.g.h;
        put(fx + x, fy + y, ground ? BG[L.r.ground!] : BG[L.r.bg]);
      }
      for (let y = 0; y < f.g.h; y++) for (let x = 0; x < f.g.w; x++) { const k = f.g.get(x, y); if (k) put(fx + x, fy + y, RGBA[k].slice(0, 3) as RGB); }
      if (f.box) for (let x = -1; x <= L.fw; x++) { put(fx + x, fy - 1, BG.azure); put(fx + x, fy + L.fh, BG.azure); }
      if (f.box) for (let y = -1; y <= L.fh; y++) { put(fx - 1, fy + y, BG.azure); put(fx + L.fw, fy + y, BG.azure); }
      const t = new Grid(L.fw + 8, 6); t.text(font3x5, f.tag, 0, 0, 'l');
      for (let y = 0; y < 6; y++) for (let x = 0; x < t.w; x++) if (t.get(x, y)) put(fx + x, fy + L.fh + 1 + y, [150, 160, 180]);
    });
  }
  const png = new PNG({ width: W * scale, height: H * scale });
  for (let y = 0; y < H * scale; y++) for (let x = 0; x < W * scale; x++) {
    const si = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 3, di = (y * W * scale + x) * 4;
    png.data[di] = buf[si]; png.data[di + 1] = buf[si + 1]; png.data[di + 2] = buf[si + 2]; png.data[di + 3] = 255;
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, file), PNG.sync.write(png));
  console.log('→', join(outDir, file), `${W}×${H} art px`);
}

function frames(p: Piece, ticks: number[], io: Partial<PieceIO>, variant?: string): Row['frames'] {
  const full = { ...defaultIO(p), ...io };
  const [w, h] = variant ? p.variants![variant] : p.size;
  return ticks.map((t) => { const g = new Grid(w, h); p.frame(t, g, full, variant); return { g, tag: String(t), box: t === p.poster && !io.mode }; });
}
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);

const which = process.argv[2] ?? 'all';

if (which === 'all' || which === 'pair') {
  render([
    { label: 'qubit-pair 32x16 on card, block below', bg: 'card', ground: 'blue', groundRows: 2, frames: frames(qubitPair, range(0, 48), {}) },
    { label: 'qubit-pair on ink', bg: 'ink', frames: frames(qubitPair, range(0, 48), {}) },
  ], 'qubit-pair.png');
  render([
    { label: 'qubit-pair sm 24x12 on card, floor below', bg: 'card', ground: 'cornflower', groundRows: 2, frames: frames(qubitPair, range(0, 48), {}, 'sm') },
    { label: 'qubit-pair sm on ink', bg: 'ink', frames: frames(qubitPair, range(0, 48), {}, 'sm') },
  ], 'qubit-pair-sm.png');
}
if (which === 'all' || which === 'walkers') {
  render([
    { label: 'walkers walk (ink, violet step)', bg: 'ink', ground: 'violet', groundRows: 2, frames: frames(walkers, range(0, 16), { mode: 'walk' }) },
    { label: 'walkers hifive since 0', bg: 'ink', ground: 'indigo', groundRows: 2, frames: frames(walkers, range(0, 24), { mode: 'hifive', since: 0 }) },
    { label: 'walkers stand', bg: 'ink', ground: 'night', groundRows: 2, frames: frames(walkers, range(0, 48), { mode: 'stand' }) },
    { label: 'walkers walk on paper', bg: 'paper', frames: frames(walkers, range(0, 8), { mode: 'walk' }) },
    { label: 'walkers stairs 40x32 walk, lifta 4 (alice two steps up)', bg: 'ink', ground: 'violet', groundRows: 1, frames: frames(walkers, range(0, 8), { mode: 'walk', liftA: 4 }, 'stairs') },
    { label: 'walkers stairs hifive, lifta 2', bg: 'ink', ground: 'violet', groundRows: 1, frames: frames(walkers, range(0, 12), { mode: 'hifive', liftA: 2 }, 'stairs') },
  ], 'walkers.png');
}
if (which === 'all' || which === 'walker') {
  render([
    { label: 'qubit-walker walk dir 1 (blue band, cornflower below)', bg: 'blue', ground: 'cornflower', groundRows: 2, frames: frames(qubitWalker, range(0, 16), { mode: 'walk', dir: 1 }) },
    { label: 'qubit-walker walk dir -1', bg: 'blue', ground: 'cornflower', groundRows: 2, frames: frames(qubitWalker, range(0, 16), { mode: 'walk', dir: -1 }) },
    { label: 'qubit-walker precess', bg: 'blue', ground: 'cornflower', groundRows: 2, frames: frames(qubitWalker, range(0, 12), { mode: 'precess', dir: 1 }) },
    { label: 'qubit-walker hop', bg: 'blue', ground: 'cornflower', groundRows: 2, frames: frames(qubitWalker, range(0, 6), { mode: 'hop', dir: 1 }) },
    { label: 'qubit-walker stand (pill, card)', bg: 'card', frames: frames(qubitWalker, range(0, 48), { mode: 'stand' }) },
    { label: 'qubit-walker walk on ink', bg: 'ink', frames: frames(qubitWalker, range(0, 16), { mode: 'walk', dir: 1 }) },
  ], 'qubit-walker.png');
}

// close-ups for critique (big pixels, few frames)
if (which === 'close') {
  const sel = (p: Piece, ticks: number[], io: Partial<PieceIO> = {}, v?: string) => frames(p, ticks, io, v);
  const spec = process.argv[3] ?? 'pair';
  if (spec === 'pair') render([
    { label: 'pair 0-11', bg: 'card', ground: 'blue', groundRows: 1, frames: sel(qubitPair, range(0, 12)) },
    { label: 'pair 12-23', bg: 'card', ground: 'blue', groundRows: 1, frames: sel(qubitPair, range(12, 24)) },
    { label: 'pair 36-47', bg: 'card', ground: 'blue', groundRows: 1, frames: sel(qubitPair, range(36, 48)) },
  ], 'close-pair.png', 8, 220);
  if (spec === 'sm') render([
    { label: 'pair sm 0-11', bg: 'card', ground: 'cornflower', groundRows: 1, frames: sel(qubitPair, range(0, 12), {}, 'sm') },
    { label: 'pair sm 12-23', bg: 'card', ground: 'cornflower', groundRows: 1, frames: sel(qubitPair, range(12, 24), {}, 'sm') },
  ], 'close-pair-sm.png', 10, 160);
  if (spec === 'walk') render([
    { label: 'walkers walk 0-7', bg: 'ink', ground: 'violet', groundRows: 1, frames: sel(walkers, range(0, 8), { mode: 'walk' }) },
    { label: 'walkers hifive 0-11', bg: 'ink', ground: 'indigo', groundRows: 1, frames: sel(walkers, range(0, 12), { mode: 'hifive' }) },
    { label: 'walkers hifive 12-23', bg: 'ink', ground: 'indigo', groundRows: 1, frames: sel(walkers, range(12, 24), { mode: 'hifive' }) },
  ], 'close-walkers.png', 8, 220);
  if (spec === 'walker') render([
    { label: 'walker walk 0-15', bg: 'blue', ground: 'cornflower', groundRows: 1, frames: sel(qubitWalker, range(0, 16), { mode: 'walk' }) },
    { label: 'walker precess', bg: 'blue', ground: 'cornflower', groundRows: 1, frames: sel(qubitWalker, range(0, 12), { mode: 'precess' }) },
    { label: 'walker hop + walk left', bg: 'blue', ground: 'cornflower', groundRows: 1, frames: [...sel(qubitWalker, range(0, 6), { mode: 'hop' }), ...sel(qubitWalker, [0, 2, 4, 6, 8, 10, 12, 14], { mode: 'walk', dir: -1 })] },
  ], 'close-walker.png', 10, 140);
}

if (which === 'faces') {
  const mk = (ps: Array<Partial<import('./creature').Pose>>, who: 'alice' | 'bob' | 'neutral' = 'alice') => ps.map((p, i) => {
    const g = new Grid(14, 16); drawCreature(g, 1, 2, { who, ...p }); return { g, tag: String(i) };
  });
  const faces: Array<Partial<import('./creature').Pose>> = [
    {}, { eyeH: 2 }, { eyeH: 2, blush: 'a' }, { eyeH: 2, mouth: 'smile' }, { eyeH: 2, face: 1 }, { eyeH: 2, face: -1 },
    { eyeH: 2, look: [0, -1] }, { eyes: 'closed' }, { eyeH: 2, body: 'squash' }, { eyeH: 2, body: 'stretch' },
  ];
  render([
    { label: 'alice faces on card', bg: 'card', ground: 'blue', groundRows: 1, frames: mk(faces) },
    { label: 'bob faces on card', bg: 'card', ground: 'blue', groundRows: 1, frames: mk(faces.map((f) => ({ ...f, blush: f.blush ? 'r' : null })), 'bob') },
    { label: 'neutral on blue', bg: 'blue', ground: 'cornflower', groundRows: 1, frames: mk(faces.map((f) => ({ ...f, blush: null })), 'neutral') },
    { label: 'alice on ink', bg: 'ink', ground: 'violet', groundRows: 1, frames: mk(faces) },
    { label: 'bob on ink, feet m', bg: 'ink', ground: 'night', groundRows: 1, frames: mk(faces.map((f) => ({ ...f, foot: 'm', blush: f.blush ? 'r' : null })), 'bob') },
    { label: 'flash', bg: 'card', ground: 'blue', groundRows: 1, frames: [...mk([{ flash: true }, { flash: true, body: 'squash' }]), ...mk([{ flash: true }], 'bob'), ...mk([{ flash: true }], 'neutral')] },
  ], 'faces.png', 8);
}

if (which === 'all' || which === 'posters') {
  const one = (p: Piece, io: Partial<PieceIO> = {}, v?: string) => frames(p, [p.poster], io, v);
  render([
    { label: 'poster pair 20 (card)', bg: 'card', ground: 'blue', groundRows: 1, frames: one(qubitPair) },
    { label: 'poster pair sm 20', bg: 'card', ground: 'cornflower', groundRows: 1, frames: one(qubitPair, {}, 'sm') },
    { label: 'poster walkers stand 2 (ink)', bg: 'ink', ground: 'violet', groundRows: 1, frames: one(walkers) },
    { label: 'poster walker walk 0 (blue)', bg: 'blue', ground: 'cornflower', groundRows: 1, frames: one(qubitWalker) },
    { label: 'walker stand (pill, card)', bg: 'card', frames: frames(qubitWalker, [0], { mode: 'stand' }) },
  ], 'posters.png', 10, 90);
}
