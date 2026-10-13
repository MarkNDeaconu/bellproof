// card 15 · hero stage layouts (lg / md / sm), the paradox band layout, and the choreography as data.
// Pure data and pure functions: no DOM, no registry access (safe to import from Node scripts).
//
// Coordinates: `col` is in modules from the stage's LEFT edge; `rowFromFloor` in modules from the stage's bottom
// (0 = standing on the floor, negative = hidden below it). Right-anchored blocks use fractional columns computed
// from the stage width so they sit flush with the right edge whatever the width is: `rightCol(width, M)`.

import type { BlockDef, ChoreoStep, StageLayout } from '../../engine';
import type { Key } from '../../engine';

export type Breakpoint = 'lg' | 'md' | 'sm';

/** Module size per breakpoint (design §3.2). */
export const MODULE: Record<Breakpoint, number> = { lg: 128, md: 64, sm: 64 };

/** Breakpoint from the viewport width (design §3.1). */
export function breakpointFor(viewportWidth: number): Breakpoint {
  return viewportWidth >= 1024 ? 'lg' : viewportWidth >= 768 ? 'md' : 'sm';
}

/** Rider pieces and their declared sizes (art-spec cards 3a, 4a, 11). The stage substitutes `placeholder` when a piece is missing. */
export const RIDERS = {
  pair: { piece: 'qubit-pair', size: [32, 16] as [number, number], sm: { variant: 'sm', size: [24, 12] as [number, number] } },
  cert: { piece: 'cert-mini', size: [24, 20] as [number, number] },
  question: { piece: 'question-block', size: [16, 16] as [number, number] },
} as const;

export interface HeroRiderIds { pair: string; cert: string }
export const HERO_RIDER_IDS: HeroRiderIds = { pair: RIDERS.pair.piece, cert: RIDERS.cert.piece };

/** Column of a block flush with the stage's right edge. The width is snapped UP to the 4-px grid (≤ 3 px overhang,
 *  hidden by the stage's overflow) so every rest position is a multiple of 4 whatever the width. */
export function snapWidth(width: number): number { return Math.ceil(Math.max(0, width) / 4) * 4; }
export function rightCol(width: number, module: number, fromRight = 1): number { return (snapWidth(width) - fromRight * module) / module; }

/** Horizontal rider offset (art px) that centres a `w`-art-px sprite on a module of `M` css px. */
export function centreDx(M: number, w: number): number { return Math.round((M / 4 - w) / 2); }

export interface DotDef { block: string; corner: 'tl' | 'tr' }
export interface FloorRiderDef { id: string; piece: string; variant?: string; size: [number, number]; x: number }

export interface HeroLayout extends StageLayout {
  bp: Breakpoint;
  width: number;             // the (snapped) stage width the right columns were computed for
  rightCol: number;          // the right-edge column (rail at lg, corner stack at md/sm)
  dots: DotDef[];            // registration dots glued to stack tops
  floorRiders: FloorRiderDef[];   // sprites standing on the floor beside the blocks (md/sm pair)
  riderSizes: Record<string, [number, number]>;   // declared art-px size of each block rider, by block id
  diamondVariant?: string;   // `sm` below lg
}

export interface HeroLayoutOpts { riders?: Partial<HeroRiderIds> }

/**
 * The hero block layout for a breakpoint and stage width (design §5.1, art-spec card 15).
 *   lg: left rail stack violet/indigo/blue (+ qubit-pair on top) · left floor cornflower + mist half · right floor azure (+ cert-mini)
 *       · right rail indigo/blue, diamond one module above the stack, reservoir cornflower then azure under the floor.
 *   md: left rail stack indigo/blue · left floor cornflower + mist half · pair (sm) standing on the floor beside them
 *       · right floor azure (+ cert) one module in from the corner · corner stack indigo with the diamond on top + reservoir.
 *   sm: left corner stack indigo/blue · pair (sm) standing on the floor beside it · right corner indigo with the diamond on top + reservoir.
 */
export function heroLayout(bp: Breakpoint, width: number, opts: HeroLayoutOpts = {}): HeroLayout {
  const M = MODULE[bp];
  const pairId = opts.riders?.pair ?? HERO_RIDER_IDS.pair;
  const certId = opts.riders?.cert ?? HERO_RIDER_IDS.cert;
  const cR = rightCol(width, M);
  const blocks: BlockDef[] = [];
  const dots: DotDef[] = [];
  const floorRiders: FloorRiderDef[] = [];

  if (bp === 'lg') {
    blocks.push(
      { id: 'L1', col: 0, rowFromFloor: 0, size: 1, step: 'v' },
      { id: 'L2', col: 0, rowFromFloor: 1, size: 1, step: 'i' },
      { id: 'L3', col: 0, rowFromFloor: 2, size: 1, step: 'b', rider: { piece: pairId, dx: centreDx(M, RIDERS.pair.size[0]), dy: 0 } },
      { id: 'F1', col: 1, rowFromFloor: 0, size: 1, step: 'c' },
      { id: 'F2', col: 1, rowFromFloor: 1, size: 0.5, step: 'u' },
      { id: 'R1', col: cR - 1, rowFromFloor: 0, size: 1, step: 'a', rider: { piece: certId, dx: centreDx(M, RIDERS.cert.size[0]), dy: 0 } },
      { id: 'RR1', col: cR, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'RR2', col: cR, rowFromFloor: 1, size: 1, step: 'b' },
      { id: 'D', col: cR, rowFromFloor: 3, size: 1, step: 'v', kind: 'diamond' },
      { id: 'RRa', col: cR, rowFromFloor: -1, size: 1, step: 'c' },
      { id: 'RRb', col: cR, rowFromFloor: -2, size: 1, step: 'a' },
    );
    dots.push({ block: 'L3', corner: 'tr' }, { block: 'RR2', corner: 'tl' });
  } else {
    blocks.push(
      { id: 'L1', col: 0, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'L2', col: 0, rowFromFloor: 1, size: 1, step: 'b' },
    );
    if (bp === 'md') {
      blocks.push(
        { id: 'F1', col: 1, rowFromFloor: 0, size: 1, step: 'c' },
        { id: 'F2', col: 1, rowFromFloor: 1, size: 0.5, step: 'u' },
        { id: 'R1', col: cR - 2, rowFromFloor: 0, size: 1, step: 'a', rider: { piece: certId, dx: centreDx(M, RIDERS.cert.size[0]), dy: 0 } },
      );
    }
    blocks.push(
      { id: 'RR1', col: cR, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'D', col: cR, rowFromFloor: 1, size: 1, step: 'v', kind: 'diamond' },
      { id: 'RRa', col: cR, rowFromFloor: -1, size: 1, step: 'c' },
      { id: 'RRb', col: cR, rowFromFloor: -2, size: 1, step: 'a' },
    );
    dots.push({ block: 'L2', corner: 'tr' });
    // the pair (sm variant, 96 px) is wider than a 64 block: it stands on the floor beside the stack (design §5.1 sm)
    floorRiders.push({ id: 'pair', piece: pairId, variant: RIDERS.pair.sm.variant, size: RIDERS.pair.sm.size, x: bp === 'md' ? 2 * M : M });
  }
  const riderSizes: Record<string, [number, number]> = { L3: RIDERS.pair.size, R1: RIDERS.cert.size };
  return { bp, module: M, width: snapWidth(width), rightCol: cR, blocks, dots, floorRiders, riderSizes, diamondVariant: bp === 'lg' ? undefined : 'sm' };
}

const LEFT_LG: Array<[string, { dy: number }]> = [['L1', { dy: -1 }], ['L2', { dy: -1 }], ['L3', { dy: -1 }]];
const RIGHT_LG: Array<[string, { dy: number }]> = [['RR1', { dy: 1 }], ['RR2', { dy: 1 }], ['D', { dy: 1 }], ['RRa', { dy: 1 }], ['RRb', { dy: 1 }]];
const LEFT_SM: Array<[string, { dy: number }]> = [['L1', { dy: -1 }], ['L2', { dy: -1 }]];
const RIGHT_SM: Array<[string, { dy: number }]> = [['RR1', { dy: 1 }], ['D', { dy: 1 }], ['RRa', { dy: 1 }], ['RRb', { dy: 1 }]];

/** One move = 800 ms power4InOut, quantised to 4 px (engine blocks.choreo defaults). */
export const MOVE_MS = 800;
export const HOLD_MS = 1000;

/**
 * The idle choreography (start times in ms). Moves tween `transform` only.
 *   lg (art-spec card 15, six moves, forward 9.4 s + 1 s hold, yoyo, 1 s hold → 20.8 s cycle):
 *     1 · 0.0  left stack sinks 1 M (violet under the floor) AND right stack rises 1 M (cornflower emerges, diamond rises)
 *     2 · 1.8  left floor cornflower (+ mist half) slides right 1 M
 *     3 · 3.4  right floor azure (+ cert) slides left 1 M
 *     4 · 5.2  right floor azure sinks M/2 (cert sinks with it)
 *     5 · 6.8  left sinks again (indigo under; blue + pair remain) AND right rises again (azure emerges)
 *     6 · 8.6  left floor block slides right 1 more M
 *   md (moves 1, 3, 5 at 0 / 2.1 / 4.2 s → forward 5.0 s, cycle 12 s) · sm (moves 1 and 5 at 0 / 4.2 s; there is no floor block to slide).
 * The two rails always move on the same frames in opposite directions (moves 1 and 5): anti-correlated, "entangled".
 */
export function heroChoreo(bp: Breakpoint): ChoreoStep[] {
  if (bp === 'lg') {
    return [
      { at: 0, moves: [...LEFT_LG, ...RIGHT_LG] },
      { at: 1800, moves: [['F1', { dx: 1 }], ['F2', { dx: 1 }]] },
      { at: 3400, moves: [['R1', { dx: -1 }]] },
      { at: 5200, moves: [['R1', { dy: -0.5 }]] },
      { at: 6800, moves: [...LEFT_LG, ...RIGHT_LG] },
      { at: 8600, moves: [['F1', { dx: 1 }], ['F2', { dx: 1 }]] },
    ];
  }
  if (bp === 'md') {
    return [
      { at: 0, moves: [...LEFT_SM, ...RIGHT_SM] },
      { at: 2100, moves: [['R1', { dx: -1 }]] },
      { at: 4200, moves: [...LEFT_SM, ...RIGHT_SM] },
    ];
  }
  return [
    { at: 0, moves: [...LEFT_SM, ...RIGHT_SM] },
    { at: 4200, moves: [...LEFT_SM, ...RIGHT_SM] },
  ];
}

/** Forward duration of the choreography in ms (last start + MOVE_MS). */
export function choreoDuration(steps: ChoreoStep[]): number { return Math.max(0, ...steps.map((s) => s.at)) + MOVE_MS; }
/** Full yoyo cycle: forward + hold + reverse + hold. */
export function cycleMs(bp: Breakpoint): number { return 2 * (choreoDuration(heroChoreo(bp)) + HOLD_MS); }

/** Pre-built lg layout at the 1440 content box (1360 wide), for docs and tests. */
export const HERO_LG: HeroLayout = heroLayout('lg', 1360);
export const HERO_MD: HeroLayout = heroLayout('md', 736);
export const HERO_SM: HeroLayout = heroLayout('sm', 390);
export const HERO_CHOREO_LG: ChoreoStep[] = heroChoreo('lg');

/**
 * The paradox band blocks (design §5.3 D): static. Left edge a 2-stack (indigo on the floor, violet above);
 * right edge a mist half on an indigo block with `question-block` standing on it.
 */
export function paradoxLayout(bp: Breakpoint, width: number, questionId: string = RIDERS.question.piece): StageLayout & { rightCol: number } {
  const M = MODULE[bp];
  const cR = rightCol(width, M);
  return {
    module: M, rightCol: cR,
    blocks: [
      { id: 'P1', col: 0, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'P2', col: 0, rowFromFloor: 1, size: 1, step: 'v' },
      { id: 'Q1', col: cR, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'Q2', col: cR, rowFromFloor: 1, size: 0.5, step: 'u', rider: { piece: questionId, dx: centreDx(M, RIDERS.question.size[0]), dy: 0 } },
    ],
  };
}

/** Footer strata, top → bottom (design §5.11): blue, cornflower, azure, mist; 64 px each. */
export const STRATA_BANDS: Key[] = ['b', 'c', 'a', 'u'];
export const STRATA_BAND_PX = 64;
/** The footer walker stands on band 2 (cornflower): its top = band 2 top − 56 (12×14 → 48×56). */
export const STRATA_WALKER_TOP = STRATA_BAND_PX - 56;

/** Dusk staircase tiers, left → right (design §5.10): night, violet, indigo. 64 px strip, 8 px steps, 8 per tier. */
export const DUSK_TIERS: Key[] = ['n', 'v', 'i'];
export const DUSK_HEIGHT = 64;
