// Mounting pieces into the DOM. engine-spec §6.1.
// Frames are rendered at 1 art px per canvas px into small cache canvases and blitted with smoothing off,
// which is an exact nearest-neighbour upscale to the integer device scale chosen by scale.fit().

import { Grid } from './grid';
import { defaultIO, frameCount, frameIndex, frameTick, periodOf, sizeOf, type Piece, type PieceIO } from './piece';
import { getPiece } from './registry';
import { fit, onDprChange, UNIT } from './scale';
import { clock, type TickSub } from './clock';
import { motion, observe } from './visibility';

export interface MountOpts {
  variant?: string;
  decorative?: boolean;
  phase?: number;                 // tick offset, for desynchronising identical pieces
  inputs?: Partial<PieceIO>;
  autoplay?: boolean;             // default true (observed by IO); false = manual play()
  unit?: number;                  // override scale (icons at BAND etc.); default UNIT
}

export interface Mounted {
  readonly el: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly piece: Piece;
  readonly io: PieceIO;
  readonly variant?: string;
  set(input: string, value: unknown): void;
  seek(tick: number): void;
  play(): void;
  stop(): void;
  readonly playing: boolean;
  readonly localTick: number;
  on(event: string, cb: (tick: number) => void): () => void;
  state(): string | undefined;
  destroy(): void;
}

const mounts = new Set<MountedImpl>();
let idleQueue: Array<() => boolean> = [];
let idleScheduled = false;

function scheduleIdle(): void {
  if (idleScheduled || !idleQueue.length) return;
  idleScheduled = true;
  const run = (deadline?: { timeRemaining(): number }) => {
    idleScheduled = false;
    const start = performance.now();
    while (idleQueue.length) {
      const budget = deadline ? deadline.timeRemaining() : 8 - (performance.now() - start);
      if (budget <= 1) break;
      const job = idleQueue[0];
      if (job()) idleQueue.shift();   // job returns true when finished
    }
    scheduleIdle();
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 500 });
  else setTimeout(() => run(), 16);
}

class MountedImpl implements Mounted {
  readonly el: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly piece: Piece;
  readonly io: PieceIO;
  readonly variant?: string;
  private ctx!: CanvasRenderingContext2D;
  private readonly w: number;
  private readonly h: number;
  private readonly unit: number;
  private grid: Grid;
  private scratch: HTMLCanvasElement;     // 1 px per art px, for uncached frames
  private scratchCtx: CanvasRenderingContext2D | null = null;
  private cache: Array<CanvasImageSource | null> | null = null;
  private cacheDone = 0;
  private startTick: number | null = null;
  private lastFrame = -1;
  private dirty = true;
  private sub: TickSub | null = null;
  private unobserve: (() => void) | null = null;
  private unDpr: (() => void) | null = null;
  private unMotion: (() => void) | null = null;
  private listeners = new Map<string, Set<(tick: number) => void>>();
  private readonly phase: number;
  private readonly autoplay: boolean;
  private _localTick = 0;
  private wantPlay = false;
  private destroyed = false;

  constructor(target: HTMLElement, piece: Piece, opts: MountOpts) {
    this.piece = piece;
    this.variant = opts.variant;
    [this.w, this.h] = sizeOf(piece, opts.variant);
    this.unit = opts.unit ?? UNIT;
    this.phase = opts.phase ?? 0;
    this.autoplay = opts.autoplay !== false;
    this.io = defaultIO(piece, opts.inputs);
    this.grid = new Grid(this.w, this.h);
    this.el = target;
    target.classList.add('px');
    target.style.setProperty('--w', String(this.w));
    target.style.setProperty('--h', String(this.h));
    if (this.unit !== UNIT) target.style.setProperty('--unit', `${this.unit}px`);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'px';
    const decorative = opts.decorative || piece.alt === '';
    if (decorative) this.canvas.setAttribute('aria-hidden', 'true');
    else { this.canvas.setAttribute('role', 'img'); this.canvas.setAttribute('aria-label', piece.alt); }
    target.replaceChildren(this.canvas);
    this.scratch = document.createElement('canvas');
    this.scratch.width = this.w; this.scratch.height = this.h;
    this.refit();
    this.seek(piece.poster);           // poster first, synchronously
    // integrator (queue #5): a loop cache larger than 2 MB (e.g. magic-square's 288 frames ≈ 7 MB) is not worth the memory;
    // such pieces render per tick instead (their frame() cost is well under 0.1 ms).
    const cacheBytes = frameCount(piece) * this.w * this.h * 4;
    if (piece.cache === 'loop' && cacheBytes <= 2_000_000) this.buildCache();
    this.unDpr = onDprChange(() => { this.refit(); this.lastFrame = -1; this.draw(this.lastTickDrawn); });
    this.unMotion = motion.onChange(() => this.applyMotion());
    // revision 1 (E5): a mount whose element left the document (a section replaced its skeleton) destroys itself
    if (this.autoplay) this.unobserve = observe(target, { play: () => this.play(), stop: () => { if (!target.isConnected) this.destroy(); else this.stop(); } });
    mounts.add(this);
  }

  private lastTickDrawn = 0;

  private refit(): void { this.ctx = fit(this.canvas, this.w, this.h, this.unit); }

  private buildCache(): void {
    const n = frameCount(this.piece);
    this.cache = new Array(n).fill(null);
    let i = 0;
    const g = new Grid(this.w, this.h);
    const bitmaps = typeof createImageBitmap === 'function';
    idleQueue.push(() => {
      // integrator R2 (queue #15): the mount may be destroyed before its cache finishes; drop the job instead of throwing
      if (!this.cache) return true;
      const start = performance.now();
      while (i < n && performance.now() - start < 6) {
        const idx = i;
        if (!this.cache[idx]) {
          if (bitmaps) {
            // revision 1 (E12): frames become ImageBitmaps (GPU-friendly, no DOM canvas per frame); until the bitmap resolves
            // a frame that is needed is rendered on demand into a canvas by draw()
            g.clear(); this.piece.frame(frameTick(this.piece, idx), g, this.io, this.variant);
            createImageBitmap(g.toImageData()).then((bm) => { if (this.cache && !this.cache[idx]) this.cache[idx] = bm; }).catch(() => {});
          } else this.cache[idx] = this.renderToCanvas(frameTick(this.piece, idx), g);
        }
        i++;
      }
      this.cacheDone = i;
      return i >= n;
    });
    scheduleIdle();
  }

  private renderToCanvas(tick: number, g: Grid = this.grid): HTMLCanvasElement {
    g.clear();
    this.piece.frame(tick, g, this.io, this.variant);
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    c.getContext('2d')!.putImageData(g.imageData(), 0, 0);
    return c;
  }

  /** Draw the frame for an absolute (local) tick. Skips when the frame is unchanged and inputs are clean. */
  private draw(localTick: number): void {
    const fi = frameIndex(this.piece, localTick);
    if (fi === this.lastFrame && !this.dirty) return;
    this.lastFrame = fi; this.dirty = false; this.lastTickDrawn = localTick;
    let src: CanvasImageSource;
    if (this.cache && this.piece.cache === 'loop') {
      let c = this.cache[fi];
      if (!c) { c = this.renderToCanvas(frameTick(this.piece, fi)); this.cache[fi] = c; }
      src = c;
    } else {
      // revision 1 (E9): uncached pieces receive the ABSOLUTE local tick (aligned to the frame start), never wrapped to
      // the period, so tick-valued inputs (intro, since, bump…) stay valid for the life of the mount.
      const absolute = localTick - (((localTick % this.piece.ticksPerFrame) + this.piece.ticksPerFrame) % this.piece.ticksPerFrame);
      this.grid.clear();
      this.piece.frame(absolute, this.grid, this.io, this.variant);
      // integrator R2 (queue #5): imageData() reuses one buffer per grid and converts with a 32-bit lookup (was a fresh
      // ImageData plus a subarray copy per pixel: ~0.3 ms per tick on tc-rounds' 128×40)
      this.scratchCtx ??= this.scratch.getContext('2d')!;
      this.scratchCtx.putImageData(this.grid.imageData(), 0, 0);
      src = this.scratch;
    }
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(src, 0, 0, this.w, this.h, 0, 0, width, height);
  }

  set(input: string, value: unknown): void {
    if (this.io[input] === value) return;
    this.io[input] = value;
    this.dirty = true;
    if (this.piece.cache === 'loop') { /* inputs on cached pieces are not expected; re-render on demand */ }
    if (!this.sub) this.draw(this.lastTickDrawn);
  }

  seek(tick: number): void {
    this._localTick = tick;
    this.dirty = true;
    this.draw(tick);
  }

  get playing(): boolean { return this.sub !== null; }
  get localTick(): number { return this._localTick; }

  play(): void {
    this.wantPlay = true;
    if (this.sub || motion.reduced) return;
    const now = clock.tick();
    if (this.startTick === null) this.startTick = now - this.phase - this._localTick;   // resume where we left off
    else this.startTick = now - this._localTick;
    this.sub = {
      kind: 'tick',
      onTick: (tick) => {
        const local = tick - (this.startTick as number);
        this._localTick = local;
        this.draw(local);
        if (this.piece.events && this.listeners.size) {
          for (const ev of this.piece.events(local, this.io)) this.listeners.get(ev)?.forEach((cb) => cb(local));
        }
      },
    };
    clock.add(this.sub);
  }

  stop(): void {
    this.wantPlay = false;
    if (this.sub) { clock.remove(this.sub); this.sub = null; }
  }

  private applyMotion(): void {
    if (motion.reduced) { const want = this.wantPlay; this.stop(); this.wantPlay = want; this.seek(this.piece.poster); }
    else if (this.wantPlay) this.play();
  }

  on(event: string, cb: (tick: number) => void): () => void {
    let s = this.listeners.get(event);
    if (!s) { s = new Set(); this.listeners.set(event, s); }
    s.add(cb);
    return () => { s!.delete(cb); };
  }

  state(): string | undefined { return this.piece.state?.(this._localTick, this.io); }

  destroy(): void {
    // art-bands fix (revision 1): idempotent. The E5 self-destroy (IO `stop` on a disconnected element) re-entered destroy()
    // through `unobserve()` → the disposer's `v.stop()` → destroy() … until the stack overflowed; the exception then aborted
    // the rest of that IntersectionObserver batch, so other mounts and the hero stage never received `play()`.
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this.unobserve?.(); this.unDpr?.(); this.unMotion?.();
    mounts.delete(this);
    if (this.cache) for (const c of this.cache) if (c && 'close' in c) (c as ImageBitmap).close();
    this.cache = null;
    if (this.el.isConnected) this.el.replaceChildren();
    delete (this.el as HTMLElement & { __mounted?: Mounted }).__mounted;
  }

  /** QA: fraction of the frame cache built. */
  get cacheProgress(): number { return this.cache ? this.cacheDone / this.cache.length : 1; }
}

/** Mount a registered piece into `target`. */
export function mount(target: HTMLElement, pieceId: string, opts: MountOpts = {}): Mounted {
  const piece = getPiece(pieceId);
  const m = new MountedImpl(target, piece, opts);
  (target as HTMLElement & { __mounted?: Mounted }).__mounted = m;
  return m;
}

/** Mount every `[data-piece]` under root that is not yet mounted. Returns the new mounts. */
export function mountAll(root: ParentNode = document, opts: { skipPlaceholders?: boolean } = {}): Mounted[] {
  const out: Mounted[] = [];
  root.querySelectorAll<HTMLElement>('[data-piece]').forEach((el) => {
    if ((el as HTMLElement & { __mounted?: Mounted }).__mounted) return;
    if (opts.skipPlaceholders && el.dataset.piece === 'placeholder') return;   // skeleton stand-ins that a section will replace
    const id = el.dataset.piece!;
    const inputs: Partial<PieceIO> = {};
    for (const [k, v] of Object.entries(el.dataset)) {
      if (k.startsWith('io') && k.length > 2 && v !== undefined) {
        const name = k[2].toLowerCase() + k.slice(3);
        inputs[name] = v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(Number(v)) ? Number(v) : v;
      }
    }
    const m = mount(el, id, {
      variant: el.dataset.variant || undefined,
      decorative: 'decorative' in el.dataset,
      phase: el.dataset.phase ? Number(el.dataset.phase) : 0,
      inputs,
    });
    const [w, h] = sizeOf(m.piece, m.variant);
    if (el.dataset.w && (Number(el.dataset.w) !== w || Number(el.dataset.h) !== h)) {
      console.warn(`[engine] ${id}: data-w/h ${el.dataset.w}×${el.dataset.h} ≠ piece size ${w}×${h}`);
    }
    out.push(m);
  });
  return out;
}

export function mountedOf(el: Element): Mounted | undefined { return (el as HTMLElement & { __mounted?: Mounted }).__mounted; }
export function allMounts(): Mounted[] { return [...mounts]; }
export { periodOf };
