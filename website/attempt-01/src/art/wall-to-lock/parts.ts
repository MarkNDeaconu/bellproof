// wall-to-lock bitmaps: the question card, the padlock (shackle + body), the rounded `?` glyph.
// Light from the upper left everywhere: lit top/left edges, shadow bottom/right edges.

import { mask, part, type Part } from '../../engine';

/** Rounded 3×5 `?` (same letterform as tc-rounds' provider tiles, so the site's question marks match). */
export const QMARK = mask(`
  ##.
  ..#
  .#.
  ...
  .#.
`, 'k', 'wtl-qmark');

/**
 * Question card 6×8: `p` face, selective outline (the owner colour on the lit top edge = the "tab",
 * `l` lit left edge, `t` shadow right/bottom edges), rounded corners. The glyph is blitted on top.
 * `b` in the map is the owner colour, recoloured at draw time (Alice `b`, Bob `v`).
 */
export const CARD_W = 6;
export const CARD_H = 8;
export const CARD = part(`
  .bbbb.
  lppppt
  lppppt
  lppppt
  lppppt
  lppppt
  lppppt
  .tttt.
`, 'wtl-card');
/** Glyph offset inside the card. */
export const CARD_GLYPH: readonly [number, number] = [1, 1];

/**
 * Padlock, 10×12 overall: an 8-wide shackle (2-px legs) on a 10×7 body.
 * The shackle part is 8×7; its last two rows sit inside the body when closed (hidden by the body), so the
 * long left leg still reaches into the body when the shackle is raised 2 px (open), while the short right
 * leg is cut 2 rows above the body (the gap that says "unlocked").
 */
export const LOCK_W = 10;
export const LOCK_H = 12;
export const SHACKLE = part(`
  ..eell..
  .ellllt.
  el....lt
  el....lt
  el....lt
  el....lt
  el....lt
`, 'wtl-shackle');
export const SHACKLE_X = 1;
/** Body: top row 5 of the lock. */
export const BODY_Y = 5;
export const BODY = part(`
  .eeeeeell.
  ellmmmmmms
  elmmkkmmms
  lmmmkkmmms
  lmmmmkmmms
  lmmmmmmmss
  .ssssssss.
`, 'wtl-body');

export type { Part };
