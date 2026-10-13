// 3c · qubit-walker (footer patrol, hero pill riser) 12×14, cache 'none'. One creature with a neutral rim
// (c/t/m) and a violet Bloch antenna.
//   mode 'walk'    : the 8-pose cycle at 6 fps (one pose per 2 ticks). The footer moves the canvas 1 art px
//                    (4 CSS px) every 2 ticks, on even local ticks, so planted feet stay put. `dir` 1 | −1.
//   mode 'precess' : 12 ticks from `since`: the antenna precesses L → front → R → back, twice, the second
//                    turn twice as fast; the eyes follow the tip. Fires 'done' on its last tick.
//   mode 'hop'     : 6 ticks from `since`: squash, rise 2 px with the antenna dragged flat, fall, land squash.
//                    Fires 'done' on its last tick.
//   mode 'stand'   : faces the viewer, antenna sweep, blink (the hero pill riser uses this).
// Poster: walk pose 0, facing right.

import { definePiece, type Grid, type PieceIO } from '../../engine';
import { drawCreature, FOOT_PAPER, type Pose } from './creature';
import { walkPose } from './walk';

const LOOP = 48;
export const PRECESS_TICKS = 12;
export const HOP_TICKS = 6;
const SWEEP: Array<-1 | 0 | 1> = [-1, -1, -1, 0, 0, 0, 1, 1, 1, 0, 0, 0];
const mod = (a: number, n: number) => ((a % n) + n) % n;
const WALK_FEET = [FOOT_PAPER[1], FOOT_PAPER[0]] as const;   // behind foot shaded, front foot lit

// precession: L, front, R, back. The back tip drops to cornflower (the far side of the sphere, a depth cue).
const PREC: Array<{ tip: -1 | 0 | 1; back: boolean }> = [
  { tip: -1, back: false }, { tip: 0, back: false }, { tip: 1, back: false }, { tip: 0, back: true },
];
function precessStep(e: number): number {
  if (e < 8) return Math.floor(e / 2) % 4;   // first turn: 2 ticks per position
  return (e - 8) % 4;                         // second turn: 1 tick per position
}

function elapsed(tick: number, io: PieceIO): number { return mod(tick - Number(io.since ?? 0), LOOP); }

/**
 * The tip bead uses the brightest key that reads on the surface each mode lives on: the footer modes
 * (walk / precess / hop) run over the blue strata band, where white pops; 'stand' is the hero pill riser on
 * the card, where white would vanish, so it keeps the default azure bead.
 */
const FOOTER_TIP = 'w' as const;

function pose(tick: number, io: PieceIO): Pose {
  const p = basePose(tick, io);
  if ((io.mode || 'walk') !== 'stand' && !p.tipKey) p.tipKey = FOOTER_TIP;
  return p;
}

function basePose(tick: number, io: PieceIO): Pose {
  const t = mod(tick, LOOP);
  const dir: 1 | -1 = Number(io.dir) < 0 ? -1 : 1;
  const mode = io.mode || 'walk';
  if (mode === 'walk') {
    const w = walkPose(Math.floor(t / 2), dir);
    return { who: 'neutral', face: dir, feet: w.feet, bob: w.bob, tip: w.tip, footKeys: WALK_FEET };
  }
  if (mode === 'precess') {
    const e = elapsed(tick, io);
    if (e < PRECESS_TICKS) {
      const s = PREC[precessStep(e)];
      return { who: 'neutral', face: 0, tip: s.tip, tipKey: s.back ? 'c' : undefined, look: s.tip ? [s.tip, 0] : [0, -1] };
    }
    return { who: 'neutral', face: 0 };
  }
  if (mode === 'hop') {
    const e = elapsed(tick, io);
    switch (e) {
      case 0: return { who: 'neutral', face: 0, body: 'squash' };
      case 1: return { who: 'neutral', face: 0, body: 'stretch', air: 1, stalk: 1, tipFlat: true, tip: -1 };
      case 2: return { who: 'neutral', face: 0, air: 2, stalk: 1, tipFlat: true, tip: -1 };
      case 3: return { who: 'neutral', face: 0, air: 1, stalk: 1, tip: -1 };
      case 4: return { who: 'neutral', face: 0, body: 'squash', tip: 1 };
      case 5: return { who: 'neutral', face: 0, tip: 0 };
      default: return { who: 'neutral', face: 0 };
    }
  }
  // stand
  const blink = t === 22 || t === 46;
  return { who: 'neutral', face: 0, tip: SWEEP[t % 12], eyes: blink ? 'closed' : 'open' };
}

export const qubitWalker = definePiece({
  id: 'qubit-walker',
  size: [12, 14],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: 0,
  maxColours: 10,
  palette: ['k', 's', 'm', 't', 'c', 'v', 'a', 'u', 'g', 'w'],
  alt: 'A small qubit creature with a Bloch-vector antenna.',
  cache: 'none',
  inputs: { dir: { type: 'number', default: 1 }, since: { type: 'number', default: 0 } },
  modes: ['walk', 'precess', 'hop', 'stand'],
  states: ['walk', 'precess', 'hop', 'stand', 'idle'],
  frame(tick: number, g: Grid, io: PieceIO) { drawCreature(g, 0, 0, pose(tick, io)); },
  state(tick: number, io: PieceIO) {
    const mode = io.mode || 'walk';
    if (mode === 'precess') return elapsed(tick, io) < PRECESS_TICKS ? 'precess' : 'idle';
    if (mode === 'hop') return elapsed(tick, io) < HOP_TICKS ? 'hop' : 'idle';
    return mode;
  },
  events(tick: number, io: PieceIO) {
    const e = elapsed(tick, io);
    if (io.mode === 'precess' && e === PRECESS_TICKS - 1) return ['done'];
    if (io.mode === 'hop' && e === HOP_TICKS - 1) return ['done'];
    return [];
  },
  exports: { walkArtPxPerTick: 0.5, moveEveryTicks: 2, precessTicks: PRECESS_TICKS, hopTicks: HOP_TICKS },
});
