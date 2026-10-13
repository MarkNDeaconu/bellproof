// logo-mark · art-spec card 16 · the pixel bell. Owner: art-logo-mark (fable).
//
// Two faces of one bitmap:
//   1. The registered piece `logo-mark` (12×11, 1 colour) for the harness, the validator, contact sheets and
//      `icon('logo-mark', { size })` (poster = the resting mark). Its 48-tick loop plays the ring once (ticks 0–11)
//      then rests, so the sheet documents the timeline. Variants: `halo` 18×17 (3-px margin so the azure halo
//      fits), `dark` and `halo-dark` (paper-coloured, for ink backgrounds).
//   2. The SVG rect grid for the page (`markSVG`, `navMark`, `footerMark`), the only art rendered at scales
//      other than 4 (integer scales only), plus `ring()` and `footerReveal()` for the footer.
// `public/favicon.svg` and `public/og.png` are generated from the same bitmap by tools/favicon.ts and tools/og.ts.

import { definePiece } from '../../engine/piece';
import type { Grid } from '../../engine/grid';
import type { Key } from '../../engine/palette';
import { BELL_H, BELL_W, HALO_MAX, bodyRuns, clapperRuns, haloRuns, markSVG, type MarkSVGOpts } from './bell';
import { RING_TICKS, ringState } from './ring';

export { BELL, BELL_H, BELL_ROWS, BELL_W, CLAPPER_ROW, HALO_MAX, bellPath, bodyRuns, clapperRuns, haloRuns, haloSVG, markSVG } from './bell';
export type { MarkSVGOpts, Run } from './bell';
export { RING_TICKS, applyRingFrame, footerReveal, ring, ringState } from './ring';
export type { FooterRevealHandle, FooterRevealOpts, RingFrame } from './ring';

/** Nav: 2 CSS px per art px → 24×22. Footer giant: 20 → 240×220. */
export const NAV_SCALE = 2;
export const FOOTER_SCALE = 20;
export const LOOP_TICKS = 48;

export const logoMark = definePiece({
  id: 'logo-mark',
  size: [BELL_W, BELL_H],
  variants: { halo: [BELL_W + 2 * HALO_MAX, BELL_H + 2 * HALO_MAX], dark: [BELL_W, BELL_H], 'halo-dark': [BELL_W + 2 * HALO_MAX, BELL_H + 2 * HALO_MAX] },
  ticksPerFrame: 1,
  loopTicks: LOOP_TICKS,
  poster: 24,
  maxColours: 3,   // k + a (light), p + a (dark): the validator counts across variants
  palette: ['k', 'p', 'a'],
  alt: 'Bellproof: a pixel bell with a check mark cut out of its skirt.',
  cache: 'loop',
  states: ['rest', 'ring'],
  exports: { ringTicks: RING_TICKS, navScale: NAV_SCALE, footerScale: FOOTER_SCALE },
  frame(tick: number, g: Grid, _io, variant?: string) {
    const dark = variant === 'dark' || variant === 'halo-dark';
    const halo = variant === 'halo' || variant === 'halo-dark';
    const k: Key = dark ? 'p' : 'k';
    const o = halo ? HALO_MAX : 0;
    const t = ((tick % LOOP_TICKS) + LOOP_TICKS) % LOOP_TICKS;
    const f = ringState(t);
    for (const [x, y, w] of bodyRuns()) g.rect(o + x, o + y, w, 1, k);
    for (const [x, y, w] of clapperRuns(f.dx)) g.rect(o + x, o + y, w, 1, k);
    if (halo && f.halo) for (const [x, y, w] of haloRuns(f.halo, f.dx)) g.rect(o + x, o + y, w, 1, 'a');
  },
  state(tick: number) { return ((tick % LOOP_TICKS) + LOOP_TICKS) % LOOP_TICKS < RING_TICKS ? 'ring' : 'rest'; },
  events(tick: number) { return ((tick % LOOP_TICKS) + LOOP_TICKS) % LOOP_TICKS === 0 ? ['ring'] : []; },
});

export default logoMark;

/** Build the mark as a live SVG element (browser only). */
export function markElement(opts: MarkSVGOpts): SVGSVGElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = markSVG(opts);
  return tpl.content.firstElementChild as SVGSVGElement;
}

/** The nav lockup's mark: 24×22, currentColor, aria-hidden (the wordmark text names the brand). */
export function navMark(opts: Partial<MarkSVGOpts> = {}): SVGSVGElement {
  return markElement({ scale: NAV_SCALE, className: 'mark--nav', ...opts });
}

/** The footer's giant mark: 240×220, currentColor, aria-hidden; hand it to `footerReveal()` and `ring()`. */
export function footerMark(opts: Partial<MarkSVGOpts> = {}): SVGSVGElement {
  return markElement({ scale: FOOTER_SCALE, className: 'mark--footer', ...opts });
}
