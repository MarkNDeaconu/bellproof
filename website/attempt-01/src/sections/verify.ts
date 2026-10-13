// Section 8 · How we verify · `#verify` (design-spec §5.8). Owner: sections-3.
//
//   head        centred eyebrow, h2, lead
//   body        [340px sticky tab card] [three feature rows]; md: the tab card becomes a sticky 3-tab strip above the
//               rows; sm: each row carries its own header bar instead
//   feature row copy (h3, body, CTA) beside a mosaic panel holding the sprite on a card plate, then an extras strip
//               spanning the row. Rows alternate sides (copy left, panel left, copy left).
//   #research   h3, lead, five ledger rows (year · authors/title/gives · venue · arXiv link cell)
//
// Panel sizing is measured, not guessed: each row picks the largest integer sprite unit (4, then 3, then 2) whose plate
// fits beside the copy (lg) or under it, so sprites stay at U = 4 wherever they physically fit and are never scaled by a
// non-integer factor. Pieces: magic-square (row 1), wall-to-lock (row 2, `placeholder` until it lands), tc-rounds (row 3).
//
// Shared helpers for sections-3 (icon, button, textLink, chip, observeOnce) are exported from here for guarantees.ts
// and cta.ts.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { clock, hasPiece, motion, mount as mountPieceInto, mountedOf, observe, type Mounted, type TickSub } from '../engine';
import { escapeHTML as esc, isExternal, type Link, type ResearchItem } from '../content/strings';

type S = SectionCtx['strings'];

/* ================================================================== shared helpers (sections-3) */

/** A pixel UI glyph placeholder; hydrate() swaps it for the inline SVG (or the fallback glyph). */
export const icon = (id: string, size = 4): string => `<i data-icon="${id}" data-size="${size}"></i>`;

/** A design §4.2 button. External and placeholder-external hrefs take the ↗ glyph, the rest the chevron. */
export function button(l: Link, variant: string, cls = ''): string {
  const glyph = isExternal(l.href) ? 'ui-external' : 'ui-chevron';
  return `<a class="btn btn--${variant}${cls ? ' ' + cls : ''}" href="${esc(l.href)}"><span class="btn__label">${esc(l.label)}</span><span class="btn__icon">${icon(glyph)}</span></a>`;
}

/** A text link with a trailing pixel glyph (→ in page, ↗ outbound) that takes the two-tick pixel step on hover. */
export function textLink(l: Link, cls = ''): string {
  const glyph = isExternal(l.href) ? 'ui-external' : 'ui-arrow';
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

/** Copy the strings agent does not have yet (see the sections-3 report, Requests). */

/* ================================================================== feature rows */

type RowKey = 'games' | 'compiler' | 'rounds';
interface RowDef {
  key: RowKey;
  piece: string;
  size: [number, number];          // art px
  tint: 'violet' | 'blue' | 'azure';
  panelLeft: boolean;
  labelH: number;                  // px of HTML label rows inside the plate (besides the sprite)
  seed: number;
}
const ROWS: RowDef[] = [
  { key: 'games', piece: 'magic-square', size: [96, 64], tint: 'violet', panelLeft: false, labelH: 0, seed: 11 },
  { key: 'compiler', piece: 'wall-to-lock', size: [96, 48], tint: 'blue', panelLeft: true, labelH: 28, seed: 23 },
  { key: 'rounds', piece: 'tc-rounds', size: [128, 40], tint: 'azure', panelLeft: false, labelH: 48, seed: 37 },
];

const TILE = 40;          // mosaic tile = 5U
const PLATE_PAD = 16;     // the card plate's padding around the sprite
const MARGIN_X = 24;      // minimum mosaic visible beside the plate
const MARGIN_Y = 40;      // one tile of mosaic above and below the plate
const COPY_MIN = 280;     // narrowest copy column beside a panel
const GAP = 40;           // copy ↔ panel gap
const SPLIT_PANEL_H = 400;
const LG = '(min-width: 1024px)';
const SM = '(max-width: 767.98px)';

interface RowCtl {
  def: RowDef;
  el: HTMLElement;
  mosaic: HTMLElement;
  svgHost: HTMLElement;
  plate: HTMLElement;
  art: HTMLElement;
  unit: number;
  mode: '' | 'split' | 'stack';
  W: number; H: number;
  m: Mounted | null;
  read(): string | undefined;      // what the row reacts to (default: the piece's state())
  react(state: string | undefined): void;
  lastState: string | undefined;
  tick: TickSub | null;
}

function rowCopy(s: S, def: RowDef): string {
  const v = s.verify.rows;
  const idx = ROWS.indexOf(def);
  const tab = s.verify.tabs[idx];
  const bar = `<p class="frow__bar h5" aria-hidden="true"><span>${esc(tab.label)}</span><span class="frow__num mono">0${idx + 1}</span></p>`;
  if (def.key === 'games') {
    const r = v.games;
    return `${bar}
      <div class="frow__copy">
        <h3 class="h3" data-reveal="1">${esc(r.h3)}</h3>
        <p class="frow__body" data-reveal="2">${esc(r.body)}</p>
      </div>
      <div class="frow__cta">${textLink(r.cta)}</div>
      <div class="frow__extras cells frow__stats" data-reveal="3">
        <div class="cell frow__stat"><p class="num-xl">${esc(r.stats[0].value)}</p><p class="frow__cap">${esc(r.stats[0].caption)}</p></div>
        <div class="cell frow__stat on-blue"><p class="num-xl">${esc(r.stats[1].value)}</p><p class="frow__cap">${esc(r.stats[1].caption)}</p></div>
        <div class="cell frow__note"><h4 class="h5">${esc(r.explainer.title)}</h4><p class="frow__cap">${esc(r.explainer.body)}</p></div>
        <div class="cell frow__note"><p class="eyebrow">${esc(r.rigidity.eyebrow)}</p><p class="frow__cap">${esc(r.rigidity.body)}</p></div>
      </div>`;
  }
  if (def.key === 'compiler') {
    const r = v.compiler;
    return `${bar}
      <div class="frow__copy">
        <h3 class="h3" data-reveal="1">${esc(r.h3)}</h3>
        <p class="frow__body" data-reveal="2">${esc(r.body)}</p>
      </div>
      <div class="frow__cta">${button(r.cta, 'outline')}</div>
      <div class="frow__extras frow__minis" data-reveal="3">
        ${r.cells.map((c) => `<div class="frow__mini"><p class="eyebrow">${esc(c.eyebrow)}</p><p class="frow__cap">${esc(c.body)}</p></div>`).join('')}
      </div>`;
  }
  const r = v.rounds;
  const tone = ['is-test', 'is-compute', 'is-verdict'];
  return `${bar}
      <div class="frow__copy">
        <p class="frow__chip" data-reveal="1">${chip(s)}</p>
        <h3 class="h3" data-reveal="1">${esc(r.h3)}</h3>
        <p class="frow__body" data-reveal="2">${esc(r.body)}</p>
      </div>
      <div class="frow__cta">${button(r.cta, 'outline')}</div>
      <div class="frow__extras cells frow__cards" data-reveal="3">
        ${r.cards.map((c, i) => `<div class="cell frow__card ${tone[i]}"><h4 class="h5">${esc(c.title)}</h4><p class="frow__cap">${esc(c.body)}</p></div>`).join('')}
      </div>`;
}

function rowPanel(s: S, def: RowDef): string {
  const v = s.verify.rows;
  let plate = `<div class="frow__art"></div>`;
  let after = '';
  if (def.key === 'games') {
    // the readout's final "1" pulses blue while the piece is in its `win` state
    const t = v.games.readout;
    const i = t.lastIndexOf('1');
    after = `<figcaption class="frow__readout mono">${esc(t.slice(0, i))}<span class="frow__one">${esc(t.slice(i))}</span></figcaption>`;
  } else if (def.key === 'compiler') {
    const l = v.compiler.labels;
    plate += `<p class="frow__label frow__label--swap" aria-live="off"><span class="frow__phys">${esc(l.physical)}</span><span class="frow__crypto">${esc(l.cryptographic)}</span></p>`;
  } else {
    const l = v.rounds.labels;
    const verdict = s.guarantees.certificate.rows.find((r) => r.key === 'verdict')?.value ?? '';
    plate = `<div class="frow__lrow frow__lrow--top"><span class="frow__label">${esc(l.schedule)}</span><span class="frow__stamp" aria-hidden="true"><span class="frow__stamp-ok">${esc(verdict)}</span><span class="frow__stamp-no">${esc(l.rejected)}</span></span></div>
      ${plate}
      <div class="frow__lrow frow__lrow--bot"><span class="frow__label">${esc(l.provider)}</span><span class="frow__meter mono" aria-hidden="true">${esc(l.meter)}</span></div>`;
  }
  const dots = def.key === 'games'
    ? '<i class="dot" style="--x:0;--y:0"></i><i class="dot" style="--x:100%;--y:0"></i><i class="dot" style="--x:0;--y:100%"></i><i class="dot" style="--x:100%;--y:100%"></i>'
    : '';
  return `<figure class="frow__panel">
      <div class="frow__mosaic frow__mosaic--${def.tint}">
        <div class="frow__tiles" aria-hidden="true"></div>
        <div class="frow__plate">${plate}</div>
        ${dots}
      </div>${after}
    </figure>`;
}

/* ------------------------------------------------------------------ mosaic (seeded tiles + one diamond tile) */

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Inline SVG of 40-px tiles in two tints, centred so edge slivers match, with one 5×5 band-pixel diamond tile. */
function mosaicSVG(W: number, H: number, seed: number, plateW: number, plateH: number): string {
  const ox = W % TILE ? Math.floor((W % TILE) / 2) - TILE : 0;
  const oy = H % TILE ? Math.floor((H % TILE) / 2) - TILE : 0;
  const cols = Math.ceil((W - ox) / TILE), rows = Math.ceil((H - oy) / TILE);
  const px0 = (W - plateW) / 2, py0 = (H - plateH) / 2;
  const on: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    on.push([]);
    for (let c = 0; c < cols; c++) on[r].push(hash2(c, r, seed) < 0.36);
  }
  // the diamond: a whole tile, inside the panel, clear of the plate by at least 8 px; picked by hash
  const cands: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = ox + c * TILE, y = oy + r * TILE;
    if (x < 0 || y < 0 || x + TILE > W || y + TILE > H) continue;
    const clear = x + TILE <= px0 - 8 || x >= px0 + plateW + 8 || y + TILE <= py0 - 8 || y >= py0 + plateH + 8;
    if (clear) cands.push([c, r]);
  }
  let dia: [number, number] | null = null;
  if (cands.length) {
    dia = cands[Math.floor(hash2(cols, rows, seed + 7) * cands.length)];
    const [dc, dr] = dia;
    for (const [c, r] of [[dc, dr], [dc - 1, dr], [dc + 1, dr], [dc, dr - 1], [dc, dr + 1]]) if (on[r]?.[c] !== undefined) on[r][c] = false;
  }
  let rects = '';
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (!on[r][c]) { c++; continue; }
      let c2 = c + 1;
      while (c2 < cols && on[r][c2]) c2++;
      rects += `<rect x="${ox + c * TILE}" y="${oy + r * TILE}" width="${(c2 - c) * TILE}" height="${TILE}"/>`;
      c = c2;
    }
  }
  let diamond = '';
  if (dia) {
    const x = ox + dia[0] * TILE, y = oy + dia[1] * TILE;
    const steps: Array<[number, number]> = [[16, 8], [8, 24], [0, 40], [8, 24], [16, 8]];
    diamond = steps.map(([dx, w], i) => `<rect x="${x + dx}" y="${y + i * 8}" width="${w}" height="8"/>`).join('');
  }
  return `<svg class="frow__svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g class="frow__t2">${rects}${diamond}</g></svg>`;
}

/* ------------------------------------------------------------------ measuring and mounting */

function plateSize(def: RowDef, u: number): [number, number] {
  return [def.size[0] * u + 2 * PLATE_PAD, def.size[1] * u + 2 * PLATE_PAD + def.labelH];
}

function decide(ctl: RowCtl): { mode: 'split' | 'stack'; unit: number; panelW: number | null } {
  const lg = matchMedia(LG).matches, sm = matchMedia(SM).matches;
  const pad = parseFloat(getComputedStyle(ctl.el).paddingLeft) || 0;
  const inner = ctl.el.clientWidth - 2 * pad;
  const avail = sm ? inner + 2 * pad - 2 : inner;      // sm: the panel bleeds to the row's lines
  for (const u of [4, 3, 2]) {
    const [pw] = plateSize(ctl.def, u);
    if (lg) {
      const minW = Math.ceil((pw + 2 * MARGIN_X) / TILE) * TILE;
      const sevenTwelfths = Math.floor(((inner - GAP) * 7) / 12 / TILE) * TILE;
      const w = Math.max(minW, sevenTwelfths);
      if (inner - GAP - w >= COPY_MIN) return { mode: 'split', unit: u, panelW: w };
    }
    if (pw + 2 * (sm ? 16 : MARGIN_X) <= avail) return { mode: 'stack', unit: u, panelW: null };
  }
  return { mode: 'stack', unit: 2, panelW: null };
}

function mountPiece(ctl: RowCtl, unit: number): void {
  ctl.m?.destroy();
  const def = ctl.def;
  const real = hasPiece(def.piece);
  const [aw, ah] = [def.size[0] * unit, def.size[1] * unit];
  ctl.art.style.setProperty('--aw', `${aw}px`);
  ctl.art.style.setProperty('--ah', `${ah}px`);
  const span = document.createElement('span');
  ctl.art.replaceChildren(span);
  const m = mountPieceInto(span, real ? def.piece : 'placeholder', {
    unit,
    variant: real ? undefined : 'wide',
    decorative: !real,
  });
  ctl.m = m;
  ctl.el.dataset.art = real ? def.piece : 'placeholder';
  ctl.lastState = ctl.read();
  ctl.react(ctl.lastState);
}

function layoutRow(ctl: RowCtl): void {
  const d = decide(ctl);
  const [pw, ph] = plateSize(ctl.def, d.unit);
  const H = d.mode === 'split'
    ? Math.max(SPLIT_PANEL_H, Math.ceil((ph + 2 * MARGIN_Y) / TILE) * TILE)
    : Math.ceil((ph + 2 * MARGIN_Y) / TILE) * TILE;
  if (d.mode !== ctl.mode) {
    ctl.el.classList.toggle('is-split', d.mode === 'split');
    ctl.el.classList.toggle('is-stack', d.mode === 'stack');
    ctl.mode = d.mode;
  }
  if (d.panelW) ctl.el.style.setProperty('--panel-w', `${d.panelW}px`);
  else ctl.el.style.removeProperty('--panel-w');
  ctl.el.style.setProperty('--panel-h', `${H}px`);
  ctl.el.style.setProperty('--u', `${d.unit}px`);
  if (d.unit !== ctl.unit || !ctl.m) { ctl.unit = d.unit; mountPiece(ctl, d.unit); }
  const W = ctl.mosaic.clientWidth;
  if (W !== ctl.W || H !== ctl.H) {
    ctl.W = W; ctl.H = H;
    ctl.svgHost.innerHTML = mosaicSVG(W, H, ctl.def.seed, pw, ph);
  }
}

/** The row's live mount, read from the DOM (the bundler must not constant-fold a property set elsewhere). */
function current(ctl: RowCtl): Mounted | undefined {
  const el = ctl.art.firstElementChild;
  return el ? mountedOf(el) : undefined;
}

/** While the panel is near the viewport, poll the piece's state() once per sprite tick and hand changes to react(). */
function watchState(ctl: RowCtl): void {
  const poll = () => {
    const st = ctl.read();
    if (st !== ctl.lastState) { ctl.lastState = st; ctl.react(st); }
  };
  observe(ctl.mosaic, {
    play() {
      if (ctl.tick || motion.reduced) return;
      ctl.tick = { kind: 'tick', onTick: poll };
      clock.add(ctl.tick);
    },
    stop() { if (ctl.tick) { clock.remove(ctl.tick); ctl.tick = null; } },
  });
  motion.onChange(() => { if (motion.reduced && ctl.tick) { clock.remove(ctl.tick); ctl.tick = null; } poll(); });
}

/* ------------------------------------------------------------------ the tab card (scroll-spy over the rows) */

function bindTabs(root: HTMLElement, rows: HTMLElement[]): void {
  const tabs = [...root.querySelectorAll<HTMLAnchorElement>('.v-tabs .tabcard__item')];
  let current = -1;
  let lockUntil = 0;
  const setActive = (i: number) => {
    if (i === current || i < 0) return;
    current = i;
    tabs.forEach((t, j) => {
      if (j === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  };
  setActive(0);
  // the row that holds the viewport's centre line is active; above the first row → first, below the last → last.
  // A passive scroll listener (rAF-batched) runs only while the rows are near the viewport.
  const spy = () => {
    if (performance.now() < lockUntil) return;
    const mid = innerHeight / 2;
    let i = 0;
    rows.forEach((r, j) => { if (r.getBoundingClientRect().top <= mid) i = j; });
    setActive(i);
  };
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; spy(); }); };
  const body = rows[0].parentElement!;
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver((entries) => {
      const near = entries.some((e) => e.isIntersecting);
      if (near) { addEventListener('scroll', onScroll, { passive: true }); spy(); }
      else removeEventListener('scroll', onScroll);
    }, { rootMargin: '100% 0px' }).observe(body);
  } else addEventListener('scroll', onScroll, { passive: true });
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    setActive(i);
    lockUntil = performance.now() + (motion.reduced ? 0 : 900);   // ignore spy updates during the smooth scroll
  }));
  root.querySelector('.v-tabs')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    const i = tabs.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const next = ({ ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[ev.key];
    if (next === undefined) return;
    ev.preventDefault();
    tabs[(next + tabs.length) % tabs.length].focus();
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
      <a class="cell cell--link research__link" href="${esc(it.url)}"><span class="mono">${esc(linkLabel)}<span class="vh">: ${esc(it.title)}</span></span><span class="research__glyph">${icon('ui-external')}</span></a>
    </li>`;
}

/* ================================================================== mount */

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const s = ctx.strings;
  const v = s.verify;
  root.innerHTML = `
    <div class="wrap v-head">
      <p class="eyebrow" data-reveal="1">${esc(v.eyebrow)}</p>
      <h2 class="h2" data-reveal="2">${esc(v.h2)}</h2>
      <p class="lead" data-reveal="3">${esc(v.lead)}</p>
    </div>
    <div class="v-body">
      <div class="wrap v-grid">
        <div class="v-aside">
          <nav class="tabcard v-tabs" aria-label="${esc(v.eyebrow)}">
            ${v.tabs.map((t) => `<a class="tabcard__item" href="${esc(t.href)}"><span>${esc(t.label)}</span><span class="tabcard__arrow">${icon('ui-arrow')}</span></a>`).join('')}
          </nav>
        </div>
        <div class="v-rows">
          ${ROWS.map((def) => `<div class="frow frow--${def.key}${def.panelLeft ? ' frow--panel-left' : ''}" id="${esc(v.rows[def.key].id)}">
            ${rowCopy(s, def)}
            ${rowPanel(s, def)}
          </div>`).join('')}
        </div>
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
      mosaic: el.querySelector<HTMLElement>('.frow__mosaic')!,
      svgHost: el.querySelector<HTMLElement>('.frow__tiles')!,
      plate: el.querySelector<HTMLElement>('.frow__plate')!,
      art: el.querySelector<HTMLElement>('.frow__art')!,
      unit: 0, mode: '', W: 0, H: 0, m: null, lastState: undefined, tick: null,
      read: () => current(ctl)?.state(),
      react: () => {},
    };
    if (def.key === 'games') {
      const one = el.querySelector<HTMLElement>('.frow__one')!;
      ctl.react = (st) => one.classList.toggle('is-win', st === 'win');
    } else if (def.key === 'compiler') {
      // the caption names the separator that is standing: the piece's own labelAt() flips it when the padlock
      // lands and back when the wall stands again (falls back to state(): crypto ↔ everything else)
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
  ctls.forEach(layoutRow);
  ctls.forEach(watchState);
  bindTabs(root, ctls.map((c) => c.el));

  // re-measure on resize (panel modes, sprite unit, mosaic); a rAF batches bursts of observations
  let raf = 0;
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; ctls.forEach(layoutRow); });
    });
    ro.observe(rowsEl);
  }
}
