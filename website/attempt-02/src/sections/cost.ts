// Cost · design-spec §5.4 as amended by revision-1 §1.3. Owner: sections-1.
// A. six glitch cells (one glitch per hover / focus)
// B. the cascade: five bars on a linear scale (48/96/144/192/240 at lg; horizontal bars below 768), the alert connector
//    and `cascade-coin` riding it, driven by the piece's pure `cascadeAt`
// C. three stats counting up from their `from` values (each set to its start value before its stagger), the sources line
//    and the closing statement.
// (The FP/FN cells and the history strip are cut in revision 1.)
// Every subscriber here stops on `motion.onChange` (reduced motion or the user's pause switch) and shows its end state.

import type { SectionCtx } from '../main';
import { clock, hasPiece, motion, mountedOf, moveUnits, observe, TICK_MS, type FrameSub, type Mounted } from '../engine';
import { escapeHTML, richHTML, strings } from '../content/strings';
import { hydrate } from './nav';

const SM = '(max-width: 767.98px)';

const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}

function render(root: HTMLElement): void {
  const c = strings.cost;
  // reveals sit on the cells' children (a clipped cell would expose the grid's hairline fill as a grey slab)
  const cells = c.cells.map((it, i) => { const r = ` data-reveal="${i + 1}"`; return (
    `<div class="cell cost__cell">` +
      `<span class="cost__ico"${r}><span class="px" data-piece="${pieceId(it.piece)}" data-decorative></span></span>` +
      `<div class="cost__txt"${r}><h3 class="h4">${escapeHTML(it.title)}</h3> <p class="body cell__body">${escapeHTML(it.body)}</p></div>` +
    `</div>`); }).join('');

  // number first in the DOM (it reads "1 Quantum job …"); CSS draws it inside the bar
  const bars = c.cascade.bars.map((b, i) =>
    `<li class="cost__col cost__col--${i + 1}" style="--n:${i + 1}">` +
      `<span class="micro cost__n">${escapeHTML(b.n)}</span> ` +
      `<span class="cost__label"><span class="h5 cost__title">${escapeHTML(b.title)}</span> <span class="small cost__what">${escapeHTML(b.body)}</span></span>` +
      `<span class="cost__bar" aria-hidden="true"></span>` +
    `</li>`).join('');

  const stats = c.stats.items.map((s, i) =>
    `<div class="cell cost__stat">` +
      `<p class="num-xl cost__num" data-reveal="${i + 1}"><span class="vh">${escapeHTML(s.value)}</span>` +
        `<span class="cost__count" aria-hidden="true" data-prefix="${escapeHTML(s.count.prefix)}" data-from="${s.count.from}" data-to="${s.count.to}" data-decimals="${s.count.decimals}" data-suffix="${escapeHTML(s.count.suffix)}">${countHTML(s.count.prefix, s.count.to.toFixed(s.count.decimals), s.count.suffix)}</span></p> ` +
      `<p class="body cell__body cost__caption" data-reveal="${i + 1}">${escapeHTML(s.caption)}</p></div>`).join('');

  root.innerHTML =
    `<div class="wrap cost">` +
      // A
      `<header class="cost__head">` +
        `<p class="eyebrow" data-reveal="1">${escapeHTML(c.eyebrow)}</p>` +
        `<h2 class="h2 measure-h2 cost__h2" data-reveal="2">${escapeHTML(c.h2)}</h2>` +
        `<p class="lead measure-lead cost__lead" data-reveal="3">${escapeHTML(c.lead)}</p>` +
      `</header>` +
      `<div class="cells cells--3 cost__cells">${cells}</div>` +
      // B
      `<div class="cost__beat cost__cascade">` +
        `<h3 class="h3 cost__h3" data-reveal="1">${escapeHTML(c.cascade.h3)}</h3>` +
        `<p class="cost__sub" data-reveal="2"><span class="chip-example">${escapeHTML(strings.common.runningExample)}</span> ` +
          `<span class="body t-soft cost__body">${escapeHTML(c.cascade.body)}</span></p>` +
        `<div class="cost__stairs">` +
          `<ol class="cost__bars" role="list">${bars}</ol>` +
          `<div class="cost__lane">` +
            `<figure class="cost__coin-fig" role="img" aria-label="${escapeHTML(c.alt.cascadeCoin)}"><span class="px cost__coin" data-piece="${pieceId('cascade-coin')}" data-decorative></span></figure>` +
          `</div>` +
          `<p class="cost__connector"><span class="mono cost__conn-l">${escapeHTML(c.cascade.connector.left)}</span> <span class="mono cost__conn-r">${escapeHTML(c.cascade.connector.right)}</span></p>` +
        `</div>` +
      `</div>` +
      // C
      `<div class="cost__beat cost__statbeat">` +
        `<div class="cells cost__stats">${stats}</div>` +
        `<p class="small t-soft cost__sources">${escapeHTML(c.stats.sources)}</p>` +
        `<p class="h3 measure-h2 cost__closing" data-reveal="1">${richHTML(c.stats.closing)}</p>` +
      `</div>` +
    `</div>`;
}

/** "10–15 years": the prefix and the number never break apart. A word unit (a suffix after a space, " years") is set at
 *  half size like a unit label, so the stat holds one line at lg; attached symbols ("B", "%") stay full size. */
function countHTML(prefix: string, num: string, suffix: string): string {
  const unit = suffix.startsWith(' ') ? ` <span class="cost__unit">${escapeHTML(suffix.slice(1))}</span>` : escapeHTML(suffix);
  return `<span class="cost__nowrap">${escapeHTML(prefix)}${num}</span>${unit}`;
}

/* ------------------------------------------------------------------ A · glitch on hover */
function glitches(root: HTMLElement): void {
  const touch = matchMedia('(hover: none)').matches;
  root.querySelectorAll<HTMLElement>('.cost__cell').forEach((cell) => {
    const el = cell.querySelector<HTMLElement>('[data-piece]');
    const m = el && mountedOf(el);
    if (!m || !m.piece.id.startsWith('glitch-')) return;
    const bind = m.piece.exports?.bindGlitch as ((m: Mounted, el: HTMLElement) => void) | undefined;
    if (bind) bind(m, cell);
    if (touch && 'idle' in (m.piece.inputs ?? {})) m.set('idle', true);
  });
}

/* ------------------------------------------------------------------ B · the cascade conveyor */
type CascadeFrame = { x: number; inputs: Record<string, unknown> };
type CascadeAt = (t: number, o: { gap: number | number[] }) => CascadeFrame;

function cascade(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>('.cost__coin')!;
  const lane = root.querySelector<HTMLElement>('.cost__lane')!;
  const bars = [...root.querySelectorAll<HTMLElement>('.cost__bar')];
  const m = mountedOf(el);
  if (!m || m.piece.id !== 'cascade-coin') return;
  const cascadeAt = m.piece.exports?.cascadeAt as CascadeAt | undefined;
  if (!cascadeAt) return;
  const smq = matchMedia(SM);

  let gaps: number[] = [64, 64, 64, 64];
  const measure = () => {
    const lr = lane.getBoundingClientRect();
    const centres = bars.map((b) => { const r = b.getBoundingClientRect(); return r.left + r.width / 2 - lr.left; });
    // at x = 0 the 128-px canvas is centred under bar 1; the gaps between bar centres in whole art units
    el.style.left = `${Math.round((centres[0] - 64) / 4) * 4}px`;
    gaps = centres.slice(1).map((c, i) => Math.max(1, Math.round((c - centres[i]) / 4)));
  };

  let t = 0;
  const sub: FrameSub = { kind: 'frame', onFrame(_n, dt) {
    t += dt / TICK_MS;
    const f = cascadeAt(t, { gap: gaps });
    moveUnits(el, f.x, 0);
    for (const [k, v] of Object.entries(f.inputs)) m.set(k, v);
  } };
  let running = false, visible = false;
  const stop = () => { if (running) { clock.remove(sub); running = false; } };
  const apply = () => {
    if (smq.matches) {                       // the horizontal bar chart: the coin plays its story in place
      stop();
      el.style.left = '';
      moveUnits(el, 0, 0);
      m.set('mode', 'story');
      return;
    }
    m.set('mode', 'drive');
    measure();
    if (motion.reduced) {                    // end state: the tall tower under "Clinical trials"
      stop();
      moveUnits(el, gaps.reduce((a, b) => a + b, 0), 0);
      m.set('fade', 4); m.set('wobble', false); m.set('belt', false); m.set('travel', -1); m.set('age', 99); m.set('stack', 5);
      return;
    }
    if (visible && !running) { clock.add(sub); running = true; }
    else if (!visible) stop();
  };
  // observe the LANE, not the piece's span (the mount's own registration on the span drives its tick clock)
  observe(lane, { play() { visible = true; apply(); }, stop() { visible = false; apply(); } });
  motion.onChange(apply);
  smq.addEventListener('change', apply);
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (!smq.matches) { measure(); if (motion.reduced) apply(); } }).observe(lane);
  apply();
}

/* ------------------------------------------------------------------ C · count-ups
   Each counter shows its start value from the first paint (never the final value first, never "10–1 years"), then counts
   from → to over 600 ms (ease-out cubic), staggered 120 ms, once, when the row is mostly on screen. */
function counts(root: HTMLElement): void {
  const row = root.querySelector<HTMLElement>('.cost__stats')!;
  const items = [...root.querySelectorAll<HTMLElement>('.cost__count')].map((el) => {
    const d = el.dataset;
    return { el, prefix: d.prefix ?? '', suffix: d.suffix ?? '', from: Number(d.from) || 0, to: Number(d.to), decimals: Number(d.decimals) || 0 };
  }).filter((it) => Number.isFinite(it.to));
  const show = (it: (typeof items)[number], v: number) => {
    const html = countHTML(it.prefix, v.toFixed(it.decimals), it.suffix);
    if (it.el.innerHTML !== html) it.el.innerHTML = html;
  };
  const finish = () => { stop(); items.forEach((it) => show(it, it.to)); done = true; };

  let done = false, elapsed = 0, running = false;
  const MS = 600, STAGGER = 120;
  const sub: FrameSub = { kind: 'frame', onFrame(_n, dt) {
    elapsed += dt;
    let all = true;
    items.forEach((it, i) => {
      const p = Math.min(1, Math.max(0, (elapsed - i * STAGGER) / MS));
      if (p < 1) all = false;
      const e = 1 - Math.pow(1 - p, 3);
      show(it, p >= 1 ? it.to : it.from + (it.to - it.from) * e);
    });
    if (all) { stop(); done = true; }
  } };
  const stop = () => { if (running) { clock.remove(sub); running = false; } };

  if (motion.reduced || typeof IntersectionObserver !== 'function') { finish(); return; }
  items.forEach((it) => show(it, it.from));
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    if (done || motion.reduced) return;
    elapsed = 0;
    clock.add(sub); running = true;
  }, { threshold: 0.6 });
  io.observe(row);
  motion.onChange(() => { if (motion.reduced && !done) { io.disconnect(); finish(); } });
}

/* ------------------------------------------------------------------ whole-px sprites (qa-pixel #15) */
function snapPx(root: HTMLElement): void {
  // the coin is placed by `left` (whole px from the lane) + moveUnits; only the grid-placed icons need the remainder
  const els = [...root.querySelectorAll<HTMLElement>('.cost__ico > .px[data-piece]')].filter((el) => el.getClientRects().length);
  const fixes = els.map((el) => {
    const [sx, sy] = (el.style.translate || '0px 0px').split(' ').map((v) => parseFloat(v) || 0);
    const r = el.getBoundingClientRect();
    const x = r.left - sx, y = r.top - (sy ?? 0);
    return [el, Math.round(x) - x, Math.round(y) - y] as const;
  });
  for (const [el, dx, dy] of fixes) {
    const v = Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 ? '' : `${dx.toFixed(3)}px ${dy.toFixed(3)}px`;
    if (el.style.translate !== v) el.style.translate = v;
  }
}
function watchSnap(root: HTMLElement): void {
  let raf = 0;
  const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => snapPx(root)); };
  run();
  document.fonts?.ready.then(run);
  if (typeof ResizeObserver === 'function') new ResizeObserver(run).observe(root);
  root.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') run(); });
}

export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  render(root);
  hydrate(root);
  glitches(root);
  cascade(root);
  counts(root);
  watchSnap(root);
  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, { cost: { missing: [...missing] } });
}
