// fridge-hero · static geometry, component parts and precomputed tables (art-spec card 1, revision 1 F2).
// Everything here is constant data derived once at module load; frame() only reads it.

import { part, type Key } from '../../engine';

export const W = 56;
export const H = 128;
export const CX = 28;            // the hanging cable column and the bit's fall column
export const LOOP = 144;
export const PULSE_PERIOD = 48;  // one pulse per line every 48 ticks; bits drop (and the readout climbs) every 48 ticks

export interface Plate { x: number; y: number; w: number; label: string }

/** Plates top to bottom. Every plate is 6 rows (r0 back edge … r5 deep underside, see `plate()` in index.ts).
 *  Centre of symmetry x = 27.5. The x/w values are pinned by `plateLeft` (sections-1 anchors its leaders there). */
export const PLATES: readonly Plate[] = [
  { x: 4, y: 4, w: 48, label: '300 K' },   // 0 top flange (room temperature)
  { x: 6, y: 20, w: 44, label: '50 K' },   // 1
  { x: 9, y: 38, w: 38, label: '4 K' },    // 2
  { x: 12, y: 56, w: 32, label: '800 mK' },// 3 still
  { x: 15, y: 72, w: 26, label: '100 mK' },// 4 cold plate
  { x: 18, y: 86, w: 20, label: '10 mK' }, // 5 mixing chamber
];
export const PLATE_ROWS = 6;

/** Rows of the five temperature labels (the full-width front row r2 of plates 1..5). HTML labels anchor here. */
export const labelRows = [22, 40, 58, 74, 88] as const;
/** Left edge x (art px) of plates 1..5 (their widest row, r2), where the HTML dotted leaders end. */
export const plateLeft = [6, 9, 12, 15, 18] as const;

/** Coax segments between plates (rows inclusive) and the x of the six lines in each segment.
 *  j: 0 outer-left = the OUTPUT line (HEMT, circulators; the readout climbs it)
 *     1 mid-left · 2 inner-left · 3 inner-right · 4 mid-right · 5 outer-right (drive lines, pulses go down).
 *  Lines step inward under plates (the jog is hidden by the plate); the inner pair keeps a 6-px central bay
 *  (x 25..30) for the heat-exchanger coil and the TWPA. */
export const SEG_ROWS: ReadonlyArray<readonly [number, number]> = [[10, 19], [26, 37], [44, 55], [62, 71], [78, 85]];
export const LINE_X: ReadonlyArray<readonly number[]> = [
  [17, 20, 23, 31, 34, 37],   // 2-px semi-rigid steel above 4 K: x is the lit left column
  [17, 20, 23, 31, 34, 37],
  [18, 21, 24, 31, 34, 37],   // 1-px superconducting lines below
  [19, 22, 24, 31, 33, 36],
  [20, 22, 24, 31, 33, 35],
];
export const OUT_LINE = 0;
/** Segments drawn 2 px wide (`l t`): the room-temperature and 50 K runs. */
export const THICK_SEGS = 2;

/** Truss rods per segment: [x, y0, y1, wide]. Inset 1 from the lower plate (0 at the MXC so the lines keep a gap).
 *  They start under the upper plate's rim and run into the lower plate's top face. Upper two: 2-px tubes. */
export const RODS: ReadonlyArray<readonly [x: number, y0: number, y1: number, wide: 0 | 1]> = [
  [7, 9, 21, 0], [48, 9, 21, 0],
  [10, 25, 39, 0], [45, 25, 39, 0],
  [13, 43, 57, 0], [42, 43, 57, 0],
  [16, 61, 73, 0], [39, 61, 73, 0],
  [18, 77, 87, 0], [37, 77, 87, 0],
];

/** Expansion loops: an oval ring (3 wide, 5 tall) around a 1×3 hole on a line, rows y..y+4. */
export const HAIRPINS: ReadonlyArray<{ line: number; seg: number; y: number }> = [
  { line: 1, seg: 2, y: 50 },           // under 4 K, never mirrored (two loops side by side read as eyes)
  { line: 5, seg: 2, y: 49 },
];

/** Attenuator beads (`size` 4|3|2 wide × 2), x = left column; `stage` = the plate they hang under (lit when cooled). */
export const BEADS: ReadonlyArray<{ x: number; y: number; w: 2 | 3 | 4; stage: number }> = [
  { x: 20, y: 45, w: 3, stage: 2 },   // 20 dB at 4 K on every drive line, a regular zigzag
  { x: 23, y: 47, w: 3, stage: 2 },
  { x: 30, y: 47, w: 3, stage: 2 },
  { x: 33, y: 45, w: 3, stage: 2 },
  { x: 36, y: 45, w: 4, stage: 2 },   // the outer-right line has room for the big one (line at col 1)
  { x: 33, y: 64, w: 2, stage: 3 },   // 10 dB under the still on the right pair
  { x: 36, y: 67, w: 2, stage: 3 },
];

// ---------------------------------------------------------------------------------------------------------------
// Component parts (ASCII maps, light from the upper left, selective outlines in the material's own dark)

/** Pulse-tube cold head, first stage (right of the curtain): a 5-wide regenerator tube straight down from the flange,
 *  a 7-wide cold flange, and the copper flex braids (a woven 2-row band) clamping it to the 50 K plate. */
export const PT_HEAD = part(`
  .lelttm.
  .lelttm.
  .lewltm.
  .lelttm.
  .lelttm.
  .lelttm.
  lleellt.
  ttttmms.
  .ltltlm.
  .tltlts.
`, 'pt-head');
export const PT_HEAD_AT = [40, 10] as const;     // tube x 41..45 rows 10..15, flange x 40..46 rows 16..17, braids rows 18..19

/** Second stage: a slimmer tube from the 50 K plate down to the 4 K cold flange, braided to the 4 K plate. */
export const PT_STAGE2 = part(`
  .elm.
  .elm.
  .elm.
  .ewm.
  .elm.
  .elm.
  .elm.
  leelt
  tttms
  .ltl.
  .tlt.
  .ltl.
`, 'pt-stage2');
export const PT_STAGE2_AT = [41, 26] as const;    // tube x 42..44 rows 26..32, flange x 41..45 rows 33..34, braids rows 35..37

/** HEMT amplifier on the output line, sitting on the 4 K plate: lit top, steel body, slate right, an azure LED. */
export const HEMT = part(`
  lleell
  ettttm
  tatttm
  ttttms
  mmmmss
`, 'hemt');
export const HEMT_AT = [11, 33] as const;        // x 11..16, rows 33..37, strapped to the output line (x 17..18)
export const HEMT_LED = [12, 35] as const;

/** Three stacked circulators (1-px discs with a lit face row) on the output line under the still. */
export const CIRC = part(`
  lel
  tms
  ...
  lel
  tms
  ...
  lel
  tms
`, 'circulators');
export const CIRC_AT = [18, 63] as const;        // x 18..20 (centred on the output line at 19), rows 63..70

/** TWPA: a slim box on the MXC with a meander of junctions behind a window. */
export const TWPA = part(`
  leel
  ewlm
  lcsm
  lsbm
  lcsm
  tmms
`, 'twpa');
export const TWPA_AT = [26, 79] as const;        // central bay, rows 79..84

/** DC wiring loom (twisted pairs for thermometers and heaters): a 2-px braided cable down the lit left side from
 *  the flange to the still, anchored at each plate. [x, y0, y1] per segment (the HEMT covers its lower part in seg 1). */
export const LOOM: ReadonlyArray<readonly [number, number, number]> = [[12, 10, 19], [12, 26, 37], [15, 44, 55]];

/** Heat-exchanger coil (still → cold plate): a 2-px zigzag in the central bay, front strands lit. */
export const HX_AT = [26, 62] as const;
export const HX_ROWS = 10;

// ---------------------------------------------------------------------------------------------------------------
// Bottom: cold finger, mu-metal can, chip package

export const FINGER = { x: 26, y0: 92, y1: 93 } as const;       // 4 wide: l t t s, an indigo reflection on the right
export const CAN = { x0: 18, x1: 37, y0: 89, y1: 108 } as const; // a 1-px U ring (mu-metal): walls x 18/37, bottom row 110, port 27..28
export const CHIP = { x: 20, y: 94, w: 16, h: 15 } as const;    // package x 20..35, rows 94..108 (the bit leaves at row 109)
export const WINDOW = { x: 23, y: 97, w: 10, h: 9 } as const;   // the die (k), rows 97..105; a 2-px face around it
/** Xmon crosses (centre x, y): TL, TR, BL, BR. */
export const QUBITS: ReadonlyArray<readonly [number, number]> = [[25, 99], [30, 99], [25, 103], [30, 103]];
/** Bond pads in the die's corners. */
export const PADS: ReadonlyArray<readonly [number, number]> = [[23, 97], [32, 97], [23, 105], [32, 105]];

/** Which qubit a drive line's pulse lands on (index = line; line 0 is the output line). */
export const LINE_QUBIT = [-1, 0, 2, 1, 3, 1] as const;
/** Pulse launch order k → drive line j (alternating sides; the output line climbs on the bit ticks). */
export const LAUNCH_ORDER = [1, 5, 2, 4, 3] as const;
export const LAUNCH_GAP = 9;                                    // launches at 0, 9, 18, 27, 36 within each 48

/** Intro timeline in ticks after `intro` (design §5.1: lower 100–1000 ms, cooldown 1000–1500, ignite 1500). */
export const INTRO = {
  lowerTicks: [112, 84, 61, 42, 28, 18, 10, 5, 2, 1, 0] as const, // lift in art px at t = 0..10 (power3Out spacing)
  restTick: 10,
  coolTicks: [12, 13, 14, 15, 16] as const,                      // stage k (1..5) cools and its rim flashes at coolTicks[k-1]
  igniteTick: 18,
} as const;

export const HALO_STEPS: readonly Key[] = ['v', 'i', 'r', 'i'];  // 6 fps breathing, 8-tick cycle (144 / 8 = 18)

// ---------------------------------------------------------------------------------------------------------------
// Pulse paths

/** One line's path: ordered points; `holdAt` = indices where the head pauses a tick (thermal anchoring at a plate);
 *  `sched[dt]` = head index dt ticks after launch (2 px per tick). */
export interface Path { pts: Array<[number, number]>; holdAt: Set<number>; sched: number[] }

function segPoints(j: number, s: number): Array<[number, number]> {
  const [y0, y1] = SEG_ROWS[s];
  const x = LINE_X[s][j];
  const hp = HAIRPINS.find((h) => h.line === j && h.seg === s);
  const pts: Array<[number, number]> = [];
  const side = x < CX ? -1 : 1;                 // the pulse runs round the outer side of a loop
  for (let y = y0; y <= y1; y++) {
    if (hp && y > hp.y && y < hp.y + 4) { pts.push([x + side, y]); continue; }
    pts.push([x, y]);
  }
  return pts;
}

function schedule(n: number, holdAt: Set<number>): number[] {
  const sched: number[] = [0];
  let idx = 0, held = false;
  while (idx < n - 1) {
    if (holdAt.has(idx) && !held) { held = true; sched.push(idx); continue; }
    held = false;
    idx = Math.min(idx + 2, n - 1);
    sched.push(idx);
  }
  return sched;
}

/** Drive line j: from the top of segment 0 down through every plate and the cold finger into the chip. */
function drivePath(j: number): Path {
  const pts: Array<[number, number]> = [];
  const holdAt = new Set<number>();
  for (let s = 0; s < SEG_ROWS.length; s++) { pts.push(...segPoints(j, s)); holdAt.add(pts.length - 1); }
  for (let y = FINGER.y0; y <= FINGER.y1; y++) pts.push([FINGER.x + 1, y]);   // down the finger (drawn 2 wide)
  return { pts, holdAt, sched: schedule(pts.length, holdAt) };
}

/** The output line: the readout climbs from above the MXC to the flange, holding under every plate. */
function readoutPath(): Path {
  const pts: Array<[number, number]> = [];
  const holdAt = new Set<number>();
  for (let s = SEG_ROWS.length - 1; s >= 0; s--) { pts.push(...segPoints(OUT_LINE, s).reverse()); holdAt.add(pts.length - 1); }
  holdAt.delete(pts.length - 1);
  return { pts, holdAt, sched: schedule(pts.length, holdAt) };
}

/** Indexed by line; PATHS[OUT_LINE] is unused (the output line carries the readout). */
export const PATHS: readonly Path[] = [0, 1, 2, 3, 4, 5].map(drivePath);
export const READOUT: Path = readoutPath();
/** Ticks from launch to arrival in the chip (the tick after the head reaches the finger's end). */
export const TRAVEL = PATHS.map((p) => p.sched.length);
export const READOUT_TRAVEL = READOUT.sched.length;


