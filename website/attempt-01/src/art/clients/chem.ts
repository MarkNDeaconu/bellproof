// client-chem · a conical flask on a small stand. A violet catalyst grain sits on the flask floor; bubbles
// nucleate on it, rise 1 px per tick and pop at the surface into a white plus. One bubble every 8 ticks.

import { definePiece, int, part, rng, type Grid, type Key } from '../../engine';
import { GROUND, LOOP, POSTER, SIZE, glint, mod, shadow } from './shared';

const W = 24;               // flask width
const X0 = 12;              // flask left edge on the canvas
const STAND_H = 2;
const FLASK_H = 29;
const Y0 = GROUND - STAND_H - FLASK_H;   // flask top row
const SURFACE = 19;         // local row of the liquid surface (liquid rows 20–27 below it)

/** Half-open wall span [l, r] of the flask at local row y (walls included). */
function span(y: number): [number, number] {
  if (y <= 1) return [7, 16];                         // rim lip, 10 wide
  if (y <= 8) return [8, 15];                         // neck, 6 inside
  if (y <= 24) { const s = Math.floor((y - 9) / 2) + 1; return [8 - s, 15 + s]; }   // 2:1 cone
  if (y <= 27) return [0, 23];
  return [1, 22];                                      // bottom row, corners clipped
}

const AIR: Key = 'u';
const LIQUID: Key = 'i';
const MENISCUS: Key = 'r';

function drawFlask(g: Grid): void {
  for (let y = 0; y < FLASK_H; y++) {
    const [l, r] = span(y);
    for (let x = l; x <= r; x++) {
      const edge = x === l || x === r || y === 0 || y === FLASK_H - 1;
      let k: Key;
      if (edge) k = x === l && y > 0 && y < FLASK_H - 1 ? 'e' : 's';
      else if (y === 1) k = x < 12 ? 'e' : 'l';       // rim lip face
      else if (y === SURFACE - 1 && (x === l + 1 || x === r - 1)) k = MENISCUS;   // meniscus creeps up the glass
      else if (y < SURFACE) k = x === r - 1 && y > 2 ? 'l' : AIR;                  // glass thickness on the shadow side
      else if (y === SURFACE) k = MENISCUS;
      else k = x >= r - 2 || (y === FLASK_H - 2 && x >= 13) ? 'v' : LIQUID;      // liquid falls into shadow lower right
      g.set(X0 + x, Y0 + y, k);
    }
  }
  // glass highlight streak down the lit (left) wall
  for (let y = 3; y < 18; y++) { const [l] = span(y); g.set(X0 + l + 1, Y0 + y, y < 9 ? 'g' : 'w'); }
}

/** Catalyst grain on the flask floor (violet, lit upper-left). */
const CATALYST = part(`
  ..wr..
  .wrrrv
  rrrvvv
`, 'catalyst');
function drawCatalyst(g: Grid): void { g.blit(CATALYST, X0 + 10, Y0 + 25); }

const STARTS = (() => {
  const rand = rng(13);
  return Array.from({ length: 6 }, (_, i) => ({ at: i * 8, dx: int(rand, -2, 2) }));
})();

function drawBubbles(g: Grid, tick: number): void {
  const t = mod(tick, LOOP);
  for (const b of STARTS) {
    const age = mod(t - b.at, LOOP);
    const y = Y0 + 24 - age;                         // rises 1 px per tick from just above the grain
    const x = X0 + 13 + b.dx + ((age >> 1) & 1);     // and wobbles 1 px every 2 ticks
    if (y > Y0 + SURFACE) g.set(x, y, 'a');
    else if (y === Y0 + SURFACE) {                  // pop: a 3-px white plus for one tick
      g.set(x, y, 'w'); g.set(x - 1, y, 'w'); g.set(x + 1, y, 'w'); g.set(x, y - 1, 'w'); g.set(x, y + 1, 'w');
    }
  }
}

/** After every other pop a wisp of vapour leaves the neck: two glow pixels drifting up and fading to mist. */
const WISP: ReadonlyArray<ReadonlyArray<readonly [number, number, Key]>> = [
  [[11, -1, 'g']],
  [[11, -2, 'g'], [12, -1, 'u']],
  [[12, -3, 'g'], [11, -2, 'u']],
  [[12, -4, 'u']],
];
function drawWisps(g: Grid, tick: number): void {
  const d = mod(tick - 7, 16);                     // pops land on 5, 13, 21 …; wisps follow 5, 21, 37 by 2 ticks
  if (d < WISP.length) for (const [x, y, k] of WISP[d]) g.set(X0 + x, Y0 + y, k);
}

export const clientChem = definePiece({
  id: 'client-chem',
  size: SIZE,
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 12,
  palette: ['s', 'l', 'e', 'w', 'u', 'g', 'a', 'v', 'r', 'n', 'i'],
  alt: 'A flask with bubbles rising from a catalyst and popping at the surface.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    shadow(g, X0 - 1, X0 + W);
    // stand: a lit top edge over a navy slab, wider than the flask
    g.rect(X0 - 3, GROUND - 2, W + 6, 1, 'l');
    g.rect(X0 - 3, GROUND - 1, W + 6, 1, 's');
    drawFlask(g);
    drawCatalyst(g);
    drawBubbles(g, tick);
    drawWisps(g, tick);
    glint(g, tick, 26, X0 + 12, Y0 + 25);      // the family glint lands on the catalyst grain (26–29)
  },
});
