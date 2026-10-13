// art-certificates · hand-drawn ASCII parts (palette keys, '.' transparent). Light from the upper left.

import { part, type Part } from '../../engine';

// ── cert-mini ───────────────────────────────────────────────────────────────────────────────

/** 6×6 printed seal for the hero card: indigo disc, azure check (the logo's ✓), violet shadow rim. */
export const MINI_SEAL: Part = part(`
  .iiii.
  iiiiai
  iaiaiv
  iiaiiv
  iiiiiv
  .vvvv.
`, 'mini-seal');

/** 6×6 rubber stamp: knob, neck, base, violet inked die. */
export const MINI_STAMP: Part = part(`
  .lll..
  ltttm.
  .ltm..
  .ltm..
  lttttm
  vvvvvv
`, 'mini-stamp');

// ── cert-mint ───────────────────────────────────────────────────────────────────────────────

/** 9×9 bell wax seal: the logo bell (card 16, paper-on-dark rule) in glow on an indigo disc,
 *  lilac rim light upper-left, white specular, violet shadow crescent lower-right. */
export const BELL_SEAL: Part = part(`
  ..rriii..
  .rwigiii.
  riigggiii
  riigggiiv
  iiigggiiv
  iigggggiv
  igggggggv
  .iivgviv.
  ..vvvvv..
`, 'bell-seal');

/** 11×10 stamp tool: knob, neck, flared base, violet inked die. */
export const STAMP: Part = part(`
  ...lllll...
  ..ltttttm..
  ..ltttttm..
  ...tmmmm...
  ....ltm....
  ....ltm....
  .lllttttmm.
  ltttttttttm
  tmmmmmmmmms
  vvvvvvvvvvv
`, 'stamp');

/** 12×12 isometric chain block (2:1): top g, left c, right b, silhouette edges i. */
export const ISO_BLOCK: Part = part(`
  .....ii.....
  ...iiggii...
  .iiggggggii.
  iggggggggggi
  iccggggggbbi
  iccccggbbbbi
  icccccbbbbbi
  icccccbbbbbi
  icccccbbbbbi
  .iicccbbbii.
  ...iicbii...
  .....ii.....
`, 'iso-block');
