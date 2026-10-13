// client-pharma · a capsule resting on the ground and a ring molecule with an iron atom (the running example's
// iron-containing active site) floating above it. Loop: the ring's bonds wiggle on their own phases, the Fe halo
// breathes lilac → indigo, and the family glint lands on the capsule.

import { definePiece, linePoints, part, type Grid } from '../../engine';
import { GROUND, LOOP, POSTER, SIZE, glint, mod, shadow, wave } from './shared';

const CAPSULE = part(`
  ....ssssssssssss....
  ..sscccccsppppppss..
  .scwwacccspwwppppes.
  scaacbbbbspppppppees
  sbcbbbbbbspppppppees
  sbbbbbbbbsppppppeels
  .sbbbbbbisppeeellls.
  ..ssbbbiisllllllss..
  ....ssssssssssss....
`, 'capsule');

const ATOM = part(`
  .ell.
  ewlls
  ellls
  lllss
  .sss.
`, 'atom');

const FE = part(`
  ..vvv..
  .vrrvv.
  vrwrvvn
  vrrvvvn
  vvvvvnn
  .vvvnn.
  ..nnn..
`, 'fe');

const CX = 31, CY = 19;
/** Pointy-top hexagon; slanted edges are exact 2:1 steps. */
const RING: ReadonlyArray<readonly [number, number]> = [[31, 9], [41, 14], [41, 24], [31, 29], [21, 24], [21, 14]];
/** Wiggle periods divide the 48-tick loop (6/8/12/16/24) so the loop stays exact. */
const BOND_WIGGLE: ReadonlyArray<readonly [number, number]> = [[6, 0], [8, 3], [12, 5], [8, 6], [6, 2], [12, 9]];
const SPOKE_WIGGLE: ReadonlyArray<readonly [number, number]> = [[16, 2], [24, 7], [16, 10], [24, 15], [16, 5], [24, 1]];

/** A bond whose middle third shifts 1 px perpendicular to it (the wiggle). Ends stay anchored. */
function bond(g: Grid, ax: number, ay: number, bx: number, by: number, off: number, clear = 0): void {
  const pts = linePoints(ax, ay, bx, by);
  const n = pts.length, lo = Math.floor(n / 3), hi = Math.ceil((2 * n) / 3);
  const vertical = ax === bx;
  pts.forEach(([x, y], i) => {
    if (clear && (x - CX) ** 2 + (y - CY) ** 2 < clear * clear) return;   // spokes start at the halo
    const o = i >= lo && i < hi ? off : 0;
    g.set(vertical ? x + o : x, vertical ? y : y + o, 'l');
  });
}

/** Halo hugging the Fe sphere: the 1-px ring just outside its silhouette (a midpoint circle of radius 4). */
function halo(g: Grid, tick: number): void {
  // 4 fps breathing: lilac 6 ticks, indigo 3, lilac 3 → period 12
  const p = mod(tick, 12);
  const k = p < 6 || p >= 9 ? 'r' : 'i';
  g.circle(CX, CY, 4, k);
}

export const clientPharma = definePiece({
  id: 'client-pharma',
  size: SIZE,
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 12,
  palette: ['s', 'l', 'e', 'w', 'p', 'c', 'a', 'b', 'i', 'v', 'r', 'n'],
  alt: 'A capsule beside a ring molecule with a violet iron atom at its centre.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    // ground and capsule
    shadow(g, 5, 18);
    g.blit(CAPSULE, 2, GROUND - 9);
    // ring bonds and Fe spokes (drawn under the atoms)
    RING.forEach(([ax, ay], i) => {
      const [bx, by] = RING[(i + 1) % RING.length];
      bond(g, ax, ay, bx, by, wave(tick, BOND_WIGGLE[i][0], BOND_WIGGLE[i][1]));
      // Fe coordinated to the four side atoms (an Fe–N4 pocket); top and bottom atoms close the ring only
      if (i % 3 !== 0) bond(g, CX, CY, ax, ay, wave(tick, SPOKE_WIGGLE[i][0], SPOKE_WIGGLE[i][1]), 5);
    });
    halo(g, tick);
    for (const [x, y] of RING) g.blit(ATOM, x - 2, y - 2);
    g.blit(FE, CX - 3, CY - 3);
    // family glint on the capsule's blue half
    glint(g, tick, 30, 7, GROUND - 6);
  },
});
