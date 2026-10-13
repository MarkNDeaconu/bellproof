// fridge-badge (card 10b), 24×24: the mini fridge with a verification badge that flips `?` ⇄ `✓`.
// Reused by `art-clients` for the Providers tab. Loop 48 at 6 fps; poster 30 (✓).

import { definePiece, font3x5, type Grid, type Key, type Part } from '../../engine';
import { drawFridgeMini, MINI } from './recipe';

/** The mini runs 8 ticks ahead inside the badge so its qubit answers (tick 20) right before the flip to ✓ (22–24). */
const MINI_LEAD = 8;

/** Badge tile geometry (relative to the piece). */
export const BADGE = { x: 16, y: 16, w: 8, h: 8 } as const;

type Face = '?' | '✓';
const GLYPH_KEY: Record<Face, Key> = { '?': 't', '✓': 'b' };

/**
 * Which face/width the tile shows at `tick` (loop 48, 6 fps):
 *   0      narrow `?`   (second half of the ✓ → ? flip)
 *   2–20   full `?`
 *   22     narrow `?`   (first half of the ? → ✓ flip)
 *   24     narrow `✓`
 *   26–44  full `✓`     (poster 30)
 *   46     narrow `✓`
 */
export function badgeFace(tick: number): { face: Face; narrow: boolean } {
  const t = ((tick % 48) + 48) % 48;
  if (t < 2) return { face: '?', narrow: true };
  if (t < 22) return { face: '?', narrow: false };
  if (t < 24) return { face: '?', narrow: true };
  if (t < 26) return { face: '✓', narrow: true };
  if (t < 46) return { face: '✓', narrow: false };
  return { face: '✓', narrow: true };
}

/**
 * Draws the 8×8 badge at (ox, oy). Rounded `p` tile, selective outline: `l` on the lit top/left, `t` on the shadow
 * bottom/right; 3×5 glyph `?` in steel or `✓` in blue. `narrow` draws the mid-flip frame (4 px wide, glyph squashed).
 */
export function drawBadge(g: Grid, ox: number, oy: number, face: Face, narrow = false): void {
  const w = narrow ? 4 : BADGE.w, h = BADGE.h;
  const x0 = ox + (BADGE.w - w) / 2;
  // face
  g.rect(x0 + 1, oy + 1, w - 2, h - 2, 'p');
  // outline, rounded corners
  for (let x = x0 + 1; x < x0 + w - 1; x++) { g.set(x, oy, 'l'); g.set(x, oy + h - 1, 't'); }
  for (let y = oy + 1; y < oy + h - 1; y++) { g.set(x0, y, 'l'); g.set(x0 + w - 1, y, 't'); }
  const glyph: Part = font3x5.glyphs[face];
  const key = GLYPH_KEY[face];
  // `?` uses all 5 rows (sits on the lower baseline); `✓` uses only the lower 4, so it is lifted 1 to centre it
  const gy = oy + (face === '✓' ? 1 : 2);
  if (!narrow) {
    g.blit(glyph, ox + 2, gy, { recolor: { k: key } });
    return;
  }
  // edge-on: keep glyph columns 1–2 (the half turned toward the viewer); OR-squashing all 3 made a solid blob
  for (let y = 0; y < 5; y++) for (let c = 0; c < 2; c++) {
    if (glyph.data[y * 3 + c + 1]) g.set(x0 + 1 + c, gy + y, key);
  }
}

export const fridgeBadge = definePiece({
  id: 'fridge-badge',
  size: [24, 24],
  ticksPerFrame: 2,
  loopTicks: 48,
  poster: 30,
  maxColours: 12,
  palette: [...MINI.palette, 'p', 'b'],
  alt: 'Pixel-art quantum computer with a badge that flips from a question mark to a check mark.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    drawFridgeMini(g, 0, 0, tick + MINI_LEAD);
    const { face, narrow } = badgeFace(tick);
    drawBadge(g, BADGE.x, BADGE.y, face, narrow);
  },
});
