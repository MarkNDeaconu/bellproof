// One requestAnimationFrame loop for the whole page. engine-spec §5.
// Two kinds of subscriber: 'tick' (12 fps sprite clock, fixed timestep) and 'frame' (smooth, display rate, dt-scaled).
// The loop cancels itself when nothing is subscribed or when paused, so an idle page costs zero rAF callbacks.
// revision 1 (E3, E6): every folded tick is delivered (capped), and with only tick subscribers the next frame is
// requested at the next tick boundary instead of at the display rate.

export const TICK_MS = 1000 / 12;
const MAX_ACC = 250;
const MAX_CATCHUP = 6;          // ticks delivered after a stall; older ones are dropped (the accumulator is clamped anyway)

export interface TickSub { kind: 'tick'; onTick(tick: number): void }
export interface FrameSub { kind: 'frame'; onFrame(now: number, dt: number): void }
export type ClockSub = TickSub | FrameSub;

let subs = new Set<ClockSub>();
let frameSubs = 0;
let raf = 0;
let timer = 0;
let paused = false;
let last = 0;
let acc = 0;
let tickCount = 0;
let frames = 0;      // rAF callbacks executed (QA counter)
let nowMs = 0;

const hasRaf = typeof requestAnimationFrame === 'function';

function loop(now: number): void {
  raf = 0;
  frames++;
  nowMs = now;
  const dt = last ? Math.min(now - last, MAX_ACC) : 0;
  last = now;
  acc += dt;
  let stepped = 0;
  while (acc >= TICK_MS) { acc -= TICK_MS; tickCount++; stepped++; }
  const list = [...subs];          // snapshot: subscribers may add/remove during callbacks
  if (stepped) {
    const first = tickCount - Math.min(stepped, MAX_CATCHUP) + 1;
    for (let t = first; t <= tickCount; t++) for (const s of list) if (s.kind === 'tick' && subs.has(s)) s.onTick(t);
  }
  if (frameSubs) for (const s of list) if (s.kind === 'frame' && subs.has(s)) s.onFrame(now, dt);
  schedule();
}

function schedule(): void {
  if (raf || timer || paused || !subs.size || !hasRaf) return;
  if (frameSubs === 0) {
    // only sprites: wake one display frame after the next tick boundary, so the rAF that follows always steps a tick
    // (integrator R2: waking 4 ms early often produced a second, empty rAF per tick, ~25 rAF/s with sprites only, E6 asks
    // ≤ 14; the frame of margin covers a rAF that runs in a frame which began before the timer fired). Every tick lands
    // the same ~1 frame late, so the 12 fps cadence stays even.
    const wait = Math.ceil(TICK_MS - acc) + 17;
    if (wait > 8) { timer = window.setTimeout(() => { timer = 0; if (!raf && !paused && subs.size) raf = requestAnimationFrame(loop); }, wait); return; }
  }
  raf = requestAnimationFrame(loop);
}

function cancel(): void {
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (timer) { clearTimeout(timer); timer = 0; }
}

function recount(): void { frameSubs = 0; for (const s of subs) if (s.kind === 'frame') frameSubs++; }

export const clock = {
  add(sub: ClockSub): () => void {
    subs.add(sub);
    recount();
    if (subs.size === 1) last = 0; // fresh start: no dt jump
    // a frame subscriber needs display-rate frames now, not at the next tick boundary
    if (sub.kind === 'frame' && timer) { clearTimeout(timer); timer = 0; }
    schedule();
    return () => clock.remove(sub);
  },
  remove(sub: ClockSub): void {
    subs.delete(sub);
    recount();
    if (!subs.size) cancel();
  },
  pause(): void { paused = true; cancel(); },
  resume(): void {
    if (!paused) return;
    paused = false;
    last = 0; acc = 0;
    schedule();
  },
  now(): number { return nowMs; },
  tick(): number { return tickCount; },
  get running(): boolean { return raf !== 0 || timer !== 0; },
  get paused(): boolean { return paused; },
  get size(): number { return subs.size; },
  get frames(): number { return frames; },
  /** Test hook: advance manually (Node / harness). */
  _step(ms: number): void { loop((nowMs || 0) + ms); cancel(); },
  _reset(): void { subs = new Set(); frameSubs = 0; cancel(); paused = false; last = 0; acc = 0; tickCount = 0; frames = 0; },
};

/** Convenience: subscribe a function to ticks. Returns unsubscribe. */
export function onTick(fn: (tick: number) => void): () => void { return clock.add({ kind: 'tick', onTick: fn }); }
export function onFrame(fn: (now: number, dt: number) => void): () => void { return clock.add({ kind: 'frame', onFrame: fn }); }
