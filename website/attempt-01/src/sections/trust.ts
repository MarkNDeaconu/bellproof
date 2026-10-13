// Trust · design-spec §5.2. Owner: sections-1.
// A. the statement with six tag chips hung on strings (chips drift ±4 px on their own loops, draggable at lg with a
//    spring back; strings recomputed each frame while visible)  B. four cells (check-scale + three icons)
// C. the closing line  D. the running-example chip + line.

import type { SectionCtx } from '../main';
import { clock, ease, hasPiece, motion, moveUnits, observe, tween, type FrameSub } from '../engine';
import { escapeHTML, richHTML, strings } from '../content/strings';
import { hydrate } from './nav';

const LG = '(min-width: 1024px)';
const SM = '(max-width: 767.98px)';

/** Chip home positions (% of the statement area, chip centre) and drift periods (s), design §5.2 A. */
const HOMES: Array<[number, number]> = [[14, 18], [82, 14], [8, 62], [88, 58], [24, 90], [74, 92]];
const PERIODS = [6.2, 7.1, 8.3, 9.1, 6.7, 7.9];

const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}
function px(id: string, fallbackVariant?: string): string {
  const real = pieceId(id);
  const v = real === id ? '' : fallbackVariant ? ` data-variant="${fallbackVariant}"` : '';
  return `<span class="px" data-piece="${real}"${v} data-decorative></span>`;
}

function render(root: HTMLElement): void {
  const t = strings.trust;
  const chips = t.tags.map((tag, i) =>
    `<li class="trust__chip" style="--hx:${HOMES[i][0]}%;--hy:${HOMES[i][1]}%" data-i="${i}">` +
      `<span class="trust__chip-ico">${px(tag.piece, 'sm')}</span><span class="h5 trust__chip-label">${escapeHTML(tag.label)}</span>` +
      `<i class="trust__knot trust__knot--l"></i><i class="trust__knot trust__knot--r"></i></li>`).join('');
  const cells = t.cells.map((c, i) =>
    `<div class="cell trust__cell" data-reveal="${i + 1}">` +
      `<span class="trust__cell-ico${i === 0 ? ' trust__cell-ico--scale' : ''}">${px(c.piece, i === 0 ? 'wide' : undefined)}</span>` +
      `<h4 class="h4">${escapeHTML(c.title)}</h4><p class="body cell__body">${escapeHTML(c.body)}</p>` +
      `<span class="tag cell__foot">${escapeHTML(c.tag)}</span></div>`).join('');
  root.innerHTML =
    `<div class="wrap trust">` +
      `<div class="trust__stage">` +
        `<svg class="trust__strings" aria-hidden="true"></svg>` +
        `<header class="trust__head">` +
          `<p class="eyebrow" data-reveal="1">${escapeHTML(t.eyebrow)}</p>` +
          `<h2 class="h2 trust__h2" data-reveal="2">${escapeHTML(t.h2)}</h2>` +
          `<p class="lead trust__lead" data-reveal="3">${escapeHTML(t.lead)}</p>` +
        `</header>` +
        `<ul class="trust__chips" role="list">${chips}</ul>` +
      `</div>` +
      `<div class="cells cells--4 trust__cells">${cells}</div>` +
      `<h3 class="h3 center trust__closing" data-reveal="1">${richHTML(t.closing)}</h3>` +
      `<p class="trust__example" data-reveal="2"><span class="chip-example">${escapeHTML(strings.common.runningExample)}</span><span class="body t-soft">${escapeHTML(t.example.text)}</span></p>` +
    `</div>`;
}

/* ------------------------------------------------------------------ chips, drift, drag, strings */
interface Chip { el: HTMLElement; i: number; home: [number, number]; dx: number; dy: number; drag: [number, number] | null; spring: { stop(): void } | null; sx: number; sy: number }

function setupChips(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('.trust__stage')!;
  const head = root.querySelector<HTMLElement>('.trust__head')!;
  const svg = root.querySelector<SVGSVGElement>('.trust__strings')!;
  const chips: Chip[] = [...root.querySelectorAll<HTMLElement>('.trust__chip')].map((el, i) => ({ el, i, home: HOMES[i], dx: 0, dy: 0, drag: null, spring: null, sx: 0, sy: 0 }));
  const lg = matchMedia(LG), sm = matchMedia(SM);
  const NS = 'http://www.w3.org/2000/svg';

  const place = (c: Chip) => moveUnits(c.el, (c.dx + c.sx) / 4, (c.dy + c.sy) / 4);

  /* strings: from each chip's inner knot to the nearest of 4 knots on the headline block; from its outer knot to the page edge */
  let lastKey = '';
  const draw = () => {
    if (sm.matches) { if (lastKey !== 'off') { svg.replaceChildren(); lastKey = 'off'; } return; }
    const sr = stage.getBoundingClientRect(), hr = head.getBoundingClientRect();
    const pageW = document.documentElement.clientWidth;
    const ox = sr.left;                                  // svg spans the viewport width, positioned from the stage left
    svg.style.left = `${-ox}px`; svg.style.width = `${pageW}px`;
    const H = sr.height;
    svg.setAttribute('viewBox', `0 0 ${pageW} ${H}`);
    svg.setAttribute('width', String(pageW)); svg.setAttribute('height', String(H));
    const knots: Array<[number, number]> = [
      [hr.left - sr.left + ox, hr.top - sr.top + hr.height / 2],
      [hr.right - sr.left + ox, hr.top - sr.top + hr.height / 2],
      [hr.left - sr.left + ox + hr.width * 0.3, hr.bottom - sr.top],
      [hr.left - sr.left + ox + hr.width * 0.7, hr.bottom - sr.top],
    ].map(([x, y]) => [Math.round(x), Math.round(y)]);
    let key = '';
    let d = '';
    const dots: string[] = knots.map(([x, y]) => `<rect x="${x - 2}" y="${y - 2}" width="4" height="4"/>`);
    for (const c of chips) {
      const r = c.el.getBoundingClientRect();
      const cy = Math.round(r.top - sr.top + r.height / 2);
      const left = Math.round(r.left - sr.left + ox), right = Math.round(r.right - sr.left + ox);
      const innerIsRight = (r.left + r.width / 2 - sr.left) < sr.width / 2;
      const inner: [number, number] = [innerIsRight ? right : left, cy];
      const outer: [number, number] = [innerIsRight ? left : right, cy];
      let best = knots[0], bd = Infinity;
      for (const k of knots) { const dd = (k[0] - inner[0]) ** 2 + (k[1] - inner[1]) ** 2; if (dd < bd) { bd = dd; best = k; } }
      d += `M${inner[0]} ${inner[1]}L${best[0]} ${best[1]}M${outer[0]} ${outer[1]}L${innerIsRight ? 0 : pageW} ${cy}`;
      key += `${left},${cy};`;
    }
    key += knots.join('|');
    if (key === lastKey) return;
    lastKey = key;
    svg.innerHTML = `<path d="${d}" fill="none" stroke="var(--hairline)" stroke-width="1" shape-rendering="crispEdges"/><g fill="var(--dot)">${dots.join('')}</g>`;
    void NS;
  };

  /* drift: each chip bobs on its own period; positions rounded to 4 px (steps of a sprite) */
  let t = 0;
  const sub: FrameSub = { kind: 'frame', onFrame(_n, dt) {
    t += dt / 1000;
    if (!sm.matches) {
      for (const c of chips) {
        if (c.drag || c.spring) continue;
        const w = (2 * Math.PI) / PERIODS[c.i];
        c.dx = Math.round(4 * Math.sin(w * 0.73 * t + c.i * 1.7) / 4) * 4;
        c.dy = Math.round(4 * Math.sin(w * t + c.i * 2.1) / 4) * 4;
        place(c);
      }
    }
    draw();
  } };
  let running = false, visible = false;
  const sync = () => {
    const want = visible && !motion.reduced;
    if (want && !running) { clock.add(sub); running = true; }
    else if (!want && running) { clock.remove(sub); running = false; draw(); }
  };
  observe(stage, { play() { visible = true; sync(); }, stop() { visible = false; sync(); } });
  motion.onChange(() => { if (motion.reduced) chips.forEach((c) => { c.spring?.stop(); c.spring = null; c.dx = c.dy = c.sx = c.sy = 0; place(c); }); sync(); draw(); });

  /* rise in on enter (300 ms, stagger 70) */
  const un = observe(stage, { play() { stage.classList.add('is-in'); un(); }, stop() {} });
  if (motion.reduced) stage.classList.add('is-in');

  /* drag (lg only): pointer moves snapped to 4 px; release → spring home over 600 ms backOut */
  for (const c of chips) {
    c.el.addEventListener('pointerdown', (e) => {
      if (!lg.matches || e.button !== 0) return;
      c.spring?.stop(); c.spring = null;
      c.drag = [e.clientX - c.sx, e.clientY - c.sy];
      c.el.setPointerCapture(e.pointerId);
      c.el.classList.add('is-drag');
      e.preventDefault();
    });
    c.el.addEventListener('pointermove', (e) => {
      if (!c.drag) return;
      c.sx = Math.round((e.clientX - c.drag[0]) / 4) * 4;
      c.sy = Math.round((e.clientY - c.drag[1]) / 4) * 4;
      place(c);
      if (!running) draw();
    });
    const release = () => {
      if (!c.drag) return;
      c.drag = null;
      c.el.classList.remove('is-drag');
      const fx = c.sx, fy = c.sy;
      if (motion.reduced) { c.sx = c.sy = 0; place(c); draw(); return; }
      c.spring = tween({ from: 1, to: 0, ms: 600, ease: ease.backOut(1.7), onUpdate: (v) => { c.sx = Math.round(fx * v / 4) * 4; c.sy = Math.round(fy * v / 4) * 4; place(c); if (!running) draw(); }, onDone: () => { c.spring = null; c.sx = c.sy = 0; place(c); } });
    };
    c.el.addEventListener('pointerup', release);
    c.el.addEventListener('pointercancel', release);
  }

  if (typeof ResizeObserver === 'function') new ResizeObserver(() => draw()).observe(stage);
  requestAnimationFrame(draw);
  if (document.fonts?.ready) document.fonts.ready.then(() => draw());
}

export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  render(root);
  hydrate(root);
  setupChips(root);
  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, { trust: { missing: [...missing] } });
}
