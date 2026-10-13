// Hero · revision 1 §1.1 (amends design-spec §5.1 "Lowered into frame"). Owner: sections-1.
//
// Geometry (one frame, full-bleed; the block stage is the frame's floor):
//   ≥ 1440       lg          [rail 128][text 1fr][fridge cell 384][rail 128], H1 88/88, sphere 16×16
//   1200–1439    lg-narrow   [rail  96][text 1fr][fridge cell 320][rail  96], H1 72/72, sphere 16×16
//   < 1200       stacked     text block, then a 480 px fridge cell (512 below 768) holding the stage; H1 64/64 (3 lines) from 768,
//                            40/44 (4 lines) below; sphere `sm`
// The sphere is the headline's full stop. The rails carry the bands T/C shuffle; the pair and the certificate stand on
// the floor. The text column ends at least M/2 + 16 above the floor.
//
// Intro (revision 1 §1.1 point 5). The final hero is the default state: CSS hides intro elements only under `html.intro`
// (set by the head script when the tab is visible, motion is allowed and not paused). The timeline starts on
// DOMContentLoaded, never from rAF, and a fail-safe lands everything if the text has not started by 1.5 s.
//   0      rail lines fade in (300 ms)
//   100    the fridge lowers (piece intro: lowered at +10 ticks, cool-1…5 at 12–16, ignite at 18)
//   200…   text beats (after ≤ 300 ms of waiting for fonts): H1 lines 200 / 320 / 440 (/ 560), pill 300, lead 560,
//          buttons 700. Delays live in top.css, relative to `is-text` (one offset only).
//   700    blocks enter (bands heroStage.intro(), 700 → ~1700)
//   ~1000  the cooldown readout counts down in the ticker slot; labels appear on the piece's cool-k events
//   ~1600  ignite clears the readout
//   1900   the ticker types (40 ms/char) into its reserved box; the illustrative tag shows from the first character
// Idle: the shuffle (bands), the sphere and fridge loops, a bit dropping from the chip to the floor every 48 ticks.
// The pause switch / reduced motion land the final state at once; everything this file starts stops with them.

import type { SectionCtx } from '../main';
import { clock, getPiece, hasPiece, motion, mountedOf, moveUnits, type Mounted, type TickSub } from '../engine';
import type { HeroStage, HeroStageOpts } from '../art/bands';
import { escapeHTML, strings } from '../content/strings';
import { artExport, hydrate, uiIcon } from './nav';

type HeroStageFn = (root: HTMLElement, opts?: HeroStageOpts) => HeroStage;

/** Intro timeline, ms from the start. Text beats inside the text group are CSS delays (top.css). */
const T = { rails: 0, fridge: 100, text: 200, fontWait: 300, blocks: 700, ticker: 1900, failsafe: 1500, cooldownFallback: 1000 } as const;
const MS_PER_CHAR = 40;

/** Pieces this section mounts; anything not registered falls back to `placeholder` (listed in `missing`). */
const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}
function px(id: string, opts: { variant?: string; cls?: string; attrs?: string } = {}): string {
  const real = pieceId(id);
  const variant = real === id ? opts.variant : 'sm';
  return `<span class="px${opts.cls ? ' ' + opts.cls : ''}" data-piece="${real}"${variant ? ` data-variant="${variant}"` : ''} data-decorative ${opts.attrs ?? ''}></span>`;
}

/* ------------------------------------------------------------------ markup */
/** One visible line set (aria-hidden; the `.vh` copy carries the sentence with its full stop). The last line ends in the
 *  sphere, sitting on the baseline where the period was. `three`: ≥ 768 (16×16 from 1200, `sm` below); `four`: < 768. */
function linesHTML(lines: readonly string[], kind: 'three' | 'four'): string {
  const stop = kind === 'three'
    ? `<span class="hero__stop hero__stop--lg">${px('bloch-inline')}</span><span class="hero__stop hero__stop--sm">${px('bloch-inline', { variant: 'sm' })}</span>`
    : `<span class="hero__stop">${px('bloch-inline', { variant: 'sm' })}</span>`;
  const spans = lines.map((l, i) =>
    `<span class="hero__line" style="--i:${i}"><span class="hero__line-in">${escapeHTML(l)}${i === lines.length - 1 ? stop : ''}</span></span>`);
  return `<span class="hero__lines hero__lines--${kind}" aria-hidden="true">${spans.join('')}</span>`;
}

function h1HTML(): string {
  const t = strings.top;
  return `<h1 class="display hero__h1"><span class="vh">${escapeHTML(t.h1)}</span>${linesHTML(t.h1Lines.three, 'three')}${linesHTML(t.h1Lines.four, 'four')}</h1>`;
}

function pillHTML(): string {
  const p = strings.top.pill;
  return `<div class="hero__pillwrap hero__rise">` +
    `<a class="pill hero__pill" data-hop="step" href="${escapeHTML(p.href)}">` +
      `<span class="pill__tile">${px('tc-glyph', { variant: 'sm' })}</span>` +
      `<span class="pill__label">${escapeHTML(p.label)}</span>` +
      `<span class="pill__label pill__label--short">${escapeHTML(p.labelShort)}</span>` +
      `<span class="btn__icon">${uiIcon('ui-chevron', 4)}</span>` +
    `</a></div>`;
}

function btnsHTML(): string {
  const c = strings.top.ctas;
  return `<div class="btn-row hero__btns hero__rise">` +
    `<a class="btn btn--primary" data-hop="step" href="${escapeHTML(c.primary.href)}"><span class="btn__label">${escapeHTML(c.primary.label)}</span><span class="btn__icon">${uiIcon('ui-chevron', 4)}</span></a>` +
    `<a class="btn btn--outline" data-hop="out" href="${escapeHTML(c.secondary.href)}"><span class="btn__label">${escapeHTML(c.secondary.label)}</span><span class="btn__icon">${uiIcon('ui-external-sm', 4)}</span></a>` +
    `</div>`;
}

/** The ticker: segments split on " · " (each `nowrap`, so it wraps only at the separators) and the last word as one
 *  inline-block that also reserves the cursor's slot. Every character is its own span, laid out from the first frame:
 *  typing only toggles visibility, so nothing reflows or moves (no CLS), and the block cursor is a class on the next
 *  character's cell (terminal style) or on the end slot. */
interface ChunkDef { text: string; kind: 'seg' | 'sep' | 'last' }
function tickerChunks(text: string): ChunkDef[] {
  const segs = text.split(' · ');
  const out: ChunkDef[] = [];
  segs.forEach((s, i) => {
    if (i) out.push({ text: ' · ', kind: 'sep' });
    if (i < segs.length - 1) { out.push({ text: s, kind: 'seg' }); return; }
    const cut = s.lastIndexOf(' ');
    if (cut > 0) { out.push({ text: s.slice(0, cut), kind: 'seg' }); out.push({ text: ' ', kind: 'sep' }); out.push({ text: s.slice(cut + 1), kind: 'last' }); }
    else out.push({ text: s, kind: 'last' });
  });
  return out;
}
function tickerHTML(): string {
  const text = strings.top.ticker.text;
  const chunks = tickerChunks(text).map((c) =>
    `<span class="hero__tk hero__tk--${c.kind}">${[...c.text].map((ch) => `<span class="hero__ch">${escapeHTML(ch)}</span>`).join('')}` +
    `${c.kind === 'last' ? '<span class="hero__ch hero__ch--end"></span>' : ''}</span>`).join('');
  const tag = strings.top.ticker.illustrative ? `<span class="tag-illustrative hero__tag">${escapeHTML(strings.common.illustrative)}</span>` : '';
  return `<p class="mono t-soft hero__ticker"><span class="vh">${escapeHTML(text)}</span>` +
    `<span class="hero__tk-typed" aria-hidden="true">${chunks}</span>${tag}` +
    `<span class="hero__readout" aria-hidden="true"></span></p>`;
}

function labelsHTML(rows: readonly number[], plateLeft: readonly number[]): string {
  return `<ul class="hero__labels" role="list" aria-hidden="true">${strings.top.fridgeLabels.map((l, i) =>
    `<li class="hero__label" style="--row:${rows[i] ?? 22 + 16 * i};--pl:${plateLeft[i] ?? 6}"><span class="hero__label-text">${escapeHTML(l)}</span><i class="hero__leader"></i></li>`).join('')}</ul>`;
}

function stripHTML(): string {
  const s = strings.top.strip;
  const cells = s.cells.map((c) =>
    `<a class="cell cell--link focus-inset hero-strip__cite" data-hop="out" href="${escapeHTML(c.href)}">` +
    `<span class="mono hero-strip__name">${escapeHTML(c.name)}</span><span class="micro t-muted hero-strip__venue">${escapeHTML(c.venue)}</span>` +
    `<span class="hero-strip__glyph">${uiIcon('ui-external', 4)}</span></a>`).join('');
  return `<div class="cells cells--flush hero-strip"><div class="cell cell--paper hero-strip__label"><p class="h5">${escapeHTML(s.label)}</p></div>${cells}</div>`;
}

function render(root: HTMLElement, rows: readonly number[], plateLeft: readonly number[]): void {
  const t = strings.top;
  root.innerHTML =
    `<div class="hero">` +
      `<div class="hero__rail hero__rail--l" aria-hidden="true"></div>` +
      `<div class="hero__text"><div class="hero__copy">` +
        pillHTML() + h1HTML() +
        `<p class="lead hero__lead hero__rise">${escapeHTML(t.lead)}</p>` +
        btnsHTML() + tickerHTML() +
      `</div></div>` +
      `<div class="hero__cell">` +
        `<figure class="hero__fig" role="img" aria-label="${escapeHTML(t.alt.fridge)}">${px('fridge-hero', { cls: 'hero__fridge', attrs: 'data-io-intro="-2"' })}</figure>` +
        labelsHTML(rows, plateLeft) +
        `<i class="hero__bit" hidden></i><i class="hero__spark" hidden></i>` +
      `</div>` +
      `<div class="hero__rail hero__rail--r" aria-hidden="true"></div>` +
      `<div class="hero__stage" aria-hidden="true"></div>` +
    `</div>` +
    stripHTML();
}

/* ------------------------------------------------------------------ the ticker */
interface Ticker { clear(): void; type(): void; finish(): void; readonly typing: boolean }
function makeTicker(p: HTMLElement): Ticker {
  const cells = [...p.querySelectorAll<HTMLElement>('.hero__ch')];      // characters, then the end slot
  const total = cells.length - 1;
  let shown = total, caret: HTMLElement | null = null;
  let unsub: (() => void) | null = null;
  const show = (n: number) => {
    if (n !== shown) {
      for (let i = Math.min(n, shown); i < Math.max(n, shown); i++) cells[i].classList.toggle('is-off', i >= n);
      shown = n;
    }
    const c = cells[Math.min(n, total)];
    if (caret !== c) { caret?.classList.remove('is-caret'); c.classList.add('is-caret'); caret = c; }
  };
  const stop = () => { unsub?.(); unsub = null; };
  show(total);
  return {
    get typing() { return unsub !== null; },
    clear() { stop(); show(0); p.classList.remove('is-typing', 'is-typed', 'is-still'); p.classList.add('is-waiting'); },
    type() {
      if (unsub || !p.classList.contains('is-waiting')) return;
      p.classList.remove('is-waiting');
      p.classList.add('is-typing');                  // the illustrative tag shows with the first character
      show(1);
      let elapsed = 0;
      unsub = clock.add({
        kind: 'frame',
        onFrame(_n, dt) {
          elapsed += dt;
          const n = Math.min(total, 1 + Math.floor(elapsed / MS_PER_CHAR));
          show(n);
          if (n >= total) { stop(); p.classList.remove('is-typing'); p.classList.add('is-typed'); }   // CSS: hold 2 s, blink 3×
        },
      });
    },
    finish() { stop(); show(total); p.classList.remove('is-waiting', 'is-typing'); p.classList.add('is-typed', 'is-still'); },
  };
}

/* ------------------------------------------------------------------ whole-px placement
   Vertical centring and text widths put sprites on fractional pixels (qa-pixel #15). The `translate` property (never
   `transform`, which the rise reveals use) moves the text group and each sphere by its sub-pixel remainder. */
function snapper(root: HTMLElement): () => void {
  const read = (el: HTMLElement) => {
    const [x = '0', y = '0'] = (el.style.translate || '0 0').split(' ');
    return [parseFloat(x) || 0, parseFloat(y) || 0];
  };
  const set = (el: HTMLElement, dx: number, dy: number) => {
    const v = Math.abs(dx) < 0.005 && Math.abs(dy) < 0.005 ? '' : `${dx.toFixed(3)}px ${dy.toFixed(3)}px`;
    if (el.style.translate !== v) el.style.translate = v;
  };
  return () => {
    const copy = root.querySelector<HTMLElement>('.hero__copy');
    if (copy && copy.getClientRects().length) {
      const [ox, oy] = read(copy);
      const r = copy.getBoundingClientRect();
      const x = r.left - ox, y = r.top + window.scrollY - oy;
      set(copy, Math.round(x) - x, Math.round(y) - y);
    }
    for (const stop of root.querySelectorAll<HTMLElement>('.hero__stop')) {
      const sprite = stop.querySelector<HTMLElement>('.px');
      const lineIn = stop.closest<HTMLElement>('.hero__line-in');
      const line = lineIn?.parentElement;
      if (!sprite || !lineIn || !line || !sprite.getClientRects().length) continue;
      const [ox, oy] = read(stop);
      const s = sprite.getBoundingClientRect(), li = lineIn.getBoundingClientRect(), mask = line.getBoundingClientRect();
      // the rise translates the line's inner box: measure from the (untransformed) mask, plus the inner box's layout
      // offset (offsetTop ignores transforms), so the result is the rest position at any moment of the rise
      const x = s.left - ox;
      const y = mask.top + (lineIn.offsetTop - line.offsetTop) + (s.top - li.top) + window.scrollY - oy;
      set(stop, Math.round(x) - x, Math.round(y) - y);
    }
  };
}

/* ------------------------------------------------------------------ the dropped bit
   On `bit-exit` the azure pixel leaves the canvas bottom; it keeps falling (2 art px per tick) as a 4×4 HTML pixel to
   the floor line (the stage bottom) and sparks for 2 ticks. Stops with the pause switch. */
function bitDrop(cell: HTMLElement, fridgeEl: HTMLElement, fridge: Mounted, stageEl: HTMLElement): () => void {
  const bit = cell.querySelector<HTMLElement>('.hero__bit')!;
  const spark = cell.querySelector<HTMLElement>('.hero__spark')!;
  const bitX = Number(fridge.piece.exports?.bitX ?? 28);
  let sub: TickSub | null = null, sparkSub: TickSub | null = null;
  const stop = () => {
    if (sub) { clock.remove(sub); sub = null; }
    if (sparkSub) { clock.remove(sparkSub); sparkSub = null; }
    bit.hidden = true; spark.hidden = true;
  };
  const offExit = fridge.on('bit-exit', () => {
    if (motion.reduced || !fridge.playing) return;
    stop();
    const cr = cell.getBoundingClientRect(), fr = fridgeEl.getBoundingClientRect();
    const floor = stageEl.getBoundingClientRect().bottom;
    if (fr.bottom >= floor - 8) return;                    // the canvas reaches the floor (stacked): nothing to continue
    const left = Math.round(fr.left - cr.left) + bitX * 4;
    const top = Math.round(fr.bottom - cr.top);
    const yMax = Math.floor((floor - fr.bottom) / 4) * 4 - 4; // land standing on the floor line
    bit.style.left = `${left}px`; bit.style.top = `${top}px`;
    moveUnits(bit, 0, 0);
    bit.hidden = false;
    let u = 0;
    sub = { kind: 'tick', onTick() {
      u += 2;
      if (u * 4 >= yMax) {
        if (sub) { clock.remove(sub); sub = null; }
        bit.hidden = true;
        spark.style.left = `${left - 4}px`; spark.style.top = `${top + yMax - 8}px`;
        spark.classList.remove('is-2'); spark.hidden = false;
        let n = 0;
        sparkSub = { kind: 'tick', onTick() { n++; if (n === 1) spark.classList.add('is-2'); else stop(); } };
        clock.add(sparkSub);
        return;
      }
      moveUnits(bit, 0, u);
    } };
    clock.add(sub);
  });
  const offMotion = motion.onChange((r) => { if (r) stop(); });
  return () => { stop(); offExit(); offMotion(); };
}

/* ------------------------------------------------------------------ mount */
export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  const html = document.documentElement;
  const intro = html.classList.contains('intro') && !document.hidden && !motion.reduced;
  const exp = hasPiece('fridge-hero') ? (getPiece('fridge-hero').exports ?? {}) : {};
  const rows = (exp.labelRows as readonly number[] | undefined) ?? [22, 40, 58, 74, 88];
  const plateLeft = (exp.plateLeft as readonly number[] | undefined) ?? [6, 9, 12, 15, 18];
  render(root, rows, plateLeft);
  try { wire(root, intro); }
  catch (e) { html.classList.remove('intro'); throw e; }       // never leave the hero hidden: without html.intro it is final
}

function wire(root: HTMLElement, intro: boolean): void {
  hydrate(root);

  const fridgeEl = root.querySelector<HTMLElement>('.hero__fridge')!;
  const fridge = mountedOf(fridgeEl)!;
  const isFridge = fridge.piece.id === 'fridge-hero';
  const cell = root.querySelector<HTMLElement>('.hero__cell')!;
  const stageEl = root.querySelector<HTMLElement>('.hero__stage')!;
  const labels = [...root.querySelectorAll<HTMLElement>('.hero__label')];
  const tickerEl = root.querySelector<HTMLElement>('.hero__ticker')!;
  const readoutEl = root.querySelector<HTMLElement>('.hero__readout')!;
  const rises = [...root.querySelectorAll<HTMLElement>('.hero__rise')];
  const ticker = makeTicker(tickerEl);
  const marks: Record<string, number> = { mount: performance.now() };

  /* ---- the block stage: one root (the frame at lg / lg-narrow, the fridge cell's box when stacked, by CSS); bands
     rebuilds itself across 1200 / 1440 */
  const makeStage = artExport<HeroStageFn>('bands', 'heroStage', 'diamond');   // `diamond` = the bands folder is registered
  if (!makeStage && !missing.includes('bands')) missing.push('bands');
  if (intro) root.classList.add('is-pre-intro');
  const stage: HeroStage | null = makeStage ? makeStage(stageEl, { intro }) : null;

  /* ---- rise reveals land on their own transitionend (the clip comes off only when the rise is complete) */
  for (const el of rises) {
    el.addEventListener('transitionend', (e) => { if (e.target === el && e.propertyName === 'transform') el.classList.add('is-landed'); });
  }

  /* ---- whole-px placement: now, when fonts swap in, and on any size change */
  const snap = snapper(root);
  let snapRaf = 0;
  const snapSoon = () => { cancelAnimationFrame(snapRaf); snapRaf = requestAnimationFrame(snap); };
  snap();
  document.fonts?.ready?.then(snapSoon);
  document.fonts?.addEventListener?.('loadingdone', snapSoon);
  if (typeof ResizeObserver === 'function') new ResizeObserver(snapSoon).observe(root.querySelector('.hero')!);

  /* ---- the intro timeline */
  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)); };
  let started = false, done = false;
  const readout = (i: number) => {
    if (done || ticker.typing || !tickerEl.classList.contains('is-waiting')) return;
    readoutEl.textContent = strings.top.cooldown[i] ?? '';
    tickerEl.classList.toggle('is-readout', readoutEl.textContent !== '');
  };
  const clearReadout = () => { readoutEl.textContent = ''; tickerEl.classList.remove('is-readout'); };
  const showLabel = (k: number) => labels[k]?.classList.add('in');

  if (isFridge) {
    fridge.on('lowered', () => readout(0));
    for (let k = 1; k <= 5; k++) fridge.on(`cool-${k}`, () => { showLabel(k - 1); readout(k); });
    fridge.on('ignite', () => { clearReadout(); marks.ignite = performance.now(); });
  }

  /** Everything at its final state now; idle loops run (or the posters, under reduced motion / pause). Idempotent. */
  const finishStatic = () => {
    timers.splice(0).forEach(clearTimeout);
    const wasDone = done;
    done = true;
    root.classList.remove('is-pre-intro');
    if (!wasDone) root.classList.add('is-static');
    root.classList.add('is-go', 'is-text');
    rises.forEach((el) => el.classList.add('is-landed'));
    labels.forEach((l) => l.classList.add('in'));
    clearReadout();
    ticker.finish();
    if (isFridge && (motion.reduced || (fridge.io.intro as number) < 0)) fridge.set('intro', -1);
    if (!wasDone) stage?.finish();
    if (!marks.final) marks.final = performance.now();
  };

  const textGo = () => {
    if (done || root.classList.contains('is-text')) return;
    root.classList.add('is-text');
    marks.text = performance.now();
  };

  const start = () => {
    if (started) return;
    started = true;
    marks.start = performance.now();
    if (done || document.hidden || motion.reduced) { finishStatic(); return; }
    let fontsIn = !document.fonts || document.fonts.status === 'loaded';
    document.fonts?.ready?.then(() => { fontsIn = true; if (performance.now() - marks.start >= T.text) textGo(); });
    at(T.rails, () => root.classList.add('is-go'));
    at(T.fridge, () => { if (isFridge) fridge.set('intro', fridge.localTick); else labels.forEach((l) => l.classList.add('in')); });
    at(T.text, () => { if (fontsIn) textGo(); });
    at(T.fontWait, textGo);                                   // never wait more than 300 ms for the fonts
    at(T.blocks, () => { root.classList.remove('is-pre-intro'); void stage?.intro(); });
    at(T.ticker, () => { clearReadout(); ticker.type(); marks.ticker = performance.now(); });
    at(T.failsafe, () => { if (!root.classList.contains('is-text')) finishStatic(); });
    if (!isFridge) {
      at(T.cooldownFallback, () => { readout(0); labels.forEach((l) => l.classList.add('in')); });
      at(T.cooldownFallback + 500, clearReadout);
    }
    // the typing ends ~ 1900 + 40 × length; the intro is over then
    at(T.ticker + MS_PER_CHAR * strings.top.ticker.text.length + 400, () => { done = true; marks.done = performance.now(); });
  };

  if (!intro) finishStatic();
  else {
    ticker.clear();
    // the timeline starts on DOMContentLoaded (this module runs just before it); the timeout covers a late mount
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else queueMicrotask(start);
    setTimeout(start, 50);
  }

  motion.onChange((reduced) => { if (reduced) finishStatic(); });

  if (isFridge) bitDrop(cell, fridgeEl, fridge, stageEl);

  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, {
    top: { missing: [...missing], stage, fridge, intro, marks, finishStatic, snap },
  });
}
