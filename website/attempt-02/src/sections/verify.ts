// Section 8 · How we verify · `#verify` (design-spec §5.8, revision-1 §1.4). Owner: sections-3.
//
//   head        centred eyebrow, h2, lead
//   figure bar  a `.cells` row of 3 numbered tabs (01 / 02 / 03), sticky under the nav at ≥ 1200, role=tablist with
//               arrow keys; the active one (the row holding the viewport centre) gets a 4 px ink top bar
//   rows        copy left (5/12) | figure right (7/12) at ≥ 1200; copy, then figure, below. Each figure is a paper cell
//               holding a hairline frame with corner dots, the sprite on a card plate, and a FIG. caption. An extras
//               strip closes rows 2 and 3 (and row 1's notes); row 1's stat pair sits in its copy column.
//   #research   h3, lead, five ledger rows (year · authors/title/gives · venue · arXiv link cell)
//
// Sizing is measured: each row picks the largest integer sprite unit (4, 3, 2) whose plate fits; the panel padding
// shrinks (24 → 8) before the unit does, so tc-rounds keeps U = 4 at ≥ 1200. Plates and sprites are snapped to whole
// CSS pixels after layout. Pieces: magic-square, wall-to-lock, tc-rounds (sizes read from the registry).
// Motion: state polling joins the clock only while a figure is in view and leaves it on pause / reduced motion.
//
// Shared sections-3 helpers (icon, button, textLink, chip, observeOnce, snap) are exported for guarantees.ts / cta.ts.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import {
  clock, getPiece, hasPiece, motion, mount as mountPieceInto, mountedOf, observe, sizeOf, type Mounted, type TickSub,
} from '../engine';
import { escapeHTML as esc, isExternal, type Link, type ResearchItem } from '../content/strings';

type S = SectionCtx['strings'];

/* ================================================================== shared helpers (sections-3) */

/** A pixel UI glyph placeholder; hydrate() swaps it for the inline SVG (or the fallback glyph). */
export const icon = (id: string, size = 4): string => `<i data-icon="${id}" data-size="${size}"></i>`;

/** The outbound glyph: the 5×5 ↗ (same weight as the chevron) when art-icons ships it, else the 7×7 bracket one. */
export const extGlyph = (): string => (hasPiece('ui-external-sm') ? 'ui-external-sm' : 'ui-external');

/** A design §4.2 button. External and placeholder-external hrefs take the ↗ glyph, the rest the chevron. */
export function button(l: Link, variant: string, cls = ''): string {
  const glyph = isExternal(l.href) ? extGlyph() : 'ui-chevron';
  return `<a class="btn btn--${variant}${cls ? ' ' + cls : ''}" href="${esc(l.href)}"><span class="btn__label">${esc(l.label)}</span><span class="btn__icon">${icon(glyph)}</span></a>`;
}

/** A text link with a trailing pixel glyph (→ in page, ↗ outbound) that takes the two-tick pixel step on hover. */
export function textLink(l: Link, cls = ''): string {
  const glyph = isExternal(l.href) ? extGlyph() : 'ui-arrow';
  return `<a class="s3-link h6${cls ? ' ' + cls : ''}" href="${esc(l.href)}"><span class="s3-link__label">${esc(l.label)}</span><span class="s3-link__icon">${icon(glyph, 2)}</span></a>`;
}

export const chip = (s: S): string => `<span class="chip-example">${esc(s.common.runningExample)}</span>`;

/** Run `fn` once when `el` is at least `ratio` visible (own observer: never shares the engine's element map). */
export function observeOnce(el: Element, ratio: number, fn: () => void): void {
  if (typeof IntersectionObserver !== 'function') { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= ratio)) { io.disconnect(); fn(); }
  }, { threshold: [0, ratio] });
  io.observe(el);
}

/** Nudge `el` (a wrapper around a sprite) onto whole CSS pixels: grid fractions and centring can leave it at .5. */
export function snap(el: HTMLElement): void {
  el.style.translate = '';
  const r = el.getBoundingClientRect();
  const dx = Math.round(r.left) - r.left;
  const y = r.top + window.scrollY;
  const dy = Math.round(y) - y;
  if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) el.style.translate = `${dx}px ${dy}px`;
}

/** Snap every match under `root` now, after web fonts settle, and whenever `root` resizes. */
export function snapAll(root: HTMLElement, selector: string): () => void {
  const run = () => root.querySelectorAll<HTMLElement>(selector).forEach(snap);
  run();
  document.fonts?.ready.then(run).catch(() => {});
  let raf = 0;
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; run(); }); }).observe(root);
  }
  return run;
}

/* ================================================================== feature rows */

type RowKey = 'games' | 'compiler' | 'rounds';
interface RowDef { key: RowKey; piece: string; fallback: [number, number]; labelH: number }
const ROWS: RowDef[] = [
  { key: 'games', piece: 'magic-square', fallback: [96, 64], labelH: 0 },
  { key: 'compiler', piece: 'wall-to-lock', fallback: [96, 48], labelH: 28 },
  { key: 'rounds', piece: 'tc-rounds', fallback: [128, 40], labelH: 48 },
];

const PLATE_PAD = 16;     // the card plate's padding around the sprite
const FRAME_X_MIN = 8;    // minimum frame padding beside the plate
const FRAME_X = 16;       // preferred frame padding beside the plate
const PANEL_MIN = 8, PANEL_MAX = 24;   // the paper cell's padding around the frame
const COPY_MIN = 300;     // narrowest copy column beside a figure
const GAP = 40;           // copy ↔ figure gap
const LG = '(min-width: 1200px)';
const SM = '(max-width: 767.98px)';

interface RowCtl {
  def: RowDef;
  size: [number, number];
  el: HTMLElement;
  panel: HTMLElement;
  plate: HTMLElement;
  art: HTMLElement;
  unit: number;
  mode: '' | 'split' | 'stack';
  read(): string | undefined;      // what the row reacts to (default: the piece's state())
  react(state: string | undefined): void;
  lastState: string | undefined;
  tick: TickSub | null;
}

function rowHTML(s: S, def: RowDef, i: number): string {
  const v = s.verify.rows;
  const r = v[def.key];
  let copy = '';
  let strip = '';
  let plate = '<div class="frow__art"></div>';
  let after = '';
  if (def.key === 'games') {
    const g = v.games;
    copy = `
      <h3 class="h3" data-reveal="1">${esc(g.h3)}</h3>
      <p class="frow__body" data-reveal="2">${esc(g.body)}</p>
      <div class="cells frow__stats" data-reveal="3">
        <div class="cell frow__stat"><p class="num-xl">${esc(g.stats[0].value)}</p><p class="frow__cap">${esc(g.stats[0].caption)}</p></div>
        <div class="cell frow__stat on-blue"><p class="num-xl">${esc(g.stats[1].value)}</p><p class="frow__cap">${esc(g.stats[1].caption)}</p></div>
      </div>`;
    strip = `<div class="frow__extras frow__minis">
        <div class="frow__mini"><h4 class="h5">${esc(g.explainer.title)}</h4><p class="frow__cap">${esc(g.explainer.body)}</p></div>
        <div class="frow__mini"><p class="eyebrow">${esc(g.rigidity.eyebrow)}</p><p class="frow__cap">${esc(g.rigidity.body)}</p></div>
      </div>`;
    // the readout's final "1" turns blue while the players are in their `win` state
    const t = g.readout, k = t.lastIndexOf('1');
    after = `<p class="frow__readout mono">${esc(t.slice(0, k))}<span class="frow__one">${esc(t.slice(k))}</span></p>`;
  } else if (def.key === 'compiler') {
    const c = v.compiler;
    copy = `
      <h3 class="h3" data-reveal="1">${esc(c.h3)}</h3>
      <p class="frow__body" data-reveal="2">${esc(c.body)}</p>`;
    strip = `<div class="frow__extras frow__minis">
        ${c.cells.map((m) => `<div class="frow__mini"><p class="eyebrow">${esc(m.eyebrow)}</p><p class="frow__cap">${esc(m.body)}</p></div>`).join('')}
      </div>`;
    plate += `<p class="frow__label frow__label--swap"><span class="frow__phys">${esc(c.labels.physical)}</span><span class="frow__crypto">${esc(c.labels.cryptographic)}</span></p>`;
  } else {
    const t = v.rounds;
    const verdict = s.guarantees.certificate.rows.find((x) => x.key === 'verdict')?.value ?? '';
    const tone = ['is-test', 'is-compute', 'is-verdict'];
    copy = `
      <p class="frow__chip" data-reveal="1">${chip(s)}</p>
      <h3 class="h3" data-reveal="1">${esc(t.h3)}</h3>
      <p class="frow__body" data-reveal="2">${esc(t.body)}</p>`;
    strip = `<div class="frow__extras cells frow__cards">
        ${t.cards.map((c, j) => `<div class="cell frow__card ${tone[j]}"><h4 class="h5">${esc(c.title)}</h4><p class="frow__cap">${esc(c.body)}</p></div>`).join('')}
      </div>`;
    plate = `<div class="frow__lrow frow__lrow--top"><span class="frow__label">${esc(t.labels.schedule)}</span><span class="frow__stamp"><span class="frow__stamp-ok">${esc(verdict)}</span><span class="frow__stamp-no">${esc(t.labels.rejected)}</span></span></div>
      ${plate}
      <div class="frow__lrow frow__lrow--bot"><span class="frow__label">${esc(t.labels.provider)}</span><span class="frow__meter mono">${esc(t.labels.meter)}</span></div>`;
  }
  const cta = def.key === 'games' ? textLink(r.cta) : button(r.cta, 'outline');
  return `<div class="frow frow--${def.key}" id="${esc(r.id)}" role="tabpanel" aria-labelledby="vfig-${i + 1}">
      <div class="frow__copy">${copy}</div>
      <div class="frow__cta">${cta}</div>
      <div class="frow__panel">
        <figure class="frow__frame" role="img" aria-label="${esc(r.alt)}">
          <i class="dot" style="--x:0;--y:0"></i><i class="dot" style="--x:100%;--y:0"></i><i class="dot" style="--x:0;--y:100%"></i><i class="dot" style="--x:100%;--y:100%"></i>
          <div class="frow__plate">${plate}</div>
          <figcaption class="frow__fig">${esc(r.fig)}</figcaption>
        </figure>${after}
      </div>
      ${strip}
    </div>`;
}

/* ------------------------------------------------------------------ measuring and mounting */

function plateW(ctl: RowCtl, u: number): number { return ctl.size[0] * u + 2 * PLATE_PAD; }

interface Plan { mode: 'split' | 'stack'; unit: number; panelW: number | null; avail: number }

function plan(ctl: RowCtl): Plan {
  const lg = matchMedia(LG).matches, sm = matchMedia(SM).matches;
  const pad = parseFloat(getComputedStyle(ctl.el).paddingLeft) || 0;
  const inner = ctl.el.clientWidth - 2 * pad;
  const stackAvail = sm ? inner + 2 * pad : inner;     // sm: the paper cell bleeds to the row's lines
  const need = (u: number) => plateW(ctl, u) + 2 + 2 * FRAME_X_MIN + 2 * PANEL_MIN;
  for (const u of [4, 3, 2]) {
    if (lg) {
      const seven = Math.floor(((inner - GAP) * 7) / 12);
      const w = Math.max(seven, need(u));
      if (inner - GAP - w >= COPY_MIN) return { mode: 'split', unit: u, panelW: w, avail: w };
    }
    if (need(u) <= stackAvail) return { mode: 'stack', unit: u, panelW: null, avail: stackAvail };
  }
  return { mode: 'stack', unit: 2, panelW: null, avail: stackAvail };
}

function mountPiece(ctl: RowCtl, unit: number): void {
  ctl.art.firstElementChild && mountedOf(ctl.art.firstElementChild)?.destroy();
  const def = ctl.def;
  const real = hasPiece(def.piece);
  ctl.art.style.setProperty('--aw', `${ctl.size[0] * unit}px`);
  ctl.art.style.setProperty('--ah', `${ctl.size[1] * unit}px`);
  const span = document.createElement('span');
  ctl.art.replaceChildren(span);
  // the figure carries the alt (strings); the canvas itself is decorative
  mountPieceInto(span, real ? def.piece : 'placeholder', { unit, variant: real ? undefined : 'wide', decorative: true });
  ctl.el.dataset.art = real ? def.piece : 'placeholder';
  ctl.lastState = ctl.read();
  ctl.react(ctl.lastState);
}

function layout(ctls: RowCtl[], root: HTMLElement): void {
  const plans = ctls.map(plan);
  // one panel padding for the whole section: the tightest row decides (24 → 8), so frames line up row to row
  let panelPad = PANEL_MAX;
  plans.forEach((p, i) => {
    const slack = p.avail - 2 - plateW(ctls[i], p.unit);
    panelPad = Math.min(panelPad, Math.max(PANEL_MIN, Math.floor((slack - 2 * FRAME_X) / 2)));
  });
  root.style.setProperty('--panel-pad', `${panelPad}px`);
  plans.forEach((p, i) => {
    const ctl = ctls[i];
    if (p.mode !== ctl.mode) {
      ctl.el.classList.toggle('is-split', p.mode === 'split');
      ctl.el.classList.toggle('is-stack', p.mode === 'stack');
      ctl.mode = p.mode;
    }
    if (p.panelW) ctl.el.style.setProperty('--panel-w', `${p.panelW}px`);
    else ctl.el.style.removeProperty('--panel-w');
    ctl.el.style.setProperty('--u', `${p.unit}px`);
    if (p.unit !== ctl.unit) { ctl.unit = p.unit; mountPiece(ctl, p.unit); }
  });
  ctls.forEach((c) => snap(c.plate));
}

/** The row's live mount, read from the DOM (the bundler must not constant-fold a property set elsewhere). */
function current(ctl: RowCtl): Mounted | undefined {
  const el = ctl.art.firstElementChild;
  return el ? mountedOf(el) : undefined;
}

/** While the figure is near the viewport and motion runs, poll the piece once per sprite tick; react to changes. */
function watchState(ctl: RowCtl): void {
  const poll = () => {
    const st = ctl.read();
    if (st !== ctl.lastState) { ctl.lastState = st; ctl.react(st); }
  };
  let visible = false;
  const start = () => { if (!ctl.tick && visible && !motion.reduced) { ctl.tick = { kind: 'tick', onTick: poll }; clock.add(ctl.tick); } };
  const halt = () => { if (ctl.tick) { clock.remove(ctl.tick); ctl.tick = null; } };
  // integrator R2: observe the art container (the mount's own box), not the whole panel: the panel's caption area entered
  // the 200 px margin first and kept a 12 fps poll alive while the piece itself was stopped (nothing on screen changed)
  observe(ctl.art, { play() { visible = true; start(); }, stop() { visible = false; halt(); } });
  // pause / reduced motion: leave the clock now; the mount shows its poster, so read it once; resume restarts polling
  motion.onChange((reduced) => { if (reduced) halt(); else start(); requestAnimationFrame(poll); });
}

/* ------------------------------------------------------------------ the figure bar (tablist + scroll-spy) */

function bindFigureBar(root: HTMLElement, rows: HTMLElement[]): void {
  const tabs = [...root.querySelectorAll<HTMLAnchorElement>('.v-fig')];
  let current = -1;
  let lockUntil = 0;
  const setActive = (i: number) => {
    if (i === current || i < 0) return;
    current = i;
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i));
      t.tabIndex = j === i ? 0 : -1;
    });
  };
  setActive(0);
  // the row holding the viewport's centre line is active; a passive scroll listener, attached only near the rows
  const spy = () => {
    if (performance.now() < lockUntil) return;
    const mid = innerHeight / 2;
    let i = 0;
    rows.forEach((r, j) => { if (r.getBoundingClientRect().top <= mid) i = j; });
    setActive(i);
  };
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; spy(); }); };
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { addEventListener('scroll', onScroll, { passive: true }); spy(); }
      else removeEventListener('scroll', onScroll);
    }, { rootMargin: '100% 0px' }).observe(rows[0].parentElement!);
  } else addEventListener('scroll', onScroll, { passive: true });
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    setActive(i);
    lockUntil = performance.now() + (motion.reduced ? 0 : 900);   // ignore the spy during the smooth scroll
  }));
  root.querySelector('.v-figs')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    const i = tabs.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    if (ev.key === ' ') { ev.preventDefault(); tabs[i].click(); return; }
    const next = ({ ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[ev.key];
    if (next === undefined) return;
    ev.preventDefault();
    const n = (next + tabs.length) % tabs.length;
    tabs.forEach((t, j) => { t.tabIndex = j === n ? 0 : -1; });
    tabs[n].focus();
  });
}

/* ------------------------------------------------------------------ research list */

function researchRow(it: ResearchItem, linkLabel: string): string {
  return `<li class="cells research__row" data-reveal="${Math.min(it.n, 5)}">
      <div class="cell research__year"><span class="num-l">${esc(it.year)}</span></div>
      <div class="cell research__main">
        <p class="research__authors">${esc(it.authors)}</p>
        <h4 class="h5 research__title">${esc(it.title)}</h4>
        <p class="small research__gives">${esc(it.gives)}</p>
      </div>
      <div class="cell research__venue"><span class="mono">${esc(it.venue)}</span></div>
      <a class="cell cell--link research__link" href="${esc(it.url)}"><span class="mono">${esc(linkLabel)}<span class="vh">: ${esc(it.title)}</span></span><span class="research__glyph">${icon(extGlyph())}</span></a>
    </li>`;
}

/* ================================================================== mount */

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const s = ctx.strings;
  const v = s.verify;
  root.innerHTML = `
    <div class="wrap v-head">
      <p class="eyebrow" data-reveal="1">${esc(v.eyebrow)}</p>
      <h2 class="h2" id="verify-h2" data-reveal="2">${esc(v.h2)}</h2>
      <p class="lead" data-reveal="3">${esc(v.lead)}</p>
    </div>
    <div class="wrap v-body">
      <div class="cells v-figs" role="tablist" aria-labelledby="verify-h2">
        ${v.tabs.map((t, i) => `<a class="cell v-fig" role="tab" id="vfig-${i + 1}" href="${esc(t.href)}" aria-controls="${esc(t.href.slice(1))}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="v-fig__n">${esc(t.n)}</span><span class="v-fig__label h6">${esc(t.label)}</span></a>`).join('')}
      </div>
      <div class="v-rows">
        ${ROWS.map((def, i) => rowHTML(s, def, i)).join('')}
      </div>
    </div>
    <div class="wrap research" id="${esc(v.research.id)}">
      <div class="research__head">
        <h3 class="h3" data-reveal="1">${esc(v.research.h3)}</h3>
        <p class="lead" data-reveal="2">${esc(v.research.lead)}</p>
      </div>
      <ol class="research__list" role="list">
        ${v.research.items.map((it) => researchRow(it, v.research.linkLabel)).join('')}
      </ol>
    </div>`;

  const rowsEl = root.querySelector<HTMLElement>('.v-rows')!;
  const ctls: RowCtl[] = ROWS.map((def) => {
    const el = root.querySelector<HTMLElement>(`.frow--${def.key}`)!;
    const ctl: RowCtl = {
      def, el,
      size: hasPiece(def.piece) ? sizeOf(getPiece(def.piece)) : def.fallback,
      panel: el.querySelector<HTMLElement>('.frow__panel')!,
      plate: el.querySelector<HTMLElement>('.frow__plate')!,
      art: el.querySelector<HTMLElement>('.frow__art')!,
      unit: 0, mode: '', lastState: undefined, tick: null,
      read: () => current(ctl)?.state(),
      react: () => {},
    };
    if (def.key === 'games') {
      const one = el.querySelector<HTMLElement>('.frow__one')!;
      ctl.react = (st) => one.classList.toggle('is-win', st === 'win');
    } else if (def.key === 'compiler') {
      // the caption names the separator that stands: the piece's labelAt() flips it when the padlock lands (39) and
      // back when the wall stands again (108); without it, state() crypto ↔ everything else
      const label = el.querySelector<HTMLElement>('.frow__label--swap')!;
      ctl.read = () => {
        const m = current(ctl);
        if (!m || m.piece.id !== def.piece) return 'physical';
        const labelAt = m.piece.exports?.labelAt as ((t: number) => string) | undefined;
        return labelAt ? labelAt(m.localTick) : m.state() === 'crypto' ? 'cryptographic' : 'physical';
      };
      ctl.react = (key) => { label.dataset.state = key === 'cryptographic' ? 'crypto' : 'physical'; };
    } else {
      const stamp = el.querySelector<HTMLElement>('.frow__stamp')!;
      ctl.react = (st) => { stamp.dataset.state = st === 'accepted' || st === 'rejected' ? st : ''; };
    }
    return ctl;
  });

  hydrate(root);
  layout(ctls, root);
  ctls.forEach(watchState);
  bindFigureBar(root, ctls.map((c) => c.el));
  document.fonts?.ready.then(() => ctls.forEach((c) => snap(c.plate))).catch(() => {});

  // re-measure on resize (modes, sprite unit, panel padding, snapping); a rAF batches bursts
  let raf = 0;
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; layout(ctls, root); });
    }).observe(rowsEl);
  }
}
