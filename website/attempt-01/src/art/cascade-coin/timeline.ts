// cascade-coin · the cascade choreography as a pure function of time. No DOM, no state.
//
// The cost section (design-spec §5.4 B) moves the canvas along the alert connector in whole art units and drives
// the piece's inputs. `cascadeAt(t)` returns both for any tick `t` of a run: where the canvas should be (`x`, art
// units right of the first stop) and the `inputs` to apply with `mounted.set(k, v)`. The piece's own `story` mode
// plays the same choreography in place (gap 0), so the harness, the contact sheets and the page share one timeline.
//
// One run:  enter (fade in, empty belt at stop 1)
//           → at each stop: a token drops in (stack + 1), lands, glints, holds
//           → between stops: the belt runs while the canvas travels right
//           → at stop 5: the tower wobbles, dissolves, rests (invisible) and the run restarts.

export const STOPS = 5;
export const MAX_STACK = 5;

/** Rest row (top) of token n (1-based), tokens stack upward from row 19. */
export const restY = (n: number): number => 20 - 3 * n;
/** Ticks a dropped token is airborne. It enters from the top edge (top row −1, so it slides in rather than popping
 *  into mid-air) and falls 3 px/tick; the tick before landing is the smear; it lands (squash) on tick `landAge(n)`. */
export const landAge = (n: number): number => Math.ceil(restY(n) / 3);

export interface CascadeOpts {
  /** Art units between consecutive stops (one number, or four for uneven columns). 0 plays in place. */
  gap?: number | readonly number[];
  /** Art units per tick while travelling. 2 gives ≈ 60 ticks per bar on the lg layout (design-spec §5.4). */
  speed?: number;
  /** Minimum ticks of belt running between stops (story mode runs the belt in place). */
  travelMin?: number;
  /** Ticks paused at each stop: the drop (≤ 7), the landing glint, the hold. */
  dwell?: number;
  /** Ticks of wobble at the last stop before the dissolve. */
  wobble?: number;
  /** Ticks of the fade in (4 dither levels) and of the dissolve out. */
  enter?: number;
  exit?: number;
  /** Invisible ticks after the dissolve (the section moves the canvas back to stop 1 here). */
  rest?: number;
}

export interface CascadeInputs { stack: number; age: number; wobble: boolean; belt: boolean; travel: number; fade: number }

export interface CascadeFrame {
  /** Art units right of stop 1 (integer). Multiply by 4 for CSS px, or pass to `moveUnits(el, x, 0)`. */
  x: number;
  /** Index of the stop the canvas is at or last left (0–4). */
  stop: number;
  /** true while travelling between stops. */
  moving: boolean;
  /** The phase name, for state readouts: 'enter' | 'drop' | 'travel' | 'wobble' | 'exit' | 'rest'. */
  phase: 'enter' | 'drop' | 'travel' | 'wobble' | 'exit' | 'rest';
  /** Inputs for the piece, ready for `for (const [k, v] of Object.entries(f.inputs)) m.set(k, v)`. */
  inputs: CascadeInputs;
}

const DEFAULTS = { gap: 0, speed: 2, travelMin: 0, dwell: 22, wobble: 36, enter: 8, exit: 8, rest: 14 } as const;

function resolve(o: CascadeOpts = {}) {
  const r = { ...DEFAULTS, ...o };
  // whole art units only, so `x` is always an integer (fractional column widths round here, not on the page)
  const gaps = (Array.isArray(r.gap) ? [...(r.gap as readonly number[])] : new Array(STOPS - 1).fill(r.gap as number)).map((g: number) => Math.round(g));
  const travel = gaps.map((g) => Math.max(r.travelMin, Math.ceil(Math.max(0, g) / r.speed)));
  return { ...r, gaps, travel };
}

/** Length in ticks of one run with these options. */
export function cascadeTicks(o: CascadeOpts = {}): number {
  const r = resolve(o);
  return r.enter + STOPS * r.dwell + r.travel.reduce((a, b) => a + b, 0) + r.wobble + r.exit + r.rest;
}

/** Dither level k ticks into a fade in of `len` ticks: 1 1 2 2 3 3 4 4 for len 8 (never a blank first tick). */
const fadeIn = (k: number, len: number): number => Math.min(4, Math.floor((k * 4) / Math.max(1, len)) + 1);
/** Dither level k ticks into a dissolve of `len` ticks: 3 3 2 2 1 1 0 0 for len 8. */
const fadeOut = (k: number, len: number): number => Math.max(0, 3 - Math.floor((k * 4) / Math.max(1, len)));

/** The choreography at tick `t` (may be fractional; wraps every run). */
export function cascadeAt(t: number, o: CascadeOpts = {}): CascadeFrame {
  const r = resolve(o);
  const total = cascadeTicks(o);
  const tt = ((t % total) + total) % total;
  let k = Math.floor(tt);
  let x = 0, travelled = 0;
  const frame = (phase: CascadeFrame['phase'], stop: number, moving: boolean, inputs: Partial<CascadeInputs>): CascadeFrame => ({
    x, stop, moving, phase,
    inputs: { stack: 0, age: 99, wobble: false, belt: false, travel: travelled, fade: 4, ...inputs },
  });

  if (k < r.enter) return frame('enter', 0, false, { stack: 0, fade: fadeIn(k, r.enter) });
  k -= r.enter;
  for (let s = 0; s < STOPS; s++) {
    if (k < r.dwell) return frame('drop', s, false, { stack: s + 1, age: k });
    k -= r.dwell;
    if (s === STOPS - 1) break;
    const len = r.travel[s];
    if (k < len) {
      // integer units, eased only by the quantisation: the canvas steps right at `speed` units per tick
      const frac = tt - Math.floor(tt);
      x += Math.min(r.gaps[s], Math.floor((k + frac) * r.speed));
      travelled += k;
      return frame('travel', s, true, { stack: s + 1, belt: true, travel: travelled });
    }
    k -= len;
    x += r.gaps[s];
    travelled += len;
  }
  if (k < r.wobble) return frame('wobble', STOPS - 1, false, { stack: STOPS, wobble: true });
  k -= r.wobble;
  if (k < r.exit) return frame('exit', STOPS - 1, false, { stack: STOPS, wobble: true, fade: fadeOut(k, r.exit) });
  return frame('rest', STOPS - 1, false, { stack: STOPS, fade: 0 });
}

/** The in-place run used by the piece's `story` mode: 240 ticks (20 s), a multiple of the 24-tick belt loop. */
export const STORY: CascadeOpts = { gap: 0, travelMin: 16, dwell: 24, wobble: 30, enter: 6, exit: 8, rest: 12 };
