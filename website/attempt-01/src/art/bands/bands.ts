// card 15 · the dusk staircase (CTA → footer seam), the footer strata and the paradox band blocks.
// Thin, opinionated wrappers over engine/blocks.ts (`staircase`, `stripe`, `stage`) carrying the card's data.

import { hasPiece, mount, mountAll, motion, stage, staircase, stripe, type Mounted, type Stage } from '../../engine';
import {
  breakpointFor, DUSK_HEIGHT, DUSK_TIERS, paradoxLayout, STRATA_BAND_PX, STRATA_BANDS, STRATA_WALKER_TOP, type Breakpoint,
} from './layouts';
import { resolveRider } from './hero';
import { ensureStyles } from './styles';

export interface GridlinesOpts { inset?: number; contentInset?: number | null }

/**
 * Grid-on-colour (design §3.3.6): horizontal hairlines every 80 px, vertical ones 48 px in from each edge and at the
 * content-box edges (`contentInset`: 40 at lg, 16 below; null = none). Ink at 10 %.
 */
export function gridlines(root: HTMLElement, opts: GridlinesOpts = {}): HTMLElement {
  ensureStyles();
  const inset = opts.inset ?? 48;
  const content = opts.contentInset === undefined ? (breakpointFor(typeof innerWidth === 'number' ? innerWidth : 1440) === 'lg' ? 40 : 16) : opts.contentInset;
  const g = document.createElement('div');
  g.className = 'bands-gridlines';
  g.setAttribute('aria-hidden', 'true');
  const xs = new Set<string>([`${inset}px`, `calc(100% - ${inset}px)`]);
  if (content !== null) { xs.add(`${content}px`); xs.add(`calc(100% - ${content}px)`); }
  for (const x of xs) { const i = document.createElement('i'); i.style.left = x; g.appendChild(i); }
  root.appendChild(g);
  return g;
}

export interface Dusk { el: HTMLElement; canvas: HTMLCanvasElement; surfaceY(x: number): number; redraw(): void; height: number }

/**
 * The dusk staircase (design §5.10, art-spec card 15): a 64-px strip under the ink CTA band. Three tiers left→right in
 * night, violet, indigo; within each tier the surface descends 8 px per 1/8 of the tier width (y 0 → 56) and resets at the
 * tier boundary. Ink fills above the surface. `surfaceY(x)` (css px from the strip top, multiples of 8) is where walkers stand.
 */
export function dusk(root: HTMLElement): Dusk {
  ensureStyles();
  const s = staircase(root, { tiers: DUSK_TIERS, height: DUSK_HEIGHT, stepPx: 8, stepsPerTier: 8 });
  root.classList.add('bands-dusk');
  return { el: root, canvas: root.querySelector('canvas')!, surfaceY: s.surfaceY, redraw: s.redraw, height: DUSK_HEIGHT };
}

export interface StrataOpts {
  /** Piece to stand on band 2 (default `qubit-walker`; `false` for none). Missing pieces fall back to `placeholder`. */
  walker?: string | false;
  /** Walker start x in css px (default 160). Move it afterwards with `moveUnits(slot, ux, 0)` (multiples of 4 px). */
  walkerX?: number;
  /** Content-box inset for the extra vertical hairlines (default from the breakpoint; null = none). */
  contentInset?: number | null;
}
export interface Strata {
  el: HTMLElement; bands: HTMLElement[];
  /** The walker's `.px` container (absolutely positioned, top = band 2 top − 56) or null. */
  walker: HTMLElement | null; walkerMount: Mounted | null;
  /** y of each band's top edge from the strip top. */
  bandTops: number[]; walkerTop: number; height: number;
}

/**
 * The footer strata (design §5.11): four 64-px bands blue → cornflower → azure → mist, grid-on-colour lines,
 * a 512-px quarter-arc (ink 10 %) at the right, and a slot for `qubit-walker` standing on band 2.
 */
export function strata(root: HTMLElement, opts: StrataOpts = {}): Strata {
  ensureStyles();
  stripe(root, { bands: STRATA_BANDS, bandPx: STRATA_BAND_PX, grid: false, arc: true });
  root.classList.add('bands-strata');
  gridlines(root, { contentInset: opts.contentInset });
  const bands = [...root.querySelectorAll<HTMLElement>('.strata__band')];
  let walker: HTMLElement | null = null, walkerMount: Mounted | null = null;
  if (opts.walker !== false) {
    const want = opts.walker ?? 'qubit-walker';
    const r = resolveRider(want, undefined, [12, 14]);
    walker = document.createElement('span');
    walker.className = 'px bands-walker';
    walker.dataset.decorative = '';
    walker.style.top = `${STRATA_BAND_PX - r.size[1] * 4}px`;
    walker.style.left = `${Math.round((opts.walkerX ?? 160) / 4) * 4}px`;
    root.appendChild(walker);
    walkerMount = mount(walker, r.piece, { variant: r.variant, decorative: true });
    if (r.piece !== want && !hasPiece(want)) walker.dataset.standIn = want;
  }
  return {
    el: root, bands, walker, walkerMount,
    bandTops: STRATA_BANDS.map((_, i) => i * STRATA_BAND_PX), walkerTop: STRATA_WALKER_TOP, height: STRATA_BANDS.length * STRATA_BAND_PX,
  };
}

export interface ParadoxOpts { bp?: Breakpoint; question?: string; width?: number }

/** The paradox band's static blocks (design §5.3 D). `question-block` stands on the right stack (placeholder until it lands). */
export function paradoxStage(root: HTMLElement, opts: ParadoxOpts = {}): { stage: Stage; riders: Mounted[]; bp: Breakpoint } {
  ensureStyles();
  const bp = opts.bp ?? breakpointFor(typeof innerWidth === 'number' ? innerWidth : root.clientWidth);
  const layout = paradoxLayout(bp, opts.width ?? root.clientWidth, opts.question);
  for (const b of layout.blocks) if (b.rider) { const r = resolveRider(b.rider.piece, b.rider.variant, [16, 16]); b.rider = { ...b.rider, piece: r.piece, variant: r.variant, dx: Math.round((layout.module / 4 - r.size[0]) / 2) }; }
  root.replaceChildren();
  const st = stage(root, layout);
  root.classList.add('bands-paradox');
  const riders = mountAll(root);
  if (motion.reduced) st.setStatic();
  return { stage: st, riders, bp };
}
