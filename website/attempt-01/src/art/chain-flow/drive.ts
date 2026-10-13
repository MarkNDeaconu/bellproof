// Drivers the flow section calls. frame() stays pure: these only step the pieces' inputs on the clock.

import { clock, motion, type Mounted } from '../../engine';
import { CLICK_TICKS } from './block';

const running = new WeakMap<Mounted, () => void>();

/**
 * Click a chain block into the chain: lights it, bumps `click`, and steps `age` 0 → CLICK_TICKS on the
 * sprite clock (one tick each: smear, squash + link spark, glyph animation, settle). Reduced motion:
 * jumps straight to the settled, lit state. Safe to call again mid-animation (restarts it).
 */
export function clickChainBlock(m: Mounted): void {
  running.get(m)?.();
  m.set('lit', true);
  m.set('click', (Number(m.io.click) || 0) + 1);
  if (motion.reduced) { m.set('age', CLICK_TICKS); return; }
  let age = 0;
  m.set('age', 0);
  const un = clock.add({
    kind: 'tick',
    onTick() {
      age++;
      m.set('age', age);
      if (age >= CLICK_TICKS) stop();
    },
  });
  const stop = () => { un(); running.delete(m); };
  running.set(m, stop);
}

/** Put a block back to its waiting state (unlit, hovering 2 px above the chain). */
export function resetChainBlock(m: Mounted): void {
  running.get(m)?.();
  m.set('age', CLICK_TICKS);
  m.set('lit', false);
}
