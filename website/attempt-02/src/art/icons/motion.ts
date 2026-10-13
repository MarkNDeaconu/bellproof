// Browser helpers for the icon set. Nothing here runs at import time, so Node (validate, sheet) can
// import the module safely. All helpers honour reduced motion (engine `motion.reduced`).
//
//   hoverable(target, mounted)  → wires pointer + focus on `target` to a hover-gesture piece (cta-*, tc-glyph)
//   flipTile(mounted, face)     → round-tile: 2-frame flip into a face, starting on the next tick
//   fadeTile(mounted, face)     → round-tile: 4-tick dither fade from the current face into `face`
//   flickerOnce(mounted)        → question-block: one ? T C ? T C ? flicker, from the next tick
//   morph(holder, MORPHS.menuToClose)  → pixel-stepped glyph swap of an inline icon SVG (83 ms/step)

import { icon, motion, type Mounted } from '../../engine';
import type { TileFace } from './round-tile';

// Since engine E9, cache-'none' pieces receive the absolute local tick, so start ticks are absolute:
// `mounted.localTick + 1` is the next tick the piece will draw (setting `localTick` itself would skip
// the first frame of a 2-frame flip).
const nextTick = (m: Mounted): number => m.localTick + 1;

/** Hover + keyboard focus on `target` drive io.hover / io.hoverAt of a mounted cta-* piece. */
export function hoverable(target: HTMLElement, m: Mounted): () => void {
  const on = () => {
    if (motion.reduced) return;
    m.set('hoverAt', nextTick(m));
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

/** question-block: one flicker (14 ticks), starting on the next tick. No-op under reduced motion. */
export function flickerOnce(m: Mounted): void {
  if (motion.reduced || m.piece.id !== 'question-block') return;
  m.set('flicker', nextTick(m));
}

/**
 * round-tile: show `face`. With motion: a 2-frame narrow flip from the next tick (into 'ok' it adds a
 * 1-tick white flash). Reduced motion (or `instant`): the face changes in place.
 */
export function flipTile(m: Mounted, face: TileFace, instant = false): void {
  m.set('face', face);
  m.set('flip', motion.reduced || instant ? -1 : nextTick(m));
}

/** round-tile: 4-tick ordered-dither fade from the current face into `face` (reduced motion: in place). */
export function fadeTile(m: Mounted, face: TileFace): void {
  const from = (m.io.face as TileFace) ?? '?';
  m.set('from', from);
  m.set('flip', -1);
  m.set('face', face);
  m.set('fade', motion.reduced ? -1 : nextTick(m));
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
