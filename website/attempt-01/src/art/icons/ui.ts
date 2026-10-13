// Static 1-colour UI glyphs (art-spec card 11, design-spec §4.9). Drawn in `k`; icon() renders them as
// inline SVG with fill="currentColor", so the colour always follows the text around them.
//
// One stroke system for the whole set:
//   · every stroke is 1 art px (4 CSS px at U);
//   · diagonals are 1:1 stair steps that touch only at corners (no doubles, no L-corners);
//   · the arrowhead of `ui-arrow`, the `ui-chevron` and the `ui-caret` are the same 3-step chevron,
//     so a button's › and a list's → and an accordion's ⌄ are one shape turned;
//   · the 7×7 glyphs fill their whole box (optical size 28 px); the check spans 7×5 because a tick
//     is wider than tall, and it is centred vertically.
// Variants hold the in-between frames for pixel-stepped glyph swaps (see motion.ts → MORPHS).

import { definePiece, mask, type Part, type Piece } from '../../engine';

interface GlyphDef { map: string; alt?: string; variants?: Record<string, string> }

export const GLYPH_MAPS = {
  'ui-chevron': {
    map: `
      .#...
      ..#..
      ...#.
      ..#..
      .#...`,
    variants: {
      // › turned 45° (the middle frame of the accordion's › → ⌄ swap)
      turn: `
        .....
        ...#.
        ...#.
        .###.
        .....`,
      // ⌄ in the chevron's own 5×5 box, so the swap never changes the icon's footprint
      down: `
        .....
        #...#
        .#.#.
        ..#..
        .....`,
      // ‹ (back / previous)
      left: `
        ...#.
        ..#..
        .#...
        ..#..
        ...#.`,
    },
  },
  'ui-arrow': {
    map: `
      ....#..
      .....#.
      #######
      .....#.
      ....#..`,
  },
  'ui-external': {
    map: `
      ...####
      .....##
      #...#.#
      #..#..#
      #.#....
      #......
      #####..`,
  },
  // ↗ alone for buttons and inline links, where the 7×7 bracket version outweighs the label and the
  // 20-px chevron beside it. Same head (vertex + 2) as the chevron family.
  'ui-external-sm': {
    map: `
      ..###
      ...##
      ..#.#
      .#...
      #....`,
  },
  'ui-check': {
    map: `
      .......
      ......#
      .....#.
      #...#..
      .#.#...
      ..#....
      .......`,
  },
  // The diamond's tips are flattened to 3 px (a stepped diamond): 1-px steps all round read as a
  // spiky bug at 28 px. The ! is knocked out: 3-px bar, 1-px gap, 1-px dot.
  'ui-warn': {
    map: `
      ..###..
      .##.##.
      ###.###
      ###.###
      #######
      .##.##.
      ..###..`,
  },
  'ui-close': {
    map: `
      #.....#
      .#...#.
      ..#.#..
      ...#...
      ..#.#..
      .#...#.
      #.....#`,
  },
  'ui-menu': {
    map: `
      #..#..#
      .......
      .......
      #..#..#
      .......
      .......
      #..#..#`,
    variants: {
      // the nine dots slide onto the diagonals: the middle frame of menu → close
      mid: `
        #.....#
        .......
        ..#.#..
        ...#...
        ..#.#..
        .......
        #.....#`,
    },
  },
  // 1-3-5-7 stair (2:1 slope) with single-pixel corners; set one column right of the box's left edge
  // so the triangle's centroid sits on the box centre (optical centring of ▶).
  'ui-play': {
    map: `
      .#......
      .###....
      .#####..
      .#######
      .#######
      .#####..
      .###....
      .#......`,
  },
  'ui-caret': {
    map: `
      #...#
      .#.#.
      ..#..`,
  },
  // Social tiles: a rounded 7×7 tile with a 3×5 letter knocked out (letters only, no brand marks).
  'social-g': {
    map: `
      .#####.
      ##...##
      ##.####
      ##.#.##
      ##.#.##
      ##...##
      .#####.`,
  },
  'social-x': {
    map: `
      .#####.
      ##.#.##
      ##.#.##
      ###.###
      ##.#.##
      ##.#.##
      .#####.`,
  },
  'social-d': {
    map: `
      .#####.
      ##..###
      ##.#.##
      ##.#.##
      ##.#.##
      ##..###
      .#####.`,
  },
} satisfies Record<string, GlyphDef>;

export type GlyphId = keyof typeof GLYPH_MAPS;

function glyph(id: string, def: GlyphDef): Piece {
  const base: Part = mask(def.map, 'k', id);
  const vparts: Record<string, Part> = {};
  for (const [v, rows] of Object.entries(def.variants ?? {})) vparts[v] = mask(rows, 'k', `${id}:${v}`);
  const variants = Object.keys(vparts).length
    ? Object.fromEntries(Object.entries(vparts).map(([v, p]) => [v, [p.w, p.h] as [number, number]]))
    : undefined;
  return definePiece({
    id,
    size: [base.w, base.h],
    variants,
    ticksPerFrame: 1,
    loopTicks: 1,
    poster: 0,
    maxColours: 1,
    palette: ['k'],
    alt: def.alt ?? '',
    cache: 'loop',
    frame(_tick, g, _io, variant) { g.blit(variant ? vparts[variant] : base, 0, 0); },
  });
}

export const uiChevron = glyph('ui-chevron', GLYPH_MAPS['ui-chevron']);
export const uiArrow = glyph('ui-arrow', GLYPH_MAPS['ui-arrow']);
export const uiExternal = glyph('ui-external', GLYPH_MAPS['ui-external']);
export const uiExternalSm = glyph('ui-external-sm', GLYPH_MAPS['ui-external-sm']);
export const uiCheck = glyph('ui-check', GLYPH_MAPS['ui-check']);
export const uiWarn = glyph('ui-warn', GLYPH_MAPS['ui-warn']);
export const uiClose = glyph('ui-close', GLYPH_MAPS['ui-close']);
export const uiMenu = glyph('ui-menu', GLYPH_MAPS['ui-menu']);
export const uiPlay = glyph('ui-play', GLYPH_MAPS['ui-play']);
export const uiCaret = glyph('ui-caret', GLYPH_MAPS['ui-caret']);
export const socialG = glyph('social-g', GLYPH_MAPS['social-g']);
export const socialX = glyph('social-x', GLYPH_MAPS['social-x']);
export const socialD = glyph('social-d', GLYPH_MAPS['social-d']);

export const UI_PIECES = [uiChevron, uiArrow, uiExternal, uiExternalSm, uiCheck, uiWarn, uiClose, uiMenu, uiPlay, uiCaret, socialG, socialX, socialD];
