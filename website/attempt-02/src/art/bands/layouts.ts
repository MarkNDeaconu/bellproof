// card 15 · revision 1: the hero layouts (lg / lg-narrow / stacked), the T/C shuffle as data, the paradox band layout,
// the footer strata geometry and the dusk staircase constants.
// Pure data and pure functions: no DOM, no registry access (safe to import from Node scripts).
//
// Coordinates: `col` is in modules from the LEFT edge of a rail stage; `rowFromFloor` in modules from the stage's bottom
// (0 = standing on the floor, negative = hidden below it). Each rail is its own stage, anchored to the left or right edge
// and the floor with CSS, so no position depends on the hero's width or height.

import type { BlockDef } from '../../engine/blocks';
import type { Key } from '../../engine/palette';
import { ease } from '../../engine/tween';

export type Breakpoint = 'lg' | 'md' | 'sm';

/** Module size per breakpoint (design §3.2). */
export const MODULE: Record<Breakpoint, number> = { lg: 128, md: 64, sm: 64 };

/** Breakpoint from the viewport width (design §3.1). */
export function breakpointFor(viewportWidth: number): Breakpoint {
  return viewportWidth >= 1024 ? 'lg' : viewportWidth >= 768 ? 'md' : 'sm';
}

/** Rider pieces and their declared sizes (art-spec cards 3a, 4a, 11; revision 1 §1.9). Missing pieces fall back to `placeholder`. */
export const RIDERS = {
  pair: { piece: 'qubit-pair', size: [32, 16] as [number, number], sm: { variant: 'sm', size: [24, 12] as [number, number] } },
  cert: { piece: 'cert-mini', size: [24, 20] as [number, number] },
  question: { piece: 'question-block', size: [16, 16] as [number, number] },
  tile: { piece: 'round-tile', size: [24, 24] as [number, number], md: { variant: 'md', size: [16, 16] as [number, number] } },
} as const;

/** Horizontal rider offset (art px) that centres a `w`-art-px sprite on a module of `M` css px. */
export function centreDx(M: number, w: number): number { return Math.round((M / 4 - w) / 2); }

export interface DotDef { block: string; corner: 'tl' | 'tr' }

// ------------------------------------------------------------------------------------------------ hero (revision 1 §1.1)

/** The three hero layouts (revision 1 §1.1 geometry rule): lg ≥ 1440 (M 128), lg-narrow 1200–1439 (M 96), stacked < 1200 (M 64). */
export type HeroLayoutName = 'lg' | 'lg-narrow' | 'stacked';
export const HERO_MODULE: Record<HeroLayoutName, 128 | 96 | 64> = { lg: 128, 'lg-narrow': 96, stacked: 64 };
export function heroLayoutFor(viewportWidth: number): HeroLayoutName {
  return viewportWidth >= 1440 ? 'lg' : viewportWidth >= 1200 ? 'lg-narrow' : 'stacked';
}
/** Legacy breakpoint names → layouts ('md' depends on the viewport: lg-narrow from 1200, stacked below). */
export function heroLayoutFromBp(bp: Breakpoint | HeroLayoutName, viewportWidth: number): HeroLayoutName {
  if (bp === 'lg' || bp === 'lg-narrow' || bp === 'stacked') return bp;
  return bp === 'md' ? (viewportWidth >= 1200 ? 'lg-narrow' : 'stacked') : 'stacked';
}

export interface HeroRiderIds { pair: string; cert: string; tile: string }
export const HERO_RIDER_IDS: HeroRiderIds = { pair: 'qubit-pair', cert: 'cert-mini', tile: 'round-tile' };

/** A sprite standing on the floor, anchored to the left or right edge of the stage (`offset` css px in from that edge). */
export interface FloorRiderDef { id: 'pair' | 'cert'; piece: string; variant?: string; size: [number, number]; side: 'left' | 'right'; offset: number }
/** A `round-tile` mounted centred inside a right-stack block: `inset` css px from the block's left and bottom edges. */
export interface TileDef { block: string; variant?: string; size: [number, number]; inset: number }

export interface HeroLayout {
  name: HeroLayoutName;
  module: number;
  /** Left rail stack (col 0 of the left rail), bottom → top. */
  left: BlockDef[];
  /** Right rail stack (col 0 of the right rail), bottom → top, then the reservoir block hidden one module under the floor. */
  right: BlockDef[];
  /** Height of each rail stage in modules: the right stack at the top of its rise (visible blocks + 1). */
  railRows: number;
  /** Tiles, top → bottom of the visible right stack, then the reservoir's. */
  tiles: TileDef[];
  dots: DotDef[];
  floorRiders: FloorRiderDef[];
}
export interface HeroLayoutOpts { riders?: Partial<HeroRiderIds> }

/**
 * The hero blocks (revision 1 §1.1 point 3): rails only; no floor blocks, no riders on the stacks, no diamond.
 *   lg / lg-narrow: left rail violet · indigo · blue (bottom → top); right rail indigo · blue · cornflower, each carrying a
 *     centred round tile; the reservoir under the right rail is violet (when the left stack sinks its violet under the floor,
 *     a violet `?` block emerges on the right: the shuffle conserves blocks). `qubit-pair` on the floor at x = M
 *     (`sm` variant at lg-narrow); `cert-mini` on the floor at x = W − M − 96. Dots at both stack tops on the rail lines.
 *   stacked (< 1200): the same on 2-block stacks (left indigo · blue, right blue · cornflower, reservoir indigo), M 64,
 *     tiles `md` filling their blocks, pair `sm`; no rail lines, so no dots.
 */
export function heroLayout(name: HeroLayoutName, opts: HeroLayoutOpts = {}): HeroLayout {
  const M = HERO_MODULE[name];
  const ids = { ...HERO_RIDER_IDS, ...opts.riders };
  const stacked = name === 'stacked';
  const leftSteps: Key[] = stacked ? ['i', 'b'] : ['v', 'i', 'b'];
  const rightSteps: Key[] = stacked ? ['b', 'c'] : ['i', 'b', 'c'];
  const reservoir: Key = stacked ? 'i' : 'v';
  const left: BlockDef[] = leftSteps.map((step, i) => ({ id: `L${i + 1}`, col: 0, rowFromFloor: i, size: 1, step }));
  const right: BlockDef[] = rightSteps.map((step, i) => ({ id: `R${i + 1}`, col: 0, rowFromFloor: i, size: 1, step }));
  right.push({ id: 'Rr', col: 0, rowFromFloor: -1, size: 1, step: reservoir });
  const tileVariant = M === 128 ? undefined : 'md';
  const tileSize: [number, number] = M === 128 ? [24, 24] : [16, 16];
  const inset = (M - tileSize[0] * 4) / 2;                       // 16 at 128 and 96, 0 at 64
  const tiles: TileDef[] = [...right.slice(0, -1).reverse(), right[right.length - 1]].map((b) => ({ block: b.id, variant: tileVariant, size: tileSize, inset }));
  const dots: DotDef[] = stacked ? [] : [{ block: left[left.length - 1].id, corner: 'tr' }, { block: right[right.length - 2].id, corner: 'tl' }];
  const pairSm = name !== 'lg';
  const floorRiders: FloorRiderDef[] = [
    { id: 'pair', piece: ids.pair, variant: pairSm ? 'sm' : undefined, size: pairSm ? [24, 12] : [32, 16], side: 'left', offset: M },
    { id: 'cert', piece: ids.cert, size: [24, 20], side: 'right', offset: M },
  ];
  return { name, module: M, left, right, railRows: rightSteps.length + 1, tiles, dots, floorRiders };
}

// ------------------------------------------------------------------------------------------------ the T/C shuffle (§1.1 point 4)

export type TileFace = '?' | 'T' | 'C' | 'ok';
/** One move = 800 ms power4InOut, quantised to 4 px; both stacks move on the same frames in opposite directions. */
export const MOVE_MS = 800;
/** One sprite tick (12 fps). */
export const TICK = 1000 / 12;
/** The cycle: 14.4 s (≈ 173 ticks), loops forward, never reverses. */
export const SHUFFLE_CYCLE_MS = 14400;

/** A stack move: `right` modules up for the right stack and the same down for the left (right +1 = right rises, left sinks). */
export interface StackMove { at: number; right: 1 | -1; label: string }
/** A tile cue: `tile` is a block id (R1 bottom … top, Rr reservoir); `flip` = 2-frame narrow flip, `fade` = 4-tick dither. */
export interface TileCue { at: number; tile: string; face: TileFace; mode: 'flip' | 'fade'; label: string }
/** A tone cue: `blocks` change by `shift` ramp steps (+1 darker, −1 lighter) for `ms`. */
export interface ToneCue { at: number; ms: number; blocks: string[]; shift: 1 | -1; label: string }
export interface HeroChoreo {
  cycleMs: number;
  moveMs: number;
  moves: StackMove[];
  tiles: TileCue[];
  tones: ToneCue[];
  /** Faces at t = 0 (and the faces the loop returns to). */
  initial: Record<string, TileFace>;
  /** The reduced-motion poster: the verdict (✓ on every visible tile). */
  poster: Record<string, TileFace>;
}

/**
 * The T/C shuffle as data (revision 1 §1.1 point 4). Times in ms from the cycle start; tick offsets are multiples of TICK.
 *   0.0  three `?` tiles shimmer (idle)
 *   1.0 / 1.8 / 2.6  top, middle, bottom tiles flip to T, C, C (the verifier's schedule; stacked: top T, bottom C);
 *        the block behind the T pulses one step darker for 2 ticks as its face lands
 *   4.2  shuffle move 1: right stack rises 1 M (the reservoir's `?` block emerges), left sinks 1 M; during the move every
 *        tile flips back to `?`, top → bottom one tick apart
 *   5.8  shuffle move 2: right sinks 1 M, left rises 1 M (the layout is restored)
 *   7.6  hold, three `?` ("what the provider sees")
 *   9.1  verdict: ✓ top → bottom 2 ticks apart (each lands with the tile's 1-tick white flash); as the last lands, every
 *        visible block of both stacks goes one ramp step lighter for 2 ticks
 *  11.6  tiles dither-fade (4 ticks) back to `?`; hold to 14.4; loop
 */
export function heroChoreo(name: HeroLayoutName): HeroChoreo {
  const layout = heroLayout(name);
  const vis = layout.right.slice(0, -1).map((b) => b.id).reverse();       // top → bottom
  const schedule: TileFace[] = vis.length === 3 ? ['T', 'C', 'C'] : ['T', 'C'];
  const flipAt = [1000, 1800, 2600];
  const tiles: TileCue[] = [];
  const tones: ToneCue[] = [];
  vis.forEach((id, i) => {
    tiles.push({ at: flipAt[i], tile: id, face: schedule[i], mode: 'flip', label: `schedule ${schedule[i]}` });
    // the flip set at `at` starts on the next tick: edge-on, half, then the face lands ≈ 3 ticks later
    if (schedule[i] === 'T') tones.push({ at: flipAt[i] + 3 * TICK, ms: 2 * TICK, blocks: [id], shift: 1, label: 'T pulse' });
  });
  vis.forEach((id, i) => tiles.push({ at: 4200 + (i + 1) * TICK, tile: id, face: '?', mode: 'flip', label: 'shuffle: back to ?' }));
  vis.forEach((id, i) => tiles.push({ at: 9100 + 2 * i * TICK, tile: id, face: 'ok', mode: 'flip', label: 'verdict' }));
  const lastVerdict = 9100 + 2 * (vis.length - 1) * TICK;
  const visibleBlocks = [...layout.left.map((b) => b.id), ...vis];
  tones.push({ at: lastVerdict + 3 * TICK, ms: 2 * TICK, blocks: visibleBlocks, shift: -1, label: 'verdict lighten' });
  vis.forEach((id) => tiles.push({ at: 11600, tile: id, face: '?', mode: 'fade', label: 'dither back to ?' }));
  tiles.sort((a, b) => a.at - b.at);
  const initial: Record<string, TileFace> = {};
  const poster: Record<string, TileFace> = {};
  for (const t of layout.tiles) { initial[t.block] = '?'; poster[t.block] = t.block === 'Rr' ? '?' : 'ok'; }
  return {
    cycleMs: SHUFFLE_CYCLE_MS, moveMs: MOVE_MS,
    moves: [{ at: 4200, right: 1, label: 'shuffle 1' }, { at: 5800, right: -1, label: 'shuffle 2' }],
    tiles, tones, initial, poster,
  };
}

/** Symmetric 4-px quantisation (round half away from zero). */
export function q4(v: number): number { return Math.sign(v) * Math.round(Math.abs(v) / 4) * 4; }

/**
 * Vertical offset of the RIGHT stack at cycle time `t` (css px, positive = up). The left stack's offset is exactly the
 * negative (it sinks while the right rises): one quantised value drives both, so they are anti-correlated by construction.
 */
export function rightOffsetAt(c: HeroChoreo, t: number, M: number): number {
  let off = 0;
  for (const m of c.moves) {
    const p = Math.min(1, Math.max(0, (t - m.at) / c.moveMs));
    off += m.right * q4(M * ease.power4InOut(p));
  }
  return off;
}
/** True while a move is in flight (or starts within one tick): the driver then runs at display rate. */
export function moving(c: HeroChoreo, t: number): boolean {
  return c.moves.some((m) => t >= m.at - TICK && t <= m.at + c.moveMs);
}
/** The face each tile shows at cycle time `t` (the last cue at or before `t`; the faces at the cycle start before the first). */
export function facesAt(c: HeroChoreo, t: number): Record<string, TileFace> {
  const out = { ...c.initial };
  for (const cue of c.tiles) if (cue.at <= t) out[cue.tile] = cue.face;
  return out;
}
/** Ramp-step shift of a block at cycle time `t` (+ darker, − lighter). */
export function toneAt(c: HeroChoreo, block: string, t: number): number {
  let s = 0;
  for (const cue of c.tones) if (t >= cue.at && t < cue.at + cue.ms && cue.blocks.includes(block)) s += cue.shift;
  return s;
}
/** The ramp, light → dark (design §1.5). */
export const RAMP: Key[] = ['u', 'a', 'c', 'b', 'i', 'v', 'n'];
export function shiftStep(step: Key, by: number): Key {
  const i = RAMP.indexOf(step);
  return i < 0 ? step : RAMP[Math.min(RAMP.length - 1, Math.max(0, i + by))];
}

/** Pre-built layouts and choreography, for docs and tests. */
export const HERO_LG: HeroLayout = heroLayout('lg');
export const HERO_LG_NARROW: HeroLayout = heroLayout('lg-narrow');
export const HERO_STACKED: HeroLayout = heroLayout('stacked');
export const HERO_CHOREO_LG: HeroChoreo = heroChoreo('lg');

// ------------------------------------------------------------------------------------------------ paradox band

/**
 * The paradox band blocks (design §5.3 D, revision 1 B1/B7): static, one stack per rail, M = the hero's rail module.
 *   left rail  · indigo on the floor, violet above
 *   right rail · indigo + a mist half with `question-block` standing on it
 * Every block is in column 0 of its own rail stage (the stages are anchored to the band's bottom-left / bottom-right).
 */
export function paradoxLayout(module: number, questionId: string = RIDERS.question.piece): { module: number; left: BlockDef[]; right: BlockDef[] } {
  const M = module;
  return {
    module: M,
    left: [
      { id: 'P1', col: 0, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'P2', col: 0, rowFromFloor: 1, size: 1, step: 'v' },
    ],
    right: [
      { id: 'Q1', col: 0, rowFromFloor: 0, size: 1, step: 'i' },
      { id: 'Q2', col: 0, rowFromFloor: 1, size: 0.5, step: 'u', rider: { piece: questionId, dx: centreDx(M, RIDERS.question.size[0]), dy: 0 } },
    ],
  };
}

/** Footer strata, top → bottom (revision 1 §1.8): blue, cornflower, azure, mist. */
export const STRATA_BANDS: Key[] = ['b', 'c', 'a', 'u'];
/** Strata height (css px): one canvas at B = 8, full width. */
export const STRATA_HEIGHT = 256;
/** The top edge descends one step of `STRATA_STEP` px every 1/`STRATA_STEPS` of the width: y 0 → 56. */
export const STRATA_STEP = 8;
export const STRATA_STEPS = 8;
/** Band seams from the strip top (fixed, horizontal): blue 0–72 · cornflower 72–128 · azure 128–176 · mist 176–256.
 *  Blue is therefore 72 px thick at the left (edge y 0) and 16 px at the right (edge y 56). */
export const STRATA_SEAMS = [72, 128, 176] as const;

/** x of the 7 step boundaries for a strip `width` px wide, snapped to the 8-px band grid (so the drawn edge and
 *  `strataSurfaceY` agree to the pixel). */
export function strataBoundaries(width: number): number[] {
  return Array.from({ length: STRATA_STEPS - 1 }, (_, i) => Math.round(((i + 1) * width) / STRATA_STEPS / STRATA_STEP) * STRATA_STEP);
}
/** y of the strata's top edge at x (css px from the strip's left edge): 0, 8, … 56, always a multiple of 8.
 *  Left of the strip → 0; right of it → 56. */
export function strataSurfaceY(x: number, width: number): number {
  let k = 0;
  for (const b of strataBoundaries(width)) if (x >= b) k++;
  return k * STRATA_STEP;
}
/** Hero rail module for a viewport width (revision 1 §1.1): 128 from 1440, 96 from 1200, 64 below. */
export function railModuleFor(viewportWidth: number): 128 | 96 | 64 {
  return viewportWidth >= 1440 ? 128 : viewportWidth >= 1200 ? 96 : 64;
}
export interface StrataGridOpts { gutter?: number; contentMax?: number; module?: number; viewportWidth?: number }
export interface StrataGrid {
  /** x of each vertical hairline's pixel column (1 px wide), left → right: content-left, rail-left, rail-right, content-right. */
  x: number[];
  /** y of each horizontal hairline (the three band seams). */
  y: number[];
  contentBox: [number, number];
  module: number;
}
/**
 * The strata's grid (revision 1 §1.8): verticals at the content-box edges and the two rail lines (content-left + M,
 * content-right − M) only, horizontals at the band seams only. Lines are drawn inside the box edges like the site's
 * `border-inline` and rail borders: the left lines occupy [x, x+1) with x = content-left and content-left + M − 1,
 * the right ones content-right − M and content-right − 1.
 */
export function strataGrid(width: number, opts: StrataGridOpts = {}): StrataGrid {
  const vw = opts.viewportWidth ?? width;
  const gutter = opts.gutter ?? (vw >= 1024 ? 40 : 16);
  const box = Math.min(width - 2 * gutter, opts.contentMax ?? 1728);
  const L = Math.round((width - box) / 2), R = L + Math.round(box);
  const M = opts.module ?? railModuleFor(vw);
  return { x: [L, L + M - 1, R - M, R - 1], y: [...STRATA_SEAMS], contentBox: [L, R], module: M };
}

/** Dusk staircase tiers, left → right (design §5.10): night, violet, indigo. 64 px strip, 8 px steps, 8 per tier. */
export const DUSK_TIERS: Key[] = ['n', 'v', 'i'];
export const DUSK_HEIGHT = 64;
