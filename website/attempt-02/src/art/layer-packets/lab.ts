// lab-bench (24×24): the client's lab. A bench with an Erlenmeyer flask (a bubble rises and pops every
// 8 ticks) and a small monitor. The monitor scans while the client waits and shows a ✓ when the
// certified result arrives from lane-left (12–35).

import { definePiece, part, type Grid } from '../../engine';
import { LOOP, POSTER, RESULT_OFF, RESULT_ON, since } from './timeline';

/** Flask glass (9×13), drawn at (2, 3). Liquid and bubble are overlaid procedurally. */
const FLASK = part(`
  ..ccccc..
  ...cgc...
  ...cwc...
  ...cgc...
  ...cgc...
  ..cwggc..
  ..cwggc..
  .cwggggc.
  .cgggggc.
  cgggggggc
  cgggggggc
  cgggggggc
  .ccccccc.
`, 'flask');
const FX = 2, FY = 3;
const LIQUID_TOP = 11, LIQUID_BOTTOM = 14;

const MONITOR = part(`
  ssssssss
  skkkkkks
  skkkkkks
  skkkkkks
  skkkkkks
  ssssssss
  ...mm...
  ...mm...
  ..ssss..
`, 'monitor');
const MX = 13, MY = 7;

const BUBBLE_X = [5, 7, 6, 5, 7, 6]; // one per 8-tick cycle, all inside the liquid at every row

function bench(g: Grid): void {
  g.rect(0, 16, 24, 1, 't');
  g.rect(0, 17, 24, 2, 'm');
  // legs: lit left column, shaded right column
  for (const lx of [2, 20]) { g.rect(lx, 19, 1, 5, 'm'); g.rect(lx + 1, 19, 1, 5, 's'); }
}

function flask(g: Grid, tick: number): void {
  g.blit(FLASK, FX, FY);
  for (let y = LIQUID_TOP; y <= LIQUID_BOTTOM; y++) {
    for (let x = FX; x < FX + FLASK.w; x++) {
      const k = g.get(x, y);
      if (k !== 'g' && k !== 'w') continue;
      g.set(x, y, y === LIQUID_TOP ? 'c' : 'b');
    }
  }
  // bubble: rises 1 px/tick from the bottom, pops at the surface, every 8 ticks
  const cyc = Math.floor((tick % LOOP) / 8), p = tick % 8;
  const bx = BUBBLE_X[cyc];
  if (p < 4) g.set(bx, LIQUID_BOTTOM - p, 'a');
  else if (p === 4) g.set(bx, LIQUID_TOP, 'w');
  else if (p === 5) { g.set(bx - 1, LIQUID_TOP - 1, 'a'); g.set(bx + 1, LIQUID_TOP - 1, 'a'); }
  // a wisp of vapour leaves the neck after each pop, drifting as it rises
  if (p >= 5) g.set(FX + 4 + (p === 6 ? 1 : 0), FY - 1 - (p - 5), 'l');
}

function monitor(g: Grid, tick: number): void {
  g.blit(MONITOR, MX, MY);
  const x0 = MX + 1, y0 = MY + 1; // display 6×4
  const r = since(tick, RESULT_ON - 1);
  if (r <= RESULT_OFF - RESULT_ON) {
    // ✓: one white tick as the certificate lands (11), then steady azure (12–35)
    const k = r === 0 ? 'w' : 'a';
    for (const [x, y] of [[0, 2], [1, 3], [2, 3], [3, 2], [4, 1], [5, 0]] as const) g.set(x0 + x, y0 + y, k);
    return;
  }
  // waiting: two dim text lines and a scanline sweeping down 1 px per 2 ticks
  g.rect(x0, y0 + 1, 4, 1, 'm');
  g.rect(x0, y0 + 3, 3, 1, 'm');
  const sl = (tick >> 1) & 3;
  g.rect(x0, y0 + sl, 6, 1, 'a');
}

export const labBench = definePiece({
  id: 'lab-bench',
  size: [24, 24],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 11,
  palette: ['k', 's', 'm', 't', 'l', 'w', 'b', 'c', 'a', 'g'],
  alt: '',   // decorative: the vault carries the diagram's alt (content.md §8)
  cache: 'loop',
  frame(tick: number, g: Grid) { bench(g); flask(g, tick); monitor(g, tick); },
});
