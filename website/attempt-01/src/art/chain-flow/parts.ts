// Shared drawing for the chain-flow family (card 9): the chain block body, coins, figures.
// Pure functions of their arguments; integer coordinates only.

import { part, type Grid, type Key, type Part } from '../../engine';

// ---------------------------------------------------------------------------------------------
// Block body. A chunky 3/4-view block (light from the upper left): a large top face carrying the
// glyph, a short front face, a 1-px right face and an indigo edge. 14 wide; height 14 at rest.
// ---------------------------------------------------------------------------------------------

export interface BlockInk { top: Key; front: Key; right: Key; edge: Key; hi: Key; bit: Key }

export const LIT: BlockInk = { top: 'g', front: 'c', right: 'b', edge: 'i', hi: 'w', bit: 'b' };
export const UNLIT: BlockInk = { top: 'a', front: 'b', right: 'i', edge: 'v', hi: 'u', bit: 'i' };

/**
 * Draw a block body with its top-left corner at (x, y).
 * `h` is the total height: 14 at rest, 13 squashed, 16 smeared. `topRows` is the height of the top face.
 * Returns the y of the top face's first row (glyph anchor).
 */
export function blockBody(g: Grid, x: number, y: number, ink: BlockInk, h = 14, w = 14, topRows?: number, bits?: number): number {
  const faceW = w - 3;                       // top/front face width (11 for a 14-wide block)
  const tr = topRows ?? h - 5;               // top face rows (9 at rest)
  // outline top edge (corners cut)
  for (let i = 1; i <= faceW; i++) g.set(x + i, y, ink.edge);
  for (let r = 1; r < h - 1; r++) {
    g.set(x, y + r, ink.edge);
    const face = r <= tr ? ink.top : ink.front;
    for (let i = 1; i <= faceW; i++) g.set(x + i, y + r, face);
    if (r === 1) { g.set(x + faceW + 1, y + r, ink.edge); continue; }
    g.set(x + faceW + 1, y + r, ink.right);
    g.set(x + faceW + 2, y + r, ink.edge);
  }
  for (let i = 1; i <= faceW + 1; i++) g.set(x + i, y + h - 1, ink.edge);
  // top-left bevel highlight: two pixels along the top, one down the side
  g.set(x + 1, y + 1, ink.hi); g.set(x + 2, y + 1, ink.hi); g.set(x + 1, y + 2, ink.hi);
  // front face: a row of hash bits (the block's "data"), 1-px dots every other column
  if (bits !== undefined && h - 1 - (tr + 1) >= 2) {
    const by = y + tr + 2;
    for (let i = 0; i < 5; i++) if ((bits >> i) & 1) g.set(x + 2 + i * 2, by, ink.bit);
  }
  return y + 1;
}

// ---------------------------------------------------------------------------------------------
// Coins (face-on, 5×5): azure face, white glint upper left, cornflower/blue rim lower right.
// ---------------------------------------------------------------------------------------------

export const COIN: Part = part(`
  .gaa.
  gwaac
  aaacc
  aaccc
  .bbb.
`, 'coin');

/** A coin cracked through (1-px raspberry crack). */
export const COIN_CRACK: Part = part(`
  .gRa.
  gwRac
  aaRcc
  aRccc
  .Rbb.
`, 'coin-crack');

/** Left and right halves of a split coin; each keeps a raspberry broken face. */
export const COIN_HALF_L: Part = part(`
  .gR
  gwR
  aaR
  aR.
  .R.
`, 'coin-half-l');
export const COIN_HALF_R: Part = part(`
  Ra.
  Rac
  Rcc
  Rcc
  Rb.
`, 'coin-half-r');
