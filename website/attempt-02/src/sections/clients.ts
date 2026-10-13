// Section 6 · #clients · "Built for decisions that ride on one number." (design-spec §5.6; revision 1 §1.5, S2-1)
// Owner: sections-2.
//
// A segmented control (role=tablist, one .cells row of five 56-px cells: 5×5 icon + h6 label inline; the active
// cell is card-white with a 2-px blue bar on its top edge) above one tab panel: the blue question cell (7/12) and
// the light stakes/certificate cell (5/12), equal heights. No fill bar, no auto-advance: clicks and arrow keys only.
// The copy of all five audiences is stacked in the same grid cell and cross-faded (150 ms, text wrappers only), so
// the cells never change size or flash their backgrounds; the sprite swaps with the engine's 4-tick dither dissolve.
// Below 1024 the control scrolls sideways (scroll-snap) and the two cells stack.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { escapeHTML as esc } from '../content/strings';
import { dissolveTo, hasPiece, mount as mountPiece, type Mounted } from '../engine';
import '../styles/sections/clients.css';

/** One 5×5 pictogram per audience (a 20-px pixel icon on each segment), 1 colour, currentColor. */
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

/** Engine reveals end on a slack clip-path; drop it once risen so nothing (focus rings, art) is ever clipped. */
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
  const pieceOf = (t: Tab) => (hasPiece(t.piece) ? t.piece : 'placeholder');
  // every audience's copy, stacked in one grid cell; only the active layer is visible (and exposed)
  const layers = (cls: string, html: (t: Tab) => string) => tabs.map((t, i) =>
    `<div class="clients__layer${i === 0 ? ' is-active' : ''}" data-layer="${i}"${i === 0 ? '' : ' aria-hidden="true"'}><div class="${cls}">${html(t)}</div></div>`).join('');

  root.innerHTML = `
  <div class="wrap clients">
    <header class="clients__head">
      <p class="eyebrow" data-reveal="1">${esc(s.eyebrow)}</p>
      <h2 class="h2" id="clients-h2" data-reveal="2">${esc(s.h2)}</h2>
      <p class="lead" data-reveal="3">${esc(s.lead)}</p>
    </header>

    <div class="clients__body" data-reveal="1">
      <div class="cells clients__seg" role="tablist" aria-labelledby="clients-h2">
        ${tabs.map((t, i) => `
        <button class="clients__tab" type="button" role="tab" id="clients-tab-${i}" aria-controls="clients-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
          <span class="clients__tab-icon">${glyphSVG(TAB_GLYPHS[i] ?? TAB_GLYPHS[0])}</span>
          <span class="h6 clients__tab-label">${esc(t.tab)}</span>
        </button>`).join('')}
      </div>
      <div class="cells clients__panel" role="tabpanel" id="clients-panel" aria-labelledby="clients-tab-0" tabindex="0">
        <div class="clients__q on-blue">
          <p class="eyebrow">${esc(s.labels.question)}</p>
          <div class="clients__layers clients__q-text">${layers('clients__question', (t) => esc(t.question))}</div>
          <span class="clients__sprite" data-sprite></span>
        </div>
        <div class="clients__detail">
          <div class="clients__block">
            <p class="eyebrow">${esc(s.labels.stakes)}</p>
            <div class="clients__layers">${layers('h4 clients__stakes', (t) => esc(t.stakes))}</div>
          </div>
          <div class="clients__block">
            <p class="eyebrow">${esc(s.labels.certificate)}</p>
            <div class="clients__layers">${layers('clients__cert', (t) => `<p>${esc(t.certificate)}</p>${t.runningExample ? `<span class="chip-example">${esc(chip)}</span>` : ''}`)}</div>
          </div>
        </div>
      </div>
    </div>

    <p class="clients__talk" data-reveal="2"><a class="link link--icon h6" data-hop="step" href="${esc(s.talk.href)}"><span>${esc(s.talk.label)}</span><i data-icon="ui-chevron"></i></a></p>
  </div>`;

  unclipReveals(root);
  hydrate(root);
  segmented(root, tabs, pieceOf);
}

function segmented(root: HTMLElement, tabs: readonly Tab[], pieceOf: (t: Tab) => string): void {
  const list = root.querySelector<HTMLElement>('[role="tablist"]')!;
  const buttons = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panel = root.querySelector<HTMLElement>('[role="tabpanel"]')!;
  const holder = panel.querySelector<HTMLElement>('[data-sprite]')!;
  const n = tabs.length;
  let index = 0;

  // ---- the sprite: one observed mount at a time, swapped by the engine's dither dissolve (instant when motion is off)
  const first = document.createElement('span');
  holder.appendChild(first);
  let sprite: Mounted = mountPiece(first, pieceOf(tabs[0]));
  let wantId = sprite.piece.id;
  let dissolving = false;
  async function swapSprite(id: string): Promise<void> {
    wantId = id;
    if (dissolving) return;
    dissolving = true;
    while (sprite.piece.id !== wantId) sprite = await dissolveTo(holder, sprite, wantId);
    dissolving = false;
  }

  function select(i: number, focus = false): void {
    i = ((i % n) + n) % n;
    if (focus) {
      buttons[i].focus({ preventScroll: true });
      buttons[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });   // the sideways scroller below 1024
    }
    if (i === index) return;
    buttons[index].setAttribute('aria-selected', 'false');
    buttons[index].tabIndex = -1;
    buttons[i].setAttribute('aria-selected', 'true');
    buttons[i].tabIndex = 0;
    panel.setAttribute('aria-labelledby', buttons[i].id);
    panel.querySelectorAll<HTMLElement>('[data-layer]').forEach((el) => {
      const on = Number(el.dataset.layer) === i;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
    });
    index = i;
    void swapSprite(pieceOf(tabs[i]));
  }

  buttons.forEach((b, i) => b.addEventListener('click', () => select(i)));
  list.addEventListener('keydown', (e) => {
    const k = e.key;
    let to: number | null = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = index + 1;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = index - 1;
    else if (k === 'Home') to = 0;
    else if (k === 'End') to = n - 1;
    if (to === null) return;
    e.preventDefault();
    select(to, true);
  });
}
