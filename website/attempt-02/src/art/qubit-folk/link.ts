// The entanglement link: a 1-px line between two orbs, alternating lilac/azure pixels.
//
// Physics rule (research 03 §6.4): no signal may travel from Alice to Bob. So the link never scrolls.
// It vibrates as a standing wave pinned at both orbs (a plucked string, fundamental mode): it bows up,
// relaxes flat, bows down, relaxes, with no direction of travel. At a measurement it flashes along its
// whole length on one tick and then holds straight in indigo (the shared, agreed state).

import type { Grid, Key } from '../../engine';

export type LinkState = 'idle' | 'flash' | 'agree';

/** Integer vertical offset of the standing wave at fraction f ∈ [0,1] of the span, tick t. */
function wave(f: number, t: number, period: number, harmonic: number): number {
  const s = Math.sin(Math.PI * harmonic * f);
  const c = Math.cos((2 * Math.PI * t) / period);
  const q = s * c;
  return q >= 0.5 ? -1 : q <= -0.5 ? 1 : 0;
}

export interface LinkOpts {
  state?: LinkState;
  period?: number;      // ticks for one full bow-up/bow-down cycle (must divide the piece loop)
  harmonic?: number;    // 1 = one bow, 2 = an S
  /** Colour phase: the r/a alternation swaps in place every `shimmer` ticks (0 = never). */
  shimmer?: number;
}

/**
 * Draw the link from (x0, y0) to (x1, y1) inclusive (x0 < x1). The straight chord is interpolated in
 * integers; the wave adds −1/0/+1 px on top. Ends are always on the chord (pinned at the orbs).
 */
export function drawLink(g: Grid, x0: number, y0: number, x1: number, y1: number, t: number, o: LinkOpts = {}): void {
  const state = o.state ?? 'idle';
  const period = o.period ?? 24;
  const harmonic = o.harmonic ?? 1;
  const span = x1 - x0;
  const swap = o.shimmer ? Math.floor(t / o.shimmer) & 1 : 0;
  for (let x = x0; x <= x1; x++) {
    const f = span ? (x - x0) / span : 0;
    const base = Math.round(y0 + (y1 - y0) * f);
    const dy = state === 'idle' ? wave(f, t, period, harmonic) : 0;
    let k: Key;
    if (state === 'flash') k = 'w';
    else if (state === 'agree') k = 'i';
    else k = ((x + swap) & 1) ? 'r' : 'a';
    g.set(x, base + dy, k);
  }
}
