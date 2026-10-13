// The ring gag and the footer reveal (design §5.11, art-spec card 16). DOM-side: it animates the SVG built by
// `markSVG()` on the engine's 12 fps tick clock. The same `ringState()` drives the registered piece's frames,
// so the harness contact sheet and the live footer show the identical timeline.

import { clock } from '../../engine/clock';
import { motion, observe } from '../../engine/visibility';
import { haloSVG } from './bell';

export interface RingFrame { dx: -1 | 0 | 1; halo: 0 | 1 | 2 | 3 }

/** Length of the ring in ticks (1 s at 12 fps): three clapper swings at 6 fps. */
export const RING_TICKS = 12;
const SWINGS: ReadonlyArray<-1 | 0 | 1> = [-1, 0, 1, 0, -1, 0];
const HALO: ReadonlyArray<0 | 1 | 2 | 3> = [1, 1, 2, 3];

/**
 * Timeline. `t` = ticks since the ring started.
 *   t0–1  clapper left,   halo at 1 art px (the card's 2-tick outline)
 *   t2–3  centre,         halo expands to 2 then 3 px (the ripple of design §5.11), then gone
 *   t4–5  right · t6–7 centre · t8–9 left · t10–11 centre → rest
 */
export function ringState(t: number): RingFrame {
  if (t < 0 || t >= RING_TICKS) return { dx: 0, halo: 0 };
  return { dx: SWINGS[Math.floor(t / 2)], halo: t < HALO.length ? HALO[t] : 0 };
}

const haloCache = new Map<string, string>();
function haloMarkup(d: 1 | 2 | 3, dx: number): string {
  const key = `${d}:${dx}`;
  let s = haloCache.get(key);
  if (s === undefined) { s = haloSVG(d, dx); haloCache.set(key, s); }
  return s;
}

/** Put a mark SVG (from `markSVG`) into a ring frame. Idempotent; `{dx:0, halo:0}` is the rest state. */
export function applyRingFrame(svg: SVGSVGElement, f: RingFrame): void {
  const clapper = svg.querySelector<SVGGElement>('[data-clapper]');
  const halo = svg.querySelector<SVGGElement>('[data-halo]');
  if (clapper) {
    if (f.dx) clapper.setAttribute('transform', `translate(${f.dx} 0)`);
    else clapper.removeAttribute('transform');
  }
  if (halo) {
    const next = f.halo ? haloMarkup(f.halo, f.dx) : '';
    if (halo.innerHTML !== next) halo.innerHTML = next;
  }
}

const active = new WeakMap<SVGSVGElement, Promise<void>>();

/**
 * Ring the bell once: 12 ticks on the shared clock, then back to rest. Returns a promise for the end of the ring.
 * A second call while ringing returns the running ring. Reduced motion: no change, resolves immediately.
 */
export function ring(svg: SVGSVGElement): Promise<void> {
  const running = active.get(svg);
  if (running) return running;
  if (motion.reduced) return Promise.resolve();
  const p = new Promise<void>((resolve) => {
    let t = 0;
    applyRingFrame(svg, ringState(0));
    const un = clock.add({
      kind: 'tick',
      onTick() {
        t++;
        if (t >= RING_TICKS || motion.reduced) {
          un();
          applyRingFrame(svg, { dx: 0, halo: 0 });
          active.delete(svg);
          resolve();
          return;
        }
        applyRingFrame(svg, ringState(t));
      },
    });
  });
  active.set(svg, p);
  return p;
}

export interface FooterRevealOpts {
  /** The giant mark (`footerMark()`), positioned by layout-core: centred, bottom-aligned on the strata. */
  mark: SVGSVGElement;
  /** The element whose top edge scrubs the reveal: the sub-footer row. */
  trigger: Element;
  /** Scroll distance of the scrub in CSS px (trigger top from viewport bottom → viewport bottom − distance). Default 280. */
  distance?: number;
  /** One step of the rise in CSS px (one art px of the mark). Default 20. */
  step?: number;
  /** The mark's height in CSS px (the 100% of the translate). Default 220. */
  height?: number;
  /** Ring once when fully risen and the page is at its bottom. Default true. */
  ringOnce?: boolean;
  onRing?(): void;
}

export interface FooterRevealHandle {
  /** Has the once-per-visit ring fired? */
  readonly rung: boolean;
  /** Current translateY in px (0 = fully risen). */
  readonly offset: number;
  /** Ring now (also marks the visit as rung). */
  ring(): Promise<void>;
  dispose(): void;
}

/**
 * The footer reveal: the mark's `transform` goes from translateY(height) to 0 as `trigger` scrolls up through the
 * last `distance` px of the viewport, quantised to `step` px, computed on the frame clock only while the trigger
 * is near the viewport. When the offset reaches 0 and the document is scrolled to its end, the bell rings once.
 * Reduced motion: the mark is in place and never rings (live media-query changes are honoured).
 */
export function footerReveal(opts: FooterRevealOpts): FooterRevealHandle {
  const { mark, trigger } = opts;
  const distance = opts.distance ?? 280;
  const step = opts.step ?? 20;
  const height = opts.height ?? 220;
  const steps = Math.max(1, Math.round(height / step));
  const ringOnce = opts.ringOnce !== false;
  let last = -1, rung = false, unsub: (() => void) | null = null, disposed = false;

  const atBottom = (): boolean => {
    const doc = document.documentElement;
    return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 1;
  };
  const setOffset = (y: number): void => {
    if (y === last) return;
    last = y;
    mark.style.transform = y ? `translateY(${y}px)` : '';
  };
  const apply = (): void => {
    if (motion.reduced) { setOffset(0); return; }
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const top = trigger.getBoundingClientRect().top;
    const p = Math.min(1, Math.max(0, (vh - top) / distance));
    setOffset((steps - Math.round(p * steps)) * step);
    if (last === 0 && ringOnce && !rung && atBottom()) { rung = true; ring(mark).then(() => opts.onRing?.()); }
  };
  // integrator R2 (queue #10): the frame subscriber runs only while the trigger is near the viewport. A motion resume used
  // to call play() unconditionally, adding a 60 fps subscriber with the footer off-screen (120 rAF/s seen at #research).
  let visible = false;
  const play = (): void => { visible = true; if (!unsub && !motion.reduced) unsub = clock.add({ kind: 'frame', onFrame: apply }); apply(); };
  const stop = (): void => { visible = false; unsub?.(); unsub = null; };
  const halt = (): void => { unsub?.(); unsub = null; };

  apply();
  const unobserve = observe(trigger, { play, stop });
  const unmotion = motion.onChange((reduced) => { if (reduced) { halt(); setOffset(0); } else if (visible) play(); else apply(); });

  return {
    get rung() { return rung; },
    get offset() { return Math.max(0, last); },
    ring() { rung = true; return ring(mark); },
    dispose() { if (disposed) return; disposed = true; stop(); unobserve(); unmotion(); },
  };
}
