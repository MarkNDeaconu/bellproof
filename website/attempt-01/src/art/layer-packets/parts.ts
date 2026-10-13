// Static pixel parts for the layer-packets family (lab, vault, packets). Keys: design-spec §1.7.
// Light from the upper left everywhere; paper-coloured packets carry a slate outline so they read on paper.

import { part, type Part } from '../../engine';

// ── packets ────────────────────────────────────────────────────────────────────────────────────

/** Escrow token, face on (6×6): a dark blue rim, a cornflower inner ring and an azure face with a glint. */
export const COIN_FACE = part(`
  .bbbb.
  bccccb
  bcwacb
  bcaacb
  bccccb
  .bbbb.
`, 'coin-face');

/** Token turned ¾ (spin frame). */
export const COIN_TURN = part(`
  ..bb..
  .bccb.
  .bwab.
  .bcab.
  .bccb.
  ..bb..
`, 'coin-turn');

/** Token edge-on (spin frame). */
export const COIN_EDGE = part(`
  ..bb..
  ..cb..
  ..cb..
  ..cb..
  ..cb..
  ..bb..
`, 'coin-edge');

/** Job envelope (8×6): flap lines run out of the top corners to a violet wax seal. */
export const ENVELOPE = part(`
  mmmmmmmm
  mmppppmm
  mpmppmpm
  mppvvppm
  mppppppm
  mmmmmmmm
`, 'envelope');

/** Encrypted challenge card (7×10): a padlock on the top edge, a `?` inside. */
export const CHALLENGE = part(`
  ...m...
  ..m.m..
  mmsssmm
  mpsespm
  mpkkkpm
  mpppkpm
  mppkkpm
  mpppppm
  mppkppm
  mmmmmmm
`, 'challenge');

/** Certified result (8×8): a scroll with rolled ends, two text lines and an indigo seal. */
export const SCROLL = part(`
  .mmmmmm.
  meeeeeem
  .mppppm.
  .mlllpm.
  .mppppm.
  .mlliim.
  mllliilm
  .mmmmmm.
`, 'scroll');
