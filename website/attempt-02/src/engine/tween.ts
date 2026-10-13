// Tweens and seekable sequences on the smooth clock. engine-spec §5.1. No GSAP.
// A Sequence is a pure function of time: every TweenSpec is evaluated at the sequence's local time,
// so it can seek, reverse and yoyo deterministically.

import { clock, type FrameSub } from './clock';

export type Ease = (t: number) => number;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export const ease = {
  linear: (t: number): number => t,
  power4Out: (t: number): number => 1 - Math.pow(1 - t, 4),
  power4In: (t: number): number => t * t * t * t,
  power4InOut: (t: number): number => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  power3Out: (t: number): number => 1 - Math.pow(1 - t, 3),
  power2In: (t: number): number => t * t,
  power2Out: (t: number): number => 1 - (1 - t) * (1 - t),
  /** Tailwind's default curve, cubic-bezier(.4,0,.2,1), approximated */
  tw: (t: number): number => cubicBezier(0.4, 0, 0.2, 1)(t),
  backOut(s = 1.7): Ease { return (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
};

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; }
    return sy(clamp01(t));
  };
}

export interface TweenSpec {
  at?: number;              // start offset in ms (sequences); default 0
  ms: number;
  from: number;
  to: number;
  ease?: Ease;
  quantize?: number;        // round the output to a multiple (blocks: 4)
  onUpdate(v: number): void;
  onDone?(): void;
}

function valueAt(spec: TweenSpec, localMs: number): number {
  const t = spec.ms <= 0 ? 1 : clamp01(localMs / spec.ms);
  const e = (spec.ease ?? ease.power4InOut)(t);
  let v = spec.from + (spec.to - spec.from) * e;
  // symmetric: round half away from zero, so a block moving −x and one moving +x land on mirrored pixels (revision 1, E7)
  if (spec.quantize) v = Math.sign(v) * Math.round(Math.abs(v) / spec.quantize) * spec.quantize;
  return v;
}

export interface Tween { stop(): void; readonly done: boolean }

/** Play one tween now. */
export function tween(spec: TweenSpec): Tween {
  let elapsed = 0, done = false, unsub: (() => void) | null = null;
  const sub: FrameSub = {
    kind: 'frame',
    onFrame(_now, dt) {
      elapsed += dt;
      spec.onUpdate(valueAt(spec, elapsed));
      if (elapsed >= spec.ms) { done = true; unsub?.(); unsub = null; spec.onDone?.(); }
    },
  };
  spec.onUpdate(valueAt(spec, 0));
  unsub = clock.add(sub);
  return { stop() { unsub?.(); unsub = null; done = true; }, get done() { return done; } };
}

export interface SequenceOpts { yoyo?: boolean; hold?: number; loop?: boolean; onComplete?(): void; onCycle?(dir: 1 | -1): void }

export class Sequence {
  readonly specs: TweenSpec[];
  readonly duration: number;
  private t = 0;
  private dir: 1 | -1 = 1;
  private holdLeft = 0;
  private unsub: (() => void) | null = null;
  private lastValues = new Map<TweenSpec, number>();
  constructor(specs: TweenSpec[], readonly opts: SequenceOpts = {}) {
    this.specs = specs;
    this.duration = Math.max(0, ...specs.map((s) => (s.at ?? 0) + s.ms));
  }
  get time(): number { return this.t; }
  get playing(): boolean { return this.unsub !== null; }
  get direction(): 1 | -1 { return this.dir; }

  /** Apply all tween values for local time `ms` (pure). */
  seek(ms: number): void {
    this.t = Math.max(0, Math.min(this.duration, ms));
    for (const s of this.specs) {
      const v = valueAt(s, this.t - (s.at ?? 0));
      if (this.lastValues.get(s) !== v) { this.lastValues.set(s, v); s.onUpdate(v); }
    }
  }
  play(): this {
    if (this.unsub) return this;
    this.seek(this.t);
    this.unsub = clock.add({ kind: 'frame', onFrame: (_n, dt) => this.advance(dt) });
    return this;
  }
  pause(): this { this.unsub?.(); this.unsub = null; return this; }
  stop(): this { this.pause(); this.t = 0; this.dir = 1; this.holdLeft = 0; return this; }
  reverse(): this { this.dir = this.dir === 1 ? -1 : 1; return this; }
  /** Jump to the end state (reduced motion) */
  finish(): this { this.pause(); this.seek(this.duration); return this; }

  private advance(dt: number): void {
    if (this.holdLeft > 0) { this.holdLeft -= dt; if (this.holdLeft > 0) return; dt = -this.holdLeft; this.holdLeft = 0; }
    const next = this.t + this.dir * dt;
    if (this.dir === 1 && next >= this.duration) {
      this.seek(this.duration);
      this.opts.onCycle?.(1);
      if (this.opts.yoyo) { this.dir = -1; this.holdLeft = this.opts.hold ?? 0; }
      else if (this.opts.loop) { this.t = 0; this.holdLeft = this.opts.hold ?? 0; }
      else { this.pause(); this.opts.onComplete?.(); }
      return;
    }
    if (this.dir === -1 && next <= 0) {
      this.seek(0);
      this.opts.onCycle?.(-1);
      if (this.opts.yoyo && this.opts.loop !== false) { this.dir = 1; this.holdLeft = this.opts.hold ?? 0; }
      else { this.pause(); this.opts.onComplete?.(); }
      return;
    }
    this.seek(next);
  }
}

export function sequence(specs: TweenSpec[], opts: SequenceOpts = {}): Sequence { return new Sequence(specs, opts); }
