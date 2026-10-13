// Section 5 · #layer · "Bellproof checks the answer before anyone gets paid." (design-spec §5.5, content §8)
// Owner: sections-2. Head, the 3-cell diagram with packet lanes, the closing lines, the with/without table.
//
// The four layer-packets pieces share one 48-tick story (poster 12). They are mounted by hand with
// autoplay:false and driven as one group from a single observer on the diagram: on enter every mount
// seeks 12 and plays on the same tick, on leave they all stop. The lanes switch to their upright `v`
// variant in the stacked layout (< 1280 px), and the group re-syncs after the swap.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { cellText, escapeHTML as esc, richHTML, type Cell } from '../content/strings';
import { hasPiece, mount as mountPiece, motion, observe, type Mounted } from '../engine';
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
  return typeof c === 'string'
    ? esc(c)
    : `${esc(cellText(c))}<span class="tag-illustrative">${esc(illustrative)}</span>`;
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
        <p class="mono layer__label layer__label--fwd">${esc(d.lanes.left.top)}</p>
        <div class="layer__track"><span class="layer__packets" data-slot="laneL"></span></div>
        <p class="mono layer__label layer__label--ret">${esc(d.lanes.left.bottom)}</p>
      </div>

      <div class="layer__cell layer__cell--core on-blue" data-reveal="2">
        <span class="layer__sprite" data-slot="vault"></span>
        <h3 class="h4 layer__title">${esc(d.bellproof.title)}</h3>
        <dl class="layer__rows">
          ${d.bellproof.rows.map((r) => `<div class="layer__row"><dt class="mono">${esc(r.label)}</dt><dd>${esc(r.body)}</dd></div>`).join('')}
        </dl>
      </div>

      <div class="layer__lane">
        <p class="mono layer__label layer__label--fwd">${esc(d.lanes.right.top)}</p>
        <div class="layer__track"><span class="layer__packets" data-slot="laneR"></span></div>
        <p class="mono layer__label layer__label--ret">${esc(d.lanes.right.bottom)}</p>
      </div>

      <div class="layer__cell layer__cell--side" data-reveal="3">
        <span class="layer__sprite layer__sprite--fridge"><span class="px" data-piece="${pid('fridge-mini')}" data-decorative></span></span>
        <h3 class="h4 layer__title">${esc(d.clouds.title)}</h3>
        <p class="layer__body">${esc(d.clouds.body)}</p>
        <span class="tag layer__tag">${esc(d.clouds.tag)}</span>
      </div>
    </div>

    <div class="layer__close">
      <h3 class="h3 layer__line" data-reveal="1">${richHTML(s.line1)}</h3>
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

/** The four story pieces as one group: same tick, same play/stop. */
function diagram(el: HTMLElement): void {
  const wide = matchMedia(WIDE);
  const slots = new Map<Slot, HTMLElement>();
  el.querySelectorAll<HTMLElement>('[data-slot]').forEach((s) => slots.set(s.dataset.slot as Slot, s));
  const mounts = new Map<Slot, Mounted>();
  let visible = false;

  const mountSlot = (slot: Slot) => {
    mounts.get(slot)?.destroy();
    const host = slots.get(slot)!;
    const def = PIECES[slot];
    const id = pid(def.id);
    const target = document.createElement('span');
    target.className = 'px';
    host.replaceChildren(target);
    const variant = id === 'placeholder' ? (def.v ? 'wide' : undefined) : def.v && !wide.matches ? 'v' : undefined;
    // lanes and lab are decorative; the vault carries the one alt for the whole diagram (content §8)
    const m = mountPiece(target, id, { variant, autoplay: false, decorative: slot !== 'vault' });
    mounts.set(slot, m);
  };

  const all = () => [...mounts.values()];
  const start = () => { all().forEach((m) => m.seek(STORY_POSTER)); all().forEach((m) => m.play()); };
  const stopAll = () => all().forEach((m) => m.stop());

  (Object.keys(PIECES) as Slot[]).forEach(mountSlot);

  observe(el, {
    play() { visible = true; start(); },
    stop() { visible = false; stopAll(); },
  });

  // stacked ↔ wide: the lanes change orientation, then the whole group restarts in step
  wide.addEventListener('change', () => {
    stopAll();
    mountSlot('laneL');
    mountSlot('laneR');
    if (visible) start(); else all().forEach((m) => m.seek(STORY_POSTER));
  });

  // reduced motion switched back off at runtime: the engine resumes each mount on its own; re-sync them
  motion.onChange((reduced) => { if (!reduced && visible) { stopAll(); start(); } });
}
