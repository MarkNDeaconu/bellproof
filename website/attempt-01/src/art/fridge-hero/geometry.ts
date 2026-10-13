// fridge-hero · static geometry and precomputed tables (art-spec card 1, design §5.1).
// Everything here is constant data derived once at module load; frame() only reads it.

import type { Key } from '../../engine';

export const W = 56;
export const H = 128;
export const CX = 28;            // the cable column and the bit's fall column
export const LOOP = 144;
export const PULSE_PERIOD = 48;  // one pulse per line every 48 ticks; bits drop every 48 ticks

export interface Plate { x: number; y: number; w: number; label: string }

/** Plates top to bottom. Every plate is 5 rows (see `plate()` in index.ts). Centre of symmetry is x = 27.5. */
export const PLATES: readonly Plate[] = [
  { x: 4, y: 4, w: 48, label: '300 K' },   // 0 top flange (room temperature)
  { x: 6, y: 20, w: 44, label: '50 K' },   // 1
  { x: 9, y: 38, w: 38, label: '4 K' },    // 2
  { x: 12, y: 56, w: 32, label: '800 mK' },// 3 still
  { x: 15, y: 72, w: 26, label: '100 mK' },// 4 cold plate
  { x: 18, y: 86, w: 20, label: '10 mK' }, // 5 mixing chamber
];

/** Rows of the five temperature labels (the gleam row r2 of plates 1..5). HTML labels anchor here. */
export const labelRows = [22, 40, 58, 74, 88] as const;
/** Left edge x (art px) of plates 1..5, where the HTML dotted leaders should end. */
export const plateLeft = [6, 9, 12, 15, 18] as const;

/** Support rods between consecutive plates: 1 px `m`, inset 1 from the lower plate's edge (0 for the MXC),
 *  running from the upper plate's underside through the lower plate's back-edge row so they meet its face. */
export const RODS: ReadonlyArray<readonly [x: number, y0: number, y1: number, wide: 0 | 1]> = [
  [6, 9, 20, 1], [48, 9, 20, 1],
  [10, 25, 38, 1], [44, 25, 38, 1],
  [13, 43, 56, 0], [42, 43, 56, 0],
  [16, 61, 72, 0], [39, 61, 72, 0],
  [18, 77, 86, 0], [37, 77, 86, 0],
];

/** Coax segments between plates (rows inclusive) and the x of the six lines in each segment.
 *  Line order j: 0 = outer left, 1 = mid left, 2 = inner left, 3 = inner right, 4 = mid right, 5 = outer right.
 *  Lines step inward under each plate (the jog is hidden by the plate) and converge to x 20..35 above the MXC. */
export const SEG_ROWS: ReadonlyArray<readonly [number, number]> = [[9, 19], [25, 37], [43, 55], [61, 71], [77, 85]];
export const LINE_X: ReadonlyArray<readonly number[]> = [
  [13, 19, 25, 30, 36, 42],
  [15, 20, 25, 30, 35, 40],
  [17, 21, 25, 30, 34, 38],
  [19, 22, 26, 29, 33, 36],
  [20, 23, 26, 29, 32, 35],
];

/** Expansion loops ("hairpins") on the mid lines in the 4 K → still segment: a 3×4 ring around a 1×2 hole. */
export const HAIRPINS: ReadonlyArray<{ line: number; seg: number; y: number; side: -1 | 1 }> = [
  { line: 1, seg: 2, y: 51, side: -1 },  // left mid line, the pulse runs down the left side of the loop
  { line: 4, seg: 2, y: 51, side: 1 },   // right mid line, the pulse runs down the right side
];

/** Attenuator beads 3×2 (`e e s` / `t t s` when lit), centred on a line; `stage` = the plate they hang under. */
export const BEADS: ReadonlyArray<{ x: number; y: number; stage: number }> = [
  { x: 16, y: 49, stage: 2 }, { x: 37, y: 45, stage: 2 },   // outer lines under 4 K, staggered (the HEMT sits above the left one)
  { x: 21, y: 64, stage: 3 }, { x: 32, y: 64, stage: 3 },   // mid lines under the still
  { x: 22, y: 80, stage: 4 }, { x: 31, y: 80, stage: 4 },   // mid lines under the cold plate
];

export const HEMT = { x: 10, y: 43, w: 6, h: 4 } as const;        // amplifier box under 4 K (in front of the rod at x 13)
export const CIRC = { x: 38, y: 61 } as const;                    // 5×5 circulator disc under the still (in front of the rod at x 39)
export const FINGER = { x: 26, y0: 91, y1: 97 } as const;         // cold finger, 4 wide: l t t s
export const CHIP = { x: 21, y: 98, w: 14, h: 11 } as const;      // chip package rows 98..108
export const WINDOW = { x: 24, y: 102, w: 9, h: 3 } as const;     // k window; halo ring is one px around it (corners rounded)
export const QUBITS: ReadonlyArray<readonly [number, number]> = [[25, 103], [27, 103], [29, 103], [31, 103]];
export const NUBS: ReadonlyArray<readonly [number, number]> = [[20, 102], [20, 103], [35, 102], [35, 103]];

/** Which qubit blinks when line j's pulse arrives. */
export const LINE_QUBIT = [0, 1, 1, 2, 2, 3] as const;
/** Pulse launch order k → line j, so consecutive launches alternate sides. */
export const LAUNCH_ORDER = [0, 5, 2, 3, 1, 4] as const;

/** Intro timeline in ticks after `intro` (design §5.1: lower 100–1000 ms, cooldown 1000–1500, ignite 1500). */
export const INTRO = {
  lowerTicks: [112, 84, 61, 42, 28, 18, 10, 5, 2, 1, 0] as const, // lift in art px at t = 0..10 (power3Out spacing)
  restTick: 10,
  coolTicks: [12, 13, 14, 15, 16] as const,                      // stage k (1..5) cools and its rim flashes at coolTicks[k-1]
  igniteTick: 18,
} as const;

export const HALO_STEPS: readonly Key[] = ['n', 'i', 'r', 'i'];  // 6 fps breathing, 8-tick cycle (144 / 8 = 18)

/** One line's pulse path: ordered points from the top of the first segment to the bottom of the cold finger. */
export interface Path { pts: Array<[number, number]>; holdAt: Set<number>; sched: number[] }

function buildPath(j: number): Path {
  const pts: Array<[number, number]> = [];
  const holdAt = new Set<number>();
  const hp = HAIRPINS.find((h) => h.line === j);
  SEG_ROWS.forEach(([y0, y1], s) => {
    const x = LINE_X[s][j];
    for (let y = y0; y <= y1; y++) {
      if (hp && hp.seg === s && (y === hp.y + 1 || y === hp.y + 2)) pts.push([x + hp.side, y]);
      else pts.push([x, y]);
    }
    holdAt.add(pts.length - 1);           // thermal anchoring: the head holds one tick above every plate (incl. the MXC)
  });
  for (let y = FINGER.y0; y <= FINGER.y1; y++) pts.push([FINGER.x + 1, y]);   // down the cold finger (drawn 2 wide)
  // schedule: head index per tick since launch; 2 px per tick, +1 tick hold above each plate
  const sched: number[] = [];
  let idx = 0, held = false;
  sched.push(idx);
  while (idx < pts.length - 1) {
    if (holdAt.has(idx) && !held) { held = true; sched.push(idx); continue; }
    held = false;
    idx = Math.min(idx + 2, pts.length - 1);
    sched.push(idx);
  }
  return { pts, holdAt, sched };
}

export const PATHS: readonly Path[] = [0, 1, 2, 3, 4, 5].map(buildPath);
/** Ticks from launch to arrival in the chip (the tick after the head reaches the finger's end). */
export const TRAVEL = PATHS.map((p) => p.sched.length);
