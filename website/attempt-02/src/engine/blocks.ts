// The blocks system: DOM blocks on the module grid, pixel diamonds, stepped bands, choreography.
// engine-spec §8, art-spec card 15. Flat colour only; sprites ride inside blocks.

import { PALETTE, type Key } from './palette';
import { BAND, fit } from './scale';
import { ease, sequence, Sequence, type TweenSpec } from './tween';
import { Grid } from './grid';
import { motion } from './visibility';

export interface RiderDef { piece: string; variant?: string; dx: number; dy: number; decorative?: boolean }
export interface BlockDef {
  id: string;
  col: number;              // module column from the stage's left edge (may be fractional ×0.5 for half-steps)
  rowFromFloor: number;     // 0 = standing on the floor; negative = hidden below the floor (reservoir)
  size: 1 | 0.5;            // 1 = M×M; 0.5 = M wide × M/2 tall
  step: Key;                // ramp key
  kind?: 'block' | 'diamond';
  rider?: RiderDef;
}
export interface StageLayout { module: number; blocks: BlockDef[]; width?: number }

interface BlockState { def: BlockDef; el: HTMLElement; col: number; row: number }

export interface Move { dx?: number; dy?: number }
export interface ChoreoStep { at: number; moves: Array<[string, Move]> }
export interface ChoreoOpts { yoyo?: boolean; hold?: number; ms?: number; quantize?: number }

export class Stage {
  readonly root: HTMLElement;
  readonly module: number;
  private blocks = new Map<string, BlockState>();
  private height = 0;
  private ro: ResizeObserver | null = null;
  private current: Sequence | null = null;

  constructor(root: HTMLElement, layout: StageLayout) {
    this.root = root;
    this.module = layout.module;
    root.classList.add('stage');
    root.style.setProperty('--module', `${layout.module}px`);
    this.measure();                                  // revision 1 (E1): measure BEFORE placing blocks (height was 0)
    for (const def of layout.blocks) this.add(def);
    if (typeof ResizeObserver === 'function') {
      // Re-layout only on a real size change (any width change, or ≥ 8 px of height: a font swap moves the hero by 2 px
      // and must not disturb a running intro). The first callback fires with the same size and is ignored. While a
      // sequence is playing the re-layout is deferred until it pauses or stops.
      this.ro = new ResizeObserver(() => { if (this.measure()) this.relayout(); });
      this.ro.observe(root);
    }
  }

  private lastW = -1;
  private lastRawH = -1;
  private pendingLayout = false;
  /** The floor is the stage's bottom edge snapped UP to the 4-px grid (blocks may overhang ≤3px, hidden by overflow),
   *  so every block position is a multiple of 4 whatever the stage's height. Returns true when the size changed enough. */
  private measure(): boolean {
    const rawH = this.root.clientHeight, w = this.root.clientWidth;
    const widthChanged = w !== this.lastW;
    const heightChanged = this.lastRawH < 0 || Math.abs(rawH - this.lastRawH) >= 8;
    if (!widthChanged && !heightChanged) return false;
    this.lastW = w; this.lastRawH = rawH;
    this.height = Math.ceil(rawH / 4) * 4;
    return true;
  }

  private relayout(): void {
    if (this.current?.playing) { this.pendingLayout = true; return; }
    this.pendingLayout = false;
    this.layoutAll();
  }

  /** Call when a sequence that drives this stage pauses/stops so a deferred re-layout can apply. */
  settle(): void { if (this.pendingLayout) this.relayout(); }

  private add(def: BlockDef): void {
    const M = this.module;
    const el = document.createElement('div');
    el.className = `block block--${def.kind ?? 'block'} step-${def.step}`;
    el.dataset.block = def.id;
    el.style.width = `${M}px`;
    el.style.height = `${def.size * M}px`;
    if (def.kind === 'diamond') {
      const n = M >= 128 ? 15 : 7;
      const c = document.createElement('canvas');
      c.className = 'px bp-band';   // integrator (R2 queue #13): not `.band`, the site's section-band class
      c.setAttribute('aria-hidden', 'true');
      el.appendChild(c);
      drawDiamond(c, n, def.step);
      const inset = (M - n * BAND) / 2;
      c.style.margin = `${inset}px`;
    } else {
      el.style.background = PALETTE[def.step];
    }
    if (def.rider) {
      const r = document.createElement('span');
      r.className = 'px rider';
      r.dataset.piece = def.rider.piece;
      if (def.rider.variant) r.dataset.variant = def.rider.variant;
      if (def.rider.decorative !== false) r.dataset.decorative = '';
      r.style.left = `${def.rider.dx * 4}px`;
      r.style.bottom = `${def.size * M + def.rider.dy * 4}px`;
      el.appendChild(r);
    }
    this.root.appendChild(el);
    const st: BlockState = { def, el, col: def.col, row: def.rowFromFloor };
    this.blocks.set(def.id, st);
    this.place(st, st.col, st.row);
  }

  /** Pixel position for grid coords. y is measured from the stage top; the floor is the stage bottom. */
  private xy(col: number, row: number, size: number): [number, number] {
    const M = this.module;
    return [col * M, this.height - (row + size) * M];
  }

  private place(st: BlockState, col: number, row: number): void {
    const [x, y] = this.xy(col, row, st.def.size);
    st.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  private layoutAll(): void { for (const st of this.blocks.values()) this.place(st, st.col, st.row); }

  get(id: string): BlockState { const b = this.blocks.get(id); if (!b) throw new Error(`stage: no block "${id}"`); return b; }
  ids(): string[] { return [...this.blocks.keys()]; }

  /** Set grid coordinates immediately (no tween). */
  setPos(id: string, col: number, row: number): void { const st = this.get(id); st.col = col; st.row = row; this.place(st, col, row); }

  /**
   * Build a seekable choreography. Moves are simulated in order so each tween knows its from/to.
   * Returns a Sequence (not started). Each move: `ms` (default 800) power4InOut, quantised to 4px.
   */
  choreo(steps: ChoreoStep[], opts: ChoreoOpts = {}): Sequence {
    const ms = opts.ms ?? 800, q = opts.quantize ?? 4;
    const sim = new Map<string, { col: number; row: number }>();
    for (const [id, st] of this.blocks) sim.set(id, { col: st.col, row: st.row });
    const specs: TweenSpec[] = [];
    // Live position = start position + the sum of every move's current delta. (art-bands fix: a block with two moves on
    // the same axis used to get the later move's start value written over the earlier one on the first seek.)
    const live = new Map<string, { x0: number; y0: number; dx: number[]; dy: number[] }>();
    for (const [id, st] of this.blocks) { const [x, y] = this.xy(st.col, st.row, st.def.size); live.set(id, { x0: x, y0: y, dx: [], dy: [] }); }
    for (const step of steps) {
      for (const [id, mv] of step.moves) {
        const st = this.get(id);
        const s = sim.get(id)!;
        const from = { col: s.col, row: s.row };
        const to = { col: s.col + (mv.dx ?? 0), row: s.row + (mv.dy ?? 0) };
        sim.set(id, to);
        const axis: 'x' | 'y' = mv.dx ? 'x' : 'y';
        const [fx, fy] = this.xy(from.col, from.row, st.def.size);
        const [tx, ty] = this.xy(to.col, to.row, st.def.size);
        const lv = live.get(id)!;
        const deltas = axis === 'x' ? lv.dx : lv.dy;
        const slot = deltas.push(0) - 1;
        const fromPx = axis === 'x' ? fx : fy;
        const sum = (a: number[]) => a.reduce((p, c) => p + c, 0);
        specs.push({
          at: step.at, ms, from: fromPx, to: axis === 'x' ? tx : ty, ease: ease.power4InOut, quantize: q,
          onUpdate: (v) => {
            deltas[slot] = v - fromPx;
            st.el.style.transform = `translate(${Math.round(lv.x0 + sum(lv.dx))}px, ${Math.round(lv.y0 + sum(lv.dy))}px)`;
          },
        });
      }
    }
    const seq = sequence(specs, { yoyo: opts.yoyo ?? true, hold: opts.hold ?? 1000, loop: true, onCycle: () => this.settle() });
    this.track(seq);
    return seq;
  }

  /** Intro: blocks slide in from outside the stage (rails horizontally, floor blocks from below), staggered. */
  enter(opts: { ms?: number; stagger?: number; railCols?: [number, number] } = {}): Sequence {
    const ms = opts.ms ?? 700, stagger = opts.stagger ?? 100;
    const specs: TweenSpec[] = [];
    const cols = this.root.clientWidth / this.module;
    const [leftRail, rightRail] = opts.railCols ?? [0, Math.round(cols) - 1];
    let i = 0;
    // art-bands fix: reservoir blocks hidden under the floor keep their rest position and take no stagger slot,
    // so the first visible (bottom) block really is the first to arrive
    const sorted = [...this.blocks.values()].filter((st) => st.row + st.def.size > 0).sort((a, b) => a.row - b.row);
    for (const st of sorted) {
      const [x, y] = this.xy(st.col, st.row, st.def.size);
      const fromRail = st.col <= leftRail ? -this.module : st.col >= rightRail ? this.module : 0;
      const live = { x: x + fromRail, y: fromRail ? y : y + this.module };
      st.el.style.transform = `translate(${live.x}px, ${live.y}px)`;
      specs.push({
        at: i * stagger, ms, from: fromRail ? live.x : live.y, to: fromRail ? x : y, ease: ease.power4Out, quantize: 4,
        onUpdate: (v) => { if (fromRail) live.x = v; else live.y = v; st.el.style.transform = `translate(${Math.round(live.x)}px, ${Math.round(live.y)}px)`; },
      });
      i++;
    }
    const seq = sequence(specs, { yoyo: false, loop: false, onComplete: () => this.settle() });
    this.track(seq);
    return seq;
  }

  /** The sequence currently driving the stage; deferred re-layouts apply when it pauses, stops or completes a cycle. */
  private track(seq: Sequence): void {
    this.current = seq;
    const pause = seq.pause.bind(seq), stop = seq.stop.bind(seq);
    seq.pause = () => { pause(); this.settle(); return seq; };
    seq.stop = () => { stop(); this.settle(); return seq; };
  }

  /** Reduced motion / teardown: everything at its declared position. */
  setStatic(): void { this.current?.stop(); this.current = null; this.layoutAll(); }

  destroy(): void { this.ro?.disconnect(); this.current?.stop(); this.root.replaceChildren(); }
}

export function stage(root: HTMLElement, layout: StageLayout): Stage { return new Stage(root, layout); }

/** Draws an n×n stepped pixel diamond (n odd) at BAND scale in the ramp colour. */
export function drawDiamond(canvas: HTMLCanvasElement, n: number, step: Key): void {
  const g = new Grid(n, n);
  const c = (n - 1) / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (Math.abs(x - c) + Math.abs(y - c) <= c) g.set(x, y, step);
  const ctx = fit(canvas, n, n, BAND);
  const src = document.createElement('canvas');
  src.width = n; src.height = n;
  src.getContext('2d')!.putImageData(g.toImageData(), 0, 0);
  ctx.drawImage(src, 0, 0, n, n, 0, 0, canvas.width, canvas.height);
}

export interface StripeOpts { bands: Key[]; bandPx?: number; grid?: boolean; arc?: boolean }

/** Horizontal strata: full-width bands stacked top→bottom, with the faint grid overlay. */
export function stripe(root: HTMLElement, opts: StripeOpts): HTMLElement {
  const h = opts.bandPx ?? 64;
  root.classList.add('strata');
  root.style.height = `${h * opts.bands.length}px`;
  opts.bands.forEach((k) => {
    const b = document.createElement('div');
    b.className = `strata__band step-${k}`;
    b.style.height = `${h}px`;
    b.style.background = PALETTE[k];
    root.appendChild(b);
  });
  if (opts.grid !== false) { const g = document.createElement('div'); g.className = 'grid-on-colour'; root.appendChild(g); }
  if (opts.arc) { const a = document.createElement('div'); a.className = 'strata__arc'; root.appendChild(a); }
  return root;
}

export interface StaircaseOpts { tiers: Key[]; height?: number; stepPx?: number; stepsPerTier?: number }

/**
 * The dusk staircase (art-spec card 15): three sawtooth tiers whose top edge descends `stepPx` per 1/stepsPerTier of the tier width.
 * Rendered as one canvas at BAND resolution (crisp 8-px steps). Returns surfaceY(x) in CSS px from the strip top.
 */
export function staircase(root: HTMLElement, opts: StaircaseOpts): { surfaceY(x: number): number; redraw(): void } {
  const height = opts.height ?? 64, stepPx = opts.stepPx ?? BAND, per = opts.stepsPerTier ?? 8;
  root.classList.add('staircase');
  root.style.height = `${height}px`;
  const canvas = document.createElement('canvas');
  canvas.className = 'bp-band';   // integrator (R2 queue #13): not `.band` (site rule: border-top + surface fill)
  canvas.setAttribute('aria-hidden', 'true');
  root.replaceChildren(canvas);
  const surfaceY = (x: number): number => {
    const w = root.clientWidth || 1;
    const tierW = w / opts.tiers.length;
    const tx = (x % tierW) / tierW;
    return Math.min(height - stepPx, Math.floor(tx * per) * stepPx);
  };
  const redraw = () => {
    const w = Math.max(1, Math.ceil(root.clientWidth / BAND));   // art-bands fix: cover the last partial band px (clipped) instead of leaving a gap
    const hb = height / BAND;
    const g = new Grid(w, hb);
    const tierW = w / opts.tiers.length;
    for (let x = 0; x < w; x++) {
      const tier = Math.min(opts.tiers.length - 1, Math.floor(x / tierW));
      const top = surfaceY(x * BAND) / BAND;
      for (let y = 0; y < hb; y++) g.set(x, y, y < top ? 'k' : opts.tiers[tier]);
    }
    const ctx = fit(canvas, w, hb, BAND);
    const src = document.createElement('canvas');
    src.width = w; src.height = hb;
    src.getContext('2d')!.putImageData(g.toImageData(), 0, 0);
    ctx.drawImage(src, 0, 0, w, hb, 0, 0, canvas.width, canvas.height);
  };
  redraw();
  if (typeof ResizeObserver === 'function') new ResizeObserver(redraw).observe(root);
  return { surfaceY, redraw };
}

export { motion };
