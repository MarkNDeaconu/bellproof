// Browser helpers for the icon set. Nothing here runs at import time, so Node (validate, sheet) can
// import the module safely. All helpers honour reduced motion (engine `motion.reduced`).
//
//   hoverable(target, mounted)  → wires pointer + focus on `target` to a hover-gesture piece (cta-*)
//   bumpOnce(mounted)           → plays question-block's bump once, from the next tick
//   morph(holder, MORPHS.menuToClose)  → pixel-stepped glyph swap of an inline icon SVG (83 ms/step)

import { icon, motion, type Mounted } from '../../engine';

/** Hover + keyboard focus on `target` drive io.hover / io.hoverAt of a mounted cta-* piece. */
export function hoverable(target: HTMLElement, m: Mounted): () => void {
  const loop = m.piece.loopTicks;
  const on = () => {
    if (motion.reduced) return;
    m.set('hoverAt', (((m.localTick + 1) % loop) + loop) % loop);
    m.set('hover', true);
  };
  const off = () => m.set('hover', false);
  const onFocusIn = () => { if ((target as Element).matches(':focus-within')) on(); };
  target.addEventListener('pointerenter', on);
  target.addEventListener('pointerleave', off);
  target.addEventListener('focusin', onFocusIn);
  target.addEventListener('focusout', off);
  return () => {
    target.removeEventListener('pointerenter', on);
    target.removeEventListener('pointerleave', off);
    target.removeEventListener('focusin', onFocusIn);
    target.removeEventListener('focusout', off);
  };
}

/** question-block: bump once (8 ticks), starting on the next tick. No-op under reduced motion. */
export function bumpOnce(m: Mounted): void {
  if (motion.reduced || m.piece.id !== 'question-block') return;
  const start = (m.localTick + 1) % 36;
  m.set('bump', start);
  const off = m.on('bumped', () => { off(); m.set('bump', -1); });
}

export interface MorphStep { id: string; variant?: string }

/** Named pixel-stepped swaps. Each footprint stays constant within a morph (no layout shift). */
export const MORPHS = {
  menuToClose: [{ id: 'ui-menu' }, { id: 'ui-menu', variant: 'mid' }, { id: 'ui-close' }],
  closeToMenu: [{ id: 'ui-close' }, { id: 'ui-menu', variant: 'mid' }, { id: 'ui-menu' }],
  chevronToDown: [{ id: 'ui-chevron' }, { id: 'ui-chevron', variant: 'turn' }, { id: 'ui-chevron', variant: 'down' }],
  downToChevron: [{ id: 'ui-chevron', variant: 'down' }, { id: 'ui-chevron', variant: 'turn' }, { id: 'ui-chevron' }],
} satisfies Record<string, MorphStep[]>;

const running = new WeakMap<Element, number>();

/**
 * Swap the inline icon SVG inside `holder` through `steps`, one sprite tick (83 ms) per step.
 * Reduced motion: jumps to the last step. Resolves when the last step is shown.
 */
export function morph(holder: Element, steps: MorphStep[], opts: { size?: number; ms?: number; label?: string } = {}): Promise<void> {
  const ms = opts.ms ?? 1000 / 12;
  const token = (running.get(holder) ?? 0) + 1;
  running.set(holder, token);
  const show = (s: MorphStep) => {
    const svg = icon(s.id, { size: opts.size, variant: s.variant, label: opts.label });
    const prev = holder.querySelector('svg.icon');
    if (prev) prev.replaceWith(svg); else holder.append(svg);
  };
  if (motion.reduced || steps.length < 2) { show(steps[steps.length - 1]); return Promise.resolve(); }
  return new Promise((resolve) => {
    let i = 1;
    const next = () => {
      if (running.get(holder) !== token) return resolve();
      show(steps[i]);
      if (++i < steps.length) setTimeout(next, ms); else resolve();
    };
    setTimeout(next, 0);
  });
}
