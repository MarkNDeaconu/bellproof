// card 15 · rails: the bottom-anchored rail stages the hero and the paradox band are built from, and rider resolution.

import { getPiece, hasPiece, sizeOf, stage, type BlockDef, type Stage } from '../../engine';

/** Resolve a rider piece: the real piece if registered, else the placeholder in the closest variant. */
export function resolveRider(piece: string, variant: string | undefined, size: [number, number]): { piece: string; variant?: string; size: [number, number] } {
  if (hasPiece(piece)) return { piece, variant, size: sizeOf(getPiece(piece), variant) };
  const v = size[0] >= 2 * size[1] ? 'wide' : size[0] <= 8 ? 'sm' : undefined;
  return { piece: 'placeholder', variant: v, size: sizeOf(getPiece('placeholder'), v) };
}

/** A rail: a bottom-anchored, fixed-height stage `M` wide against the left or right edge of `root`, all blocks in col 0.
 *  The floor is the rail's bottom = root's bottom, whatever root's height and whenever it is measured (B1). */
export function railStage(root: HTMLElement, side: 'l' | 'r', M: number, heightPx: number, blocks: BlockDef[], clip?: string): { el: HTMLElement; stage: Stage } {
  const el = document.createElement('div');
  el.className = `bands-rail bands-rail--${side}`;
  el.dataset.rail = side;
  el.style.cssText = `position:absolute;bottom:0;${side === 'l' ? 'left' : 'right'}:0;width:${M}px;height:${Math.ceil(heightPx / 4) * 4}px;` +
    (clip ? `overflow:visible;clip-path:${clip};` : '');
  root.appendChild(el);
  return { el, stage: stage(el, { module: M, blocks: blocks.map((b) => ({ ...b, col: 0 })) }) };
}

