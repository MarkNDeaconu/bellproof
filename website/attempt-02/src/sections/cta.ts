// Section 10 · CTA band · `#cta` (design-spec §4.7/§5.10, revision-1 §1.8). Owner: sections-3.
//
//   head      eyebrow (azure), display headline (one sentence per line, balanced), lead
//   cells     a `.cells` row of 3 link rows: each whole cell is the link — [cta-* lg sprite 48 px] [h4 + body] [↗ / ›];
//             hovering or focusing a cell plays its sprite's gesture (hoverable)
//   contact   one centred primary-on-dark "Contact" button
//   dusk      the bands `dusk()` staircase (night → violet → indigo) and the walkers driver
//
// Walkers (qubit-folk `walkers`, `stairs` 40×32): the canvas moves 4 CSS px per 12 fps tick; each creature stands on
// the highest step under its feet (drops are instant, the 56 px riser at each tier is climbed one step per tick, Bob
// first). Mid-way they stop for one high-five, walk off the right edge and re-enter 2 s later. Hover pauses them.
// The driver ticks only while the strip is near the viewport and motion runs: the pause switch or reduced motion
// stops it at once (the pair freezes in place, standing; off-screen it is placed mid-stair). Coordination hook for the
// footer's arrival scene: `bp:walkers` events (see dispatch/listen below).

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { clock, hasPiece, motion, mountedOf, moveUnits, observe, type Mounted, type TickSub } from '../engine';
import { escapeHTML as esc, isExternal } from '../content/strings';
import { dusk } from '../art/bands';
import { hoverable } from '../art/icons/motion';
import { button, extGlyph, icon, snapAll } from './verify';

const STEP_PX = 4;                  // canvas advance per tick
const RISE_PX = 8;                  // one staircase step per tick when climbing
const CANVAS_W = 160;
const A_FEET: [number, number] = [12, 36];    // Alice's foot span in css px from the canvas left (art x 3–8)
const B_FEET: [number, number] = [124, 148];  // Bob's (art x 31–36)
const REENTRY_TICKS = 24;

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const c = ctx.strings.cta;
  const walkerId = hasPiece('walkers') ? 'walkers' : 'placeholder';
  // one sentence per line (layout #10); the visible text is the string verbatim
  const sentences = c.h2.split(/(?<=\.)\s+/);

  root.innerHTML = `
    <div class="wrap cta-head">
      <p class="eyebrow" data-reveal="1">${esc(c.eyebrow)}</p>
      <h2 class="display cta-h" data-reveal="2">${sentences.map((t) => `<span class="cta-h__s">${esc(t)}</span>`).join(' ')}</h2>
      <p class="lead" data-reveal="3">${esc(c.lead)}</p>
    </div>
    <div class="wrap cta-cells-wrap">
      <div class="cells cta-cells">
        ${c.cells.map((cell) => {
          const id = hasPiece(cell.piece) ? cell.piece : 'placeholder';
          const variant = id === 'placeholder' ? 'sm' : 'lg';
          return `<a class="cell cell--link cta-cell" href="${esc(cell.href)}">
            <span class="cta-cell__icon"><span class="px" data-piece="${id}" data-variant="${variant}" data-decorative></span></span>
            <span class="cta-cell__text"><h3 class="h4 cta-cell__title">${esc(cell.title)}</h3><span class="cta-cell__body">${esc(cell.body)}</span></span>
            <span class="cta-cell__glyph">${icon(isExternal(cell.href) ? extGlyph() : 'ui-chevron')}</span>
          </a>`;
        }).join('')}
      </div>
    </div>
    <div class="wrap cta-final">${button(c.contact, 'primary-on-dark')}</div>
    <div class="cta-dusk">
      <div class="cta-stairs" aria-hidden="true"></div>
      <div class="cta-walk">
        <span class="px cta-walker" data-piece="${walkerId}"${walkerId === 'walkers' ? ' data-variant="stairs" data-io-mode="walk"' : ''} data-decorative></span>
      </div>
    </div>`;

  hydrate(root);
  snapAll(root, '.cta-cell__icon');            // grid thirds are fractional: keep the sprites on whole pixels

  root.querySelectorAll<HTMLElement>('.cta-cell').forEach((cell) => {
    const m = mountedOf(cell.querySelector('.cta-cell__icon .px')!);
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
  let hovered = false, hifived = false, wait = 0, visible = false, footerBusy = false;
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
  const announce = (state: 'enter' | 'exit') =>
    document.dispatchEvent(new CustomEvent('bp:walkers', { detail: { where: 'cta', state } }));

  m.on('done', () => { if (mode === 'hifive') setMode(hovered ? 'stand' : 'walk'); });
  // the footer's arrival scene may hold the CTA pair off-stage while its own pair is visible
  document.addEventListener('bp:walkers', (e) => {
    const d = (e as CustomEvent<{ where: string; state: string }>).detail;
    if (d?.where === 'footer') footerBusy = d.state === 'present';
  });

  const step = () => {
    if (mode !== 'walk') return;
    if (wait > 0) { wait--; return; }
    if (x === -CANVAS_W && footerBusy) return;
    if (x === -CANVAS_W) announce('enter');
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
      if (x >= W) { x = -CANVAS_W; yA = 0; yB = 0; hifived = false; wait = REENTRY_TICKS; announce('exit'); }
    }
    place();
  };

  // hover pauses (not during a high-five, which finishes first)
  el.addEventListener('pointerenter', () => { hovered = true; if (mode === 'walk') setMode('stand'); });
  el.addEventListener('pointerleave', () => { hovered = false; if (mode === 'stand' && !motion.reduced) setMode('walk'); });

  const midStair = () => { x = Math.round((width() / 2 - CANVAS_W / 2) / 4) * 4; settle(); };

  let sub: TickSub | null = null;
  const run = () => { if (!sub && visible && !motion.reduced) { sub = { kind: 'tick', onTick: step }; clock.add(sub); } };
  const halt = () => { if (sub) { clock.remove(sub); sub = null; } };
  observe(strip, { play() { visible = true; run(); }, stop() { visible = false; halt(); } });

  /** Stop and stand: in place if the pair is on stage, else mid-stair (reduced motion at load, or paused off-stage). */
  const freeze = () => {
    halt();
    if (x < 0 || x > width() - CANVAS_W) midStair();
    mode = 'walk';
    setMode('stand');
    place();
  };

  if (motion.reduced) freeze(); else place();
  motion.onChange((reduced) => {
    if (reduced) freeze();
    else { setMode('walk'); run(); }
  });
}
