// The piece harness. engine-spec §9. preview.html?piece=<id>&variant=&bg=paper|ink|blue|card&zoom=1|2|4&tick=&play=0|1
//   &mode=&hover=1&click=&progress=&<input>=<value>&sheet=1&grid=1&rm=1   ·   piece=all   ·   piece=bands-stage

import '../engine/engine.css';
import '../art/registry';
import {
  allMounts, allPieces, clock, font3x5, frameCount, frameTick, getPiece, Grid, hasPiece, motion, mount, mountAll,
  periodOf, sizeOf, UNIT, defaultIO, type Mounted, type Piece,
} from '../engine';
import { demoStage } from './demo-stage';

const q = new URLSearchParams(location.search);
const stage = document.getElementById('stage')!;
const target = document.getElementById('target') as HTMLElement;
const info = document.getElementById('info')!;
const bg = q.get('bg') ?? 'paper';
stage.dataset.bg = bg;
if (q.get('rm') === '1') motion.force(true);
motion.init();

declare global { interface Window { __bp: Record<string, unknown> } }
window.__bp = { clock, motion, allMounts, allPieces, getPiece, mounts: () => allMounts() };

const RESERVED = new Set(['piece', 'variant', 'bg', 'zoom', 'tick', 'play', 'sheet', 'grid', 'rm', 'hover', 'focus', 'click', 'progress', 'mode']);

function esc(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function renderIndex(): void {
  const grid = document.createElement('div');
  grid.id = 'all';
  stage.classList.add('index');
  stage.replaceChildren(grid);
  for (const p of allPieces()) {
    const a = document.createElement('a');
    a.href = `?piece=${p.id}&bg=${bg}`;
    const holder = document.createElement('span');
    a.append(holder);
    const label = document.createElement('small');
    label.textContent = `${p.id} · ${p.size[0]}×${p.size[1]} · ${periodOf(p)}t`;
    a.append(label);
    grid.append(a);
    mount(holder, p.id, { decorative: true });
  }
  info.innerHTML = `<h1>all pieces (${allPieces().length})</h1><p>Posters shown; each animates when visible. Click one to open it.</p><p><a href="?piece=bands-stage">bands-stage demo</a></p>`;
}

function renderSheet(piece: Piece, variant?: string): void {
  const [w, h] = sizeOf(piece, variant);
  const n = frameCount(piece);
  const maxFrames = 144;
  const stride = Math.max(1, Math.ceil(n / maxFrames));
  const frames: number[] = [];
  for (let f = 0; f < n; f += stride) frames.push(f);
  const cols = Math.ceil(Math.sqrt(frames.length));
  const rows = Math.ceil(frames.length / cols);
  const cellW = w + 4, cellH = h + 4 + 7;
  const sheet = new Grid(cols * cellW, rows * cellH);
  const paperBg = bg !== 'ink';
  sheet.rect(0, 0, sheet.w, sheet.h, paperBg ? 'p' : 'k');
  const io = defaultIO(piece);
  const g = new Grid(w, h);
  const t0 = performance.now();
  frames.forEach((f, i) => {
    const tick = frameTick(piece, f);
    const x = (i % cols) * cellW + 2, y = Math.floor(i / cols) * cellH + 2;
    g.clear(); piece.frame(tick, g, io, variant);
    sheet.blit(g, x, y);
    if (tick === piece.poster) sheet.rect(x - 1, y - 1, w + 2, h + 2, 'a', false);
    sheet.text(font3x5, String(tick), x, y + h + 1, paperBg ? 'm' : 'l');
  });
  const genMs = performance.now() - t0;
  const strip = new Grid(frames.length * (w + 1), h);
  frames.forEach((f, i) => { g.clear(); piece.frame(frameTick(piece, f), g, io, variant); strip.blit(g, i * (w + 1), 0); });
  const wrap = document.createElement('div');
  wrap.id = 'sheetwrap';
  const c1 = document.createElement('canvas'); c1.id = 'sheet';
  const c2 = document.createElement('canvas'); c2.id = 'strip';
  wrap.append(c1, c2);
  stage.replaceChildren(wrap);
  blitGrid(c1, sheet, 4);
  blitGrid(c2, strip, 1);
  info.innerHTML = `<h1>${esc(piece.id)} · sheet</h1><dl><dt>frames</dt><dd>${frames.length} of ${n}${stride > 1 ? ` (every ${stride})` : ''}</dd><dt>size</dt><dd>${w}×${h}</dd><dt>poster</dt><dd>tick ${piece.poster} (boxed azure)</dd><dt>gen</dt><dd>${genMs.toFixed(1)} ms total</dd></dl><p>Top: 4× with tick labels. Bottom: 1× strip.</p>`;
}

function blitGrid(canvas: HTMLCanvasElement, g: Grid, scale: number): void {
  const src = document.createElement('canvas');
  src.width = g.w; src.height = g.h;
  src.getContext('2d')!.putImageData(g.toImageData(), 0, 0);
  const dpr = devicePixelRatio || 1;
  const s = Math.max(1, Math.round(scale * dpr));
  canvas.width = g.w * s; canvas.height = g.h * s;
  canvas.style.width = `${(g.w * s) / dpr}px`; canvas.style.height = `${(g.h * s) / dpr}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, g.w, g.h, 0, 0, canvas.width, canvas.height);
}

function renderPiece(id: string): void {
  const piece = getPiece(id);
  const variant = q.get('variant') || undefined;
  if (q.get('sheet') === '1') { renderSheet(piece, variant); return; }
  const zoom = Math.max(1, Math.min(4, Number(q.get('zoom') ?? 1) | 0));
  const inputs: Record<string, unknown> = {};
  for (const [k, v] of q.entries()) {
    if (RESERVED.has(k) && !['hover', 'focus', 'click', 'progress', 'mode'].includes(k)) continue;
    if (k === 'hover' || k === 'focus') inputs[k] = v === '1' || v === 'true';
    else if (k === 'click' || k === 'progress') inputs[k] = Number(v);
    else inputs[k] = v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(Number(v)) ? Number(v) : v;
  }
  const tickParam = q.get('tick');
  const autoplay = q.get('play') !== '0' && tickParam === null;
  const m = mount(target, id, { variant, inputs, autoplay, unit: UNIT * zoom });
  if (tickParam !== null) m.seek(Number(tickParam));
  if (q.get('grid') === '1') target.classList.add('grid');
  // real interaction
  target.addEventListener('pointerenter', () => m.set('hover', true));
  target.addEventListener('pointerleave', () => m.set('hover', false));
  target.addEventListener('click', () => m.set('click', (m.io.click as number) + 1));
  target.tabIndex = 0;
  target.addEventListener('focus', () => m.set('focus', true));
  target.addEventListener('blur', () => m.set('focus', false));

  const [w, h] = sizeOf(piece, variant);
  const dl = (rows: Array<[string, string]>) => `<dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const staticInfo = dl([
    ['id', esc(piece.id)], ['size', `${w}×${h}${variant ? ` (${variant})` : ''} → ${w * UNIT * zoom}×${h * UNIT * zoom} css px`],
    ['variants', esc(Object.keys(piece.variants ?? {}).join(', ') || '—')],
    ['tpf / loop', `${piece.ticksPerFrame} / ${piece.loopTicks}`], ['period', String(periodOf(piece))],
    ['poster', String(piece.poster)], ['cache', piece.cache], ['colours', `≤ ${piece.maxColours}: ${esc(piece.palette.join(' '))}`],
    ['inputs', esc(Object.entries(piece.inputs ?? {}).map(([k, d]) => `${k}:${d.type}=${String(d.default)}`).join(', ') || '—')],
    ['modes', esc(piece.modes?.join(', ') ?? '—')], ['alt', esc(piece.alt || '(decorative)')],
    ['dpr', String(devicePixelRatio)], ['device px/art px', String(Math.round(UNIT * zoom * devicePixelRatio))],
  ]);
  const live = document.createElement('div');
  const links = `<p><a href="?piece=all">all</a> · <a href="?piece=${id}&sheet=1&bg=${bg}">sheet</a> · <a href="?piece=${id}&bg=${bg === 'ink' ? 'paper' : 'ink'}">on ${bg === 'ink' ? 'paper' : 'ink'}</a> · <a href="?piece=${id}&zoom=4&grid=1&bg=${bg}">4× grid</a> · <a href="?piece=${id}&rm=1&bg=${bg}">reduced</a></p>`;
  const controls = `<div class="controls"><button id="b-play">play</button><button id="b-stop">stop</button><button id="b-step">step</button><button id="b-poster">poster</button></div>`;
  info.innerHTML = `<h1>${esc(piece.id)}</h1>${staticInfo}${links}${controls}`;
  info.append(live);
  document.getElementById('b-play')!.onclick = () => m.play();
  document.getElementById('b-stop')!.onclick = () => m.stop();
  document.getElementById('b-step')!.onclick = () => { m.stop(); m.seek(m.localTick + piece.ticksPerFrame); };
  document.getElementById('b-poster')!.onclick = () => { m.stop(); m.seek(piece.poster); };
  let lastDraw = 0;
  const update = () => {
    const t0 = performance.now();
    const st = m.state();
    lastDraw = performance.now() - t0;
    live.innerHTML = dl([
      ['clock', `${clock.tick()} (${clock.running ? 'running' : 'idle'}, ${clock.size} subs)`], ['local tick', String(m.localTick)],
      ['frame', String(Math.floor(((m.localTick % periodOf(piece)) + periodOf(piece)) % periodOf(piece) / piece.ticksPerFrame))],
      ['state', esc(st ?? '—')], ['io', esc(JSON.stringify(m.io))],
      ['cache', `${Math.round(((m as Mounted & { cacheProgress?: number }).cacheProgress ?? 1) * 100)}%`],
      ['state() ms', lastDraw.toFixed(3)], ['motion', motion.reduced ? 'reduced' : 'full'],
    ]);
  };
  update();
  setInterval(update, 250);
}

const id = q.get('piece') ?? 'all';
if (id === 'all') renderIndex();
else if (id === 'bands-stage') demoStage(stage, info);
else if (!hasPiece(id)) { info.innerHTML = `<h1>unknown piece "${esc(id)}"</h1><p><a href="?piece=all">see all</a></p>`; }
else renderPiece(id);

// any [data-piece] placed by the demo stage
mountAll(document);
