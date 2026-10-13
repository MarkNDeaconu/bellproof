// 3a · qubit-pair (hero riders) 32×16; variant sm 24×12. Alice (blue rim) and Bob (violet rim) stand on
// the top of the left rail stack, joined by the entanglement link. They sway their antennas in mirror,
// hop in mirror sync (one rises on the exact tick the other squats), and are measured together: both
// rims and the whole link flash on one tick, both antennas snap up (↑↑) and hold. Poster tick 20.
//
// Timeline (each 24-tick half; the second half swaps the hopper):
//   0–11  idle: facing each other, antennas sweep L-L-L U-U-U R-R-R U-U-U in mirror, blink on 7
//   12    anticipation: both squash
//   13–17 hopper rises 1, 1, hold, −1, −1 (antenna dragged on the way up); squatter squashes on the same ticks
//   15    apex = measurement: both rims + the whole link flash white on one tick, antennas snap up
//   16–17 a ring burst opens around both antenna tips on the same ticks (r 1, then r 2)
//   18    hopper landing squash; squatter rises
//   16–21 measured hold: facing the viewer, blush, link straight in indigo (the agreed state)
//   22–23 overlap back to idle: faces turn to each other, the link relaxes to the lilac/azure wave
//   (antennas stay up until the next sweep starts at 0 / 24)

import { definePiece, type Grid } from '../../engine';
import { BOX, drawCreature, FOOT_PAPER, type Pose, type Size } from './creature';
import { drawLink } from './link';

const LOOP = 48;

/** Idle antenna sweep for Alice (Bob is the mirror): L L L U U U R R R U U U. */
const SWEEP: Array<-1 | 0 | 1> = [-1, -1, -1, 0, 0, 0, 1, 1, 1, 0, 0, 0];

interface Half { air: number; body: Pose['body']; stalk?: number; tipFlat?: boolean; tip?: -1 | 0 | 1 }

/** Hopper and squatter poses at local tick h ∈ [0, 24) of a half. */
function half(h: number, size: Size): { hop: Half; squat: Half } {
  const idle: Half = { air: 0, body: 'normal' };
  const sq: Half = { air: 0, body: 'squash' };
  if (size === 'sm') {
    // sm has a single row of headroom: a 1-px hop held 4 ticks, the take-off antenna swept flat
    switch (h) {
      case 12: return { hop: sq, squat: sq };
      case 13: return { hop: { air: 1, body: 'stretch', stalk: 1, tipFlat: true, tip: -1 }, squat: sq };
      case 14: return { hop: { air: 1, body: 'normal', tip: -1 }, squat: sq };
      case 15: case 16: return { hop: { air: 1, body: 'normal' }, squat: sq };
      case 17: return { hop: idle, squat: sq };
      case 18: return { hop: sq, squat: idle };
      default: return { hop: idle, squat: idle };
    }
  }
  switch (h) {
    case 12: return { hop: sq, squat: sq };                                                     // anticipation
    case 13: return { hop: { air: 1, body: 'stretch', stalk: 1, tip: -1 }, squat: sq };          // take-off
    case 14: return { hop: { air: 2, body: 'normal', stalk: 1, tip: -1 }, squat: sq };
    case 15: return { hop: { air: 2, body: 'normal' }, squat: sq };                              // apex
    case 16: return { hop: { air: 1, body: 'stretch' }, squat: sq };
    case 17: return { hop: idle, squat: sq };                                                    // touchdown
    case 18: return { hop: sq, squat: idle };                                                    // landing squash
    default: return { hop: idle, squat: idle };
  }
}

/** Ring burst of radius r around (cx, cy): r 1 is a solid diamond, r 2 keeps every other pixel. */
function burst(g: Grid, cx: number, cy: number, r: number): void {
  if (r === 1) { g.set(cx - 1, cy, 'a'); g.set(cx + 1, cy, 'a'); g.set(cx, cy - 1, 'a'); g.set(cx, cy + 1, 'a'); return; }
  for (const [dx, dy] of [[2, 0], [1, -2], [-1, -2], [-2, 0], [-1, 2], [1, 2]]) g.set(cx + dx, cy + dy, 'a');
}

function drawPair(tick: number, g: Grid, size: Size): void {
  const t = ((tick % LOOP) + LOOP) % LOOP;
  const B = BOX[size];
  const by = g.h - B.h;                  // box top so the feet stand on the bottom row
  const ax = 0, bx = g.w - B.w;          // Alice left, Bob right
  const h = t % 24;
  const st = half(h, size);
  const aliceHalf = t < 24 ? st.hop : st.squat;
  const bobHalf = t < 24 ? st.squat : st.hop;
  const flash = h === 15;
  const upright = h >= 15;               // antennas up from the measurement to the end of the half
  const front = h >= 16 && h <= 21;      // facing the viewer during the hold
  const blush = h >= 17 && h <= 21;
  const linkState = flash ? 'flash' : h >= 16 && h <= 21 ? 'agree' : 'idle';
  const blink = h === 7;
  const sweep = SWEEP[h % 12];

  const pose = (who: 'alice' | 'bob', hh: Half): Pose => {
    const m = who === 'bob' ? -1 : 1;
    const tip = upright ? 0 : ((hh.tip ?? sweep) * m) as -1 | 0 | 1;
    return {
      who, size,
      face: front ? 0 : (m as 1 | -1), mirror: who === 'bob',
      eyes: blink ? 'closed' : 'open',
      tip, stalk: upright ? undefined : hh.stalk, tipFlat: upright ? false : hh.tipFlat,
      body: hh.body, air: hh.air,
      flash,
      blush: blush ? (who === 'alice' ? 'a' : 'r') : null,
      footKeys: FOOT_PAPER,
    };
  };
  const pa = pose('alice', aliceHalf), pb = pose('bob', bobHalf);

  // link between the orbs' equators, pinned to each orb (it tilts while one of them is in the air)
  const eq = size === 'md' ? 5 : 4;      // rows above the orb's bottom row
  const ya = by + B.orbBottom - eq - aliceHalf.air + (aliceHalf.body === 'squash' ? 1 : 0);
  const yb = by + B.orbBottom - eq - bobHalf.air + (bobHalf.body === 'squash' ? 1 : 0);
  drawLink(g, ax + B.w - 1, ya, bx, yb, t, { state: linkState, period: 24, harmonic: 1, shimmer: 6 });

  // measurement burst: a ring opens around both antenna tips on the same ticks (behind the creatures):
  // r 1 solid, then r 2 broken into every other pixel so it dissipates on paper and on ink alike
  if (h === 16 || (h === 17 && size === 'md')) {   // sm: r 1 only (r 2 would clip at the top edge)
    const orbH = size === 'md' ? 10 : 8;
    const tipRow = (air: number, body: Pose['body']) =>
      by + B.orbBottom - (orbH - 1) - air - (body === 'stretch' ? 1 : body === 'squash' ? -1 : 0) - B.stalk - 1;
    burst(g, ax + B.antL, tipRow(aliceHalf.air, aliceHalf.body), h - 15);
    burst(g, bx + B.w - 1 - B.antL, tipRow(bobHalf.air, bobHalf.body), h - 15);
  }

  drawCreature(g, ax, by, pa);
  drawCreature(g, bx, by, pb);
}

export const qubitPair = definePiece({
  id: 'qubit-pair',
  size: [32, 16],
  variants: { sm: [24, 12] },
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: 20,
  maxColours: 13,
  palette: ['k', 'n', 's', 'm', 'v', 'i', 'b', 'c', 'a', 'u', 'g', 'r', 'w'],
  alt: 'Two entangled qubit creatures, Alice and Bob, hop in mirror sync and are measured together.',
  cache: 'loop',
  frame(tick: number, g: Grid, _io, variant?: string) {
    drawPair(tick, g, variant === 'sm' ? 'sm' : 'md');
  },
  exports: { feetRow: 15, smFeetRow: 11 },
});
