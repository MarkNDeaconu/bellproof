// wall-to-lock bitmaps (revision 1, at scale): the question card, the padlock (shackle + body), the chip box.
// Light from the upper left everywhere: lit top/left edges, shadow bottom/right edges.

import { part, type Part } from '../../engine';

/**
 * Question card 9×11: `p` face, selective outline (the owner colour on the lit top edge = the "tab",
 * `l` lit left edge, `t` shadow right/bottom edges), rounded corners. A 5×7 `?` is drawn on it with g.text().
 * `b` in the map is the owner colour, recoloured at draw time (Alice `b`, Bob `v`).
 */
export const CARD_W = 9;
export const CARD_H = 11;
export const CARD = part(`
  .bbbbbbb.
  lpppppppt
  lpppppppt
  lpppppppt
  lpppppppt
  lpppppppt
  lpppppppt
  lpppppppt
  lpppppppt
  lpppppppt
  .ttttttt.
`, 'wtl-card');
/** Glyph offset inside the card (font5x7). */
export const CARD_GLYPH: readonly [number, number] = [2, 2];

/**
 * Padlock 14×16: a 12-wide shackle with 2-px legs (inner hole 8 wide, so the card's 7-px tab shows through it)
 * on a 14×10 body. The shackle part is 12×8; its last two rows sit behind the body when it is shut.
 */
export const LOCK_W = 14;
export const LOCK_H = 16;
export const SHACKLE = part(`
  ...eelllt...
  .eelllllltt.
  eel......ltt
  el........lt
  el........lt
  el........lt
  el........lt
  el........lt
`, 'wtl-shackle');
export const SHACKLE_X = 1;
export const BODY_Y = 6;
export const BODY = part(`
  .eeeeeeeeeell.
  ellmmmmmmmmmms
  elmmmmmmmmmmms
  lmmmmkkkkmmmms
  lmmmmkkkkmmmms
  lmmmmmkkmmmmms
  lmmmmmkkmmmmms
  lmmmmmmmmmmmss
  lmmmmmmmmmmmss
  .ssssssssssss.
`, 'wtl-body');

/**
 * Chip box 12×10 (the sample box under the mixing chamber): `s` shell, lit `e` top/left, `t`/`m` shaded
 * right/bottom, a 4×3 `k` window. The 2×1 qubit is set by the fridge drawer in its owner's colour.
 */
export const BOX_W = 12;
export const BOX_H = 10;
export const BOX = part(`
  .ssssssssss.
  seeeeeeeeems
  sellllllltms
  selkkkklltms
  selkkkklltms
  selkkkklltms
  sellllllltms
  sellllllltms
  semmmmmmmmms
  .ssssssssss.
`, 'wtl-box');
/** Window (relative to the box) and the 2×1 qubit inside it. */
export const BOX_WINDOW = { x: 3, y: 3, w: 4, h: 3 } as const;
export const BOX_QUBIT: readonly [number, number] = [4, 4];

export type { Part };
