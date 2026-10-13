// Section 5 · #layer · "Bellproof checks the answer before anyone gets paid." (design-spec §5.5, content §8)
// Owner: sections-2. Head, the 3-cell diagram with packet lanes, the closing lines, the with/without table.
//
// The four layer-packets pieces share one 48-tick story (poster 12). They are mounted by hand with
// autoplay:false and kept on ONE story clock: each piece plays only while its own slot is within 200 px of the
// viewport (stacked at 390 the diagram is ~1 300 px tall), and whenever a piece (re)starts it is seeked to the
// group's current story tick, so the coin still arrives as the vault shuts. The lanes switch to their upright
// `v` variant in the stacked layout (< 1280 px) and their arrows turn with them (→ ↓, ← ↑).

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { cellText, escapeHTML as esc, richHTML, type Cell } from '../content/strings';
import { clock, hasPiece, mount as mountPiece, motion, observe, type Mounted } from '../engine';
import '../styles/sections/layer.css';

/** The horizontal diagram needs ≥ 1200 px of content for its five columns; below that it stacks. */
const WIDE = '(min-width: 1280px)';
const STORY_POSTER = 12;

type Slot = 'lab' | 'laneL' | 'vault' | 'laneR';
const PIECES: Record<Slot, { id: string; v?: boolean }> = {
  lab: { id: 'lab-bench' },
  laneL: { id: 'lane-left', v: true },
  vault: { id: 'vault' },
  laneR: { id: 'lane-right', v: true },
};

/** Real id when registered, else the placeholder (sized by the slot's CSS so nothing shifts). */
const pid = (id: string) => (hasPiece(id) ? id : 'placeholder');

function cellHTML(c: Cell, illustrative: string): string {
  // a space text node before the tag, so assistive tech reads "… certified illustrative", not "certifiedillustrative"
  return typeof c === 'string'
    ? esc(c)
    : `${esc(cellText(c))} <span class="tag-illustrative">${esc(illustrative)}</span>`;
}

/** A lane label whose arrow turns with the lane: the string's own → / ← when the lanes run sideways,
 *  ↓ / ↑ when they stand upright below 1280. The arrow is presentation (aria-hidden); the words are read. */
function laneLabel(text: string, cls: string): string {
  const m = /^(←\s*)?(.*?)(\s*→)?$/.exec(text) ?? [text, '', text, ''];
  const lead = m[1] ? `<span class="layer__arrow" data-h="←" data-v="↑" aria-hidden="true"></span> ` : '';
  const tail = m[3] ? ` <span class="layer__arrow" data-h="→" data-v="↓" aria-hidden="true"></span>` : '';
  return `<p class="mono layer__label ${cls}">${lead}<span>${esc(m[2])}</span>${tail}</p>`;
}

/** Engine reveals end on `clip-path: inset(0)`, which would clip focus rings and overhanging art: drop it once risen. */
function unclipReveals(root: HTMLElement): void {
  root.addEventListener('transitionend', (e) => {
    const el = e.target as HTMLElement;
    if (e.propertyName === 'clip-path' && el.matches('[data-reveal].in')) el.style.clipPath = 'none';
  });
}

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const s = ctx.strings.layer;
  const d = s.diagram;
  const c = ctx.strings.common;
  const [hBlank, hWithout, hWith] = s.table.headers;

  root.innerHTML = `
  <div class="wrap layer">
    <header class="layer__head">
      <p class="eyebrow" data-reveal="1">${esc(s.eyebrow)}</p>
      <h2 class="h2" data-reveal="2">${esc(s.h2)}</h2>
      <p class="lead" data-reveal="3">${esc(s.lead)}</p>
    </header>

    <div class="layer__diagram">
      <div class="layer__cell layer__cell--side" data-reveal="1">
        <span class="layer__sprite" data-slot="lab"></span>
        <h3 class="h4 layer__title">${esc(d.clients.title)}</h3>
        <p class="layer__body">${esc(d.clients.body)}</p>
        <span class="tag layer__tag">${esc(d.clients.tag)}</span>
      </div>

      <div class="layer__lane">
        ${laneLabel(d.lanes.left.top, 'layer__label--fwd')}
        <div class="layer__track"><span class="layer__packets" data-slot="laneL"></span></div>
        ${laneLabel(d.lanes.left.bottom, 'layer__label--ret')}
      </div>

      <div class="layer__cell layer__cell--core on-blue" data-reveal="2">
        <span class="layer__sprite" role="img" aria-label="${esc(s.alt.packets)}"><span class="layer__slot" data-slot="vault"></span></span>
        <h3 class="h4 layer__title">${esc(d.bellproof.title)}</h3>
        <dl class="layer__rows">
          ${d.bellproof.rows.map((r) => `<div class="layer__row"><dt class="micro">${esc(r.label)}</dt><dd>${esc(r.body)}</dd></div>`).join('')}
        </dl>
      </div>

      <div class="layer__lane">
        ${laneLabel(d.lanes.right.top, 'layer__label--fwd')}
        <div class="layer__track"><span class="layer__packets" data-slot="laneR"></span></div>
        ${laneLabel(d.lanes.right.bottom, 'layer__label--ret')}
      </div>

      <div class="layer__cell layer__cell--side" data-reveal="3">
        <span class="layer__sprite layer__sprite--fridge"><span class="px" data-piece="${pid('fridge-mini')}" data-decorative></span></span>
        <h3 class="h4 layer__title">${esc(d.clouds.title)}</h3>
        <p class="layer__body">${esc(d.clouds.body)}</p>
        <span class="tag layer__tag">${esc(d.clouds.tag)}</span>
      </div>
    </div>

    <div class="layer__close">
      <p class="h3 layer__line" data-reveal="1">${richHTML(s.line1)}</p>
      <div class="layer__quote" data-reveal="2">
        <blockquote class="h4 px-bracket layer__pull"><p>${esc(s.quote)}</p></blockquote>
        <p class="small layer__note">${esc(s.quoteNote)}</p>
      </div>
    </div>

    <div class="layer__compare" id="${esc(s.table.id)}">
      <div class="layer__compare-head" data-reveal="1">
        <span class="chip-example">${esc(c.runningExample)}</span>
        <h3 class="h3">${esc(s.table.h3)}</h3>
      </div>
      <div class="layer__table-wrap" data-reveal="2">
        <table class="table layer__table">
          <colgroup><col class="layer__col-k"><col><col></colgroup>
          <thead>
            <tr>
              <td>${hBlank ? esc(hBlank) : ''}</td>
              <th scope="col" class="is-alert">${esc(hWithout)}</th>
              <th scope="col" class="is-blue">${esc(hWith)}</th>
            </tr>
          </thead>
          <tbody>
            ${s.table.rows.map((row) => {
              const [k, without, withB] = row;
              return `<tr>
                <th scope="row">${esc(cellText(k))}</th>
                <td class="is-alert" data-label="${esc(hWithout)}">${cellHTML(without, c.illustrative)}</td>
                <td class="is-blue layer__with" data-label="${esc(hWith)}">${cellHTML(withB, c.illustrative)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p class="layer__cta" data-reveal="3"><a class="link h6" href="${esc(s.cta.href)}">${esc(s.cta.label)}</a></p>
    </div>
  </div>`;

  unclipReveals(root);
  hydrate(root);
  diagram(root.querySelector<HTMLElement>('.layer__diagram')!);
}

/** The four story pieces on one story clock; each plays only while its own slot is near the viewport. */
function diagram(el: HTMLElement): void {
  const wide = matchMedia(WIDE);
  const slots = new Map<Slot, HTMLElement>();
  el.querySelectorAll<HTMLElement>('[data-slot]').forEach((s) => slots.set(s.dataset.slot as Slot, s));
  const mounts = new Map<Slot, Mounted>();
  const near = new Set<Slot>();
  let t0: number | null = null;            // clock tick at which the shared story was at its poster tick

  /** The story tick every piece should show now (the group's clock, started when the first piece showed). */
  const storyTick = () => {
    if (t0 === null) t0 = clock.tick();
    return STORY_POSTER + (clock.tick() - t0);
  };
  const start = (slot: Slot) => {
    const m = mounts.get(slot);
    if (!m || motion.reduced) return;
    m.stop();
    m.seek(storyTick());
    m.play();
  };

  const mountSlot = (slot: Slot) => {
    mounts.get(slot)?.destroy();
    const host = slots.get(slot)!;
    const def = PIECES[slot];
    const id = pid(def.id);
    const target = document.createElement('span');
    target.className = 'px';
    host.replaceChildren(target);
    const variant = id === 'placeholder' ? (def.v ? 'wide' : undefined) : def.v && !wide.matches ? 'v' : undefined;
    // all decorative: the vault's slot sits in a role=img wrapper labelled with layer.alt.packets (content §8)
    const m = mountPiece(target, id, { variant, autoplay: false, decorative: true });
    mounts.set(slot, m);
    if (near.has(slot)) start(slot);
  };

  (Object.keys(PIECES) as Slot[]).forEach((slot) => {
    mountSlot(slot);
    observe(slots.get(slot)!, {
      play() { near.add(slot); start(slot); },
      stop() { near.delete(slot); mounts.get(slot)?.stop(); },
    });
  });

  // stacked ↔ wide: the lanes change orientation; the new mounts join the running story
  wide.addEventListener('change', () => { mountSlot('laneL'); mountSlot('laneR'); });

  // pause / reduced motion: the engine stops every mount and shows the posters. On resume it restarts the ones
  // that were playing from their posters; put them back on one story clock instead.
  motion.onChange((reduced) => {
    if (reduced) { t0 = null; return; }
    near.forEach((slot) => start(slot));
  });
}
