// card 15 · `bands` (revision 1): blocks, the T/C shuffle, the paradox rails, the dusk staircase, the footer strata.
// See README.md for the API and the choreography table.
//
//   piece      `diamond` (15×15, variant sm 7×7; pulses v→i→v every 36 ticks; mount with `unit: BAND`). Not in the hero any more.
//   data       heroLayout / heroChoreo (lg / lg-narrow / stacked), the shuffle's pure state functions, paradoxLayout,
//              STRATA_* + strataSurfaceY / strataGrid, DUSK_*
//   DOM        heroStage(root, opts) · paradoxStage(root, opts) · strata(root, opts) · dusk(root) · gridlines(root, opts)
//
// The registry only picks up the Piece exports; the layouts and functions are ignored by it.

export { diamond, drawDiamondShape, DIAMOND_PULSE_TICKS } from './diamond';
export {
  MODULE, breakpointFor, centreDx, RIDERS, RAMP, shiftStep, q4,
  HERO_MODULE, heroLayoutFor, heroLayoutFromBp, HERO_RIDER_IDS, heroLayout, heroChoreo,
  MOVE_MS, TICK, SHUFFLE_CYCLE_MS, rightOffsetAt, moving, facesAt, toneAt,
  HERO_LG, HERO_LG_NARROW, HERO_STACKED, HERO_CHOREO_LG, paradoxLayout,
  STRATA_BANDS, STRATA_HEIGHT, STRATA_STEP, STRATA_STEPS, STRATA_SEAMS, strataBoundaries, strataSurfaceY, strataGrid, railModuleFor,
  DUSK_TIERS, DUSK_HEIGHT,
} from './layouts';
export type {
  Breakpoint, HeroLayoutName, HeroLayout, HeroLayoutOpts, HeroRiderIds, DotDef, FloorRiderDef, TileDef, TileFace,
  HeroChoreo, StackMove, TileCue, ToneCue, StrataGrid, StrataGridOpts,
} from './layouts';
export { heroStage, resolveRider } from './hero';
export type { HeroStage, HeroStageOpts } from './hero';
export { railStage } from './rails';
export { dusk, strata, paradoxStage, gridlines } from './bands';
export type { Dusk, Strata, StrataOpts, Paradox, ParadoxOpts, Gridlines, GridlinesOpts } from './bands';

export { diamond as default } from './diamond';
