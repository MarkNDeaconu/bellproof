// Cost · design-spec §5.4. Owner: sections-1.
// A. six glitch cells (one glitch per hover)  B. the cascade: staircase bars, the alert connector and `cascade-coin`
//    riding it (driven by the piece's pure `cascadeAt`), FP/FN cells  C. stats with count-ups + sources
// D. history + sources. Four beats separated by hairlines.

import type { SectionCtx } from '../main';
import { clock, countUp, hasPiece, motion, mountedOf, moveUnits, observe, TICK_MS, type FrameSub, type Mounted } from '../engine';
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
  const cells = c.cells.map((it, i) =>
    `<div class="cell cost__cell" data-reveal="${(i % 3) + 1}">` +
      `<span class="cost__ico"><span class="px" data-piece="${pieceId(it.piece)}" data-decorative></span></span>` +
      `<h4 class="h4">${escapeHTML(it.title)}</h4><p class="body cell__body">${escapeHTML(it.body)}</p></div>`).join('');

  const bars = c.cascade.bars.map((b, i) =>
    `<div class="cell cost__bar cost__bar--${i + 1}" style="--n:${i + 1}">` +
      `<span class="micro cost__bar-n">${escapeHTML(b.n)}</span>` +
      `<p class="h5">${escapeHTML(b.title)}</p>` +
      `<p class="small cost__bar-body">${escapeHTML(b.body)}</p>` +
    `</div>`).join('');

  const errors = c.cascade.errors.map((e, i) =>
    `<div class="cell cost__err" data-reveal="${i + 1}"><span class="tag tag--alert">${escapeHTML(e.tag)}</span><h4 class="h4">${escapeHTML(e.title)}</h4><p class="body cell__body">${escapeHTML(e.body)}</p></div>`).join('');

  const stats = c.stats.items.map((s, i) =>
    `<div class="cell cost__stat" data-reveal="${i + 1}">` +
      `<p class="num-xl cost__num"><span class="cost__count" aria-hidden="true" data-prefix="${escapeHTML(s.count.prefix)}" data-to="${s.count.to}" data-decimals="${s.count.decimals}" data-suffix="${escapeHTML(s.count.suffix)}">${escapeHTML(s.value)}</span><span class="vh">${escapeHTML(s.value)}</span></p>` +
      `<p class="body cell__body cell__foot">${escapeHTML(s.caption)}</p></div>`).join('');

  const history = c.history.items.map((h, i) =>
    `<div class="cell cost__hist" data-reveal="${i + 1}">` +
      `<p class="num-xl">${escapeHTML(h.year)}</p><p class="h5">${escapeHTML(h.who)}</p>` +
      `<p class="mono t-alert">${escapeHTML(h.line)}</p><p class="body cell__body">${escapeHTML(h.body)}</p></div>`).join('');

  root.innerHTML =
    `<div class="wrap cost">` +
      // A
      `<header class="cost__head">` +
        `<p class="eyebrow" data-reveal="1">${escapeHTML(c.eyebrow)}</p>` +
        `<h2 class="h2 measure-h2" data-reveal="2">${escapeHTML(c.h2)}</h2>` +
        `<p class="lead measure-lead cost__lead" data-reveal="3">${escapeHTML(c.lead)}</p>` +
      `</header>` +
      `<div class="cells cells--3 cost__cells">${cells}</div>` +
      // B
      `<div class="cost__beat cost__cascade">` +
        `<span class="chip-example">${escapeHTML(strings.common.runningExample)}</span>` +
        `<h3 class="h3 measure-h2 cost__h3" data-reveal="1">${escapeHTML(c.cascade.h3)}</h3>` +
        `<p class="body t-soft measure-lead cost__body" data-reveal="2">${escapeHTML(c.cascade.body)}</p>` +
        `<div class="cost__stairs">` +
          `<div class="cells cells--open cost__bars">${bars}</div>` +
          `<div class="cost__lane">` +
            `<figure class="cost__coin-fig" role="img" aria-label="${escapeHTML(c.alt.cascadeCoin)}"><span class="px cost__coin" data-piece="${pieceId('cascade-coin')}" data-decorative></span></figure>` +
          `</div>` +
          `<div class="cost__connector"><span class="mono cost__conn-l">${escapeHTML(c.cascade.connector.left)}</span><span class="mono cost__conn-r">${escapeHTML(c.cascade.connector.right)}</span></div>` +
        `</div>` +
        `<div class="cells cells--2 cost__errors">${errors}</div>` +
      `</div>` +
      // C
      `<div class="cost__beat">` +
        `<div class="cells cells--3 cost__stats">${stats}</div>` +
        `<p class="small t-soft cost__sources">${escapeHTML(c.stats.sources)}</p>` +
        `<h3 class="h3 measure-h2 cost__closing" data-reveal="1">${richHTML(c.stats.closing)}</h3>` +
      `</div>` +
      // D
      `<div class="cost__beat">` +
        `<h3 class="h3 measure-h2" data-reveal="1">${escapeHTML(c.history.h3)}</h3>` +
        `<div class="cells cells--3 cost__history">${history}</div>` +
        `<p class="small t-soft cost__sources">${escapeHTML(c.history.sources)}</p>` +
        `<h3 class="h3 measure-h2 cost__closing" data-reveal="1">${richHTML(c.history.closing)}</h3>` +
      `</div>` +
    `</div>`;
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
    // at x = 0 the canvas (128 wide) is centred under bar 1; gaps between bar centres in whole art units
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
  const apply = () => {
    if (smq.matches) {                       // the horizontal bar chart: the coin plays its story in place
      if (running) { clock.remove(sub); running = false; }
      moveUnits(el, 0, 0);
      m.set('mode', 'story');
      return;
    }
    m.set('mode', 'drive');
    measure();
    if (motion.reduced) {                    // end state: the tall tower under "Clinical trials"
      if (running) { clock.remove(sub); running = false; }
      moveUnits(el, gaps.reduce((a, b) => a + b, 0), 0);
      m.set('fade', 4); m.set('wobble', false); m.set('belt', false); m.set('age', 99); m.set('stack', 5);
      return;
    }
    const want = visible;
    if (want && !running) { clock.add(sub); running = true; }
    else if (!want && running) { clock.remove(sub); running = false; }
  };
  // observe the LANE, not the piece's span (visibility keys by element; the mount's own registration must stay)
  observe(lane, { play() { visible = true; apply(); }, stop() { visible = false; apply(); } });
  motion.onChange(apply);
  smq.addEventListener('change', apply);
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (!smq.matches) measure(); }).observe(lane);
  apply();
}

/* ------------------------------------------------------------------ C · count-ups */
function counts(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.cost__count').forEach((el) => {
    const { prefix = '', suffix = '' } = el.dataset;
    const to = Number(el.dataset.to), decimals = Number(el.dataset.decimals) || 0;
    if (!Number.isFinite(to)) return;
    countUp(el, to, { ms: 600, format: (v) => `${prefix}${v.toFixed(decimals)}${suffix}` });
  });
}

export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  render(root);
  hydrate(root);
  glitches(root);
  cascade(root);
  counts(root);
  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, { cost: { missing: [...missing] } });
}
