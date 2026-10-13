// Section 6 · #clients · "Built for decisions that ride on one number." (design-spec §5.6, §4.6; content §9)
// Owner: sections-2.
//
// lg (≥1024): vertical ARIA tabs (arrow keys, Home/End, automatic activation) beside one tab panel: the
// blue question cell with the audience sprite, and the stakes / certificate cell. The active tab's 4-px
// bar fills over 6 s (CSS); its `animationend` advances to the next tab. Hover, keyboard focus inside the
// list and being off screen pause it; a click or a key press stops auto-advance for good. Reduced motion:
// no bar, so no auto-advance. The sprite swaps with the engine's 4-tick dissolve, the copy with a 150-ms
// fade, together.
// md/sm (<1024): an accordion; the open item renders the same panel inside itself.

import type { SectionCtx } from '../main';
import { artExport, hydrate, snapIcons, uiIcon } from './nav';
import { escapeHTML as esc } from '../content/strings';
import { clock, ease, hasPiece, iconSVG, mount as mountPiece, motion, observe, type Mounted } from '../engine';
import '../styles/sections/clients.css';

const LG = '(min-width: 1024px)';
const FADE_MS = 150;

/** One 5×5 pictogram per audience (design §4.6: a 20-px pixel icon on each tab), 1 colour, currentColor. */
const TAB_GLYPHS = [
  // pharma: a ring molecule with its iron atom
  `.###.
   #...#
   #.#.#
   #...#
   .###.`,
  // batteries: a cell with its nub, half charged
  `..#..
   .###.
   .#.#.
   .###.
   .###.`,
  // chemicals: a flask (rim, neck, flared body)
  `.###.
   .#.#.
   .#.#.
   #...#
   #####`,
  // DAOs & funders: the milestone flag
  `####.
   ####.
   #....
   #....
   #....`,
  // providers: the fridge chandelier, plates and coax narrowing to the chip
  `#####
   .#.#.
   .###.
   .#.#.
   ..#..`,
];

function glyphSVG(map: string): string {
  const rows = map.trim().split('\n').map((r) => r.trim());
  const rects: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') { x++; continue; }
      let x2 = x + 1;
      while (x2 < row.length && row[x2] === '#') x2++;
      rects.push(`<rect x="${x}" y="${y}" width="${x2 - x}" height="1"/>`);
      x = x2;
    }
  });
  return `<svg class="icon" width="20" height="20" viewBox="0 0 5 5" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects.join('')}</svg>`;
}

/** The pixel chevron in one of its swap states (› closed, ⌄ open, the turn between). */
function chevron(state: 'closed' | 'turn' | 'open'): string {
  if (!hasPiece('ui-chevron')) return uiIcon('ui-chevron', 4);
  const variant = state === 'closed' ? undefined : state === 'turn' ? 'turn' : 'down';
  try { return iconSVG('ui-chevron', { size: 4, variant }); } catch { return iconSVG('ui-chevron', { size: 4 }); }
}

/* ------------------------------------------------------------------ the 4-step dither dissolve
   design §5.6 asks for an ordered-dither dissolve over 4 ticks. The engine's dissolveTo is a top-down wipe,
   so this does it at the DOM level: the incoming sprite is masked with an ordered 4×4 Bayer pattern whose
   cells are one art pixel (4 CSS px, aligned to the sprite's own grid), the outgoing one with the exact
   complement, so every art pixel shows one sprite or the other: 4/16, 8/16, 12/16, then all. */
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function bayerMask(level: number, invert: boolean): string {
  let rects = '';
  BAYER.forEach((row, y) => row.forEach((v, x) => { if ((v < level * 4) !== invert) rects += `<rect x='${x}' y='${y}' width='1' height='1'/>`; }));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 4 4' shape-rendering='crispEdges'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const MASKS = [1, 2, 3].map((l) => ({ in: bayerMask(l, false), out: bayerMask(l, true) }));
function setMask(el: HTMLElement, img: string | null): void {
  for (const pre of ['', '-webkit-']) {
    el.style.setProperty(`${pre}mask-image`, img ?? '');
    el.style.setProperty(`${pre}mask-size`, img ? '16px 16px' : '');
    el.style.setProperty(`${pre}mask-repeat`, img ? 'repeat' : '');
  }
}
function ditherSwap(holder: HTMLElement, from: Mounted, toId: string): Promise<Mounted> {
  return new Promise((resolve) => {
    const next = document.createElement('span');
    next.className = 'clients__over';
    next.style.visibility = 'hidden';
    holder.appendChild(next);
    const m = mountPiece(next, toId, { autoplay: false });
    const finish = () => {
      setMask(next, null);
      next.style.visibility = '';
      next.classList.remove('clients__over');
      from.destroy();
      from.el.remove();
      m.play();
      resolve(m);
    };
    if (motion.reduced) { finish(); return; }
    let step = 0;
    const un = clock.add({ kind: 'tick', onTick() {
      step++;
      if (step >= 4) { un(); finish(); return; }
      setMask(next, MASKS[step - 1].in);
      setMask(from.el, MASKS[step - 1].out);
      next.style.visibility = '';
    } });
  });
}

/** Engine reveals end on `clip-path: inset(0)`, which would clip focus rings: drop it once risen. */
function unclipReveals(root: HTMLElement): void {
  root.addEventListener('transitionend', (e) => {
    const el = e.target as HTMLElement;
    if (e.propertyName === 'clip-path' && el.matches('[data-reveal].in')) el.style.clipPath = 'none';
  });
}

type Tab = SectionCtx['strings']['clients']['tabs'][number];

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const s = ctx.strings.clients;
  const tabs = s.tabs;
  const chip = ctx.strings.common.runningExample;
  // content keeps `fridge-badge` for providers; the clients card wraps it as the 48×48 `client-providers`
  const pieceOf = (t: Tab) => {
    const id = t.piece === 'fridge-badge' ? 'client-providers' : t.piece;
    return hasPiece(id) ? id : 'placeholder';
  };

  const question = (t: Tab, extra = '') => `
    <div class="clients__q on-blue">
      <div class="clients__q-text" data-swap>
        <p class="eyebrow">${esc(s.labels.question)}</p>
        <p class="clients__question" data-field="question">${esc(t.question)}</p>
      </div>
      <span class="clients__sprite"${extra}></span>
    </div>`;
  // in the tab panel the chip keeps its box when hidden (no shift between tabs); in the accordion it is absent
  const detail = (t: Tab, keepBox = false) => `
    <div class="clients__detail" data-swap>
      <div class="clients__col">
        <div class="clients__col-head"><p class="eyebrow">${esc(s.labels.stakes)}</p></div>
        <p class="h4" data-field="stakes">${esc(t.stakes)}</p>
      </div>
      <div class="clients__col">
        <div class="clients__col-head">
          <p class="eyebrow">${esc(s.labels.certificate)}</p>
          <span class="chip-example${keepBox && !t.runningExample ? ' is-hidden' : ''}" data-field="chip"${keepBox || t.runningExample ? '' : ' hidden'}>${esc(chip)}</span>
        </div>
        <p class="clients__cert" data-field="certificate">${esc(t.certificate)}</p>
      </div>
    </div>`;

  root.innerHTML = `
  <div class="wrap clients">
    <header class="clients__head">
      <div class="clients__intro">
        <p class="eyebrow" data-reveal="1">${esc(s.eyebrow)}</p>
        <h2 class="h2" id="clients-h2" data-reveal="2">${esc(s.h2)}</h2>
      </div>
      <a class="btn btn--outline clients__cta" data-hop="step" href="${esc(s.cta.href)}"><span class="btn__label">${esc(s.cta.label)}</span><span class="btn__icon"><i data-icon="ui-chevron"></i></span></a>
      <p class="lead clients__lead" data-reveal="3">${esc(s.lead)}</p>
    </header>

    <div class="clients__tabs" data-reveal="1">
      <div class="vtabs clients__list" role="tablist" aria-orientation="vertical" aria-labelledby="clients-h2">
        ${tabs.map((t, i) => `
        <button class="vtab" type="button" role="tab" id="clients-tab-${i}" aria-controls="clients-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
          <span class="vtab__icon">${glyphSVG(TAB_GLYPHS[i] ?? TAB_GLYPHS[0])}</span>
          <span class="vtab__title">${esc(t.tab)}</span>
          <span class="vtab__bar" aria-hidden="true"></span>
        </button>`).join('')}
      </div>
      <div class="clients__panel" role="tabpanel" id="clients-panel" aria-labelledby="clients-tab-0" tabindex="0">
        ${question(tabs[0], ' data-sprite="tabs"')}
        ${detail(tabs[0], true)}
      </div>
    </div>

    <div class="acc clients__acc">
      ${tabs.map((t, i) => `
      <div class="acc__item${i === 0 ? ' is-open' : ''}">
        <h3 class="clients__acc-h">
          <button class="acc__head" type="button" id="clients-acc-${i}" aria-expanded="${i === 0}" aria-controls="clients-acc-panel-${i}" data-hop="${i === 0 ? 'drop' : 'step'}">
            <span class="clients__acc-label"><span class="vtab__icon">${glyphSVG(TAB_GLYPHS[i] ?? TAB_GLYPHS[0])}</span><span>${esc(t.tab)}</span></span>
            <span class="clients__acc-glyph" aria-hidden="true">${chevron(i === 0 ? 'open' : 'closed')}</span>
          </button>
        </h3>
        <div class="acc__panel" id="clients-acc-panel-${i}" role="region" aria-labelledby="clients-acc-${i}">
          <div class="acc__inner"><div class="clients__acc-body">
            ${question(t, ` data-sprite="acc-${i}"`)}
            ${detail(t)}
          </div></div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;

  unclipReveals(root);
  hydrate(root);

  const lg = matchMedia(LG);
  const tabsCtl = tabsView(root, tabs, pieceOf);
  const accCtl = accordion(root, tabs, pieceOf);
  lg.addEventListener('change', () => {
    if (lg.matches) { const open = accCtl.openIndex(); if (open >= 0) tabsCtl.show(open); }
    else accCtl.open(tabsCtl.index());
  });
}

/* ------------------------------------------------------------------ lg: vertical tabs */
function tabsView(root: HTMLElement, tabs: readonly Tab[], pieceOf: (t: Tab) => string) {
  const wrap = root.querySelector<HTMLElement>('.clients__tabs')!;
  const list = wrap.querySelector<HTMLElement>('[role="tablist"]')!;
  const buttons = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panel = wrap.querySelector<HTMLElement>('[role="tabpanel"]')!;
  const holder = panel.querySelector<HTMLElement>('[data-sprite]')!;
  const swaps = [...panel.querySelectorAll<HTMLElement>('[data-swap]')];
  const n = tabs.length;
  let index = 0;
  let manual = false;
  let hover = false;
  let focusIn = false;
  let visible = false;
  let textToken = 0;

  // ---- sprite: one mount at a time, swapped by dissolve; it plays only while its cell is on screen
  const first = document.createElement('span');
  holder.appendChild(first);
  let sprite: Mounted = mountPiece(first, pieceOf(tabs[0]), { autoplay: false });
  let wantId = sprite.piece.id;
  let dissolving = false;
  let spriteVisible = false;
  observe(holder, {
    play() { spriteVisible = true; if (!dissolving) sprite.play(); },
    stop() { spriteVisible = false; sprite.stop(); },
  });
  async function swapSprite(id: string, instant: boolean): Promise<void> {
    wantId = id;
    if (dissolving) return;
    if (instant) {
      if (sprite.piece.id === id) return;
      sprite.destroy(); sprite.el.remove();
      const el = document.createElement('span');
      holder.appendChild(el);
      sprite = mountPiece(el, id, { autoplay: false });
      if (spriteVisible) sprite.play();
      return;
    }
    dissolving = true;
    while (sprite.piece.id !== wantId) sprite = await ditherSwap(holder, sprite, wantId);
    dissolving = false;
    if (!spriteVisible) sprite.stop();
  }

  // ---- copy: 150 ms out, swap, 150 ms in (instant under reduced motion)
  function setFields(t: Tab): void {
    panel.querySelectorAll<HTMLElement>('[data-field]').forEach((el) => {
      const f = el.dataset.field!;
      if (f === 'chip') el.classList.toggle('is-hidden', !t.runningExample);
      else el.textContent = t[f as 'question' | 'stakes' | 'certificate'];
    });
  }
  function swapText(t: Tab, instant: boolean): void {
    const token = ++textToken;
    if (instant || motion.reduced) { swaps.forEach((el) => el.classList.remove('is-out')); setFields(t); return; }
    swaps.forEach((el) => el.classList.add('is-out'));
    setTimeout(() => {
      if (token !== textToken) return;
      setFields(t);
      swaps.forEach((el) => el.classList.remove('is-out'));
    }, FADE_MS);
  }

  function select(i: number, opts: { focus?: boolean; instant?: boolean } = {}): void {
    i = ((i % n) + n) % n;
    if (opts.focus) buttons[i].focus();
    if (i === index) return;
    buttons[index].setAttribute('aria-selected', 'false');
    buttons[index].tabIndex = -1;
    buttons[i].setAttribute('aria-selected', 'true');
    buttons[i].tabIndex = 0;
    panel.setAttribute('aria-labelledby', buttons[i].id);
    index = i;
    swapText(tabs[i], !!opts.instant);
    void swapSprite(pieceOf(tabs[i]), !!opts.instant);
  }

  // ---- auto-advance: the bar's CSS fill ends → next tab
  const syncPause = () => list.classList.toggle('is-paused', hover || focusIn || !visible);
  const stopAuto = () => { manual = true; list.classList.add('is-manual'); };
  list.addEventListener('animationend', (e) => {
    if (manual || !(e.target as Element).classList.contains('vtab__bar')) return;
    select(index + 1);
  });
  wrap.addEventListener('pointerenter', () => { hover = true; syncPause(); });
  wrap.addEventListener('pointerleave', () => { hover = false; syncPause(); });
  list.addEventListener('focusin', () => { focusIn = true; syncPause(); });
  list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget as Node)) { focusIn = false; syncPause(); } });
  observe(list, { play() { visible = true; syncPause(); }, stop() { visible = false; syncPause(); } });
  syncPause();

  // ---- input: click selects for good; arrows / Home / End move and select (automatic activation)
  buttons.forEach((b, i) => b.addEventListener('click', () => { stopAuto(); select(i); }));
  list.addEventListener('keydown', (e) => {
    const k = e.key;
    let to: number | null = null;
    if (k === 'ArrowDown' || k === 'ArrowRight') to = index + 1;
    else if (k === 'ArrowUp' || k === 'ArrowLeft') to = index - 1;
    else if (k === 'Home') to = 0;
    else if (k === 'End') to = n - 1;
    if (to === null) return;
    e.preventDefault();
    stopAuto();
    select(to, { focus: true });
  });

  return {
    index: () => index,
    show: (i: number) => select(i, { instant: true }),
  };
}

/* ------------------------------------------------------------------ md/sm: accordion */
function accordion(root: HTMLElement, tabs: readonly Tab[], pieceOf: (t: Tab) => string) {
  const items = [...root.querySelectorAll<HTMLElement>('.clients__acc .acc__item')];
  const heads = items.map((it) => it.querySelector<HTMLButtonElement>('.acc__head')!);
  const sprites: Array<Mounted | null> = items.map(() => null);
  const closing: Array<number> = items.map(() => 0);
  let openIdx = 0;

  const glyphHolder = (i: number) => heads[i].querySelector<HTMLElement>('.clients__acc-glyph')!;
  // › → turn → ⌄ with art-icons' morph() (one tick per step); a plain two-frame swap without it
  type MorphFn = (holder: Element, steps: unknown[], opts?: { size?: number }) => Promise<void>;
  const morph = artExport<MorphFn>('icons', 'morph', 'ui-chevron');
  const MORPHS = artExport<Record<string, unknown[]>>('icons', 'MORPHS', 'ui-chevron');
  function swapGlyph(i: number, open: boolean): void {
    const holder = glyphHolder(i);
    heads[i].dataset.hop = open ? 'drop' : 'step';
    if (morph && MORPHS?.chevronToDown && MORPHS?.downToChevron) {
      void morph(holder, open ? MORPHS.chevronToDown : MORPHS.downToChevron, { size: 4 }).then(() => snapIcons(heads[i]));
      return;
    }
    if (motion.reduced) { holder.innerHTML = chevron(open ? 'open' : 'closed'); return; }
    holder.innerHTML = chevron('turn');
    setTimeout(() => { if ((heads[i].getAttribute('aria-expanded') === 'true') === open) holder.innerHTML = chevron(open ? 'open' : 'closed'); }, 1000 / 12);
  }

  function mountSprite(i: number): void {
    clearTimeout(closing[i]);
    if (sprites[i]) return;
    const host = items[i].querySelector<HTMLElement>('[data-sprite]')!;
    const el = document.createElement('span');
    host.replaceChildren(el);
    sprites[i] = mountPiece(el, pieceOf(tabs[i]));        // observed: plays only while on screen
  }
  function dropSprite(i: number): void {
    // after the panel has collapsed, so the art doesn't vanish mid-animation
    closing[i] = window.setTimeout(() => { sprites[i]?.destroy(); sprites[i] = null; }, motion.reduced ? 0 : 320);
  }

  function set(i: number, open: boolean): void {
    if ((heads[i].getAttribute('aria-expanded') === 'true') === open) return;
    heads[i].setAttribute('aria-expanded', String(open));
    items[i].classList.toggle('is-open', open);
    swapGlyph(i, open);
    if (open) mountSprite(i); else dropSprite(i);
  }
  /** Steer the clicked header while the panels animate, so a panel collapsing above never yanks it away
   *  (no reliance on scroll anchoring, which Safari lacks). It stays put, or, when it sits low in the
   *  viewport (its panel would open below the fold) or under the nav, it glides up to just below the nav
   *  in step with the 300-ms panel transition. */
  let unPin: (() => void) | null = null;
  function pin(head: HTMLElement): void {
    unPin?.();
    const top0 = head.getBoundingClientRect().top;
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 73;
    const goal = top0 > window.innerHeight * 0.4 || top0 < pad ? pad : top0;
    const fix = (p: number) => {
      const want = top0 + (goal - top0) * ease.tw(p);
      const d = head.getBoundingClientRect().top - want;
      if (Math.abs(d) >= 1) window.scrollBy(0, Math.round(d));
    };
    if (motion.reduced) { fix(1); return; }
    let t = 0;
    unPin = clock.add({ kind: 'frame', onFrame(_n, dt) {
      t += dt;
      fix(Math.min(1, t / 300));
      if (t > 360) { unPin?.(); unPin = null; }
    } });
  }
  function open(i: number, keepInPlace = false): void {
    items.forEach((_, j) => { if (j !== i) set(j, false); });
    set(i, true);
    openIdx = i;
    if (keepInPlace) pin(heads[i]);
  }

  heads.forEach((h, i) => h.addEventListener('click', () => {
    if (h.getAttribute('aria-expanded') === 'true') { set(i, false); openIdx = -1; }
    else open(i, true);
  }));
  mountSprite(0);

  return { open, openIndex: () => openIdx };
}
