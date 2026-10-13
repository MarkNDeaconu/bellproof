// Section 10 · CTA band · `#cta` (design-spec §4.7, §5.10). Owner: sections-3.
//
//   head      eyebrow (azure), display headline, lead
//   cells     a full-bleed band of 3 cells (cta-play / cta-code / cta-book icons, h4, body pinned low, ghost button)
//   final     centred primary-on-dark "Get in touch"
//   dusk      the bands `dusk()` staircase (night → violet → indigo) and the walkers driver
//
// Walkers (qubit-folk `walkers`, `stairs` variant 40×32): the section moves the canvas 4 CSS px per 12 fps tick
// (integration notes), with each creature standing on the highest step under its feet: drops are instant (one 8-px
// step), the 56-px riser at each tier boundary is climbed one step per tick with the pair pausing, Bob first, then
// Alice. Mid-way they stop for one high-five (`since` + `mode`, back to `walk` on `done`), walk off the right edge and
// re-enter from the left after a 2 s breath. Hover pauses them (mode `stand`). The driver only ticks while the strip is
// near the viewport. Reduced motion: standing mid-stair on the poster.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { clock, hasPiece, motion, mountedOf, moveUnits, observe, type Mounted, type TickSub } from '../engine';
import { escapeHTML as esc } from '../content/strings';
import { dusk } from '../art/bands';
import { hoverable } from '../art/icons/motion';
import { button } from './verify';

const STEP_PX = 4;                  // canvas advance per tick
const RISE_PX = 8;                  // one staircase step per tick when climbing
const CANVAS_W = 160;
const A_FEET: [number, number] = [12, 36];    // Alice's foot span in css px from the canvas left (art x 3–8)
const B_FEET: [number, number] = [124, 148];  // Bob's (art x 31–36)
const REENTRY_TICKS = 24;

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const c = ctx.strings.cta;
  const walkerId = hasPiece('walkers') ? 'walkers' : 'placeholder';

  root.innerHTML = `
    <div class="wrap cta-head">
      <p class="eyebrow" data-reveal="1">${esc(c.eyebrow)}</p>
      <h2 class="display" data-reveal="2">${esc(c.h2)}</h2>
      <p class="lead" data-reveal="3">${esc(c.lead)}</p>
    </div>
    <div class="cta-band">
      <div class="wrap">
        <div class="cells cells--3 cta-cells">
          ${c.cells.map((cell, i) => {
            const id = hasPiece(cell.piece) ? cell.piece : 'placeholder';
            return `<div class="cell cta-cell" data-reveal="${i + 1}">
              <span class="px cta-cell__icon" data-piece="${id}"${id === 'placeholder' ? ' data-variant="sm"' : ''} data-decorative></span>
              <h3 class="h4">${esc(cell.title)}</h3>
              <p class="cell__body cell__foot">${esc(cell.body)}</p>
              ${button(cell.button, 'ghost-on-dark', 'cta-cell__btn')}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div class="wrap cta-final">${button(c.final, 'primary-on-dark')}</div>
    <div class="cta-dusk">
      <div class="cta-stairs" aria-hidden="true"></div>
      <div class="cta-walk">
        <span class="px cta-walker" data-piece="${walkerId}"${walkerId === 'walkers' ? ' data-variant="stairs" data-io-mode="walk"' : ''} data-decorative></span>
      </div>
    </div>`;

  hydrate(root);

  // cell icons: hover or keyboard focus anywhere in the cell plays the icon's gesture
  root.querySelectorAll<HTMLElement>('.cta-cell').forEach((cell) => {
    const m = mountedOf(cell.querySelector('.cta-cell__icon')!);
    if (m && m.piece.id !== 'placeholder') hoverable(cell, m);
  });

  const strip = root.querySelector<HTMLElement>('.cta-dusk')!;
  const stairs = dusk(root.querySelector<HTMLElement>('.cta-stairs')!);
  const walker = root.querySelector<HTMLElement>('.cta-walker')!;
  const m = mountedOf(walker);
  if (!m || m.piece.id !== 'walkers') return;
  driveWalkers(strip, stairs.surfaceY, walker, m);
}

function driveWalkers(strip: HTMLElement, surfaceY: (x: number) => number, el: HTMLElement, m: Mounted): void {
  let x = -CANVAS_W, yA = 0, yB = 0;
  let mode: 'walk' | 'hifive' | 'stand' = 'walk';
  let hovered = false, hifived = false, wait = 0;
  let lastLift = '';

  const width = () => strip.clientWidth || 1;
  const surf = (px: number): number => {
    const W = width();
    if (px < 0) return 0;                       // off the left edge: level with the first step
    if (px >= W) return surfaceY(W - 1);        // off the right edge: level with the last step
    return surfaceY(px);
  };
  /** The highest step under a foot span (smallest y): a creature stays on a step until both feet have left it. */
  const under = (span: [number, number]): number => {
    let best = Infinity;
    for (let px = x + span[0]; px < x + span[1]; px += 2) best = Math.min(best, surf(px));
    return Math.min(best, surf(x + span[1] - 1));
  };

  const place = () => {
    const bottom = Math.max(yA, yB);
    moveUnits(el, x / 4, bottom / 4);
    const lift = `${(bottom - yA) / 4}:${(bottom - yB) / 4}`;
    if (lift !== lastLift) {
      lastLift = lift;
      m.set('liftA', (bottom - yA) / 4);
      m.set('liftB', (bottom - yB) / 4);
      m.seek(m.localTick);            // redraw now so the lift lands on the same frame as the move
    }
  };

  const settle = () => { yA = under(A_FEET); yB = under(B_FEET); };

  const setMode = (next: typeof mode) => {
    if (mode === next) return;
    mode = next;
    if (next === 'hifive') m.set('since', m.localTick);
    m.set('mode', next);
  };

  m.on('done', () => { if (mode === 'hifive') setMode(hovered ? 'stand' : 'walk'); });

  const step = () => {
    if (mode !== 'walk') return;
    if (wait > 0) { wait--; return; }
    const tA = under(A_FEET), tB = under(B_FEET);
    let climbing = false;
    if (tB < yB) { yB -= RISE_PX; climbing = true; } else yB = tB;           // Bob leads, so he climbs first
    if (tA < yA) { if (!climbing) yA -= RISE_PX; climbing = true; } else yA = tA;
    if (!climbing) {
      x += STEP_PX;
      const W = width();
      if (!hifived && x + CANVAS_W / 2 >= W / 2) {
        hifived = true;
        settle();
        place();
        setMode('hifive');
        return;
      }
      if (x >= W) { x = -CANVAS_W; yA = 0; yB = 0; hifived = false; wait = REENTRY_TICKS; }
    }
    place();
  };

  // hover pauses (not during a high-five, which finishes first)
  el.addEventListener('pointerenter', () => { hovered = true; if (mode === 'walk') setMode('stand'); });
  el.addEventListener('pointerleave', () => { hovered = false; if (mode === 'stand' && !motion.reduced) setMode('walk'); });

  const still = () => {
    // reduced motion: standing mid-stair, on the poster pose
    x = Math.round((width() / 2 - CANVAS_W / 2) / 4) * 4;
    settle();
    mode = 'walk';
    setMode('stand');
    place();
  };

  let sub: TickSub | null = null;
  const run = () => { if (!sub && !motion.reduced) { sub = { kind: 'tick', onTick: step }; clock.add(sub); } };
  const halt = () => { if (sub) { clock.remove(sub); sub = null; } };
  observe(strip, { play: run, stop: halt });

  if (motion.reduced) still(); else place();
  motion.onChange((reduced) => {
    if (reduced) { halt(); still(); }
    else { setMode('walk'); if (strip.getBoundingClientRect().top < innerHeight + 200) run(); }
  });
}
