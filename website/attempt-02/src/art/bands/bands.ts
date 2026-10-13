// card 15 · the dusk staircase (CTA → footer seam), the footer strata, the module grid on colour and the paradox band blocks.
// Thin, opinionated wrappers over engine/blocks.ts (`staircase`, `stage`) carrying the card's data (revision 1: B1, B5, B7).

import {
  BAND, fit, Grid, hasPiece, mount, mountAll, motion, onDprChange, stage, staircase,
  type BlockDef, type Key, type Mounted, type Stage,
} from '../../engine';
import {
  breakpointFor, DUSK_HEIGHT, DUSK_TIERS, paradoxLayout, railModuleFor, STRATA_BANDS, STRATA_HEIGHT, STRATA_SEAMS,
  strataBoundaries, strataGrid, strataSurfaceY, type Breakpoint, type StrataGrid, type StrataGridOpts,
} from './layouts';
import { railStage, resolveRider } from './rails';
import { ensureStyles } from './styles';

export interface GridlinesOpts extends StrataGridOpts {
  /** y of each horizontal hairline from the root's top (default: none). */
  y?: readonly number[];
  /** Where each vertical starts (css px from the root's top) for its x; default 0 (full height). */
  top?: (x: number) => number;
}
export interface Gridlines { el: HTMLElement; grid: StrataGrid; redraw(): void; destroy(): void }

/**
 * The module grid on colour (revision 1 §1.8, replacing the 48/80 grid): verticals at the content-box edges and the two
 * rail lines (content-left + M, content-right − M) only, horizontals only where asked (`y`, e.g. band seams).
 * Ink at 10 % (`--grid-on-colour`), 1-px DOM lines, re-measured on resize. Used by `strata()`; usable on any colour band.
 */
export function gridlines(root: HTMLElement, opts: GridlinesOpts = {}): Gridlines {
  ensureStyles();
  const g = document.createElement('div');
  g.className = 'bands-gridlines';
  g.setAttribute('aria-hidden', 'true');
  root.appendChild(g);
  const api: Gridlines = {
    el: g,
    grid: strataGrid(0),
    redraw() {
      const W = root.clientWidth;
      const vw = opts.viewportWidth ?? (typeof innerWidth === 'number' ? innerWidth : W);
      const grid = api.grid = strataGrid(W, { ...opts, viewportWidth: vw });
      g.replaceChildren();
      for (const x of grid.x) {
        if (x < 0 || x >= W) continue;
        const i = document.createElement('i');
        i.className = 'bands-gridlines__v';
        i.style.left = `${x}px`;
        i.style.top = `${opts.top ? opts.top(x) : 0}px`;
        g.appendChild(i);
      }
      for (const y of opts.y ?? []) {
        const i = document.createElement('i');
        i.className = 'bands-gridlines__h';
        i.style.top = `${y}px`;
        g.appendChild(i);
      }
    },
    destroy() { ro?.disconnect(); g.remove(); },
  };
  api.redraw();
  let lastW = root.clientWidth;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (root.clientWidth !== lastW) { lastW = root.clientWidth; api.redraw(); } }) : null;
  ro?.observe(root);
  return api;
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
  // the engine names the canvas `.band`, which collides with the site's `.band` section rule (border-top + surface fill:
  // a hairline over the first staircase row); give it our own class with the same display rules
  const canvas = root.querySelector('canvas')!;
  canvas.classList.remove('band');
  canvas.classList.add('bands-dusk__canvas');
  return { el: root, canvas, surfaceY: s.surfaceY, redraw: s.redraw, height: DUSK_HEIGHT };
}

export interface StrataOpts {
  /** Gutter for the content box (default 40 at ≥ 1024, 16 below); the box is capped at `contentMax` (1728) and centred. */
  gutter?: number;
  contentMax?: number;
  /** Rail module M for the two rail lines (default the hero's: 128 from 1440, 96 from 1200, 64 below). */
  module?: number;
  /** Palette key painted above the top edge (default none: transparent, the footer's own surface shows through). */
  above?: Key | null;
  /** Legacy: a piece standing on the top edge at `walkerX` (default false: the footer drives `walkers` itself). */
  walker?: string | false;
  walkerX?: number;
}
export interface Strata {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  /** 256. */
  height: number;
  /** Band seams from the strip top: [72, 128, 176]. */
  seams: readonly number[];
  /** y of the top edge at x (css px from the strip's left edge): 0 … 56 in steps of 8. Walkers stand with their feet here. */
  surfaceY(x: number): number;
  /** The 7 step boundaries (css px, multiples of 8). */
  boundaries(): number[];
  /** The content box [left, right] and the rail module used for the grid, as last drawn. */
  contentBox: [number, number];
  module: number;
  gridlines: Gridlines;
  /** Legacy walker slot (absolutely positioned, feet on the surface at walkerX) or null. */
  walker: HTMLElement | null; walkerMount: Mounted | null;
  redraw(): void;
  destroy(): void;
}

/**
 * The footer strata (revision 1 §1.8, B5): one canvas at B = 8, full width, 256 px. The top edge descends left → right
 * one 8-px step every 1/8 of the width (y 0 → 56), continuing the dusk staircase's fall; nothing above the edge. Below it
 * four bands with horizontal seams at 72 / 128 / 176: blue (72 thick at the left, 16 at the right), cornflower 56,
 * azure 48, mist the rest. No arc. Grid: verticals at the content-box edges and the two rail lines, starting at the
 * edge (never on the paper above it); horizontals at the three seams; ink 10 %.
 */
export function strata(root: HTMLElement, opts: StrataOpts = {}): Strata {
  ensureStyles();
  root.replaceChildren();
  root.classList.add('bands-strata');
  root.classList.remove('strata');
  if (typeof getComputedStyle === 'function' && getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.style.height = `${STRATA_HEIGHT}px`;
  root.style.background = 'transparent';      // the old `.footer__strata` paints blue: the edge must show the footer above it
  const canvas = document.createElement('canvas');
  canvas.className = 'bands-strata__canvas';      // not `.band`: the site's `.band` rule adds a border-top and a surface fill
  canvas.setAttribute('aria-hidden', 'true');
  root.appendChild(canvas);
  const width = () => root.clientWidth || 1;
  const surfaceY = (x: number) => strataSurfaceY(x, width());
  const hb = STRATA_HEIGHT / BAND;
  const seamsB = STRATA_SEAMS.map((y) => y / BAND);
  const draw = () => {
    const W = width();
    const wb = Math.max(1, Math.ceil(W / BAND));      // cover the last partial band px (clipped by the root)
    const g = new Grid(wb, hb);
    for (let x = 0; x < wb; x++) {
      const top = surfaceY(x * BAND) / BAND;
      for (let y = 0; y < hb; y++) {
        if (y < top) { if (opts.above) g.set(x, y, opts.above); continue; }
        const band = y < seamsB[0] ? 0 : y < seamsB[1] ? 1 : y < seamsB[2] ? 2 : 3;
        g.set(x, y, STRATA_BANDS[band]);
      }
    }
    const ctx = fit(canvas, wb, hb, BAND);
    const src = document.createElement('canvas');
    src.width = wb; src.height = hb;
    src.getContext('2d')!.putImageData(g.toImageData(), 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, wb, hb, 0, 0, canvas.width, canvas.height);
  };
  const lines = gridlines(root, { gutter: opts.gutter, contentMax: opts.contentMax, module: opts.module, y: STRATA_SEAMS, top: surfaceY });

  let walker: HTMLElement | null = null, walkerMount: Mounted | null = null, walkerH = 0;
  if (opts.walker) {
    const want = opts.walker;
    const r = resolveRider(want, undefined, [12, 14]);
    walkerH = r.size[1] * 4;
    walker = document.createElement('span');
    walker.className = 'px bands-walker';
    walker.dataset.decorative = '';
    root.appendChild(walker);
    walkerMount = mount(walker, r.piece, { variant: r.variant, decorative: true });
    if (r.piece !== want && !hasPiece(want)) walker.dataset.standIn = want;
  }
  const placeWalker = () => {
    if (!walker) return;
    const x = Math.round((opts.walkerX ?? 160) / 4) * 4;
    walker.style.left = `${x}px`;
    walker.style.top = `${surfaceY(x + 8) - walkerH}px`;
  };

  const api: Strata = {
    el: root, canvas, height: STRATA_HEIGHT, seams: STRATA_SEAMS, surfaceY,
    boundaries: () => strataBoundaries(width()),
    get contentBox() { return lines.grid.contentBox; },
    get module() { return lines.grid.module; },
    gridlines: lines, walker, walkerMount,
    redraw() { draw(); lines.redraw(); placeWalker(); },
    destroy() { ro?.disconnect(); unDpr(); lines.destroy(); walkerMount?.destroy(); root.replaceChildren(); root.classList.remove('bands-strata'); },
  } as Strata;
  draw();
  placeWalker();
  let lastW = root.clientWidth;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (root.clientWidth !== lastW) { lastW = root.clientWidth; draw(); placeWalker(); } }) : null;
  ro?.observe(root);
  const unDpr = onDprChange(draw);
  return api;
}

export interface ParadoxOpts {
  /** Legacy (ignored except as a hint): the rail module now follows the hero's rails, `railModuleFor(innerWidth)`. */
  bp?: Breakpoint;
  /** Force the rail module (128 / 96 / 64); default the hero's for the viewport, re-checked on resize. */
  module?: number;
  question?: string;
  /** Accepted for compatibility and ignored: nothing depends on the width. */
  width?: number;
  /** Called after the helper rebuilt itself (the rail module changed across 1200 / 1440): re-wire anything held on `riders`. */
  onRebuild?(p: Paradox): void;
}
export interface Paradox {
  /** The left rail stage (indigo on the floor, violet above). */
  readonly stage: Stage;
  /** Both rail stages: [left, right]. */
  readonly stages: [Stage, Stage];
  readonly riders: Mounted[];
  readonly bp: Breakpoint;
  /** Width of each rail (= M). B7: at ≥ 1200 the band's copy must start right of the rail (x ≥ M) so the violet stack
   *  is never under text; below 1200 the band reserves 2M under the copy. */
  readonly rail: number;
  destroy(): void;
}

/**
 * The paradox band's static blocks (design §5.3 D, revision 1 B1/B7). Two rail stages, each M wide (the hero's rail
 * module: 128 from 1440, 96 from 1200, 64 below), **anchored to the band's bottom edge**, so the floor is the band bottom
 * whatever the band's height, and the right stack is flush with the right edge at any width without a rebuild.
 *   left rail  · indigo on the floor, violet above (2M tall)
 *   right rail · indigo + a mist half, `question-block` (placeholder until it lands) standing on it
 * The helper rebuilds itself when the rail module changes on resize (`onRebuild` is called).
 */
export function paradoxStage(root: HTMLElement, opts: ParadoxOpts = {}): Paradox {
  ensureStyles();
  const vw = () => (typeof innerWidth === 'number' ? innerWidth : root.clientWidth);
  let M = 0, left!: Stage, right!: Stage, riders: Mounted[] = [];
  const build = () => {
    riders.forEach((m) => m.destroy());
    left?.destroy(); right?.destroy();
    M = opts.module ?? railModuleFor(vw());
    const layout = paradoxLayout(M, opts.question);
    root.replaceChildren();
    root.classList.add('bands-paradox');
    root.dataset.rail = String(M);
    if (typeof getComputedStyle === 'function' && getComputedStyle(root).position === 'static') root.style.position = 'relative';
    const height = (defs: BlockDef[]) => {
      let top = 0;
      for (const b of defs) {
        top = Math.max(top, (b.rowFromFloor + b.size) * M);
        if (b.rider) {
          const r = resolveRider(b.rider.piece, b.rider.variant, [16, 16]);
          b.rider = { ...b.rider, piece: r.piece, variant: r.variant, dx: Math.round((M / 4 - r.size[0]) / 2) };
          top = Math.max(top, (b.rowFromFloor + b.size) * M + r.size[1] * 4);
        }
      }
      return top;
    };
    left = railStage(root, 'l', M, height(layout.left), layout.left).stage;
    right = railStage(root, 'r', M, height(layout.right), layout.right).stage;
    riders = mountAll(root);
    if (motion.reduced) { left.setStatic(); right.setStatic(); }
  };
  build();
  const api: Paradox = {
    get stage() { return left; },
    get stages() { return [left, right] as [Stage, Stage]; },
    get riders() { return riders; },
    get bp() { return breakpointFor(vw()); },
    get rail() { return M; },
    destroy() { ro?.disconnect(); riders.forEach((m) => m.destroy()); left.destroy(); right.destroy(); root.replaceChildren(); root.classList.remove('bands-paradox'); },
  };
  let lastW = root.clientWidth;
  const ro = opts.module === undefined && typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    if (!root.isConnected) { ro?.disconnect(); return; }
    if (root.clientWidth === lastW) return;
    lastW = root.clientWidth;
    if (railModuleFor(vw()) !== M) { build(); opts.onRebuild?.(api); }
  }) : null;
  ro?.observe(root);
  return api;
}
