// card 15 · `bands`: blocks, diamonds, strata, staircase (fable). See README.md for the API and the choreography table.
//
//   piece      `diamond` (15×15, variant sm 7×7; pulses v→i→v every 36 ticks; mount with `unit: BAND`)
//   data       MODULE, breakpointFor, heroLayout/heroChoreo (lg/md/sm), HERO_LG/MD/SM, paradoxLayout, STRATA_*, DUSK_*
//   DOM        heroStage(root, opts) · dusk(root) · strata(root, opts) · paradoxStage(root, opts) · gridlines(root)
//
// The registry only picks up the Piece exports; the layouts and functions are ignored by it.

export { diamond, drawDiamondShape, DIAMOND_PULSE_TICKS } from './diamond';
export {
  MODULE, breakpointFor, snapWidth, rightCol, centreDx,
  RIDERS, HERO_RIDER_IDS, heroLayout, heroChoreo, choreoDuration, cycleMs, MOVE_MS, HOLD_MS,
  HERO_LG, HERO_MD, HERO_SM, HERO_CHOREO_LG, paradoxLayout,
  STRATA_BANDS, STRATA_BAND_PX, STRATA_WALKER_TOP, DUSK_TIERS, DUSK_HEIGHT,
} from './layouts';
export type { Breakpoint, HeroLayout, HeroLayoutOpts, HeroRiderIds, DotDef, FloorRiderDef } from './layouts';
export { heroStage, resolveRider } from './hero';
export type { HeroStage, HeroStageOpts } from './hero';
export { dusk, strata, paradoxStage, gridlines } from './bands';
export type { Dusk, Strata, StrataOpts, ParadoxOpts, GridlinesOpts } from './bands';

export { diamond as default } from './diamond';
